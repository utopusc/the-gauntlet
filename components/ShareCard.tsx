import React from 'react';
import { motion } from 'framer-motion';
import type { Verdict } from '../types';

interface ShareCardProps {
  verdict: Verdict;
  idea: string;
}

/* ---------------------------------------------------------------------------
 * Score band -> arcade palette. Each band picks an accent CSS var + a pixel
 * glow helper class + a high-score "RANK" label.
 * ------------------------------------------------------------------------- */
function scoreTheme(score: number) {
  if (score >= 75) {
    return {
      accent: 'var(--neon-cyan)',
      glowClass: 'glow-cyan',
      text: 'text-neonCyan',
      band: 'S-RANK',
    };
  }
  if (score >= 50) {
    return {
      accent: 'var(--neon-violet)',
      glowClass: 'glow',
      text: 'text-neonViolet',
      band: 'A-RANK',
    };
  }
  if (score >= 30) {
    return {
      accent: 'var(--neon-amber)',
      glowClass: 'glow-amber',
      text: 'text-neonAmber',
      band: 'C-RANK',
    };
  }
  return {
    accent: 'var(--neon-red)',
    glowClass: 'glow-red',
    text: 'text-neonRed',
    band: 'GAME OVER',
  };
}

/* ---------------------------------------------------------------------------
 * High-score readout: a big pixel "score / 100" that counts up + a RANK label.
 * Replaces the old SVG progress ring with an arcade scoreboard.
 * ------------------------------------------------------------------------- */
const HighScore: React.FC<{ score: number; theme: ReturnType<typeof scoreTheme> }> = ({
  score,
  theme,
}) => {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <span className="font-pixel text-[8px] tracking-[0.3em] text-neonInk/55">
        SCORE
      </span>
      <div className="flex items-end gap-1">
        <motion.span
          className={`font-pixel text-4xl tabular-nums sm:text-5xl ${theme.text} ${theme.glowClass}`}
          initial={{ opacity: 0, scale: 0.5, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 12 }}
        >
          {clamped}
        </motion.span>
        <span className="font-pixel text-base text-neonInk/40">/100</span>
      </div>
      <motion.span
        className={`font-pixel text-[10px] tracking-[0.25em] ${theme.text} ${theme.glowClass}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        {theme.band}
      </motion.span>
    </div>
  );
};

export const ShareCard: React.FC<ShareCardProps> = ({ verdict, idea }) => {
  const theme = scoreTheme(verdict.score);
  const funded = verdict.outcome === 'funded';

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="pixel-panel scanline relative w-full max-w-xl overflow-hidden p-6 sm:p-8"
      style={{ ['--accent' as any]: theme.accent }}
    >
      {/* header: brand + outcome stamp */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg pixelated">⚔️</span>
          <span className="font-pixel text-[10px] tracking-[0.25em] text-neonInk/80">
            THE GAUNTLET
          </span>
        </div>
        <motion.div
          initial={{ rotate: -10, opacity: 0, scale: 1.5 }}
          animate={{ rotate: -6, opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 200, damping: 12 }}
          className={`font-pixel border-[3px] px-2.5 py-1.5 text-[10px] tracking-widest ${theme.glowClass} ${
            funded ? 'border-neonGreen text-neonGreen' : 'border-neonRed text-neonRed'
          }`}
        >
          {funded ? 'FUNDED' : 'PASSED'}
        </motion.div>
      </div>

      {/* score + verdict line */}
      <div className="relative mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
        <HighScore score={verdict.score} theme={theme} />
        <div className="text-center sm:text-left">
          <div className="font-pixel text-[9px] tracking-[0.25em] text-neonInk/45">
            INVESTOR VERDICT
          </div>
          <h2 className="mt-2 font-pixel text-base leading-relaxed text-neonInk sm:text-lg">
            {verdict.oneLiner}
          </h2>
        </div>
      </div>

      {/* the pitch */}
      <div className="relative mt-6 border-[3px] border-black bg-black/50 px-4 py-3">
        <div className="font-pixel text-[8px] tracking-[0.25em] text-neonInk/45">
          THE PITCH
        </div>
        <p className="mt-1 text-lg text-neonInk/85">"{idea.trim()}"</p>
      </div>

      {/* investor quote */}
      <blockquote
        className="relative mt-6 border-l-[3px] pl-4"
        style={{ borderColor: theme.accent }}
      >
        <span className={`font-pixel text-2xl leading-none ${theme.text}`}>"</span>
        <p className="-mt-2 pl-2 text-xl italic text-neonInk">
          {verdict.investorQuote}
        </p>
        <footer className="mt-1 pl-2 font-pixel text-[8px] tracking-wider text-neonInk/45">
          — THE GAUNTLET INVESTOR PANEL
        </footer>
      </blockquote>

      {/* strengths + risks */}
      <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 font-pixel text-[9px] tracking-[0.2em] text-neonGreen glow">
            <span style={{ ['--accent' as any]: 'var(--neon-green)' }}>STRENGTHS</span>
          </div>
          <ul className="space-y-1.5">
            {verdict.strengths.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="flex items-start gap-2 text-lg leading-snug text-neonInk/85"
              >
                <span className="mt-1 text-base text-neonGreen">▸</span>
                <span>{s}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 font-pixel text-[9px] tracking-[0.2em] text-neonAmber glow-amber">
            RISKS
          </div>
          <ul className="space-y-1.5">
            {verdict.risks.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="flex items-start gap-2 text-lg leading-snug text-neonInk/85"
              >
                <span className="mt-1 text-base text-neonAmber">▲</span>
                <span>{r}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* footer brand strip */}
      <div className="relative mt-7 flex items-center justify-between border-t-[3px] border-black pt-4">
        <span className="font-pixel text-[8px] tracking-[0.25em] text-neonInk/40">
          AI VC BOSS BATTLE
        </span>
        <span className="font-pixel text-[8px] tracking-[0.25em] text-neonInk/40">
          THE-GAUNTLET
        </span>
      </div>
    </motion.div>
  );
};

export default ShareCard;
