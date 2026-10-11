export interface ScoringRules {
  readonly pointsPerPlacedCell: number;
  readonly pointsPerClearedCell: number;
  /** Consecutive moves without a clear that end a streak. */
  readonly streakBreakAfter: number;
  readonly multiLineBonusCoins: number;
  readonly streakBonusCoins: number;
  readonly perfectClearPoints: number;
  readonly perfectClearCoins: number;
}

export const DEFAULT_SCORING: ScoringRules = {
  pointsPerPlacedCell: 1,
  pointsPerClearedCell: 10,
  streakBreakAfter: 3,
  multiLineBonusCoins: 5,
  streakBonusCoins: 3,
  perfectClearPoints: 500,
  perfectClearCoins: 25,
};

export interface MoveInput {
  readonly placedCells: number;
  readonly clearedCells: number;
  readonly lines: number;
  readonly streak: number;
  readonly movesSinceClear: number;
  readonly perfectClear: boolean;
}

export interface MoveScore {
  readonly points: number;
  /** Every cleared gem turns into one coin, plus multi-line and streak bonuses. */
  readonly coins: number;
  readonly streak: number;
  readonly movesSinceClear: number;
}

export const streakMultiplier = (streak: number): number => 1 + Math.max(0, streak - 1) * 0.5;

export const scoreMove = (rules: ScoringRules, input: MoveInput): MoveScore => {
  const placementPoints = input.placedCells * rules.pointsPerPlacedCell;

  if (input.lines === 0) {
    const movesSinceClear = input.movesSinceClear + 1;
    return {
      points: placementPoints,
      coins: 0,
      streak: movesSinceClear >= rules.streakBreakAfter ? 0 : input.streak,
      movesSinceClear,
    };
  }

  const streak = input.streak + 1;
  const clearPoints = Math.round(
    input.clearedCells * rules.pointsPerClearedCell * input.lines * streakMultiplier(streak),
  );
  const coins =
    input.clearedCells +
    (input.lines - 1) * rules.multiLineBonusCoins +
    (streak - 1) * rules.streakBonusCoins +
    (input.perfectClear ? rules.perfectClearCoins : 0);

  return {
    points: placementPoints + clearPoints + (input.perfectClear ? rules.perfectClearPoints : 0),
    coins,
    streak,
    movesSinceClear: 0,
  };
};
