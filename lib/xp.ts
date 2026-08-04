/**
 * XP awarded on workout completion.
 *
 * - BASE_WORKOUT_XP: flat reward for finishing any session
 * - PR_BONUS_XP: per personal record broken during the session
 * - ROUTINE_TARGET_BONUS_XP: bonus when full routine target volume is hit
 */
export const BASE_WORKOUT_XP = 50;
export const PR_BONUS_XP = 25;
export const ROUTINE_TARGET_BONUS_XP = 30;

export function calculateWorkoutXP(params: {
  prCount: number;
  hitRoutineTarget?: boolean;
}): number {
  let xp = BASE_WORKOUT_XP;
  xp += params.prCount * PR_BONUS_XP;

  if (params.hitRoutineTarget) {
    xp += ROUTINE_TARGET_BONUS_XP;
  }

  return xp;
}

/** level = floor(sqrt(total_xp / 100)) */
export function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) return 0;
  return Math.floor(Math.sqrt(totalXp / 100));
}

export function xpProgressInLevel(totalXp: number): {
  level: number;
  current: number;
  needed: number;
  percent: number;
} {
  const level = calculateLevel(totalXp);
  const currentLevelFloor = level * level * 100;
  const nextLevelFloor = (level + 1) * (level + 1) * 100;
  const current = totalXp - currentLevelFloor;
  const needed = nextLevelFloor - currentLevelFloor;
  const percent = needed > 0 ? Math.min(100, (current / needed) * 100) : 100;

  return { level, current, needed, percent };
}
