export interface Position {
  readonly col: number;
  readonly row: number;
}

/** Immutable row-major grid, generic over the cell type. */
export interface Grid<TCell> {
  readonly cols: number;
  readonly rows: number;
  readonly cells: readonly TCell[];
}

export type CellUpdate<TCell> = readonly [position: Position, value: TCell];

const assertSize = (cols: number, rows: number): void => {
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) {
    throw new RangeError(`Invalid grid size: ${cols}x${rows}`);
  }
};

export const createGrid = <TCell>(cols: number, rows: number, fill: TCell): Grid<TCell> => {
  assertSize(cols, rows);
  return { cols, rows, cells: Array.from({ length: cols * rows }, () => fill) };
};

export const gridFromCells = <TCell>(cols: number, rows: number, cells: readonly TCell[]): Grid<TCell> => {
  assertSize(cols, rows);
  if (cells.length !== cols * rows) {
    throw new RangeError(`Expected ${cols * rows} cells, received ${cells.length}`);
  }
  return { cols, rows, cells: [...cells] };
};

export const isInside = (grid: Grid<unknown>, { col, row }: Position): boolean =>
  Number.isInteger(col) && Number.isInteger(row) && col >= 0 && row >= 0 && col < grid.cols && row < grid.rows;

export const toIndex = (grid: Grid<unknown>, { col, row }: Position): number => row * grid.cols + col;

export const toPosition = (grid: Grid<unknown>, index: number): Position => ({
  col: index % grid.cols,
  row: Math.floor(index / grid.cols),
});

export const cellAt = <TCell>(grid: Grid<TCell>, position: Position): TCell | undefined =>
  isInside(grid, position) ? grid.cells[toIndex(grid, position)] : undefined;

export const updateCells = <TCell>(grid: Grid<TCell>, updates: Iterable<CellUpdate<TCell>>): Grid<TCell> => {
  const cells = [...grid.cells];
  for (const [position, value] of updates) {
    if (!isInside(grid, position)) {
      throw new RangeError(`Position ${position.col},${position.row} is outside the grid`);
    }
    cells[toIndex(grid, position)] = value;
  }
  return { cols: grid.cols, rows: grid.rows, cells };
};

export const rowIndices = (grid: Grid<unknown>, row: number): number[] =>
  Array.from({ length: grid.cols }, (_, col) => row * grid.cols + col);

export const colIndices = (grid: Grid<unknown>, col: number): number[] =>
  Array.from({ length: grid.rows }, (_, row) => row * grid.cols + col);

export const countCells = <TCell>(grid: Grid<TCell>, predicate: (cell: TCell) => boolean): number =>
  grid.cells.reduce((total, cell) => (predicate(cell) ? total + 1 : total), 0);

export const translate = (position: Position, offset: Position): Position => ({
  col: position.col + offset.col,
  row: position.row + offset.row,
});

export const samePosition = (a: Position, b: Position): boolean => a.col === b.col && a.row === b.row;
