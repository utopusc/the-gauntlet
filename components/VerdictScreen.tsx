import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GameApi } from '../types';
import { ShareCard } from './ShareCard';
import { NameEntry } from './NameEntry';
import { Button } from './ui/Button';
import { buildShareText, shareToX, shareToLinkedIn } from '../lib/share';
import { sfx } from '../lib/sfx';

interface VerdictScreenProps {
  game: GameApi;
  /** Open the App-owned HIGH SCORES (leaderboard) overlay. */
  onOpenLeaderboard: () => void;
}

/** Map a final score to an arcade RANK letter (shared bands with the win screen). */
function rankFor(score: number): { rank: string; color: string } {
  if (score >= 8000) return { rank: 'S', color: 'var(--neon-cyan)' };
  if (score >= 5000) return { rank: 'A', color: 'var(--neon-green)' };
  if (score >= 3000) return { rank: 'B', color: 'var(--neon-violet)' };
  if (score >= 1500) return { rank: 'C', color: 'var(--neon-amber)' };
  return { rank: 'D', color: 'var(--neon-red)' };
}

/* ---------------------------------------------------------------------------
 * FINAL SCORE board for a LOSS — same total + breakdown + rank readout as the
 * win screen, themed toward the rejection palette. Counts up on mount.
 * ------------------------------------------------------------------------- */
const FinalScore: React.FC<{ game: GameApi }> = ({ game }) => {
  const total = Math.max(0, Math.round(game.score));
  const bd = game.scoreBreakdown;
  const { rank, color } = rankFor(total);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(eased * total));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const rows: Array<{ label: string; value: number | string }> = bd
    ? [
        { label: 'BASE', value: bd.base.toLocaleString() },
        { label: 'SPEED', value: `+${bd.speed.toLocaleString()}` },
        { label: 'COMBO', value: `+${bd.combo.toLocaleString()}` },
        { label: 'BONUS', value: `+${bd.bonuses.toLocaleString()}` },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="pixel-panel scanline flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8"
      style={{ ['--accent' as any]: color }}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="flex flex-col items-center sm:items-start">
          <span className="font-pixel text-[9px] tracking-[0.3em] text-neonInk/55">
            FINAL SCORE
          </span>
          <span
            className="font-pixel glow text-5xl tabular-nums leading-none sm:text-7xl"
            style={{ color }}
          >
            {shown.toLocaleString()}
          </span>
          <span className="font-pixel mt-2 text-[8px] tracking-[0.25em] text-neonInk/45">
            BEST COMBO ×{game.bestCombo}
          </span>
        </div>

        <motion.div
          initial={{ scale: 1.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: -4 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 12 }}
          className="font-pixel glow grid h-24 w-24 shrink-0 place-items-center border-[3px] text-5xl"
          style={{ color, borderColor: color, boxShadow: `0 0 18px ${color}` }}
          aria-label={`Rank ${rank}`}
        >
          {rank}
        </motion.div>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t-[3px] border-black pt-4 sm:grid-cols-4">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-1">
              <span className="font-pixel text-[8px] tracking-[0.2em] text-neonInk/45">
                {r.label}
              </span>
              <span className="font-pixel tabular-nums text-sm text-neonInk">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/**
 * The LOSE / rejection screen — arcade "GAME OVER". A win routes to RaiseScreen
 * instead; this only shows when the founder's credibility hit zero (outcome 'passed').
 * Plays the K.O. slam + a CONTINUE? countdown energy, then the post-mortem card.
 */
export const VerdictScreen: React.FC<VerdictScreenProps> = ({ game, onOpenLeaderboard }) => {
  const { verdict, companyProfile, reset } = game;

  // K.O. flash first, then settle into GAME OVER. Failure sting on mount.
  const [phase, setPhase] = useState<'ko' | 'over'>('ko');
  // Track whether the player has already saved this run's high score.
  const [saved, setSaved] = useState<boolean>(Boolean(game.lastEntry));
  useEffect(() => {
    sfx.ko();
    sfx.lose();
    const t = setTimeout(() => setPhase('over'), 1300);
    return () => clearTimeout(t);
  }, []);

  const handleSave = (name: string) => {
    game.saveScore(name);
    setSaved(true);
  };

  // The "pitch" the share card prints: prefer the extracted tagline, then the
  // company name, then whatever idea text the founder typed at intake.
  const pitch =
    companyProfile?.tagline?.trim() ||
    companyProfile?.name?.trim() ||
    game.companyInput?.idea?.trim() ||
    'A startup that entered the arena.';

  // Defensive: if we somehow land here without a verdict, offer a way out.
  if (!verdict) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-pixel text-sm text-neonInk/80">THE PANEL WENT QUIET…</p>
        <Button onClick={reset} variant="outline">
          BACK TO START
        </Button>
      </div>
    );
  }

  const shareText = buildShareText(verdict, pitch);

  return (
    <div
      className="accent-expert relative flex min-h-screen w-full flex-col items-center justify-center gap-8 px-2 py-12 sm:py-16"
    >
      {/* K.O. slam stinger */}
      {phase === 'ko' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="ko-flash text-6xl sm:text-8xl">K.O.</span>
        </div>
      )}

      {/* GAME OVER headline */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: phase === 'over' ? 0 : 1.2 }}
        className="text-center"
      >
        <div className="font-pixel text-xl tracking-[0.2em] text-neonRed glow-red sm:text-2xl">
          GAME OVER
        </div>
        <h1 className="mt-4 font-pixel text-2xl leading-relaxed text-neonInk sm:text-3xl">
          THE PANEL PASSED
        </h1>
        <p className="mt-3 text-xl leading-snug text-neonInk/55">
          Your credibility ran out before you cleared the room. Here is the post-mortem.
        </p>
      </motion.div>

      {/* ---- FINAL SCORE board (total + breakdown + rank) ---- */}
      <FinalScore game={game} />

      {/* ---- high-score save / leaderboard ---- */}
      <div className="flex w-full max-w-xl flex-col items-center gap-4">
        {game.qualifies && !saved ? (
          <NameEntry onSubmit={handleSave} />
        ) : saved ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pixel-panel scanline flex w-full flex-col items-center gap-3 p-5 text-center"
            style={{ ['--accent' as any]: 'var(--neon-amber)' }}
          >
            <p className="font-pixel text-[10px] tracking-[0.2em] text-neonAmber glow-amber">
              ★ SCORE SAVED — YOU MADE THE BOARD
            </p>
            <Button variant="primary" size="md" glow className="w-full" onClick={onOpenLeaderboard}>
              🏆 VIEW LEADERBOARD
            </Button>
          </motion.div>
        ) : null}
      </div>

      {/* the shareable post-mortem card */}
      <ShareCard
        verdict={verdict}
        idea={pitch}
        finalScore={game.score}
        bestCombo={game.bestCombo}
        rank={rankFor(Math.max(0, Math.round(game.score))).rank}
      />

      {/* actions — CONTINUE? energy */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex w-full max-w-xl flex-col items-center gap-3"
      >
        <div className="font-pixel animate-pulse text-center text-[11px] tracking-[0.3em] text-neonAmber glow-amber">
          CONTINUE?
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="md" className="flex-1" onClick={() => shareToX(shareText)}>
            <span aria-hidden>𝕏</span> SHARE ON X
          </Button>
          <Button variant="outline" size="md" className="flex-1" onClick={() => shareToLinkedIn()}>
            <span aria-hidden>in</span> SHARE ON LINKEDIN
          </Button>
        </div>
        <Button variant="outline" size="md" className="w-full" onClick={onOpenLeaderboard}>
          🏆 LEADERBOARD
        </Button>
        <Button variant="danger" size="lg" glow className="w-full" onClick={reset}>
          ⚔ RUN IT BACK
        </Button>
        <p className="mt-1 text-center text-base text-neonInk/45">
          Sharpen the deck, fix the red flags, and re-enter THE GAUNTLET.
        </p>
      </motion.div>
    </div>
  );
};

export default VerdictScreen;
