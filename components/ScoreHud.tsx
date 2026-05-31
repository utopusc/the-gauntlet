import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ScoreHudProps {
  /** Running score for the current run. From game.score. */
  score: number;
  /** Current streak of solid/killer answers (resets on weak/timeout). From game.combo. */
  combo: number;
  /** Points awarded for the most recent answer (0 on weak/timeout; null before first). From game.lastPoints. */
  lastPoints: number | null;
  /** Speed-tier label of the most recent answer: 'FAST'|'QUICK'|'OK'|'TIME OUT'. From game.lastSpeed. */
  lastSpeed: string | null;
}

interface ScorePop {
  id: number;
  pts: number;
  speed: string;
  miss: boolean;
}

// Combo of this many or more lights the flame badge.
const COMBO_FLAME_AT = 2;

// Map a speed label to its neon accent for the floating popup.
const SPEED_COLOR: Record<string, string> = {
  FAST: 'var(--neon-green)',
  QUICK: 'var(--neon-cyan)',
  OK: 'var(--neon-amber)',
  'TIME OUT': 'var(--neon-red)',
};

/**
 * THE GAUNTLET — arcade SCORE + COMBO HUD (corner overlay).
 *
 * - Big pixel SCORE that ticks up.
 * - COMBO xN badge with a flame 🔥 once the streak hits 2+ (pulses with the streak).
 * - A floating "+pts  SPEED!" popup that fires every time an answer is scored
 *   (driven by lastPoints/lastSpeed changing). A timeout / 0-point answer shows a
 *   red "MISS" pop instead.
 *
 * Colors track the active --accent (Arena's data-mode wrapper). Number uses the
 * pixel font; everything stays crisp and arcade-flavored.
 */
export function ScoreHud({ score, combo, lastPoints, lastSpeed }: ScoreHudProps) {
  const [pops, setPops] = useState<ScorePop[]>([]);
  const [bumped, setBumped] = useState(false);

  // Detect a fresh answer: lastPoints/lastSpeed change identity each submit.
  // We key off a monotonically changing tuple so repeated identical scores still fire.
  const lastSeenRef = useRef<{ pts: number | null; speed: string | null }>({
    pts: null,
    speed: null,
  });

  useEffect(() => {
    // Nothing scored yet.
    if (lastPoints === null && lastSpeed === null) return;
    const prev = lastSeenRef.current;
    // Only react when the result actually changes (new answer judged).
    if (prev.pts === lastPoints && prev.speed === lastSpeed) return;
    lastSeenRef.current = { pts: lastPoints, speed: lastSpeed };

    const pts = lastPoints ?? 0;
    const speed = lastSpeed ?? '';
    const miss = pts <= 0 || speed === 'TIME OUT';

    const id = Date.now() + Math.random();
    setPops((p) => [...p, { id, pts, speed, miss }]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1100);

    // Pop the SCORE readout a touch on every gain.
    if (pts > 0) {
      setBumped(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setBumped(true)));
      window.setTimeout(() => setBumped(false), 320);
    }
  }, [lastPoints, lastSpeed]);

  const flame = combo >= COMBO_FLAME_AT;

  return (
    <div className="pointer-events-none relative flex flex-col items-end gap-1">
      {/* ===== SCORE ===== */}
      <div className="pixel-panel scanline px-3 py-2 text-right">
        <p className="font-pixel text-[7px] leading-none text-neonInk/45">SCORE</p>
        <motion.p
          className="font-pixel tabular-nums text-base leading-none sm:text-xl"
          style={{ color: 'var(--accent)', textShadow: '0 0 10px var(--accent)' }}
          animate={bumped ? { scale: [1, 1.22, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {Math.max(0, Math.round(score)).toLocaleString()}
        </motion.p>

        {/* ===== COMBO ===== */}
        <AnimatePresence>
          {flame && (
            <motion.div
              key="combo"
              className="mt-1.5 flex items-center justify-end gap-1"
              initial={{ opacity: 0, y: -4, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.span
                className="text-sm leading-none sm:text-base"
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.18, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                🔥
              </motion.span>
              <span
                className="font-pixel text-[9px] leading-none sm:text-xs"
                style={{ color: 'var(--neon-amber)', textShadow: '0 0 8px var(--neon-amber)' }}
              >
                COMBO x{combo}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== floating "+pts SPEED!" / MISS popups ===== */}
      <div className="pointer-events-none absolute right-1 top-0 z-30 overflow-visible">
        <AnimatePresence>
          {pops.map((p) => (
            <motion.div
              key={p.id}
              className="absolute right-0 top-0 whitespace-nowrap text-right"
              initial={{ opacity: 0, y: 6, scale: 0.6 }}
              animate={{ opacity: 1, y: -34, scale: 1 }}
              exit={{ opacity: 0, y: -56, scale: 0.9 }}
              transition={{ duration: 1, ease: [0.2, 0.9, 0.2, 1] }}
            >
              {p.miss ? (
                <span
                  className="font-pixel text-xs sm:text-sm"
                  style={{
                    color: 'var(--neon-red)',
                    textShadow: '0 0 2px #07030f, 2px 2px 0 #07030f, 0 0 16px var(--neon-red)',
                  }}
                >
                  {p.speed === 'TIME OUT' ? 'TIME OUT!' : 'MISS'}
                </span>
              ) : (
                <span
                  className="font-pixel text-sm sm:text-lg"
                  style={{
                    color: SPEED_COLOR[p.speed] ?? 'var(--neon-amber)',
                    textShadow: `0 0 2px #07030f, 2px 2px 0 #07030f, 0 0 16px ${
                      SPEED_COLOR[p.speed] ?? 'var(--neon-amber)'
                    }`,
                  }}
                >
                  +{p.pts.toLocaleString()}
                  {p.speed ? <span className="ml-1 text-[9px] sm:text-[11px]">{p.speed}!</span> : null}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ScoreHud;
