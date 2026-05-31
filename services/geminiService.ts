// THE GAUNTLET — Gemini service (LOGIC layer)
// Every function wraps generateContent calls and JSON-parses the result.
// Every call is try/catch-wrapped with a sane fallback so the LIVE DEMO NEVER
// hard-crashes on a parse hiccup, a tool-mode rejection, or a transient error.
//
// Two analysis paths, by design:
//   • URL path  -> uses Gemini's native urlContext tool. Gemini REJECTS
//     responseSchema/JSON-mode together with urlContext, so we call WITHOUT a
//     schema, instruct "return ONLY JSON", and parse res.text defensively.
//   • PDF/idea path -> no tools, so we can safely use a responseSchema.
//
// NOTE: For production-scale website crawling, swap the urlContext tool for a
// server-side Firecrawl pass. Firecrawl is server-side and would break this
// pure-client / AI Studio build, so urlContext is the demo-safe choice here.
import { GoogleGenAI, Type } from '@google/genai';
import { MODEL, EVENT_INVESTORS } from '../constants';
import type {
  Boss,
  CompanyInput,
  CompanyProfile,
  InvestorMatch,
  JudgeResult,
  ModeConfig,
  Verdict,
} from '../types';
import {
  analysisSystem,
  analysisUser,
  bossQuestionSystem,
  bossQuestionUser,
  judgeSystem,
  judgeUser,
  verdictSystem,
  verdictUser,
  investorMatchSystem,
  investorMatchUser,
} from '../prompts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ---- helpers --------------------------------------------------------------

const clamp = (n: number, min: number, max: number): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, Math.round(v)));
};

const toStringArray = (v: unknown, fallback: string[], max = 4): string[] => {
  if (Array.isArray(v)) {
    const arr = v.map((x) => String(x).trim()).filter(Boolean);
    if (arr.length) return arr.slice(0, max);
  }
  return fallback;
};

const str = (v: unknown, fallback: string): string => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || fallback;
};

/**
 * Defensively pull a JSON object out of model text that may be wrapped in code
 * fences or padded with prose. Returns null if nothing parseable is found.
 */
function extractJson<T = any>(text: string | undefined): T | null {
  if (!text) return null;
  let t = text.trim();
  // Strip ```json ... ``` or ``` ... ``` fences.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // Direct parse first.
  try {
    return JSON.parse(t) as T;
  } catch {
    /* fall through to brace extraction */
  }
  // Extract the first balanced {...} block.
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const slice = t.slice(start, end + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      /* give up */
    }
  }
  return null;
}

// ---- analysis -------------------------------------------------------------

/** Build a minimal-but-honest profile when the model cannot be reached/parsed. */
function fallbackProfile(input: CompanyInput): CompanyProfile {
  const fromUrl = input.url ? input.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '';
  const name = fromUrl || input.pdfName?.replace(/\.pdf$/i, '') || 'Your Company';
  const sources: string[] = [];
  if (input.url) sources.push(input.url);
  if (input.pdfName) sources.push(input.pdfName);
  const idea = input.idea?.trim();
  return {
    name,
    tagline: idea ? idea.slice(0, 90) : 'An early-stage company entering the Gauntlet.',
    problem: idea || 'A real problem the founder is attacking (details pending deeper read).',
    solution: idea || 'The founder\'s proposed solution.',
    market: 'Market not yet quantified — clarify TAM and who buys.',
    traction: 'No traction disclosed.',
    team: 'Team not described.',
    businessModel: 'Business model not stated.',
    askAmount: '$5M Seed',
    signals: idea ? ['Founder has a clear thesis'] : ['Founder showed up to fight'],
    redFlags: [
      'Limited public proof — defensibility unverified',
      'Traction and unit economics undisclosed',
    ],
    sourceNote: sources.length
      ? `Auto-profile (source read partial): ${sources.join(', ')}`
      : 'Auto-profile built from the founder description.',
  };
}

/** Normalize whatever the model returned into a complete CompanyProfile. */
function normalizeProfile(raw: any, input: CompanyInput): CompanyProfile {
  const fb = fallbackProfile(input);
  if (!raw || typeof raw !== 'object') return fb;
  return {
    name: str(raw.name, fb.name),
    tagline: str(raw.tagline, fb.tagline),
    problem: str(raw.problem, fb.problem),
    solution: str(raw.solution, fb.solution),
    market: str(raw.market, fb.market),
    traction: str(raw.traction, fb.traction),
    team: str(raw.team, fb.team),
    businessModel: str(raw.businessModel, fb.businessModel),
    askAmount: str(raw.askAmount, fb.askAmount),
    signals: toStringArray(raw.signals, fb.signals),
    redFlags: toStringArray(raw.redFlags, fb.redFlags),
    sourceNote: str(raw.sourceNote, fb.sourceNote),
  };
}

/**
 * Read the founder's website (urlContext tool) and/or pitch PDF (inlineData) and/or
 * idea text, and extract a structured CompanyProfile. Never throws — on any failure
 * it returns a minimal honest profile so the demo keeps moving.
 */
export async function analyzeCompany(input: CompanyInput): Promise<CompanyProfile> {
  const url = input.url?.trim();
  const idea = input.idea?.trim();
  const hasPdf = Boolean(input.pdfBase64);

  // Nothing to analyze -> straight to fallback (built from idea/url if present).
  if (!url && !hasPdf && !idea) {
    return fallbackProfile(input);
  }

  try {
    const userText = analysisUser({ url, idea, hasPdf });

    // Build content parts: text instruction + optional PDF inlineData.
    const parts: any[] = [{ text: userText }];
    if (hasPdf && input.pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: input.pdfBase64, // base64 WITHOUT the data: prefix
        },
      });
    }

    // Config: when a URL is present we MUST use the urlContext tool and therefore
    // CANNOT pass responseSchema (Gemini rejects the combination). For PDF/idea
    // only, we can safely lock the output with a responseSchema.
    const config: any = {
      systemInstruction: analysisSystem(),
      temperature: 0.4,
    };

    if (url) {
      config.tools = [{ urlContext: {} }];
      // No responseMimeType / responseSchema here — prompt enforces raw JSON.
    } else {
      config.responseMimeType = 'application/json';
      config.responseSchema = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          tagline: { type: Type.STRING },
          problem: { type: Type.STRING },
          solution: { type: Type.STRING },
          market: { type: Type.STRING },
          traction: { type: Type.STRING },
          team: { type: Type.STRING },
          businessModel: { type: Type.STRING },
          askAmount: { type: Type.STRING },
          signals: { type: Type.ARRAY, items: { type: Type.STRING } },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          sourceNote: { type: Type.STRING },
        },
        required: [
          'name', 'tagline', 'problem', 'solution', 'market', 'traction',
          'team', 'businessModel', 'askAmount', 'signals', 'redFlags', 'sourceNote',
        ],
      };
    }

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config,
    });

    const parsed = extractJson<Partial<CompanyProfile>>(res.text);
    return normalizeProfile(parsed, input);
  } catch (err) {
    console.error('[gauntlet] analyzeCompany failed:', err);
    // Last-ditch: if the URL path failed (often the tool+schema combo), retry once
    // PDF/idea-only with a strict schema so a deck upload still yields a real profile.
    if (url && (hasPdf || idea)) {
      try {
        return await analyzeCompany({ ...input, url: undefined });
      } catch (retryErr) {
        console.error('[gauntlet] analyzeCompany retry (no-url) failed:', retryErr);
      }
    }
    return fallbackProfile(input);
  }
}

// ---- boss question --------------------------------------------------------

export async function generateBossQuestion(
  profile: CompanyProfile,
  boss: Boss,
  askedSoFar: string[],
  mode?: ModeConfig,
): Promise<string> {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: bossQuestionUser(profile, askedSoFar),
      config: {
        systemInstruction: bossQuestionSystem(boss, mode),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: 'One brutal, company-specific VC question. 1-2 sentences.',
            },
          },
          required: ['question'],
        },
        temperature: 0.9,
      },
    });
    const parsed = extractJson<{ question?: string }>(res.text);
    const q = (parsed?.question || '').trim();
    if (q) return q;
    throw new Error('empty question');
  } catch (err) {
    console.error('[gauntlet] generateBossQuestion failed:', err);
    // Persona + company-flavored fallback so the demo keeps moving.
    return `On ${boss.focus} — walk me through exactly why ${profile.name} wins here. Specifics, not vision.`;
  }
}

// ---- judge ----------------------------------------------------------------

export async function judgeAnswer(
  profile: CompanyProfile,
  boss: Boss,
  question: string,
  answer: string,
  mode?: ModeConfig,
): Promise<JudgeResult> {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: judgeUser(profile, question, answer),
      config: {
        systemInstruction: judgeSystem(boss, mode),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            damage: { type: Type.NUMBER, description: "Damage to the investor's skepticism HP. 0-100." },
            selfDamage: { type: Type.NUMBER, description: "Damage to the founder's own credibility. 0-40." },
            critique: { type: Type.STRING, description: 'Sharp, specific 1-2 sentence critique.' },
            rating: { type: Type.STRING, enum: ['weak', 'solid', 'killer'] },
            followUp: { type: Type.STRING, description: 'A pointed 1-sentence follow-up that raises the stakes.' },
          },
          required: ['damage', 'selfDamage', 'critique', 'rating', 'followUp'],
        },
        temperature: 0.8,
      },
    });
    const parsed = extractJson<Partial<JudgeResult>>(res.text) ?? {};
    const rating: JudgeResult['rating'] =
      parsed.rating === 'killer' || parsed.rating === 'weak' ? parsed.rating : 'solid';
    return {
      damage: clamp(parsed.damage as number, 0, 100),
      selfDamage: clamp(parsed.selfDamage as number, 0, 40),
      critique:
        (parsed.critique || '').trim() ||
        'Decent, but you skated past the hard part. Give me the specifics.',
      rating,
      followUp:
        (parsed.followUp || '').trim() ||
        'And what happens when a better-funded incumbent copies that next quarter?',
    };
  } catch (err) {
    console.error('[gauntlet] judgeAnswer failed:', err);
    // Mild, neutral fallback — keeps the fight going without rewarding noise.
    return {
      damage: 28,
      selfDamage: 8,
      critique:
        'There is a real answer in there, but it is buried in generalities. I need the concrete version.',
      rating: 'solid',
      followUp: 'Be precise: what is the one thing that makes this defensible?',
    };
  }
}

// ---- verdict --------------------------------------------------------------

export async function generateVerdict(
  profile: CompanyProfile,
  transcript: string,
  outcome: 'funded' | 'passed',
  mode?: ModeConfig,
): Promise<Verdict> {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: verdictUser(profile, transcript),
      config: {
        systemInstruction: verdictSystem(outcome, mode),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: 'Fundability score, 0-100.' },
            oneLiner: { type: Type.STRING, description: 'Punchy 1-sentence verdict headline.' },
            investorQuote: { type: Type.STRING, description: 'Quotable, sharable 1-2 sentence partner-voice line.' },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: '2-3 short strength bullet phrases.' },
            risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: '2-3 short risk bullet phrases.' },
            outcome: { type: Type.STRING, enum: ['funded', 'passed'] },
          },
          required: ['score', 'oneLiner', 'investorQuote', 'strengths', 'risks', 'outcome'],
        },
        temperature: 0.85,
      },
    });
    const parsed = extractJson<Partial<Verdict>>(res.text) ?? {};
    const safeOutcome: Verdict['outcome'] =
      parsed.outcome === 'funded' || parsed.outcome === 'passed' ? parsed.outcome : outcome;
    return {
      score: clamp(parsed.score as number, 0, 100),
      oneLiner:
        (parsed.oneLiner || '').trim() ||
        (outcome === 'funded'
          ? 'Survived the room — there is a real company in here.'
          : 'Not yet. The room walked, but the idea has a pulse.'),
      investorQuote:
        (parsed.investorQuote || '').trim() ||
        (outcome === 'funded'
          ? '"I would take a second meeting. Sharpen the wedge and come back with numbers."'
          : '"Pass for now. Get me proof of pull and I will re-open the conversation."'),
      strengths: toStringArray(parsed.strengths, [
        'Clear founder conviction',
        'A real problem worth solving',
      ]),
      risks: toStringArray(parsed.risks, [
        'Defensibility still unproven',
        'Go-to-market needs sharper specifics',
      ]),
      outcome: safeOutcome,
    };
  } catch (err) {
    console.error('[gauntlet] generateVerdict failed:', err);
    const funded = outcome === 'funded';
    return {
      score: funded ? 64 : 31,
      oneLiner: funded
        ? 'Survived the gauntlet — a fundable start with edges to sharpen.'
        : 'The room passed today — strong instincts, thin proof.',
      investorQuote: funded
        ? '"There is signal here. Tighten the moat and the GTM and I am interested."'
        : '"Not a no forever. Bring me traction and the math, and we talk again."',
      strengths: funded
        ? ['Stood up to hard questions', 'Real conviction on the problem']
        : ['Genuine problem worth solving', 'Fast on your feet'],
      risks: funded
        ? ['Moat still needs proof', 'Unit economics unvalidated']
        : ['Defensibility unclear', 'Distribution plan too vague'],
      outcome,
    };
  }
}

// ---- investor matching ----------------------------------------------------

const VALID_WARMTH: InvestorMatch['warmth'][] = ['hot', 'warm', 'cold'];

/** Deterministic warmth by rank when the model omits/garbles it. */
function warmthByRank(rank: number, score: number): InvestorMatch['warmth'] {
  if (rank === 0 && score >= 70) return 'hot';
  if (rank <= 1) return 'warm';
  return 'cold';
}

/** Build 3 honest fallback matches straight from the static shortlist. */
function fallbackInvestors(profile: CompanyProfile, verdict: Verdict): InvestorMatch[] {
  return EVENT_INVESTORS.slice(0, 3).map((inv, i) => ({
    fund: inv.fund,
    partner: inv.partner,
    thesisFit: `${inv.fund} backs ${inv.thesis} — a plausible fit for ${profile.name}.`,
    introEmail:
      `Hi ${inv.partner.split(' ')[0]}, I'm the founder of ${profile.name} — ${profile.tagline} ` +
      `We just cleared a brutal investor gauntlet (fundability ${verdict.score}/100) and are raising ${profile.askAmount}. ` +
      `Given ${inv.fund}'s focus on ${inv.thesis}, I'd love 20 minutes to show you what we're building.`,
    warmth: warmthByRank(i, verdict.score),
  }));
}

/**
 * Pick the 3 best-fit funds from EVENT_INVESTORS and draft a warm intro for each.
 * Validates that the returned funds actually exist in the shortlist; backfills any
 * gaps from the static list. Never throws.
 */
export async function matchInvestors(
  profile: CompanyProfile,
  verdict: Verdict,
): Promise<InvestorMatch[]> {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: investorMatchUser(profile, verdict, EVENT_INVESTORS),
      config: {
        systemInstruction: investorMatchSystem(),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fund: { type: Type.STRING },
                  partner: { type: Type.STRING },
                  thesisFit: { type: Type.STRING },
                  introEmail: { type: Type.STRING },
                  warmth: { type: Type.STRING, enum: ['hot', 'warm', 'cold'] },
                },
                required: ['fund', 'partner', 'thesisFit', 'introEmail', 'warmth'],
              },
            },
          },
          required: ['matches'],
        },
        temperature: 0.7,
      },
    });

    const parsed = extractJson<{ matches?: any[] }>(res.text);
    const rawMatches = Array.isArray(parsed?.matches) ? parsed!.matches : [];

    const matches: InvestorMatch[] = [];
    const usedFunds = new Set<string>();
    rawMatches.forEach((m, i) => {
      if (!m || matches.length >= 3) return;
      const fundName = str(m.fund, '');
      // Resolve against the real shortlist (case-insensitive contains match).
      const known = EVENT_INVESTORS.find(
        (inv) =>
          inv.fund.toLowerCase() === fundName.toLowerCase() ||
          inv.fund.toLowerCase().includes(fundName.toLowerCase()) ||
          (fundName && fundName.toLowerCase().includes(inv.fund.toLowerCase())),
      );
      const fund = known?.fund ?? fundName;
      if (!fund || usedFunds.has(fund)) return;
      usedFunds.add(fund);
      const partner = known?.partner ?? str(m.partner, 'the partner');
      const warmth = VALID_WARMTH.includes(m.warmth) ? m.warmth : warmthByRank(i, verdict.score);
      matches.push({
        fund,
        partner,
        thesisFit:
          str(m.thesisFit, '') ||
          `${fund} fits ${profile.name}${known ? ` — ${known.thesis}` : ''}.`,
        introEmail:
          str(m.introEmail, '') ||
          `Hi ${partner.split(' ')[0]}, I'm the founder of ${profile.name} — ${profile.tagline} ` +
            `We just cleared the Gauntlet (fundability ${verdict.score}/100) and are raising ${profile.askAmount}. ` +
            `I'd love 20 minutes to walk you through it.`,
        warmth,
      });
    });

    // Backfill to 3 from the static shortlist if the model returned fewer/garbled.
    if (matches.length < 3) {
      for (const inv of EVENT_INVESTORS) {
        if (matches.length >= 3) break;
        if (usedFunds.has(inv.fund)) continue;
        usedFunds.add(inv.fund);
        matches.push(fallbackInvestors(profile, verdict).find((f) => f.fund === inv.fund) ?? {
          fund: inv.fund,
          partner: inv.partner,
          thesisFit: `${inv.fund} backs ${inv.thesis} — a plausible fit for ${profile.name}.`,
          introEmail:
            `Hi ${inv.partner.split(' ')[0]}, I'm the founder of ${profile.name} — ${profile.tagline} ` +
            `We're raising ${profile.askAmount} after clearing the Gauntlet (fundability ${verdict.score}/100). ` +
            `Given your focus on ${inv.thesis}, I'd love to connect.`,
          warmth: warmthByRank(matches.length, verdict.score),
        });
      }
    }

    return matches.length ? matches : fallbackInvestors(profile, verdict);
  } catch (err) {
    console.error('[gauntlet] matchInvestors failed:', err);
    return fallbackInvestors(profile, verdict);
  }
}
