// THE GAUNTLET — game state machine (LOGIC layer)
// Returns the full GameApi. Drives:
//   onboard -> analyzing -> profile -> arena -> win | lose
//
// This layer also owns the ARENA CLOCK, the COMBO + SCORING engine, and the
// end-of-run LEADERBOARD qualify/save. The timer lives entirely here (a single
// window.setInterval); the UI reads `timeLeft` / `timeLimit` and renders.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BOSSES,
  DEFAULT_MODE,
  FOUNDER_MAX_HP,
  getMode,
} from '../constants';
import {
  analyzeCompany,
  generateBossQuestion,
  judgeAnswer,
  generateVerdict,
  matchInvestors,
} from '../services/geminiService';
import { speedTier, answerPoints, endBonuses } from '../lib/scoring';
import * as leaderboard from '../lib/leaderboard';
import type { ScoreEntry } from '../lib/leaderboard';
import { sfx } from '../lib/sfx';
import type { QAHistoryItem } from '../prompts';
import type {
  BossState,
  CompanyInput,
  CompanyProfile,
  GameApi,
  GameMode,
  GamePhase,
  InvestorMatch,
  JudgeResult,
  ModeConfig,
  ScoreBreakdown,
  Verdict,
} from '../types';

// Bosses at full HP. `mult` scales each boss's maxHp (and starting hp) by the
// active mode's bossHpMult — applied fresh at arena entry. Default 1 = base balance.
const freshBosses = (mult = 1): BossState[] =>
  BOSSES.map((b) => {
    const maxHp = Math.max(1, Math.round(b.maxHp * mult));
    return { ...b, maxHp, hp: maxHp, defeated: false };
  });

const TICK_MS = 200; // countdown resolution
const TICK_WARN_SECS = 5; // play sfx.tick() in the final N seconds

export function useGame(): GameApi {
  const [phase, setPhase] = useState<GamePhase>('onboard');

  // mode (chosen on Onboard, before the battle). Default keeps original balance.
  const [mode, setModeState] = useState<GameMode>(DEFAULT_MODE);
  const modeConfig = useMemo<ModeConfig>(() => getMode(mode), [mode]);
  const modeRef = useRef<ModeConfig>(getMode(DEFAULT_MODE)); // freshest resolved config for async flows

  // intake + analysis
  const [companyInput, setCompanyInput] = useState<CompanyInput | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // raise flow
  const [investors, setInvestors] = useState<InvestorMatch[]>([]);
  const [matching, setMatching] = useState(false);

  // arena
  const [bosses, setBosses] = useState<BossState[]>(() => freshBosses());
  const [currentBossIndex, setCurrentBossIndex] = useState(0);
  // founderMaxHp is the mode-scaled ceiling; founderHp is the current value.
  const [founderMaxHp, setFounderMaxHp] = useState(FOUNDER_MAX_HP);
  const [founderHp, setFounderHp] = useState(FOUNDER_MAX_HP);
  const [question, setQuestion] = useState('');
  const [lastResult, setLastResult] = useState<JudgeResult | null>(null);

  // ---- scoring / combo / timer ----
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [lastSpeed, setLastSpeed] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState(getMode(DEFAULT_MODE).timeLimit);
  const [timeLeft, setTimeLeft] = useState(getMode(DEFAULT_MODE).timeLimit);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);

  // ---- leaderboard ----
  const [qualifies, setQualifies] = useState(false);
  const [lastEntry, setLastEntry] = useState<ScoreEntry | null>(null);

  // shared
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs we read inside async flows for the freshest value without re-binding.
  const roundRef = useRef(0); // rounds spent on the current boss
  const askedRef = useRef<string[]>([]); // questions asked to the current boss (avoid repeats)
  const historyRef = useRef<QAHistoryItem[]>([]); // per-boss Q/A/J exchange (drives follow-ups)
  const transcriptRef = useRef(''); // full Q/A/J transcript for the verdict
  const profileRef = useRef<CompanyProfile | null>(null); // freshest profile for async grounding

  // Scoring refs (read synchronously inside the same async submit flow).
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const breakdownRef = useRef({ base: 0, speed: 0, combo: 0 });
  const tookDamageRef = useRef(false);
  const finishedRef = useRef(false); // guard: finishGame only runs once per run

  // Timer refs.
  const timerRef = useRef<number | null>(null);
  const lastTickSecRef = useRef<number>(Infinity);
  const handleTimeoutRef = useRef<() => void>(() => {});

  const currentBoss = bosses[currentBossIndex] ?? null;

  // ---- timer control -----------------------------------------------------

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start a fresh countdown for the current question. Plays sfx.tick() in the
  // final few seconds and fires the timeout handler at zero.
  const startTimer = useCallback(
    (limit: number) => {
      clearTimer();
      const startedAt = Date.now();
      lastTickSecRef.current = Infinity;
      setTimeLimit(limit);
      setTimeLeft(limit);
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAt) / 1000;
        const remaining = Math.max(0, limit - elapsed);
        setTimeLeft(remaining);
        const wholeSec = Math.ceil(remaining);
        if (wholeSec <= TICK_WARN_SECS && wholeSec > 0 && wholeSec < lastTickSecRef.current) {
          lastTickSecRef.current = wholeSec;
          try {
            sfx.tick();
          } catch {
            /* ignore */
          }
        }
        if (remaining <= 0) {
          clearTimer();
          handleTimeoutRef.current();
        }
      }, TICK_MS);
    },
    [clearTimer],
  );

  // Cleanup on unmount.
  useEffect(() => () => clearTimer(), [clearTimer]);

  // Select the active mode (called from the Onboard mode selector). Keeps modeRef
  // in sync so in-flight async battle calls always read the freshest config, and
  // resyncs the displayed clock on the onboard screen.
  const setMode = useCallback((m: GameMode) => {
    const cfg = getMode(m);
    modeRef.current = cfg;
    setModeState(m);
    setTimeLimit(cfg.timeLimit);
    setTimeLeft(cfg.timeLimit);
  }, []);

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
  // Stops the clock while generating, then (re)starts it once the question shows.
  const askNextQuestion = useCallback(
    async (boss: BossState) => {
      const profile = profileRef.current;
      if (!profile) return;
      clearTimer();
      setLoading(true);
      setError(null);
      try {
        const q = await generateBossQuestion(
          profile,
          boss,
          modeRef.current,
          historyRef.current,
          askedRef.current,
        );
        askedRef.current = [...askedRef.current, q];
        appendTranscript(`[${boss.name} — ${boss.title}] Q: ${q}`);
        setQuestion(q);
        // Start the clock only once the question is on screen.
        startTimer(modeRef.current.timeLimit);
      } catch (err) {
        console.error('[gauntlet] askNextQuestion failed:', err);
        setError('The investor lost their train of thought. Try again.');
      } finally {
        setLoading(false);
      }
    },
    [clearTimer, startTimer],
  );

  const enterArena = useCallback(() => {
    const profile = profileRef.current;
    if (!profile) return;
    // Apply the active mode's balance: tankier/squishier bosses + scaled founder HP.
    const cfg = modeRef.current;
    const startBosses = freshBosses(cfg.bossHpMult);
    const scaledFounderMax = Math.max(1, Math.round(FOUNDER_MAX_HP * cfg.founderHpMult));

    // Reset per-boss + run trackers.
    roundRef.current = 0;
    askedRef.current = [];
    historyRef.current = [];
    transcriptRef.current = `Company: ${profile.name} — ${profile.tagline}`;
    comboRef.current = 0;
    scoreRef.current = 0;
    breakdownRef.current = { base: 0, speed: 0, combo: 0 };
    tookDamageRef.current = false;
    finishedRef.current = false;

    setBosses(startBosses);
    setCurrentBossIndex(0);
    setFounderMaxHp(scaledFounderMax);
    setFounderHp(scaledFounderMax);
    setQuestion('');
    setLastResult(null);
    setVerdict(null);
    setInvestors([]);
    setError(null);

    // Reset scoring/combo/leaderboard view state.
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLastPoints(null);
    setLastSpeed(null);
    setScoreBreakdown(null);
    setQualifies(false);
    setLastEntry(null);

    setPhase('arena');
    try {
      sfx.select();
    } catch {
      /* ignore */
    }
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

  const finish = useCallback(
    async (outcome: 'funded' | 'passed', founderHpAtEnd: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      clearTimer();

      const cfg = modeRef.current;
      const profile = profileRef.current;

      // End-of-run bonuses (mode-multiplied).
      const tookNoDamage = !tookDamageRef.current;
      const bonus = endBonuses(outcome, Math.max(0, founderHpAtEnd), tookNoDamage, cfg.scoreMult);
      const finalScore = Math.round(scoreRef.current + bonus);
      scoreRef.current = finalScore;
      setScore(finalScore);

      const bd = breakdownRef.current;
      setScoreBreakdown({
        base: Math.round(bd.base),
        speed: Math.round(bd.speed),
        combo: Math.round(bd.combo),
        bonuses: bonus,
        total: finalScore,
      });

      // Leaderboard qualification (computed off the FINAL score). No auto-save.
      try {
        setQualifies(leaderboard.qualifies(finalScore));
      } catch {
        setQualifies(false);
      }

      try {
        outcome === 'funded' ? sfx.win() : sfx.lose();
      } catch {
        /* ignore */
      }

      setLoading(true);
      setError(null);
      try {
        const v = profile
          ? await generateVerdict(profile, transcriptRef.current, outcome, cfg)
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
    },
    [clearTimer],
  );

  // ---- advance to next round / boss / end --------------------------------
  // Centralized so both submitAnswer and the timeout path reuse it.
  const advanceAfterRound = useCallback(
    async (boss: BossState, bossDown: boolean, newFounderHp: number) => {
      roundRef.current += 1;

      // 1) Founder credibility destroyed -> immediate loss.
      if (newFounderHp <= 0) {
        await finish('passed', 0);
        return;
      }

      const roundsExhausted = roundRef.current >= modeRef.current.rounds;

      // 2) Boss still standing and rounds remain -> next question, same boss (follow-up).
      if (!bossDown && !roundsExhausted) {
        await askNextQuestion(boss);
        return;
      }

      // 3) Boss cleared (defeated OR survived the rounds) -> advance.
      if (bossDown) {
        try {
          sfx.ko();
        } catch {
          /* ignore */
        }
      }
      const isLastBoss = currentBossIndex >= bosses.length - 1;
      if (isLastBoss) {
        await finish('funded', newFounderHp);
        return;
      }

      // Move to the next boss: reset per-boss tracking.
      const nextIndex = currentBossIndex + 1;
      roundRef.current = 0;
      askedRef.current = [];
      historyRef.current = [];
      setCurrentBossIndex(nextIndex);
      // Mark the cleared boss as defeated for UI (progress dots) even if it
      // survived on HP — it's behind the founder now.
      setBosses((prev) =>
        prev.map((b, i) => (i === currentBossIndex ? { ...b, defeated: true } : b)),
      );
      await askNextQuestion(bosses[nextIndex]);
    },
    [askNextQuestion, bosses, currentBossIndex, finish],
  );

  // ---- timeout handler ---------------------------------------------------
  const handleTimeout = useCallback(() => {
    if (loading || finishedRef.current) return;
    const boss = bosses[currentBossIndex];
    if (!boss) return;
    clearTimer();

    try {
      sfx.buzz();
    } catch {
      /* ignore */
    }

    const cfg = modeRef.current;
    // No points, combo reset, founder takes self-damage.
    setLastPoints(0);
    setLastSpeed('TIME OUT');
    comboRef.current = 0;
    setCombo(0);
    tookDamageRef.current = true;

    const selfDamage = Math.round(22 * cfg.selfDamageMult);
    const timeoutResult: JudgeResult = {
      damage: 0,
      selfDamage,
      critique: 'Out of time. In this room, hesitation reads as a "no". Be faster.',
      rating: 'weak',
      followUp: 'Lead with the answer next time — what is the single sharpest version?',
    };
    setLastResult(timeoutResult);

    // Record the timeout as a used round in both the transcript and the per-boss history.
    appendTranscript('A: (no answer — timed out)');
    appendTranscript(`J: [weak] dmg 0/self ${selfDamage} — timed out.`);
    historyRef.current = [
      ...historyRef.current,
      { question, answer: '(no answer — timed out)', rating: 'weak' },
    ];

    const newFounderHp = Math.max(0, founderHp - selfDamage);
    setFounderHp(newFounderHp);

    // Let the damage register, then advance (boss not down on a timeout).
    window.setTimeout(() => {
      void advanceAfterRound(boss, false, newFounderHp);
    }, 800);
  }, [advanceAfterRound, bosses, clearTimer, currentBossIndex, founderHp, loading, question]);
  handleTimeoutRef.current = handleTimeout;

  // ---- submit answer -----------------------------------------------------

  const submitAnswer = useCallback(
    async (answer: string) => {
      const trimmed = answer.trim();
      const boss = bosses[currentBossIndex];
      const profile = profileRef.current;
      if (!trimmed || !boss || !profile || loading || finishedRef.current) return;

      // Snapshot the clock BEFORE we stop it -> speed tier.
      const frac = timeLimit > 0 ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 0;
      const tier = speedTier(frac);
      clearTimer();

      setLoading(true);
      setError(null);
      const cfg = modeRef.current;
      try {
        const result = await judgeAnswer(profile, boss, cfg, question, trimmed);
        setLastResult(result);
        appendTranscript(`A: ${trimmed}`);
        appendTranscript(
          `J: [${result.rating}] dmg ${result.damage}/self ${result.selfDamage} — ${result.critique}`,
        );
        // Thread this exchange into the per-boss history so the NEXT question is a real follow-up.
        historyRef.current = [
          ...historyRef.current,
          { question, answer: trimmed, rating: result.rating },
        ];

        // ---- SFX ----
        try {
          if (result.rating === 'killer') sfx.hit();
          else if (result.rating === 'weak') sfx.blip();
          else sfx.hit();
        } catch {
          /* ignore */
        }

        // ---- SCORING ----
        const prevStreak = comboRef.current; // streak BEFORE this answer
        const pts =
          result.rating === 'weak'
            ? 0
            : answerPoints(result.rating, tier.mult, cfg.scoreMult, prevStreak);

        // Approximate the base/speed/combo split for the end-screen breakdown.
        if (pts > 0) {
          const base = answerPoints(result.rating, 1, cfg.scoreMult, 0);
          const withSpeed = answerPoints(result.rating, tier.mult, cfg.scoreMult, 0);
          breakdownRef.current.base += base;
          breakdownRef.current.speed += Math.max(0, withSpeed - base);
          breakdownRef.current.combo += Math.max(0, pts - withSpeed);
        }

        setLastPoints(pts);
        setLastSpeed(tier.label);
        scoreRef.current += pts;
        setScore(scoreRef.current);

        // Combo: increment on solid/killer, reset on weak.
        if (result.rating === 'weak') {
          comboRef.current = 0;
        } else {
          comboRef.current = prevStreak + 1;
          setBestCombo((b) => Math.max(b, comboRef.current));
        }
        setCombo(comboRef.current);

        // ---- DAMAGE ----
        const newBossHp = Math.max(0, boss.hp - result.damage);
        const bossDown = newBossHp <= 0;
        setBosses((prev) =>
          prev.map((b, i) =>
            i === currentBossIndex ? { ...b, hp: newBossHp, defeated: bossDown } : b,
          ),
        );

        // Apply self-damage to the founder, scaled by the mode (EASY/FUN softens, EXPERT amplifies).
        const scaledSelfDamage = Math.round(result.selfDamage * cfg.selfDamageMult);
        if (scaledSelfDamage > 0) tookDamageRef.current = true;
        const newFounderHp = Math.max(0, founderHp - scaledSelfDamage);
        setFounderHp(newFounderHp);

        await advanceAfterRound({ ...boss, hp: newBossHp }, bossDown, newFounderHp);
      } catch (err) {
        console.error('[gauntlet] submitAnswer failed:', err);
        setError('The investor is reviewing your answer... something glitched. Try again.');
        setLoading(false);
      }
    },
    [
      advanceAfterRound,
      bosses,
      currentBossIndex,
      founderHp,
      question,
      loading,
      clearTimer,
      timeLeft,
      timeLimit,
    ],
  );

  // ---- leaderboard save --------------------------------------------------

  const saveScore = useCallback(
    (name: string): ScoreEntry => {
      const outcome: 'funded' | 'passed' = phase === 'win' ? 'funded' : 'passed';
      const entry = leaderboard.addScore({
        name: (name || 'YOU').toUpperCase().slice(0, 12),
        score: scoreRef.current,
        mode,
        company: profileRef.current?.name || companyProfile?.name || 'Unknown',
        outcome,
      });
      setLastEntry(entry);
      try {
        sfx.select();
      } catch {
        /* ignore */
      }
      return entry;
    },
    [companyProfile, mode, phase],
  );

  // ---- reset -------------------------------------------------------------

  const reset = useCallback(() => {
    clearTimer();
    roundRef.current = 0;
    askedRef.current = [];
    historyRef.current = [];
    transcriptRef.current = '';
    profileRef.current = null;
    comboRef.current = 0;
    scoreRef.current = 0;
    breakdownRef.current = { base: 0, speed: 0, combo: 0 };
    tookDamageRef.current = false;
    finishedRef.current = false;

    setPhase('onboard');
    setCompanyInput(null);
    setCompanyProfile(null);
    setAnalyzing(false);
    setInvestors([]);
    setMatching(false);
    // Reset to BASE balance; enterArena re-applies the active mode's mults.
    // The selected `mode` itself is intentionally preserved across reset so a
    // replay honors the founder's chosen difficulty.
    setBosses(freshBosses());
    setCurrentBossIndex(0);
    setFounderMaxHp(FOUNDER_MAX_HP);
    setFounderHp(FOUNDER_MAX_HP);
    setQuestion('');
    setLastResult(null);
    setVerdict(null);
    setError(null);
    setLoading(false);

    // Scoring / combo / timer / leaderboard.
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLastPoints(null);
    setLastSpeed(null);
    setScoreBreakdown(null);
    setTimeLimit(modeRef.current.timeLimit);
    setTimeLeft(modeRef.current.timeLimit);
    setQualifies(false);
    setLastEntry(null);
  }, [clearTimer]);

  return {
    mode,
    setMode,
    modeConfig,
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
    founderMaxHp,
    question,
    lastResult,

    // scoring / combo / timer
    score,
    combo,
    bestCombo,
    lastPoints,
    lastSpeed,
    timeLeft,
    timeLimit,
    scoreBreakdown,

    // leaderboard
    qualifies,
    lastEntry,
    saveScore,

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

export default useGame;
