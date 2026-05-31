import React from 'react';
import { motion } from 'framer-motion';
import type { BossState } from '../types';

interface BossCardProps {
  boss: BossState;
  speaking?: boolean;
  /** When true, the portrait plays the .hit-shake + .hit-flash animation. */
  hit?: boolean;
}

// Map the boss constants' accents (named or hex) onto the pixel-retro palette.
const ACCENT_HEX: Record<string, string> = {
  cyan: 'var(--neon-cyan)',
  violet: 'var(--neon-violet)',
  amber: 'var(--neon-amber)',
  rose: 'var(--neon-red)',
  emerald: 'var(--neon-green)',
};

function accentColor(accent: string): string {
  if (accent.startsWith('#')) return accent;
  return ACCENT_HEX[accent] ?? 'var(--neon-cyan)';
}

/**
 * Pixel-framed boss portrait + identity. Emoji sits in a square pixel frame
 * (.pixelated, hard border, neon inner glow). Name/title/fund render in the
 * pixel font; focus stays in the readable retro body font. Same props as before
 * (boss, speaking) plus an optional `hit` flag the Arena toggles on damage.
 */
export function BossCard({ boss, speaking = false, hit = false }: BossCardProps) {
  const hex = accentColor(boss.accent);

  return (
    <div className="flex items-center gap-4 sm:gap-5">
      {/* Pixel-framed portrait */}
      <div className="relative shrink-0">
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{ boxShadow: `0 0 0 2px ${hex}, 0 0 26px ${hex}` }}
          animate={speaking ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.55 }}
          transition={{ duration: 1.4, repeat: speaking ? Infinity : 0, ease: 'easeInOut' }}
        />
        <div
          className={`relative grid h-16 w-16 place-items-center border-[3px] bg-[#07030f] sm:h-20 sm:w-20${
            hit ? ' hit-shake hit-flash' : ''
          }`}
          style={{
            borderColor: hex,
            boxShadow: `inset 0 0 20px -2px ${hex}, 4px 4px 0 0 rgba(0,0,0,0.9)`,
          }}
        >
          <motion.span
            className="pixelated text-3xl leading-none sm:text-4xl"
            animate={speaking ? { rotate: [0, -7, 7, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6, repeat: speaking ? Infinity : 0, repeatDelay: 1.4 }}
          >
            {boss.emoji}
          </motion.span>
        </div>
        {boss.defeated && (
          <div
            className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center border-[3px] bg-[#07030f] font-pixel text-[10px]"
            style={{ borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}
          >
            ✓
          </div>
        )}
      </div>

      {/* Identity */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-pixel truncate text-[11px] leading-snug sm:text-sm" style={{ color: hex, textShadow: `0 0 10px ${hex}` }}>
            {boss.name}
          </h2>
          {speaking && (
            <motion.span
              className="font-pixel border-2 px-1.5 py-0.5 text-[7px] leading-none"
              style={{ borderColor: hex, color: hex }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              VS
            </motion.span>
          )}
        </div>
        <p className="font-pixel mt-1.5 text-[8px] leading-snug sm:text-[9px]" style={{ color: hex }}>
          {boss.title}
        </p>
        <p className="mt-1 truncate text-base text-neonInk/55 sm:text-lg">{boss.fund}</p>
        <p className="mt-0.5 line-clamp-1 text-sm text-neonInk/45 sm:text-base">
          Pressing on: <span className="text-neonInk/75">{boss.focus}</span>
        </p>
      </div>
    </div>
  );
}
