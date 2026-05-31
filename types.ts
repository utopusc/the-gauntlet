// THE GAUNTLET — shared types (LOGIC layer)
// These symbol names are a hard contract: other writers (App, screens, hooks) import them.

// onboard: intake (url / pdf / idea) | analyzing: Gemini reading site+deck
// profile: dossier review | arena: boss fight | win: $5M raise flow | lose: rejection
export type GamePhase = 'onboard' | 'analyzing' | 'profile' | 'arena' | 'win' | 'lose';

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

export interface GameApi {
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
  question: string;
  lastResult: JudgeResult | null;

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
