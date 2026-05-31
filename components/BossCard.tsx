import React from 'react';
import { motion } from 'framer-motion';
import type { BossState } from '../types';

interface BossCardProps {
  boss: BossState;
  speaking?: boolean;
}

const ACCENT_HEX: Record<string, string> = {
  cyan: '#22d3ee',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#fb7185',
  emerald: '#34d399',
};

function accentHex(accent: string): string {
  if (accent.startsWith('#')) return accent;
  return ACCENT_HEX[accent] ?? '#22d3ee';
}

export function BossCard({ boss, speaking = false }: BossCardProps) {
  const hex = accentHex(boss.accent);

  return (
    <div className="flex items-center gap-4 sm:gap-5">
      {/* Avatar ring */}
      <div className="relative shrink-0">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 0 2px ${hex}66, 0 0 32px ${hex}88` }}
          animate={
            speaking
              ? { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
              : { scale: 1, opacity: 0.55 }
          }
          transition={{ duration: 1.6, repeat: speaking ? Infinity : 0, ease: 'easeInOut' }}
        />
        <div
          className="relative grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-black/50 text-3xl backdrop-blur sm:h-20 sm:w-20 sm:text-4xl"
          style={{ boxShadow: `inset 0 0 22px ${hex}44` }}
        >
          <motion.span
            animate={speaking ? { rotate: [0, -6, 6, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6, repeat: speaking ? Infinity : 0, repeatDelay: 1.4 }}
          >
            {boss.emoji}
          </motion.span>
        </div>
        {boss.defeated && (
          <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-sm backdrop-blur">
            ✓
          </div>
        )}
      </div>

      {/* Identity */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-lg font-black tracking-tight sm:text-2xl">{boss.name}</h2>
          {speaking && (
            <motion.span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}55` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              Interrogating
            </motion.span>
          )}
        </div>
        <p className="truncate text-sm font-medium" style={{ color: hex }}>
          {boss.title}
        </p>
        <p className="truncate text-xs text-white/40">{boss.fund}</p>
        <p className="mt-1 line-clamp-1 text-xs text-white/40">
          Pressing on: <span className="text-white/60">{boss.focus}</span>
        </p>
      </div>
    </div>
  );
}
