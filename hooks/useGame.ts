// THE GAUNTLET — game state machine (LOGIC layer)
// Returns the full GameApi. Drives:
//   onboard -> analyzing -> profile -> arena -> win | lose
import { useCallback, useRef, useState } from 'react';
import { BOSSES, FOUNDER_MAX_HP, MAX_ROUNDS_PER_BOSS } from '../constants';
import {
  analyzeCompany,
  generateBossQuestion,
  judgeAnswer,
  generateVerdict,
  matchInvestors,
} from '../services/geminiService';
import type {
  BossState,
  CompanyInput,
  CompanyProfile,
  GameApi,
  GamePhase,
  InvestorMatch,
  JudgeResult,
  Verdict,
} from '../types';

const freshBosses = (): BossState[] =>
  BOSSES.map((b) => ({ ...b, hp: b.maxHp, defeated: false }));

export function useGame(): GameApi {
  const [phase, setPhase] = useState<GamePhase>('onboard');

  // intake + analysis
  const [companyInput, setCompanyInput] = useState<CompanyInput | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // raise flow
  const [investors, setInvestors] = useState<InvestorMatch[]>([]);
  const [matching, setMatching] = useState(false);

  // arena
  const [bosses, setBosses] = useState<BossState[]>(freshBosses);
  const [currentBossIndex, setCurrentBossIndex] = useState(0);
  const [founderHp, setFounderHp] = useState(FOUNDER_MAX_HP);
  const [question, setQuestion] = useState('');
  const [lastResult, setLastResult] = useState<JudgeResult | null>(null);

  // shared
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs we read inside async flows for the freshest value without re-binding.
  const roundRef = useRef(0); // rounds spent on the current boss
  const askedRef = useRef<string[]>([]); // questions asked to the current boss (avoid repeats)
  const transcriptRef = useRef(''); // full Q/A/J transcript for the verdict
  const profileRef = useRef<CompanyProfile | null>(null); // freshest profile for async grounding

  const currentBoss = bosses[currentBossIndex] ?? null;

  const appendTranscript = (line: string) => {
    transcriptRef.current += (transcriptRef.current ? '\n' : '') + line;
  };

  // ---- analysis ----------------------------------------------------------

  const analyze = useCallback(async (input: CompanyInput) => {
    setCompanyInput(input);
    setAnalyzing(true);
    setError(null);
    setPhase('analyzing');
    try {
      // analyzeCompany never throws — it returns a minimal profile on failure.
      const profile = await analyzeCompany(input);
      profileRef.current = profile;
      setCompanyProfile(profile);
      setPhase('profile');
    } catch (err) {
      // Defensive: should not happen, but never strand the founder on a spinner.
      console.error('[gauntlet] analyze failed:', err);
      const minimal = await analyzeCompany({ idea: input.idea, pdfName: input.pdfName });
      profileRef.current = minimal;
      setCompanyProfile(minimal);
      setError('We could not fully read your sources — proceeding on a partial profile.');
      setPhase('profile');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // ---- arena -------------------------------------------------------------

  // Fetch and set the next question for a given boss (grounded on the profile).
  const askNextQuestion = useCallback(async (boss: BossState) => {
    const profile = profileRef.current;
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const q = await generateBossQuestion(profile, boss, askedRef.current);
      askedRef.current = [...askedRef.current, q];
      appendTranscript(`[${boss.name} — ${boss.title}] Q: ${q}`);
      setQuestion(q);
    } catch (err) {
      console.error('[gauntlet] askNextQuestion failed:', err);
      setError('The investor lost their train of thought. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const enterArena = useCallback(() => {
    const profile = profileRef.current;
    if (!profile) return;
    const startBosses = freshBosses();
    roundRef.current = 0;
    askedRef.current = [];
    transcriptRef.current = `Company: ${profile.name} — ${profile.tagline}`;
    setBosses(startBosses);
    setCurrentBossIndex(0);
    setFounderHp(FOUNDER_MAX_HP);
    setQuestion('');
    setLastResult(null);
    setVerdict(null);
    setInvestors([]);
    setError(null);
    setPhase('arena');
    void askNextQuestion(startBosses[0]);
  }, [askNextQuestion]);

  // Convenience: analyze from a bare idea then drop into the profile screen.
  const start = useCallback(
    (idea: string) => {
      const trimmed = idea.trim();
      if (!trimmed) return;
      void analyze({ idea: trimmed });
    },
    [analyze],
  );

  // ---- finish: verdict (+ raise matching on a win) -----------------------

  const finish = useCallback(async (outcome: 'funded' | 'passed') => {
    const profile = profileRef.current;
    setLoading(true);
    setError(null);
    try {
      const v = profile
        ? await generateVerdict(profile, transcriptRef.current, outcome)
        : null;
      setVerdict(v);

      if (outcome === 'funded' && profile && v) {
        // Win -> raise flow: generate the matched investor shortlist.
        setMatching(true);
        try {
          const matches = await matchInvestors(profile, v);
          setInvestors(matches);
        } catch (matchErr) {
          console.error('[gauntlet] matchInvestors failed:', matchErr);
        } finally {
          setMatching(false);
        }
      }
    } catch (err) {
      console.error('[gauntlet] finish/verdict failed:', err);
      setError('Could not reach the partners — showing a provisional verdict.');
    } finally {
      setLoading(false);
      setPhase(outcome === 'funded' ? 'win' : 'lose');
    }
  }, []);

  const submitAnswer = useCallback(
    async (answer: string) => {
      const trimmed = answer.trim();
      const boss = bosses[currentBossIndex];
      const profile = profileRef.current;
      if (!trimmed || !boss || !profile || loading) return;

      setLoading(true);
      setError(null);
      try {
        const result = await judgeAnswer(profile, boss, question, trimmed);
        setLastResult(result);
        appendTranscript(`A: ${trimmed}`);
        appendTranscript(
          `J: [${result.rating}] dmg ${result.damage}/self ${result.selfDamage} — ${result.critique}`,
        );

        // Apply damage to this boss.
        const newBossHp = Math.max(0, boss.hp - result.damage);
        const bossDown = newBossHp <= 0;
        setBosses((prev) =>
          prev.map((b, i) =>
            i === currentBossIndex ? { ...b, hp: newBossHp, defeated: bossDown } : b,
          ),
        );

        // Apply self-damage to the founder.
        const newFounderHp = Math.max(0, founderHp - result.selfDamage);
        setFounderHp(newFounderHp);

        roundRef.current += 1;

        // 1) Founder credibility destroyed -> immediate loss.
        if (newFounderHp <= 0) {
          await finish('passed');
          return;
        }

        const roundsExhausted = roundRef.current >= MAX_ROUNDS_PER_BOSS;

        // 2) Boss still standing and rounds remain -> next question, same boss.
        if (!bossDown && !roundsExhausted) {
          await askNextQuestion(boss);
          return;
        }

        // 3) Boss cleared (defeated OR survived the rounds) -> advance.
        const isLastBoss = currentBossIndex >= bosses.length - 1;
        if (isLastBoss) {
          await finish('funded');
          return;
        }

        // Move to the next boss: reset per-boss tracking.
        const nextIndex = currentBossIndex + 1;
        roundRef.current = 0;
        askedRef.current = [];
        setCurrentBossIndex(nextIndex);
        // Mark the cleared boss as defeated for UI (progress dots) even if it
        // survived on HP — it's behind the founder now.
        setBosses((prev) =>
          prev.map((b, i) => (i === currentBossIndex ? { ...b, defeated: true } : b)),
        );
        await askNextQuestion(bosses[nextIndex]);
      } catch (err) {
        console.error('[gauntlet] submitAnswer failed:', err);
        setError('The investor is reviewing your answer... something glitched. Try again.');
        setLoading(false);
      }
    },
    [bosses, currentBossIndex, founderHp, question, loading, askNextQuestion, finish],
  );

  // ---- reset -------------------------------------------------------------

  const reset = useCallback(() => {
    roundRef.current = 0;
    askedRef.current = [];
    transcriptRef.current = '';
    profileRef.current = null;
    setPhase('onboard');
    setCompanyInput(null);
    setCompanyProfile(null);
    setAnalyzing(false);
    setInvestors([]);
    setMatching(false);
    setBosses(freshBosses());
    setCurrentBossIndex(0);
    setFounderHp(FOUNDER_MAX_HP);
    setQuestion('');
    setLastResult(null);
    setVerdict(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    phase,
    companyInput,
    companyProfile,
    analyzing,
    investors,
    matching,
    bosses,
    currentBossIndex,
    currentBoss,
    founderHp,
    question,
    lastResult,
    loading,
    error,
    verdict,
    analyze,
    enterArena,
    submitAnswer,
    reset,
    start,
  };
}
