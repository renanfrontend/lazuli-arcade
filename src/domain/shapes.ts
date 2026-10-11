import type { Position } from './grid';

export type ShapeFamily = 'dot' | 'line' | 'square' | 'corner' | 'tee' | 'ell' | 'skew' | 'rect' | 'bigCorner';

export interface Shape {
  readonly id: string;
  readonly family: ShapeFamily;
  /** Block offsets relative to the shape's top-left corner. */
  readonly cells: readonly Position[];
  readonly width: number;
  readonly height: number;
  /** Relative chance of being dealt. */
  readonly weight: number;
}

export interface ShapeSpec {
  readonly key: string;
  readonly family: ShapeFamily;
  /** `#` marks a block, `.` an empty spot; one text line per row. */
  readonly pattern: string;
  /** Total weight, shared evenly between every orientation of the spec. */
  readonly weight: number;
  readonly mirrored?: boolean;
}

const normalize = (cells: readonly Position[]): Position[] => {
  const minCol = Math.min(...cells.map(({ col }) => col));
  const minRow = Math.min(...cells.map(({ row }) => row));
  return cells
    .map(({ col, row }) => ({ col: col - minCol, row: row - minRow }))
    .sort((a, b) => a.row - b.row || a.col - b.col);
};

const signature = (cells: readonly Position[]): string => cells.map(({ col, row }) => `${col}:${row}`).join('|');

const rotate = (cells: readonly Position[]): Position[] => normalize(cells.map(({ col, row }) => ({ col: -row, row: col })));

const mirror = (cells: readonly Position[]): Position[] => normalize(cells.map(({ col, row }) => ({ col: -col, row })));

export const parsePattern = (pattern: string): Position[] => {
  const cells: Position[] = [];
  pattern
    .trim()
    .split('\n')
    .forEach((line, row) => {
      Array.from(line.trim()).forEach((char, col) => {
        if (char === '#') cells.push({ col, row });
        else if (char !== '.') throw new SyntaxError(`Unexpected "${char}" in shape pattern`);
      });
    });
  if (cells.length === 0) throw new SyntaxError('A shape pattern needs at least one block');
  return normalize(cells);
};

/** Every distinct rotation (and optionally mirror image) of a set of cells. */
export const orientations = (cells: readonly Position[], mirrored: boolean): Position[][] => {
  const unique = new Map<string, Position[]>();
  const seeds = mirrored ? [normalize(cells), mirror(cells)] : [normalize(cells)];
  for (const seed of seeds) {
    let current = seed;
    for (let turn = 0; turn < 4; turn += 1) {
      if (!unique.has(signature(current))) unique.set(signature(current), current);
      current = rotate(current);
    }
  }
  return [...unique.values()];
};

export const buildCatalog = (specs: readonly ShapeSpec[]): readonly Shape[] =>
  specs.flatMap((spec) => {
    const variants = orientations(parsePattern(spec.pattern), spec.mirrored ?? false);
    return variants.map(
      (cells, index): Shape =>
        Object.freeze({
          id: variants.length === 1 ? spec.key : `${spec.key}-${index + 1}`,
          family: spec.family,
          cells: Object.freeze(cells),
          width: Math.max(...cells.map(({ col }) => col)) + 1,
          height: Math.max(...cells.map(({ row }) => row)) + 1,
          weight: spec.weight / variants.length,
        }),
    );
  });

export const DEFAULT_SHAPE_SPECS: readonly ShapeSpec[] = [
  { key: 'dot', family: 'dot', pattern: '#', weight: 2 },
  { key: 'line2', family: 'line', pattern: '##', weight: 6 },
  { key: 'line3', family: 'line', pattern: '###', weight: 8 },
  { key: 'line4', family: 'line', pattern: '####', weight: 6 },
  { key: 'line5', family: 'line', pattern: '#####', weight: 4 },
  { key: 'corner3', family: 'corner', pattern: '#.\n##', weight: 7 },
  { key: 'square2', family: 'square', pattern: '##\n##', weight: 7 },
  { key: 'tee4', family: 'tee', pattern: '###\n.#.', weight: 4 },
  { key: 'ell4', family: 'ell', pattern: '#.\n#.\n##', weight: 6, mirrored: true },
  { key: 'skew4', family: 'skew', pattern: '.##\n##.', weight: 3, mirrored: true },
  { key: 'rect6', family: 'rect', pattern: '###\n###', weight: 3 },
  { key: 'bigCorner5', family: 'bigCorner', pattern: '#..\n#..\n###', weight: 4 },
  { key: 'square3', family: 'square', pattern: '###\n###\n###', weight: 2 },
];

export const SHAPE_CATALOG: readonly Shape[] = buildCatalog(DEFAULT_SHAPE_SPECS);

export const findShape = (catalog: readonly Shape[], id: string): Shape | undefined =>
  catalog.find((shape) => shape.id === id);

const RAMP_LARGE_BOOST = 2.5;
const RAMP_TINY_CUT = 0.6;
const RAMP_RELIEF_FADE = 0.7;

/**
 * Deal weight adjusted to the moment of the game:
 * - `fill` (0..1): a crowded board makes small pieces likelier and large ones
 *   rarer; an open board does the opposite.
 * - `level` (0..1): difficulty ramp; large pieces grow likelier, tiny ones
 *   rarer, and the crowded-board relief fades.
 */
export const adaptiveWeight = (shape: Shape, fill: number, level = 0): number => {
  const size = shape.cells.length;
  let weight = shape.weight;

  if (size >= 5) weight *= 1 + RAMP_LARGE_BOOST * level;
  else if (size <= 2) weight *= 1 - RAMP_TINY_CUT * level;

  if (fill > 0.5) {
    const relief = Math.min(1, (fill - 0.5) / 0.3) * (1 - RAMP_RELIEF_FADE * level);
    if (size <= 3) weight *= 1 + 1.5 * relief;
    else if (size >= 5) weight *= 1 - 0.75 * relief;
  } else if (fill < 0.2 && size >= 5) {
    weight *= 1.3;
  }
  return weight;
};

/** Difficulty level in 0..1, reached linearly over `rampMoves` placements. */
export const difficultyLevel = (moves: number, rampMoves: number): number =>
  rampMoves <= 0 ? 1 : Math.min(1, Math.max(0, moves / rampMoves));
