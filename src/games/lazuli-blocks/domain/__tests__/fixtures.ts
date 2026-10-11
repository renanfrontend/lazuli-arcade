import type { Board, BoardCell } from '../board';
import type { GemKind } from '../gem';
import { gridFromCells } from '@shared/domain/grid';
import { findShape, SHAPE_CATALOG, type Shape } from '../shapes';

const CHAR_TO_GEM: Readonly<Record<string, GemKind>> = {
  '#': 'sapphire',
  s: 'sapphire',
  r: 'ruby',
  e: 'emerald',
  a: 'amethyst',
  t: 'topaz',
};

/** Builds a board from rows of text: `.` is empty, `#` (or a gem code) is a gem. */
export const boardFrom = (art: string): Board => {
  const lines = art
    .trim()
    .split('\n')
    .map((line) => line.trim());
  const cols = lines[0]?.length ?? 0;
  const cells: BoardCell[] = lines.flatMap((line) => {
    if (line.length !== cols) throw new Error(`Ragged fixture row: "${line}"`);
    return Array.from(line, (char): BoardCell => {
      if (char === '.') return null;
      const gem = CHAR_TO_GEM[char];
      if (!gem) throw new Error(`Unknown fixture char "${char}"`);
      return gem;
    });
  });
  return gridFromCells(cols, lines.length, cells);
};

export const boardToArt = (board: Board): string =>
  Array.from({ length: board.rows }, (_, row) =>
    board.cells
      .slice(row * board.cols, (row + 1) * board.cols)
      .map((cell) => (cell === null ? '.' : '#'))
      .join(''),
  ).join('\n');

export const shape = (id: string): Shape => {
  const found = findShape(SHAPE_CATALOG, id);
  if (!found) throw new Error(`Unknown shape "${id}"`);
  return found;
};

/** First catalog shape whose blocks match the pattern, e.g. a horizontal 3-line. */
export const shapeLike = (pattern: string): Shape => {
  const rows = pattern.trim().split('\n');
  const wanted = rows
    .flatMap((line, row) => Array.from(line.trim(), (char, col) => (char === '#' ? `${col}:${row}` : null)))
    .filter((key): key is string => key !== null)
    .sort()
    .join('|');
  const found = SHAPE_CATALOG.find(
    (candidate) =>
      candidate.cells
        .map(({ col, row }) => `${col}:${row}`)
        .sort()
        .join('|') === wanted,
  );
  if (!found) throw new Error(`No catalog shape matches:\n${pattern}`);
  return found;
};
