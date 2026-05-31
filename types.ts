// THE GAUNTLET — shared types (W2)
// These symbol names are a hard contract: other writers (App, screens, hooks) import them.

export type GamePhase = 'landing' | 'arena' | 'win' | 'lose';

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

export interface GameApi {
  phase: GamePhase;
  idea: string;
  bosses: BossState[];
  currentBossIndex: number;
  currentBoss: BossState | null;
  founderHp: number;
  question: string;
  lastResult: JudgeResult | null;
  loading: boolean;
  error: string | null;
  verdict: Verdict | null;
  start: (idea: string) => void;
  submitAnswer: (answer: string) => Promise<void>;
  reset: () => void;
}
