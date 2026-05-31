import React from 'react';
import { motion } from 'framer-motion';
import type { Verdict } from '../types';

interface ShareCardProps {
  verdict: Verdict;
  idea: string;
}

/** Pick an accent palette from the score band. */
function scoreTheme(score: number) {
  if (score >= 75) {
    return {
      ring: '#22d3ee', // cyan
      ring2: '#a855f7', // violet
      text: 'text-cyan-300',
      glow: 'rgba(34,211,238,0.55)',
      band: 'TOP TIER',
    };
  }
  if (score >= 50) {
    return {
      ring: '#a855f7',
      ring2: '#f59e0b',
      text: 'text-violet-300',
      glow: 'rgba(168,85,247,0.5)',
      band: 'PROMISING',
    };
  }
  if (score >= 30) {
    return {
      ring: '#f59e0b',
      ring2: '#fb7185',
      text: 'text-amber-300',
      glow: 'rgba(245,158,11,0.5)',
      band: 'RISKY',
    };
  }
  return {
    ring: '#fb7185',
    ring2: '#f43f5e',
    text: 'text-rose-300',
    glow: 'rgba(244,63,94,0.5)',
    band: 'PASS',
  };
}

const RING_SIZE = 168;
const RING_STROKE = 12;
const RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ScoreRing: React.FC<{ score: number; theme: ReturnType<typeof scoreTheme> }> = ({
  score,
  theme,
}) => {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div
      className="relative shrink-0"
      style={{ width: RING_SIZE, height: RING_SIZE }}
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.ring} />
            <stop offset="100%" stopColor={theme.ring2} />
          </linearGradient>
        </defs>
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={RING_STROKE}
        />
        <motion.circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${theme.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-5xl font-black tabular-nums ${theme.text}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        >
          {clamped}
        </motion.span>
        <span className="text-[10px] font-semibold tracking-[0.25em] text-slate-400">
          / 100
        </span>
      </div>
    </div>
  );
};

export const ShareCard: React.FC<ShareCardProps> = ({ verdict, idea }) => {
  const theme = scoreTheme(verdict.score);
  const funded = verdict.outcome === 'funded';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10
                 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-7 sm:p-9
                 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
      style={{ boxShadow: `0 0 80px -40px ${theme.glow}` }}
    >
      {/* corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
        style={{ background: theme.glow, opacity: 0.4 }}
      />

      {/* header: brand + stamp */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <span className="text-xs font-bold tracking-[0.35em] text-slate-300">
            THE GAUNTLET
          </span>
        </div>
        <motion.div
          initial={{ rotate: -12, opacity: 0, scale: 1.4 }}
          animate={{ rotate: -8, opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 180, damping: 12 }}
          className={`rounded-md border-2 px-3 py-1 text-xs font-black tracking-widest ${
            funded
              ? 'border-cyan-400/70 text-cyan-300'
              : 'border-rose-500/70 text-rose-300'
          }`}
        >
          {funded ? 'TERM SHEET' : 'PASSED'}
        </motion.div>
      </div>

      {/* score + verdict line */}
      <div className="relative mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
        <ScoreRing score={verdict.score} theme={theme} />
        <div className="text-center sm:text-left">
          <div
            className={`text-[11px] font-bold tracking-[0.3em] ${theme.text}`}
          >
            {theme.band}
          </div>
          <h2 className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">
            {verdict.oneLiner}
          </h2>
        </div>
      </div>

      {/* the pitch */}
      <div className="relative mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="text-[10px] font-semibold tracking-[0.25em] text-slate-500">
          THE PITCH
        </div>
        <p className="mt-1 text-sm text-slate-200">"{idea.trim()}"</p>
      </div>

      {/* investor quote */}
      <blockquote className="relative mt-6 border-l-2 border-white/15 pl-4">
        <span className={`text-3xl leading-none ${theme.text}`}>“</span>
        <p className="-mt-3 pl-3 text-lg font-medium italic text-slate-100">
          {verdict.investorQuote}
        </p>
        <footer className="mt-1 pl-3 text-xs text-slate-500">
          — The Gauntlet investor panel
        </footer>
      </blockquote>

      {/* strengths + risks */}
      <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-[11px] font-bold tracking-[0.25em] text-emerald-400">
            STRENGTHS
          </div>
          <ul className="space-y-1.5">
            {verdict.strengths.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="flex items-start gap-2 text-sm text-slate-200"
              >
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>{s}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-[11px] font-bold tracking-[0.25em] text-amber-400">
            RISKS
          </div>
          <ul className="space-y-1.5">
            {verdict.risks.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="flex items-start gap-2 text-sm text-slate-200"
              >
                <span className="mt-0.5 text-amber-400">▲</span>
                <span>{r}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* footer brand strip */}
      <div className="relative mt-7 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-[10px] tracking-[0.3em] text-slate-500">
          AI VC BOSS BATTLE
        </span>
        <span className="text-[10px] tracking-[0.3em] text-slate-500">
          the-gauntlet
        </span>
      </div>
    </motion.div>
  );
};

export default ShareCard;
