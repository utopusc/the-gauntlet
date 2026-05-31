import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameApi } from '../types';
import { FOUNDER_MAX_HP } from '../constants';
import { BossCard } from './BossCard';
import { HpBar } from './HpBar';
import { AnswerInput } from './AnswerInput';

interface ArenaProps {
  game: GameApi;
}

const RATING_META: Record<
  string,
  { label: string; color: string; chip: string }
> = {
  killer: { label: 'KILLER', color: '#34d399', chip: 'rgba(52,211,153,0.15)' },
  solid: { label: 'SOLID', color: '#22d3ee', chip: 'rgba(34,211,238,0.15)' },
  weak: { label: 'WEAK', color: '#fb7185', chip: 'rgba(251,113,133,0.15)' },
};

function QuestionBlock({ question, loading }: { question: string; loading: boolean }) {
  if (loading && !question) {
    return (
      <div className="space-y-3">
        <div className="shimmer h-4 w-3/4 rounded-full" />
        <div className="shimmer h-4 w-full rounded-full" />
        <div className="shimmer h-4 w-2/3 rounded-full" />
      </div>
    );
  }
  return (
    <motion.p
      key={question}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-lg font-semibold leading-snug text-white sm:text-2xl"
    >
      <span className="mr-1 text-white/30">“</span>
      {question}
      <span className="ml-1 text-white/30">”</span>
    </motion.p>
  );
}

export function Arena({ game }: ArenaProps) {
  const boss = game.currentBoss;
  const result = game.lastResult;

  if (!boss) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="shimmer h-6 w-48 rounded-full" />
      </div>
    );
  }

  const ratingMeta = result ? RATING_META[result.rating] ?? RATING_META.solid : null;

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Top bar: idea + progress dots */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Your pitch</p>
          <p className="max-w-md truncate text-sm font-medium text-white/70">{game.idea}</p>
        </div>
        <div className="flex items-center gap-2">
          {game.bosses.map((b, i) => {
            const isCurrent = i === game.currentBossIndex;
            return (
              <div key={b.id} className="flex items-center gap-2">
                <motion.div
                  className="grid h-8 w-8 place-items-center rounded-full border text-sm"
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    opacity: b.defeated || isCurrent ? 1 : 0.4,
                  }}
                  style={{
                    borderColor: b.defeated
                      ? 'rgba(52,211,153,0.6)'
                      : isCurrent
                        ? 'rgba(34,211,238,0.6)'
                        : 'rgba(255,255,255,0.12)',
                    background: b.defeated
                      ? 'rgba(52,211,153,0.15)'
                      : isCurrent
                        ? 'rgba(34,211,238,0.12)'
                        : 'transparent',
                  }}
                  title={b.name}
                >
                  {b.defeated ? '✓' : b.emoji}
                </motion.div>
                {i < game.bosses.length - 1 && (
                  <div
                    className="h-px w-4 sm:w-6"
                    style={{
                      background: b.defeated ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.12)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Boss + boss HP */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur sm:p-6">
        <BossCard boss={boss} speaking={game.loading} />
        <div className="mt-5">
          <HpBar value={boss.hp} max={boss.maxHp} accent={boss.accent} label="Skepticism" />
        </div>
      </div>

      {/* Question */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-5 backdrop-blur sm:p-7">
        <div className="absolute -right-8 -top-8 text-7xl opacity-[0.06]">{boss.emoji}</div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
          {boss.name} asks
        </p>
        <QuestionBlock question={game.question} loading={game.loading} />
      </div>

      {/* Last result / critique */}
      <AnimatePresence mode="wait">
        {result && ratingMeta && (
          <motion.div
            key={result.critique}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-black tracking-wider"
                  style={{ background: ratingMeta.chip, color: ratingMeta.color }}
                >
                  {ratingMeta.label} REBUTTAL
                </span>
                {result.damage > 0 && (
                  <span className="font-mono text-xs text-emerald-300">
                    −{Math.round(result.damage)} skepticism
                  </span>
                )}
                {result.selfDamage > 0 && (
                  <span className="font-mono text-xs text-rose-300">
                    −{Math.round(result.selfDamage)} credibility
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-white/80 sm:text-base">{result.critique}</p>
              {result.followUp && (
                <p className="mt-3 border-l-2 border-white/15 pl-3 text-xs italic text-white/45 sm:text-sm">
                  {result.followUp}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {game.error && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {game.error}
        </div>
      )}

      {/* Founder credibility + answer input pinned to bottom of flow */}
      <div className="mt-auto flex flex-col gap-4 pt-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <HpBar
            value={game.founderHp}
            max={FOUNDER_MAX_HP}
            accent="emerald"
            label="Your credibility"
          />
        </div>
        <AnswerInput onSubmit={(a) => game.submitAnswer(a)} disabled={game.loading} />
      </div>
    </div>
  );
}
