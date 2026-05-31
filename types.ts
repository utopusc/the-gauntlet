// THE GAUNTLET — shared types (LOGIC layer)
// These symbol names are a hard contract: other writers (App, screens, hooks) import them.

import type { ScoreEntry } from './lib/leaderboard';

// onboard: intake (url / pdf / idea) | analyzing: Gemini reading site+deck
// profile: dossier review | arena: boss fight | win: $5M raise flow | lose: rejection
export type GamePhase = 'onboard' | 'analyzing' | 'profile' | 'arena' | 'win' | 'lose';

// ---- game mode ------------------------------------------------------------

/**
 * Difficulty / tone selector chosen on the Onboard screen BEFORE the battle.
 *   easy   -> gentle, coaching, encouraging; teaches the founder; long timer; soft on everyone.
 *   fun    -> absurd, meme-y curveballs; lenient judging; comedic critiques; soft on the founder.
 *   normal -> realistic, sharp, fair VC questions (the original behavior). Balanced.
 *   expert -> brutal, technical, rapid-fire, ruthless; tankier bosses + fragile founder + harsh judging.
 */
export type GameMode = 'easy' | 'fun' | 'normal' | 'expert';

/**
 * Full personality + balance knobs for a mode. Drives BOTH the prompts (vibe/strictness)
 * and the arena math (HP multipliers, self-damage, rounds, timer, score). `accent` is a CSS
 * color the UI uses to theme the selector + the active-mode flourish.
 */
export interface ModeConfig {
  id: GameMode;
  /** Short uppercase label for the selector chip, e.g. "FUN". */
  label: string;
  /** One-line pitch shown under the label, e.g. "Chaos mode. Anything goes.". */
  tagline: string;
  /** Single emoji shown on the mode chip. */
  emoji: string;
  /** CSS color (hex) — green (easy) / magenta (fun) / cyan (normal) / red (expert). */
  accent: string;
  /** Boss maxHp multiplier (>1 = tankier bosses). */
  bossHpMult: number;
  /** Founder maxHp multiplier (>1 = founder survives more punishment). */
  founderHpMult: number;
  /** Multiplier applied to the founder's self-damage per bad answer (>1 = punished harder). */
  selfDamageMult: number;
  /** Rounds the founder gets per boss before forced advance. */
  rounds: number;
  /** How the judge scores: lenient = generous, fair = balanced, harsh = stingy. */
  strictness: 'lenient' | 'fair' | 'harsh';
  /** Seconds allotted per question (the countdown clock in the arena). */
  timeLimit: number;
  /** Score multiplier for this mode (rewards harder difficulties). */
  scoreMult: number;
  /** A sentence injected into EVERY battle prompt describing question style + tone. */
  vibe: string;
}

export interface Boss {
  id: string;
  name: string;
  title: string;
  fund: string;
  emoji: string;
  persona: string;
  focus: string;
  maxHp: number;
  accent: string;
}

export interface BossState extends Boss {
  hp: number;
  defeated: boolean;
}

export interface JudgeResult {
  /** Damage dealt to the boss's skepticism HP. 0-100. */
  damage: number;
  /** Self-inflicted damage to the founder's credibility. 0-40. */
  selfDamage: number;
  /** A sharp, 1-3 sentence critique of the founder's answer. */
  critique: string;
  rating: 'weak' | 'solid' | 'killer';
  /** A pointed follow-up question that raises the stakes. */
  followUp: string;
}

export interface Verdict {
  /** Fundability score, 0-100. */
  score: number;
  oneLiner: string;
  investorQuote: string;
  strengths: string[];
  risks: string[];
  outcome: 'funded' | 'passed';
}

/**
 * Raw intake from the OnboardScreen. Any combination of the three may be present;
 * at least one should be. pdfBase64 is base64 WITHOUT the `data:` prefix.
 */
export interface CompanyInput {
  url?: string;
  pdfBase64?: string;
  pdfName?: string;
  idea?: string;
}

/**
 * Structured company dossier extracted by Gemini from the website / PDF / idea.
 * Every field is always a string (never undefined) so screens can render safely.
 */
export interface CompanyProfile {
  name: string;
  tagline: string;
  problem: string;
  solution: string;
  market: string;
  traction: string;
  team: string;
  businessModel: string;
  askAmount: string;
  /** Positive proof points the bosses can probe / reward. */
  signals: string[];
  /** Weaknesses the bosses will attack. */
  redFlags: string[];
  /** Where this profile came from, e.g. "Read from acme.com + uploaded deck.pdf". */
  sourceNote: string;
}

/**
 * A matched investor from the event shortlist, with a ready-to-send warm intro.
 */
export interface InvestorMatch {
  fund: string;
  partner: string;
  /** 1-sentence why-this-fund-fits-this-company line. */
  thesisFit: string;
  /** A 3-sentence warm intro email the founder could actually send. */
  introEmail: string;
  warmth: 'hot' | 'warm' | 'cold';
}

// ---- scoring breakdown (end screens) --------------------------------------

/** Per-component split of the final score, shown on the win/lose screens. */
export interface ScoreBreakdown {
  /** Sum of base rating points (mode-multiplied), pre-speed, pre-combo. */
  base: number;
  /** Extra points earned from fast answers. */
  speed: number;
  /** Extra points earned from combo streaks. */
  combo: number;
  /** End-of-run bonuses (win + perfect + remaining-HP), mode-multiplied. */
  bonuses: number;
  /** Grand total (== game.score at end of run). */
  total: number;
}

// Re-export ScoreEntry so consumers can import it from either source.
// lib/leaderboard is the source of truth.
export type { ScoreEntry };

export interface GameApi {
  // ---- mode (chosen on Onboard, before the battle) ----
  /** Active game mode. Defaults to 'normal'. */
  mode: GameMode;
  /** Set the active mode (call from the Onboard mode selector). */
  setMode: (m: GameMode) => void;
  /** Resolved config for the active mode (timeLimit, scoreMult, accent, etc.). */
  modeConfig: ModeConfig;

  // ---- phase + intake ----
  phase: GamePhase;
  companyInput: CompanyInput | null;
  companyProfile: CompanyProfile | null;
  analyzing: boolean;

  // ---- raise flow ----
  investors: InvestorMatch[];
  matching: boolean;

  // ---- arena ----
  bosses: BossState[];
  currentBossIndex: number;
  currentBoss: BossState | null;
  founderHp: number;
  /** Mode-scaled founder HP ceiling (FOUNDER_MAX_HP * mode.founderHpMult). Use for the HP bar denominator. */
  founderMaxHp: number;
  question: string;
  lastResult: JudgeResult | null;

  // ---- scoring / combo / timer ----
  /** Running score for the current run. */
  score: number;
  /** Current streak of solid/killer answers (resets on weak/timeout). */
  combo: number;
  /** Best combo reached this run. */
  bestCombo: number;
  /** Points awarded for the most recent answer (0 on weak/timeout). null before first answer. */
  lastPoints: number | null;
  /** Speed-tier label of the most recent answer: 'FAST' | 'QUICK' | 'OK' | 'TIME OUT'. */
  lastSpeed: string | null;
  /** Seconds left on the current question's clock (fractional; counts down). */
  timeLeft: number;
  /** The full clock for the current question (== modeConfig.timeLimit). */
  timeLimit: number;
  /** Component breakdown of the final score (null until the run ends). */
  scoreBreakdown: ScoreBreakdown | null;

  // ---- leaderboard ----
  /** True at end of run if the final score makes the top-10 board. */
  qualifies: boolean;
  /** The entry saved via saveScore() (null until saved). */
  lastEntry: ScoreEntry | null;
  /** Persist the final score under `name`, store + return the saved entry. NOT auto-called. */
  saveScore: (name: string) => ScoreEntry;

  // ---- shared ----
  loading: boolean;
  error: string | null;
  verdict: Verdict | null;

  // ---- methods ----
  analyze: (input: CompanyInput) => Promise<void>;
  enterArena: () => void;
  submitAnswer: (answer: string) => Promise<void>;
  reset: () => void;
  /** Convenience: analyze from a bare idea string (kept for back-compat / quick demo). */
  start: (idea: string) => void;
}
