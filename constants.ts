// THE GAUNTLET — game constants (W2)
import type { Boss } from './types';

// Single source of truth for the model. Swap to a gemini-3 model here if/when available.
export const MODEL = 'gemini-2.5-flash';

// Founder's starting credibility. Hit 0 and you're walked out of the room.
export const FOUNDER_MAX_HP = 100;

// Max question/answer rounds the founder gets per boss before forced advance.
export const MAX_ROUNDS_PER_BOSS = 3;

/**
 * The three bosses map 1:1 to the hackathon judging criteria:
 *   Skeptic  -> Market   (TAM / why-now / moat)
 *   Architect-> Tech     (feasibility / durable advantage / data)
 *   Operator -> GTM      (distribution / unit economics)
 * A deliberate meta touch: beat the bosses, beat the rubric.
 */
export const BOSSES: Boss[] = [
  {
    id: 'skeptic',
    name: 'Vesper Kline',
    title: 'The Skeptic',
    fund: 'Mayfield-style Seed',
    emoji: '🦈',
    accent: '#22d3ee', // cyan
    maxHp: 100,
    focus: 'market size, why-now, defensibility',
    persona:
      'A razor-sharp, contrarian seed VC. You have funded 40 companies and killed 400 pitches. ' +
      'You hammer TAM, "why now", and defensibility. You despise vague market claims and "it\'s a huge market" hand-waving. ' +
      'You want a real wedge, a real moat, and a reason this could not have been built two years ago.',
  },
  {
    id: 'architect',
    name: 'Dr. Aris Thorne',
    title: 'The Architect',
    fund: 'DeepMind-grade Deep Tech',
    emoji: '🧠',
    accent: '#a78bfa', // violet
    maxHp: 110,
    focus: 'technical feasibility, real moat, data advantage',
    persona:
      'A brilliant, exacting technical researcher turned investor. You can smell a fake demo from across the room. ' +
      'You hammer technical feasibility, what is genuinely hard, and whether there is a durable data or systems advantage. ' +
      'You are unimpressed by "we use AI"; you want to know exactly what is defensible once the API everyone uses ships the same feature.',
  },
  {
    id: 'operator',
    name: 'Mara Vance',
    title: 'The Operator',
    fund: 'Growth / Operator Fund',
    emoji: '📈',
    accent: '#fbbf24', // amber
    maxHp: 120,
    focus: 'distribution, CAC/LTV, go-to-market',
    persona:
      'A growth-obsessed operator who scaled two companies past $100M ARR. You think most startups die of indifference, not competition. ' +
      'You hammer distribution, CAC/LTV, and a concrete go-to-market motion. ' +
      'You want the first 100 customers, the channel, and the unit economics — not a brand vision.',
  },
];

/**
 * The real funds + partners attending GDG Stanford x Red Bull Basement.
 * matchInvestors() picks the 3 best-fit from this shortlist and writes a warm
 * intro for each. Each `thesis` is a tight 4-8 word fit signal used for matching.
 */
export interface EventInvestor {
  fund: string;
  partner: string;
  thesis: string;
}

export const EVENT_INVESTORS: EventInvestor[] = [
  { fund: 'Mayfield', partner: 'Ursheet Parikh', thesis: 'AI-native infrastructure and enterprise seed bets' },
  { fund: 'Pear VC', partner: 'Andrew Parambath', thesis: 'pre-seed founders with deep technical edge' },
  { fund: 'Susa Ventures', partner: "Derick En'Wezoh", thesis: 'data network effects and defensible moats' },
  { fund: 'DTCP', partner: 'Lena Stocker', thesis: 'enterprise SaaS and digital infrastructure growth' },
  { fund: 'Cota Capital', partner: 'Vikram Venkat', thesis: 'modern enterprise and deep-tech transformation' },
  { fund: 'Mighty Capital', partner: 'Kevin Bernal', thesis: 'product-led B2B software at scale' },
  { fund: 'Giant Ventures', partner: 'Zenetta Burger', thesis: 'purpose-driven climate, health, and inclusion startups' },
  { fund: 'Bay Angels', partner: 'Neda Emami', thesis: 'early angel checks for bold first-time founders' },
  { fund: 'J2 Ventures', partner: 'Matt Goldman', thesis: 'dual-use frontier tech and national security' },
  { fund: 'Exponential Ventures', partner: 'Magne Jul Pedersen', thesis: 'exponential automation and AI-driven productivity' },
  { fund: 'INCE Capital', partner: 'Zhen Xia', thesis: 'global consumer and cross-border tech platforms' },
  { fund: 'AB Plus Ventures', partner: 'Anitha Vadavatha', thesis: 'early-stage SaaS and emerging-market founders' },
  { fund: 'Flourish Ventures', partner: 'Philippe Mallette', thesis: 'fintech and financial-health innovation' },
  { fund: 'Costanoa', partner: 'Nicole Seah', thesis: 'applied AI and data-driven B2B tools' },
  { fund: 'F-Prime', partner: 'Benjamin Gorman', thesis: 'healthtech, fintech, and deep-tech category leaders' },
  { fund: 'Llama Ventures', partner: 'Herman Zhou', thesis: 'AI-first products and generative tooling' },
  { fund: 'M12 (Microsoft)', partner: 'Tracy Liu', thesis: 'enterprise AI, infra, and developer platforms' },
];
