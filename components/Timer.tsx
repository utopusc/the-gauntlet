import React from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  /** Seconds left on the current question (fractional; counts down). From game.timeLeft. */
  timeLeft: number;
  /** Full clock for the current question (== game.timeLimit / modeConfig.timeLimit). */
  timeLimit: number;
  /** When true (boss is judging / generating), the clock is paused — dim it. */
  paused?: boolean;
}

// Below this many whole seconds the bar + readout flip red and pulse with urgency.
const DANGER_SECS = 5;

/**
 * THE GAUNTLET — retro draining countdown.
 *
 * A pixel-framed health-bar-style track that drains left→right as time runs out,
 * with a big pixel seconds readout. Under ~5s it flips to neon-red and pulses
 * (the audible sfx.tick() is fired by useGame's clock, not here — this is pure UI).
 *
 * Colors track the active --accent (set by Arena's data-mode wrapper) until the
 * danger band, then go red. Reuses the arcade frame language (hard border, inner
 * neon glow, square corners, scanline) used by .pixel-panel / .hp-bar.
 */
export function Timer({ timeLeft, timeLimit, paused = false }: TimerProps) {
  const limit = timeLimit > 0 ? timeLimit : 1;
  const left = Math.max(0, Math.min(timeLeft, limit));
  const frac = left / limit; // 1 = full, 0 = empty
  const pct = frac * 100;

  // Whole seconds shown big; ceil so "3.4s left" still reads "4".
  const secs = Math.ceil(left);
  const danger = secs <= DANGER_SECS && left > 0;

  const fillColor = danger ? 'var(--neon-red)' : 'var(--accent)';
  const readoutColor = danger ? 'var(--neon-red)' : 'var(--accent)';

  return (
    <div className="w-full select-none" aria-live="off">
      {/* label row */}
      <div className="mb-1 flex items-end justify-between gap-2">
        <span
          className="font-pixel text-[8px] sm:text-[9px]"
          style={{ color: paused ? 'rgba(233,227,255,0.4)' : readoutColor }}
        >
          {paused ? 'CLOCK HOLD' : 'TIME'}
        </span>

        {/* big pixel seconds — pulses red under the danger band */}
        <motion.span
          key={danger ? 'danger' : 'calm'}
          className="font-pixel tabular-nums text-lg leading-none sm:text-2xl"
          style={{
            color: paused ? 'rgba(233,227,255,0.5)' : readoutColor,
            textShadow: paused
              ? 'none'
              : `0 0 8px ${danger ? 'var(--neon-red)' : 'var(--accent)'}`,
          }}
          animate={
            danger && !paused
              ? { scale: [1, 1.18, 1], opacity: [1, 0.65, 1] }
              : { scale: 1, opacity: 1 }
          }
          transition={
            danger && !paused
              ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
        >
          {secs}
          <span className="text-neonInk/30">s</span>
        </motion.span>
      </div>

      {/* draining track — same chunky frame as .hp-bar */}
      <div
        className="hp-bar relative overflow-hidden p-0"
        style={{ opacity: paused ? 0.5 : 1 }}
      >
        <div className="relative h-3.5 w-full sm:h-4">
          {/* drained backdrop */}
          <div className="absolute inset-0" style={{ background: '#1c1430' }} />
          {/* remaining fill — width tracks frac; recolors + pulses in danger */}
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{
              background: `linear-gradient(to bottom, color-mix(in srgb, ${fillColor} 100%, white 25%), ${fillColor})`,
              boxShadow: `0 0 10px -1px ${fillColor}`,
            }}
            animate={{
              width: `${pct}%`,
              opacity: danger && !paused ? [1, 0.5, 1] : 1,
            }}
            transition={{
              width: { duration: 0.18, ease: 'linear' },
              opacity:
                danger && !paused
                  ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.2 },
            }}
          />
          {/* scanline texture over the bar for the CRT feel */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Timer;
