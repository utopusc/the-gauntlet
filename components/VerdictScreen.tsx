import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GameApi } from '../types';
import { ShareCard } from './ShareCard';
import { Button } from './ui/Button';
import { buildShareText, shareToX, shareToLinkedIn } from '../lib/share';
import { sfx } from '../lib/sfx';

interface VerdictScreenProps {
  game: GameApi;
}

/**
 * The LOSE / rejection screen — arcade "GAME OVER". A win routes to RaiseScreen
 * instead; this only shows when the founder's credibility hit zero (outcome 'passed').
 * Plays the K.O. slam + a CONTINUE? countdown energy, then the post-mortem card.
 */
export const VerdictScreen: React.FC<VerdictScreenProps> = ({ game }) => {
  const { verdict, companyProfile, reset } = game;

  // K.O. flash first, then settle into GAME OVER. Failure sting on mount.
  const [phase, setPhase] = useState<'ko' | 'over'>('ko');
  useEffect(() => {
    sfx.ko();
    sfx.lose();
    const t = setTimeout(() => setPhase('over'), 1300);
    return () => clearTimeout(t);
  }, []);

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

      {/* the shareable post-mortem card */}
      <ShareCard verdict={verdict} idea={pitch} />

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
