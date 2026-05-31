// THE GAUNTLET — game state machine (W2)
// Returns the full GameApi. Drives: landing -> arena -> win | lose.
import { useCallback, useRef, useState } from 'react';
import { BOSSES, FOUNDER_MAX_HP, MAX_ROUNDS_PER_BOSS } from '../constants';
import {
  generateBossQuestion,
  judgeAnswer,
  generateVerdict,
} from '../services/geminiService';
import type { BossState, GameApi, GamePhase, JudgeResult, Verdict } from '../types';

const freshBosses = (): BossState[] =>
  BOSSES.map((b) => ({ ...b, hp: b.maxHp, defeated: false }));

export function useGame(): GameApi {
  const [phase, setPhase] = useState<GamePhase>('landing');
  const [idea, setIdea] = useState('');
  const [bosses, setBosses] = useState<BossState[]>(freshBosses);
  const [currentBossIndex, setCurrentBossIndex] = useState(0);
  const [founderHp, setFounderHp] = useState(FOUNDER_MAX_HP);
  const [question, setQuestion] = useState('');
  const [lastResult, setLastResult] = useState<JudgeResult | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for values we read inside async flows where we want the freshest value
  // without re-binding the callback on every render.
  const roundRef = useRef(0); // rounds spent on the current boss
  const askedRef = useRef<string[]>([]); // questions asked to the current boss (avoid repeats)
  const transcriptRef = useRef(''); // full Q/A/J transcript for the verdict
  const ideaRef = useRef('');

  const currentBoss = bosses[currentBossIndex] ?? null;

  const appendTranscript = (line: string) => {
    transcriptRef.current += (transcriptRef.current ? '\n' : '') + line;
  };

  // Fetch and set the next question for a given boss.
  const askNextQuestion = useCallback(
    async (boss: BossState) => {
      setLoading(true);
      setError(null);
      try {
        const q = await generateBossQuestion(ideaRef.current, boss, askedRef.current);
        askedRef.current = [...askedRef.current, q];
        appendTranscript(`[${boss.name} — ${boss.title}] Q: ${q}`);
        setQuestion(q);
      } catch (err) {
        console.error('[gauntlet] askNextQuestion failed:', err);
        setError('The investor lost their train of thought. Try again.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const start = useCallback(
    (rawIdea: string) => {
      const trimmed = rawIdea.trim();
      if (!trimmed) return;
      // Reset everything for a clean run.
      const startBosses = freshBosses();
      ideaRef.current = trimmed;
      roundRef.current = 0;
      askedRef.current = [];
      transcriptRef.current = `Startup idea: "${trimmed}"`;
      setIdea(trimmed);
      setBosses(startBosses);
      setCurrentBossIndex(0);
      setFounderHp(FOUNDER_MAX_HP);
      setQuestion('');
      setLastResult(null);
      setVerdict(null);
      setError(null);
      setPhase('arena');
      void askNextQuestion(startBosses[0]);
    },
    [askNextQuestion],
  );

  const finish = useCallback(
    async (outcome: 'funded' | 'passed') => {
      setLoading(true);
      setError(null);
      try {
        const v = await generateVerdict(ideaRef.current, transcriptRef.current, outcome);
        setVerdict(v);
      } catch (err) {
        console.error('[gauntlet] finish/verdict failed:', err);
        setError('Could not reach the partners — showing a provisional verdict.');
      } finally {
        setLoading(false);
        setPhase(outcome === 'funded' ? 'win' : 'lose');
      }
    },
    [],
  );

  const submitAnswer = useCallback(
    async (answer: string) => {
      const trimmed = answer.trim();
      const boss = bosses[currentBossIndex];
      if (!trimmed || !boss || loading) return;

      setLoading(true);
      setError(null);
      try {
        const result = await judgeAnswer(ideaRef.current, boss, question, trimmed);
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

  const reset = useCallback(() => {
    ideaRef.current = '';
    roundRef.current = 0;
    askedRef.current = [];
    transcriptRef.current = '';
    setPhase('landing');
    setIdea('');
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
    idea,
    bosses,
    currentBossIndex,
    currentBoss,
    founderHp,
    question,
    lastResult,
    loading,
    error,
    verdict,
    start,
    submitAnswer,
    reset,
  };
}
