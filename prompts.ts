// THE GAUNTLET — Gemini prompts (LOGIC layer)
// Analysis + per-boss + judge + verdict + investor-match prompts.
// Everything is grounded on the extracted CompanyProfile so the battle references
// the founder's REAL claims, traction, and red flags — not generic VC noise.
import type { Boss, CompanyProfile, ModeConfig, Verdict } from './types';
import type { EventInvestor } from './constants';

/**
 * Per-boss Q/A/J history item used to make follow-up questions GENUINE.
 * `rating` is the judge's bucket of the founder's answer ('weak'|'solid'|'killer').
 */
export interface QAHistoryItem {
  question: string;
  answer: string;
  rating: string;
}

// ---- mode injection -------------------------------------------------------

/**
 * The MODE block injected at the top of every battle prompt. It carries the
 * active mode's `vibe` (question style + tone) so the model adapts EASY / FUN /
 * NORMAL / EXPERT behavior. Returns '' if no mode is provided (safe back-compat —
 * the prompt then reads exactly as the original NORMAL behavior).
 */
function modeBlock(mode?: ModeConfig): string {
  if (!mode) return '';
  return [
    '',
    `=== MODE: ${mode.label} ===`,
    mode.vibe,
    '',
  ].join('\n');
}

/**
 * Concrete, strictness-aware scoring guidance for the JUDGE prompt. Shifts the
 * damage/selfDamage bands and critique tone by mode without changing the schema.
 */
function strictnessGuidance(mode?: ModeConfig): string {
  switch (mode?.strictness) {
    case 'lenient':
      return [
        'SCORING STYLE — LENIENT (EASY / FUN mode): be generous and encouraging. Reward effort, boldness, and good instincts.',
        '- damage (0-100): a committed, clear, or clever answer = 55-100. Even a so-so answer that engages = 35-60. Only a total non-answer = under 25.',
        '- selfDamage (0-40): keep it LOW. A confident answer = 0-3. Only a genuine faceplant = 10-20. Never above 20.',
        '- critique: 1-2 sentences, warm and constructive (coaching in EASY, funny-and-kind in FUN). Celebrate what worked, nudge what to sharpen.',
        '- rating: lean toward "solid"/"killer". Reserve "weak" for total dodges.',
      ].join('\n');
    case 'harsh':
      return [
        'SCORING STYLE — HARSH (EXPERT mode): be stingy and ruthless. Only rigor earns reward.',
        '- damage (0-100): only a genuinely rigorous, specific, evidence-backed answer = 45-90. A solid-but-incomplete answer = 18-38. Any hand-waving or buzzwords = 0-15.',
        '- selfDamage (0-40): punish gaps hard. A flawless answer = 0-6. A vague, evasive, or contradictory answer = 22-40.',
        '- critique: 1-2 sentences, surgical and unforgiving. Name the exact failure of logic, math, or defensibility. No comfort.',
        '- rating: "killer" ONLY for genuinely elite answers; "weak" for anything that dodges the technical core.',
      ].join('\n');
    case 'fair':
    default:
      return [
        'SCORING STYLE — FAIR (NORMAL mode): balanced and honest.',
        '- damage (0-100): a killer, specific, evidence-backed answer = 60-100. A solid-but-incomplete answer = 30-55. Vague, evasive, or buzzword answer = 0-25.',
        '- selfDamage (0-40): a confident sharp answer = 0-5. A hand-wavy or contradictory answer = 15-40. Do not punish a good answer.',
        '- critique: 1-2 sentences. Sharp, specific, true. Name the actual gap or praise the actual insight.',
        '- rating: "killer" if genuinely impressed, "solid" if respectable, "weak" if it dodged or fluffed.',
      ].join('\n');
  }
}

// ---- analysis -------------------------------------------------------------

/**
 * Instruction asking Gemini to read a website (via the urlContext tool) and/or a
 * pitch PDF and/or an idea blurb, then emit a structured CompanyProfile.
 *
 * IMPORTANT: the urlContext tool path canNOT be combined with responseSchema/JSON
 * mode (Gemini rejects it), so we instruct the model to return ONLY a raw JSON
 * object and parse it defensively in the service. The PDF-only path may use a
 * responseSchema, but this same prompt works for both.
 */
export function analysisSystem(): string {
  return [
    'You are a sharp pre-seed analyst at a top VC fund. You read a company\'s website and/or pitch deck and produce a tight, honest dossier a partner can act on.',
    '',
    'Extract a structured profile of the company. Be concrete and specific — pull REAL claims, numbers, customer names, and language from the source material. Do NOT invent traction that is not stated; if something is missing, say so plainly (e.g. "No traction disclosed").',
    '',
    'Return ONLY a single raw JSON object (no markdown, no code fences, no prose before or after) with EXACTLY these fields:',
    '{',
    '  "name": string,            // company name',
    '  "tagline": string,         // one crisp line on what they do',
    '  "problem": string,         // the problem they attack (1-2 sentences)',
    '  "solution": string,        // how they solve it (1-2 sentences)',
    '  "market": string,          // market / who buys / size signal',
    '  "traction": string,        // real traction stated, or "No traction disclosed"',
    '  "team": string,            // founders / team signal, or "Team not described"',
    '  "businessModel": string,   // how they make money',
    '  "askAmount": string,       // the raise they are seeking, e.g. "$5M Seed" (infer if absent)',
    '  "signals": string[],       // 2-4 genuine strengths / proof points',
    '  "redFlags": string[],      // 2-4 honest weaknesses a VC would probe',
    '  "sourceNote": string       // one line on what you read, e.g. "Read from acme.com and the uploaded deck."',
    '}',
    '',
    'Keep every string field punchy. Never leave a field empty — use an honest placeholder if the source is silent.',
  ].join('\n');
}

export function analysisUser(opts: { url?: string; idea?: string; hasPdf?: boolean }): string {
  const parts: string[] = ['Produce the company dossier from the following sources:'];
  if (opts.url) parts.push(`- Company website to READ (use it as ground truth): ${opts.url}`);
  if (opts.hasPdf) parts.push('- An attached pitch PDF (read it as ground truth).');
  if (opts.idea) parts.push(`- Founder's description: "${opts.idea}"`);
  if (!opts.url && !opts.hasPdf && opts.idea) {
    parts.push('\nOnly the founder description is available — build the best honest profile you can from it, and flag the lack of public proof in redFlags.');
  }
  parts.push('\nReturn ONLY the raw JSON object described in your instructions.');
  return parts.join('\n');
}

// ---- shared profile context ----------------------------------------------

/** Compact, grounded snapshot of the company injected into every battle prompt. */
function profileContext(p: CompanyProfile): string {
  return [
    `COMPANY: ${p.name} — ${p.tagline}`,
    `PROBLEM: ${p.problem}`,
    `SOLUTION: ${p.solution}`,
    `MARKET: ${p.market}`,
    `TRACTION: ${p.traction}`,
    `TEAM: ${p.team}`,
    `BUSINESS MODEL: ${p.businessModel}`,
    `ASK: ${p.askAmount}`,
    p.signals.length ? `SIGNALS: ${p.signals.join('; ')}` : '',
    p.redFlags.length ? `RED FLAGS (attack these): ${p.redFlags.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// ---- boss question --------------------------------------------------------

/**
 * System instruction for generating a boss's COMPANY-specific question.
 * When there is prior history with this boss, the model MUST produce a genuine
 * FOLLOW-UP (drill the weakest point of the founder's last answer). The model
 * returns JSON { question: string } (1-2 sentences).
 */
export function bossQuestionSystem(boss: Boss, mode: ModeConfig | undefined, isFollowUp: boolean): string {
  const base = [
    `You are ${boss.name}, ${boss.title} — a ${boss.fund} investor in a high-stakes pitch battle called THE GAUNTLET.`,
    `PERSONA: ${boss.persona}`,
    `YOUR OBSESSION: ${boss.focus}.`,
    modeBlock(mode),
  ];

  if (isFollowUp) {
    base.push(
      'You have ALREADY questioned this founder. Your job now is a genuine FOLLOW-UP — escalate the pressure on what they just said.',
      'Rules for the follow-up:',
      '- Zero in on the SINGLE weakest, vaguest, or most hand-wavy assumption in the founder\'s LAST answer.',
      '- Quote or closely paraphrase their exact words ("You said ...") so they feel you listened.',
      '- Make this question HARDER and more specific than the last — escalate, do not restart.',
      '- 1-2 sentences. No preamble, no greeting, no "great question". Just the sharper question.',
      '- Match the MODE tone (coaching in EASY, absurd in FUN, balanced in NORMAL, brutal in EXPERT).',
      '- NEVER repeat or rephrase any question already asked this session.',
    );
  } else {
    base.push(
      'This is your OPENING question to the founder. Ask ONE question that targets the single weakest point of THIS exact company through your lens, in the STYLE AND TONE of the MODE above.',
      'Rules:',
      '- 1-2 sentences. No preamble, no greeting, no "great question". Just the question.',
      '- Reference a CONCRETE detail from the dossier — a stated claim, a number, a red flag, the actual market or buyer. Make the founder feel you read their deck.',
      '- Match the MODE: it dictates whether you are gentle and coaching, brutally technical, fairly sharp, or wildly absurd. Honor it.',
      '- Never repeat a question already asked this session.',
    );
  }
  return base.join('\n');
}

/**
 * User content for the boss question. Threads the per-boss Q/A history so the
 * model can write a real follow-up, plus the list of already-asked questions to
 * forbid repeats.
 */
export function bossQuestionUser(
  profile: CompanyProfile,
  askedSoFar: string[],
  history: QAHistoryItem[] = [],
): string {
  const asked = askedSoFar.length
    ? `\n\nAlready asked (do NOT repeat or rephrase these):\n- ${askedSoFar.join('\n- ')}`
    : '';

  if (history.length) {
    const last = history[history.length - 1];
    const exchange = history
      .map(
        (h, i) =>
          `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}\n(your read: ${h.rating})`,
      )
      .join('\n');
    return [
      profileContext(profile),
      '',
      'EXCHANGE SO FAR WITH THIS FOUNDER:',
      exchange,
      '',
      `THE FOUNDER'S LAST ANSWER (attack the weakest part of THIS): "${last.answer}"`,
      asked,
      '',
      'Write your single, sharper FOLLOW-UP question now.',
    ].join('\n');
  }

  return `${profileContext(profile)}${asked}`;
}

// ---- judge ----------------------------------------------------------------

/**
 * System instruction for judging a founder's answer, grounded on the company.
 * Returns JSON { damage, selfDamage, critique, rating, followUp }.
 */
export function judgeSystem(boss: Boss, mode?: ModeConfig): string {
  return [
    `You are ${boss.name}, ${boss.title} (${boss.fund}). PERSONA: ${boss.persona}`,
    `You care above all about: ${boss.focus}.`,
    modeBlock(mode),
    'You have the founder\'s real company dossier and you asked them a question. Now JUDGE their answer in the STYLE AND TONE of the MODE above.',
    'Weigh the answer AGAINST the dossier: reward answers that resolve a stated red flag or back a claim with the real traction; punish answers that contradict the dossier or hand-wave.',
    '',
    strictnessGuidance(mode),
    '- critique: follow the critique guidance for this mode. Reference the company. End with a POINTED follow-up jab that presses on the remaining weakness. No generic filler.',
    '- followUp: 1 sentence. A pointed next question that presses on the remaining weakness, in this mode\'s tone. Raise the stakes.',
    '',
    'Stay in character for the MODE above at all times — gentle and coaching in EASY, comedic and generous in FUN, balanced in NORMAL, surgical and stingy in EXPERT.',
  ].join('\n');
}

export function judgeUser(
  profile: CompanyProfile,
  question: string,
  answer: string,
): string {
  return [
    profileContext(profile),
    '',
    `Your question: "${question}"`,
    `Founder's answer: "${answer}"`,
  ].join('\n');
}

// ---- verdict --------------------------------------------------------------

/**
 * System instruction for the final verdict / Term Sheet, grounded on the company.
 * Returns JSON { score, oneLiner, investorQuote, strengths[], risks[], outcome }.
 */
export function verdictSystem(outcome: 'funded' | 'passed', mode?: ModeConfig): string {
  const frame =
    outcome === 'funded'
      ? 'The founder SURVIVED all three investors. This is a TERM SHEET — they earned a real look. Be earned-positive: credible, specific, still honest about risk.'
      : 'The founder was WALKED OUT — credibility hit zero before the round ended. This is a PASS. Be sharp and honest, but respect the hustle; give a real path back.';
  return [
    'You are the managing partner writing the final verdict after THE GAUNTLET — a three-investor pitch battle.',
    frame,
    modeBlock(mode),
    'Write the verdict in the STYLE AND TONE of the MODE above (warm and encouraging in EASY, playful and generous in FUN, balanced in NORMAL, exacting in EXPERT).',
    'You have the company dossier and the full transcript. Ground every line in the REAL company.',
    'Return:',
    '- score (0-100): honest fundability calibrated to BOTH the transcript and the mode. Funded outcomes usually 55-92; passed outcomes usually 8-48. EASY/FUN mode skews more generous; EXPERT mode skews more brutal.',
    '- oneLiner: a punchy 1-sentence headline verdict on the company.',
    '- investorQuote: a quotable, sharable 1-2 sentence line in the partner\'s voice — the thing you\'d say in the partner meeting.',
    '- strengths: 2-3 short bullet phrases (real, specific to this company).',
    '- risks: 2-3 short bullet phrases (the things that could kill it).',
    `- outcome: "${outcome}".`,
    '',
    'Voice: a top-tier VC, adapted to the MODE. Specific to THIS company and THIS transcript.',
  ].join('\n');
}

export function verdictUser(profile: CompanyProfile, transcript: string): string {
  return [
    profileContext(profile),
    '',
    'Full pitch transcript (Q = investor question, A = founder answer, J = your read):',
    transcript || '(no substantive exchange recorded)',
  ].join('\n');
}

// ---- investor matching ----------------------------------------------------

/**
 * System instruction for matching the company to the best-fit event investors and
 * drafting a warm intro for each. Returns JSON { matches: InvestorMatch[] }.
 */
export function investorMatchSystem(): string {
  return [
    'You are the head of platform / founder relations at a startup accelerator. The founder just CLEARED THE GAUNTLET (survived three brutal investor bosses) and is cleared to pitch for a $5M raise.',
    'You have: (1) the company dossier, (2) the partner verdict + fundability score, and (3) a shortlist of real funds attending the event, each with a one-line thesis.',
    '',
    'Pick the THREE funds whose thesis best fits THIS company and write a ready-to-send warm intro for each.',
    'For each match return:',
    '- fund: exact fund name from the shortlist.',
    '- partner: exact partner name from the shortlist.',
    '- thesisFit: ONE sentence on why this fund fits this company (tie their thesis to a real dossier detail).',
    '- introEmail: a 3-sentence warm intro the founder could actually send to the partner. Reference the company by name, the specific traction/wedge, and the $5M ask. Warm, concise, no fluff, no subject line, no signature block — just the body. Honest framing: this is a draft the founder sends, not a booked meeting.',
    '- warmth: "hot" if the fit is excellent (use for the strongest 1, especially if the score is high), "warm" for a strong fit, "cold" for a plausible but weaker stretch fit. Calibrate warmth to BOTH the fundability score and the thesis fit.',
    '',
    'Return ONLY a single raw JSON object: { "matches": [ {fund, partner, thesisFit, introEmail, warmth}, {…}, {…} ] }. No markdown, no code fences.',
  ].join('\n');
}

export function investorMatchUser(
  profile: CompanyProfile,
  verdict: Verdict,
  shortlist: EventInvestor[],
): string {
  const funds = shortlist
    .map((i) => `- ${i.fund} (${i.partner}): ${i.thesis}`)
    .join('\n');
  return [
    profileContext(profile),
    '',
    `PARTNER VERDICT: ${verdict.oneLiner}`,
    `FUNDABILITY SCORE: ${verdict.score}/100`,
    `STRENGTHS: ${verdict.strengths.join('; ')}`,
    `RISKS: ${verdict.risks.join('; ')}`,
    '',
    'AVAILABLE FUNDS (pick the 3 best fits — only from this list):',
    funds,
    '',
    'Return ONLY the raw JSON { "matches": [...] }.',
  ].join('\n');
}
