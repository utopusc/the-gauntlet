// THE GAUNTLET — HIGH SCORES leaderboard (full-screen retro modal overlay).
//
// App-owned + ALWAYS MOUNTED:
//   <Leaderboard open={showLeaderboard} onClose={closeLeaderboard} highlightId={game.lastEntry?.id} />
// so it animates in/out on `open` (renders nothing when closed). Renders ABOVE
// the .crt overlay (z > 9000). Reads the top-10 from the localStorage-backed
// leaderboard (source of truth: ../lib/leaderboard). Each row: rank / NAME
// (pixel) / SCORE / mode chip (accent) / company / outcome. The row whose
// entry.id === highlightId is glowed + pulsed (the run just saved). A chunky
// BACK arcade button (+ backdrop click + ESC) closes it.
//
// Reuses the existing arcade theme classes (.pixel-panel / .arcade-btn /
// .font-pixel / .glow / .scanline) + framer-motion + the sfx singleton.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { topN, type ScoreEntry } from '../lib/leaderboard';
import { getMode } from '../constants';
import { sfx } from '../lib/sfx';
import type { GameMode } from '../types';

interface LeaderboardProps {
  /** Whether the board is shown. Component stays mounted; toggles on this. */
  open: boolean;
  /** Close the board (BACK button + backdrop click + ESC). */
  onClose: () => void;
  /** Highlight the row with this entry id (the score the player just saved). */
  highlightId?: string | null;
  /** How many rows to show. Defaults to 10. */
  limit?: number;
}

const MODE_HEX: Record<GameMode, string> = {
  easy: '#22c55e',
  fun: '#ec4899',
  normal: '#22d3ee',
  expert: '#ef4444',
};

const RANK_COLOR: Record<number, string> = {
  1: 'var(--neon-amber)',
  2: 'var(--neon-ink)',
  3: 'var(--neon-violet)',
};

/** Short, friendly date — "MAY 31" style; falls back gracefully on bad input. */
function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d
      .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      .toUpperCase();
  } catch {
    return '';
  }
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  open,
  onClose,
  highlightId,
  limit = 10,
}) => {
  // Read fresh each time the board opens — useGame.saveScore() persists first.
  const entries = React.useMemo<ScoreEntry[]>(
    () => (open ? topN(limit > 0 ? limit : 10) : []),
    [open, limit],
  );

  const handleClose = React.useCallback(() => {
    try {
      sfx.blip();
    } catch {
      /* sfx is best-effort */
    }
    onClose();
  }, [onClose]);

  // ESC closes (only while open).
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="leaderboard-overlay"
          // Above the .crt (z-index 9000). pointer-events on -> captures clicks.
          className="fixed inset-0 z-[9500] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="High Scores"
          style={{
            background:
              'radial-gradient(120% 120% at 50% 0%, rgba(10,6,18,0.86), rgba(7,3,15,0.96))',
            backdropFilter: 'blur(2px)',
          }}
        >
          <motion.div
            className="pixel-panel scanline w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
            initial={{ scale: 0.9, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ---- header ---- */}
            <div className="px-5 pt-5 pb-4 sm:px-7 sm:pt-6 text-center border-b-[3px] border-[color:var(--accent)]">
              <motion.h2
                className="font-pixel glow text-[color:var(--accent)] text-lg sm:text-2xl"
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.06 }}
              >
                ★ HIGH SCORES ★
              </motion.h2>
              <p className="font-retro mt-2 text-neonInk/70 text-base sm:text-lg tracking-wide">
                THE GAUNTLET — HALL OF FOUNDERS
              </p>
            </div>

            {/* ---- column labels (sm+) ---- */}
            <div className="hidden sm:grid grid-cols-[3.2rem_1fr_7rem_6rem] gap-3 px-7 pt-3 pb-2 font-pixel text-[0.6rem] text-neonInk/55">
              <span>RANK</span>
              <span>FOUNDER</span>
              <span className="text-right">SCORE</span>
              <span className="text-right">RESULT</span>
            </div>

            {/* ---- rows ---- */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 pb-3 space-y-2">
              {entries.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-pixel text-[color:var(--accent)] text-sm glow">
                    NO SCORES YET
                  </p>
                  <p className="font-retro mt-3 text-neonInk/60 text-lg">
                    Survive the gauntlet to claim the #1 slot.
                  </p>
                </div>
              ) : (
                entries.map((e, i) => {
                  const rank = i + 1;
                  const mc = getMode(e.mode);
                  const modeHex = MODE_HEX[e.mode] ?? mc.accent ?? 'var(--accent)';
                  const isYou = !!highlightId && e.id === highlightId;
                  const funded = e.outcome === 'funded';
                  const rankColor = RANK_COLOR[rank] ?? 'var(--neon-ink)';

                  return (
                    <motion.div
                      key={e.id}
                      initial={{ x: -16, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        delay: 0.08 + i * 0.035,
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                      className="grid grid-cols-[2.4rem_1fr_auto] sm:grid-cols-[3.2rem_1fr_7rem_6rem] items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-[3px] relative"
                      style={{
                        background: isYou
                          ? 'color-mix(in srgb, var(--accent) 16%, #07030f)'
                          : '#07030f',
                        borderColor: isYou
                          ? 'var(--accent)'
                          : 'color-mix(in srgb, var(--neon-ink) 14%, transparent)',
                        boxShadow: isYou
                          ? '0 0 22px -6px var(--accent), inset 0 0 14px -4px var(--accent)'
                          : 'none',
                        animation: isYou
                          ? 'glow-pulse 1.8s ease-in-out infinite'
                          : undefined,
                      }}
                    >
                      {/* rank */}
                      <div
                        className="font-pixel text-xs sm:text-sm text-center"
                        style={{
                          color: rankColor,
                          textShadow: rank <= 3 ? `0 0 8px ${rankColor}` : 'none',
                        }}
                      >
                        {rank}
                      </div>

                      {/* name + meta (company / date) */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-pixel text-[0.72rem] sm:text-sm truncate max-w-[10ch] sm:max-w-[16ch]"
                            style={{
                              color: isYou ? 'var(--accent)' : 'var(--neon-ink)',
                              textShadow: isYou ? '0 0 8px var(--accent)' : 'none',
                            }}
                            title={e.name}
                          >
                            {e.name}
                          </span>
                          {isYou && (
                            <span className="font-pixel text-[0.5rem] text-[#07030f] bg-[color:var(--accent)] px-1.5 py-0.5">
                              YOU
                            </span>
                          )}
                          {/* mode chip — accent-tinted */}
                          <span
                            className="font-pixel text-[0.5rem] px-1.5 py-0.5 border"
                            style={{
                              color: modeHex,
                              borderColor: modeHex,
                              background: `color-mix(in srgb, ${modeHex} 14%, transparent)`,
                            }}
                            title={`${mc.label} mode`}
                          >
                            {mc.emoji} {mc.label}
                          </span>
                        </div>
                        <div className="font-retro text-neonInk/55 text-sm sm:text-base truncate mt-0.5">
                          {e.company || '—'}
                          {fmtDate(e.date) ? (
                            <span className="text-neonInk/35"> · {fmtDate(e.date)}</span>
                          ) : null}
                        </div>
                      </div>

                      {/* score */}
                      <div className="font-pixel text-[0.72rem] sm:text-base text-right tabular-nums">
                        <span
                          style={{
                            color: isYou ? 'var(--accent)' : 'var(--neon-amber)',
                            textShadow: isYou
                              ? '0 0 10px var(--accent)'
                              : '0 0 8px rgba(255,182,39,0.55)',
                          }}
                        >
                          {e.score.toLocaleString()}
                        </span>
                        {/* outcome inline on mobile (no dedicated column) */}
                        <div className="sm:hidden font-pixel text-[0.5rem] mt-1">
                          <span
                            style={{
                              color: funded ? 'var(--neon-green)' : 'var(--neon-red)',
                            }}
                          >
                            {funded ? 'FUNDED' : 'PASSED'}
                          </span>
                        </div>
                      </div>

                      {/* outcome (sm+ dedicated column) */}
                      <div className="hidden sm:block font-pixel text-[0.6rem] text-right">
                        <span
                          style={{
                            color: funded ? 'var(--neon-green)' : 'var(--neon-red)',
                            textShadow: funded
                              ? '0 0 8px rgba(57,255,139,0.5)'
                              : '0 0 8px rgba(255,46,76,0.5)',
                          }}
                        >
                          {funded ? '✔ FUNDED' : '✖ PASSED'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* ---- footer / BACK ---- */}
            <div className="px-5 sm:px-7 py-4 border-t-[3px] border-[color:var(--accent)] flex items-center justify-between gap-3">
              <span className="font-retro text-neonInk/45 text-sm sm:text-base hidden sm:inline">
                Press ESC to exit
              </span>
              <button
                type="button"
                className="arcade-btn font-pixel text-[0.62rem] sm:text-xs ml-auto"
                onClick={handleClose}
                autoFocus
              >
                ◄ BACK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Leaderboard;
