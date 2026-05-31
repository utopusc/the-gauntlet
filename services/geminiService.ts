// THE GAUNTLET — Gemini service (W2)
// Each function wraps a single generateContent call with a responseSchema and
// JSON-parses res.text. Every call is try/catch-wrapped with a sane fallback so
// the live demo NEVER hard-crashes on a parse hiccup or transient API error.
import { GoogleGenAI, Type } from '@google/genai';
import { MODEL } from '../constants';
import type { Boss, JudgeResult, Verdict } from '../types';
import {
  bossQuestionSystem,
  bossQuestionUser,
  judgeSystem,
  judgeUser,
  verdictSystem,
  verdictUser,
} from '../prompts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ---- helpers --------------------------------------------------------------

const clamp = (n: number, min: number, max: number): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, Math.round(v)));
};

const toStringArray = (v: unknown, fallback: string[]): string[] => {
  if (Array.isArray(v)) {
    const arr = v.map((x) => String(x)).filter(Boolean);
    if (arr.length) return arr.slice(0, 4);
  }
  return fallback;
};

// ---- boss question --------------------------------------------------------

export async function generateBossQuestion(
  idea: string,
  boss: Boss,
  askedSoFar: string[],
): Promise<string> {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: bossQuestionUser(idea, askedSoFar),
      config: {
        systemInstruction: bossQuestionSystem(boss),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: 'One brutal, idea-specific VC question. 1-2 sentences.',
            },
          },
          required: ['question'],
        },
        temperature: 0.9,
      },
    });
    const parsed = JSON.parse(res.text) as { question?: string };
    const q = (parsed.question || '').trim();
    if (q) return q;
    throw new Error('empty question');
  } catch (err) {
    console.error('[gauntlet] generateBossQuestion failed:', err);
    // Persona-flavored fallback so the demo keeps moving.
    return `On ${boss.focus} — walk me through exactly why "${idea}" wins here. Specifics, not vision.`;
  }
}

// ---- judge ----------------------------------------------------------------

export async function judgeAnswer(
  idea: string,
  boss: Boss,
  question: string,
  answer: string,
): Promise<JudgeResult> {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: judgeUser(idea, question, answer),
      config: {
        systemInstruction: judgeSystem(boss),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            damage: {
              type: Type.NUMBER,
              description: "Damage to the investor's skepticism HP. 0-100.",
            },
            selfDamage: {
              type: Type.NUMBER,
              description: "Damage to the founder's own credibility. 0-40.",
            },
            critique: {
              type: Type.STRING,
              description: 'Sharp, specific 1-2 sentence critique.',
            },
            rating: {
              type: Type.STRING,
              enum: ['weak', 'solid', 'killer'],
            },
            followUp: {
              type: Type.STRING,
              description: 'A pointed 1-sentence follow-up that raises the stakes.',
            },
          },
          required: ['damage', 'selfDamage', 'critique', 'rating', 'followUp'],
        },
        temperature: 0.8,
      },
    });
    const parsed = JSON.parse(res.text) as Partial<JudgeResult>;
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
  idea: string,
  transcript: string,
  outcome: 'funded' | 'passed',
): Promise<Verdict> {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: verdictUser(idea, transcript),
      config: {
        systemInstruction: verdictSystem(outcome),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: 'Fundability score, 0-100.' },
            oneLiner: { type: Type.STRING, description: 'Punchy 1-sentence verdict headline.' },
            investorQuote: {
              type: Type.STRING,
              description: 'Quotable, sharable 1-2 sentence partner-voice line.',
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 short strength bullet phrases.',
            },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 short risk bullet phrases.',
            },
            outcome: { type: Type.STRING, enum: ['funded', 'passed'] },
          },
          required: ['score', 'oneLiner', 'investorQuote', 'strengths', 'risks', 'outcome'],
        },
        temperature: 0.85,
      },
    });
    const parsed = JSON.parse(res.text) as Partial<Verdict>;
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
