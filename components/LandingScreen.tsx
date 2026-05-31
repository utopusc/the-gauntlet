import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameApi } from '../types';
import { BOSSES } from '../constants';

interface LandingScreenProps {
  game: GameApi;
}

const ACCENT_HEX: Record<string, string> = {
  cyan: '#22d3ee',
  violet: '#8b5cf6',
  amber: '#f59e0b',
};

function accentHex(accent: string): string {
  if (accent.startsWith('#')) return accent;
  return ACCENT_HEX[accent] ?? '#22d3ee';
}

const EXAMPLES = [
  'Uber for in-home senior care, dispatched by AI',
  'A vector DB that runs entirely on-device',
  'AI copilot that negotiates your SaaS bills',
];

export function LandingScreen({ game }: LandingScreenProps) {
  const [idea, setIdea] = useState('');

  const trimmed = idea.trim();
  const canStart = trimmed.length >= 8;

  const start = () => {
    if (!canStart) return;
    game.start(trimmed);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      start();
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8">
      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 backdrop-blur"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
        Powered by Gemini
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center text-5xl font-black leading-[0.9] tracking-tighter sm:text-7xl md:text-8xl"
      >
        <span className="bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">
          THE
        </span>{' '}
        <span className="bg-gradient-to-r from-cyan-300 via-violet-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(139,92,246,0.5)]">
          GAUNTLET
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mt-5 max-w-xl text-center text-base text-white/55 sm:text-lg"
      >
        Pitch one line. Survive three AI investors who&apos;ve heard every excuse.
        Drain their skepticism before they shred your credibility — and walk out with a term sheet.
      </motion.p>

      {/* Idea input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        className="mt-9 w-full max-w-2xl"
      >
        <div className="group relative rounded-2xl border border-white/10 bg-black/40 p-1 backdrop-blur transition-colors focus-within:border-cyan-400/50 focus-within:shadow-[0_0_40px_rgba(34,211,238,0.25)]">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value.slice(0, 200))}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="What are you building? e.g. AI copilot that negotiates your SaaS bills"
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-base text-white placeholder-white/30 outline-none sm:text-lg"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="font-mono text-[11px] tabular-nums text-white/25">{idea.length}/200</span>
            <span className="hidden text-[11px] text-white/25 sm:block">One sharp sentence beats a paragraph.</span>
          </div>
        </div>

        {/* Example chips */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setIdea(ex)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/45 transition-colors hover:border-white/20 hover:text-white/80"
            >
              {ex}
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={start}
          disabled={!canStart}
          whileHover={canStart ? { scale: 1.02 } : undefined}
          whileTap={canStart ? { scale: 0.98 } : undefined}
          className={`mt-6 w-full rounded-2xl px-6 py-4 text-lg font-black tracking-tight transition-all ${
            canStart
              ? 'bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 text-black shadow-[0_0_50px_rgba(139,92,246,0.5)]'
              : 'cursor-not-allowed border border-white/10 bg-white/5 text-white/30'
          }`}
        >
          {canStart ? 'Enter the Gauntlet →' : 'Type your idea to begin'}
        </motion.button>
      </motion.div>

      {/* Boss preview */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        className="mt-12 w-full max-w-3xl"
      >
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Three bosses stand between you and the round
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BOSSES.map((boss, i) => {
            const hex = accentHex(boss.accent);
            return (
              <motion.div
                key={boss.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
              >
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${hex}, transparent)` }}
                />
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-black/40 text-2xl"
                    style={{ boxShadow: `0 0 22px ${hex}55, inset 0 0 14px ${hex}33` }}
                  >
                    {boss.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{boss.name}</p>
                    <p className="truncate text-xs" style={{ color: hex }}>
                      {boss.title}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/45">
                  Hammers <span className="text-white/70">{boss.focus}</span>.
                </p>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[11px] text-white/25">
          Market · Technology · Go-to-market — the same axes real funds grade you on.
        </p>
      </motion.div>
    </div>
  );
}
