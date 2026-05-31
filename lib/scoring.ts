// THE GAUNTLET — scoring math (PURE, no React, no DOM, no side effects).
//
// Every export here is a deterministic pure function so useGame and any UI can
// call them freely (in render, in handlers, in tests) without surprises.
//
// Pipeline per answer:
//   speedFrac = timeLeft / timeLimit   (0..1, how much time was left at submit)
//   tier      = speedTier(speedFrac)   -> { mult, label }  (FAST / QUICK / OK)
//   points    = answerPoints(rating, tier.mult, mode.scoreMult, prevStreak)
//             = round( RATING_POINTS[rating] * speedMult * modeMult * comboMult(streak) )
// End of game:
//   bonus     = endBonuses(outcome, founderHp, tookNoDamage, mode.scoreMult)
//
// A timed-out answer scores nothing (TIMEOUT_MULT = 0) and resets the combo —
// useGame handles that branch directly (it never calls answerPoints on timeout).

import {
  RATING_POINTS,
  SPEED_TIERS,
  TIMEOUT_MULT,
  COMBO_STEP,
  WIN_BONUS,
  PERFECT_BONUS,
  HP_BONUS_PER,
} from '../constants';

type Rating = 'weak' | 'solid' | 'killer';
type Outcome = 'funded' | 'passed';

/**
 * Pick the speed tier for a given fraction of time remaining at submit.
 * Returns the FIRST tier in SPEED_TIERS whose `minFrac` the fraction meets
 * (SPEED_TIERS is ordered high -> low). The final tier has minFrac 0, so this
 * always resolves. `frac` is clamped to [0, 1] so callers can pass raw ratios.
 */
export function speedTier(frac: number): { mult: number; label: string } {
  const f = Number.isFinite(frac) ? Math.max(0, Math.min(1, frac)) : 0;
  for (const t of SPEED_TIERS) {
    if (f >= t.minFrac) return { mult: t.mult, label: t.label };
  }
  // Defensive fallback — should be unreachable while a 0-minFrac tier exists.
  const last = SPEED_TIERS[SPEED_TIERS.length - 1];
  return last
    ? { mult: last.mult, label: last.label }
    : { mult: 1, label: 'OK' };
}

/**
 * Combo multiplier for the current streak of solid/killer answers.
 *   comboMult(0) = 1, comboMult(1) = 1.25, comboMult(2) = 1.5, ...
 * Negative / non-finite streaks are floored at 0 so the multiplier never dips
 * below 1.
 */
export function comboMult(streak: number): number {
  const s = Number.isFinite(streak) ? Math.max(0, streak) : 0;
  return 1 + COMBO_STEP * s;
}

/**
 * Points awarded for a single judged answer.
 *   round( RATING_POINTS[rating] * speedMult * modeMult * comboMult(streak) )
 *
 * @param rating    judge rating ('weak' | 'solid' | 'killer')
 * @param speedMult multiplier from speedTier(...).mult
 * @param modeMult  the active ModeConfig.scoreMult
 * @param streak    streak BEFORE this answer (the streak that earned the combo)
 */
export function answerPoints(
  rating: Rating,
  speedMult: number,
  modeMult: number,
  streak: number,
): number {
  const base = RATING_POINTS[rating] ?? 0;
  const sm = Number.isFinite(speedMult) ? speedMult : 1;
  const mm = Number.isFinite(modeMult) ? modeMult : 1;
  return Math.round(base * sm * mm * comboMult(streak));
}

/**
 * End-of-game bonus points, all scaled by the mode multiplier and rounded once.
 *   (funded ? WIN_BONUS : 0)
 * + (funded && tookNoDamage ? PERFECT_BONUS : 0)
 * + founderHp * HP_BONUS_PER
 * then * modeMult, rounded.
 *
 * @param outcome      'funded' | 'passed'
 * @param founderHp    remaining founder HP at game end
 * @param tookNoDamage true if the founder finished a funded run unscathed
 * @param modeMult     the active ModeConfig.scoreMult
 */
export function endBonuses(
  outcome: Outcome,
  founderHp: number,
  tookNoDamage: boolean,
  modeMult: number,
): number {
  const funded = outcome === 'funded';
  const hp = Number.isFinite(founderHp) ? Math.max(0, founderHp) : 0;
  const mm = Number.isFinite(modeMult) ? modeMult : 1;
  const raw =
    (funded ? WIN_BONUS : 0) +
    (funded && tookNoDamage ? PERFECT_BONUS : 0) +
    hp * HP_BONUS_PER;
  return Math.round(raw * mm);
}

// Re-export the no-points timeout multiplier so callers that want to express the
// timeout branch symbolically can `points = base * TIMEOUT_MULT` if they prefer.
export { TIMEOUT_MULT };
