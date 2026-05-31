import React, { useMemo } from 'react';

interface HpBarProps {
  value: number;
  max: number;
  /** Accent — either a hex (#22f0ff) or a legacy token name (cyan/violet/amber/rose/emerald). */
  accent: string;
  label: string;
  /** Number of segments to render. Default 20 (Street-Fighter-ish). */
  segments?: number;
}

// Map legacy named accents (and the boss constants' hexes) onto the pixel-retro palette.
const ACCENT_HEX: Record<string, string> = {
  cyan: 'var(--neon-cyan)',
  violet: 'var(--neon-violet)',
  amber: 'var(--neon-amber)',
  rose: 'var(--neon-red)',
  emerald: 'var(--neon-green)',
  green: 'var(--neon-green)',
};

function accentColor(accent: string): string {
  if (accent.startsWith('#')) return accent;
  return ACCENT_HEX[accent] ?? 'var(--neon-cyan)';
}

/**
 * Segmented fighting-game HP bar. Renders `segments` .hp-seg children inside a
 * .hp-bar frame; segments flip to .hp-seg--empty as HP drains, and the whole
 * bar pulses red (.hp-bar--danger) when low. The fill color smoothly tracks the
 * accent until it drops into the danger band. Logic preserved: value/max/label.
 */
export function HpBar({ value, max, accent, label, segments = 20 }: HpBarProps) {
  const safeMax = Math.max(1, max);
  const clamped = Math.max(0, Math.min(value, safeMax));
  const pct = (clamped / safeMax) * 100;
  const hex = accentColor(accent);

  const low = pct <= 25;
  // How many segments are still "filled".
  const filled = Math.round((clamped / safeMax) * segments);

  const segNodes = useMemo(
    () =>
      Array.from({ length: segments }, (_, i) => {
        const isEmpty = i >= filled;
        return (
          <span
            key={i}
            className={`hp-seg${isEmpty ? ' hp-seg--empty' : ''}`}
            style={isEmpty ? undefined : ({ ['--hp-color' as string]: hex })}
          />
        );
      }),
    [segments, filled, hex],
  );

  return (
    <div className="relative w-full">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-pixel text-[8px] text-neonInk/70 sm:text-[9px]">{label}</span>
        <span className="font-pixel text-[8px] tabular-nums sm:text-[9px]" style={{ color: low ? 'var(--neon-red)' : hex }}>
          {Math.round(clamped)}
          <span className="text-neonInk/30">/{safeMax}</span>
        </span>
      </div>

      <div className={`hp-bar${low ? ' hp-bar--danger' : ''}`}>{segNodes}</div>
    </div>
  );
}
