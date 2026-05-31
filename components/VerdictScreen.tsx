import React from 'react';
import { motion } from 'framer-motion';
import type { GameApi } from '../types';
import { ShareCard } from './ShareCard';
import { Button } from './ui/Button';
import { buildShareText, shareToX, shareToLinkedIn } from '../lib/share';

interface VerdictScreenProps {
  game: GameApi;
}

/**
 * The LOSE / rejection card. A win now routes to RaiseScreen instead — this
 * screen only ever shows when the founder's credibility hit zero (outcome 'passed').
 */
export const VerdictScreen: React.FC<VerdictScreenProps> = ({ game }) => {
  const { verdict, companyProfile, reset } = game;

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
        <p className="text-lg text-slate-300">The panel went quiet…</p>
        <Button onClick={reset} variant="outline">
          Back to start
        </Button>
      </div>
    );
  }

  const shareText = buildShareText(verdict, pitch);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 py-12 sm:py-16">
      {/* headline */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="text-xs font-bold tracking-[0.4em] text-rose-300">
          YOU GOT REJECTED
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
          The Panel Has Passed
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Your credibility ran out before you cleared the room. Here is the post-mortem.
        </p>
      </motion.div>

      {/* the shareable hero card */}
      <ShareCard verdict={verdict} idea={pitch} />

      {/* actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex w-full max-w-xl flex-col items-center gap-3"
      >
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={() => shareToX(shareText)}
          >
            <span aria-hidden>𝕏</span> Share on X
          </Button>
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={() => shareToLinkedIn()}
          >
            <span aria-hidden>in</span> Share on LinkedIn
          </Button>
        </div>
        <Button
          variant="primary"
          size="lg"
          glow
          className="w-full"
          onClick={reset}
        >
          ⚔️ Run It Back
        </Button>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sharpen the deck, fix the red flags, and re-enter the Gauntlet.
        </p>
      </motion.div>
    </div>
  );
};

export default VerdictScreen;
