import React from 'react';
import { motion } from 'framer-motion';
import type { GameApi } from '../types';
import { ShareCard } from './ShareCard';
import { Button } from './ui/Button';
import { buildShareText, shareToX, shareToLinkedIn } from '../lib/share';

interface VerdictScreenProps {
  game: GameApi;
}

export const VerdictScreen: React.FC<VerdictScreenProps> = ({ game }) => {
  const { verdict, idea, reset } = game;

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

  const funded = verdict.outcome === 'funded';
  const shareText = buildShareText(verdict, idea);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 py-12 sm:py-16">
      {/* headline */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div
          className={`text-xs font-bold tracking-[0.4em] ${
            funded ? 'text-cyan-300' : 'text-rose-300'
          }`}
        >
          {funded ? 'YOU SURVIVED' : 'YOU GOT REJECTED'}
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
          {funded ? 'The Verdict Is In' : 'The Panel Has Passed'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {funded
            ? 'Three AI VCs grilled you. Here is your term sheet.'
            : 'Your credibility ran out. Here is the post-mortem.'}
        </p>
      </motion.div>

      {/* the shareable hero card */}
      <ShareCard verdict={verdict} idea={idea} />

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
          ⚔️ Play Again
        </Button>
        <p className="mt-1 text-center text-xs text-slate-500">
          Screenshot the card above and post it. Tag a founder who can't survive.
        </p>
      </motion.div>
    </div>
  );
};

export default VerdictScreen;
