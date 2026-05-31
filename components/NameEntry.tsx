// THE GAUNTLET — NEW HIGH SCORE name entry (arcade classic).
//
// Rendered INLINE by the end screens (RaiseScreen / VerdictScreen) as
//   {game.qualifies && !saved ? <NameEntry onSubmit={handleSave} /> : ...}
// so it must be a self-contained block (NOT a fixed overlay) that drops into
// the screen's normal flow. Classic coin-op vibe: "NEW HIGH SCORE! ENTER YOUR
// NAME", an uppercase name field (default "YOU", clamped to 12 chars) and a
// SUBMIT arcade button that calls onSubmit(name) + plays sfx.select(). The
// parent wires onSubmit -> game.saveScore(name).
//
// Reuses the existing arcade theme classes (.pixel-panel / .arcade-btn /
// .font-pixel / .glow / .scanline) + framer-motion + the sfx singleton.

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sfx } from '../lib/sfx';

interface NameEntryProps {
  /** Called with the chosen name (already uppercased + clamped <=12). */
  onSubmit: (name: string) => void;
  /** Final score for this run — shown as the headline reward when provided. */
  score?: number;
  /** Where this run placed on the board (1-based), shown as "RANK #n" when known. */
  rank?: number | null;
  /** Prefilled name. Defaults to "YOU". */
  defaultName?: string;
  /** Optional skip — hidden when not provided. */
  onSkip?: () => void;
}

const MAX_LEN = 12;

/** Uppercase + strip non-printable chars + clamp to MAX_LEN. */
function sanitize(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^\x20-\x7E]/g, '') // printable ASCII only — keeps it arcade-clean
    .slice(0, MAX_LEN);
}

export const NameEntry: React.FC<NameEntryProps> = ({
  onSubmit,
  score,
  rank,
  defaultName = 'YOU',
  onSkip,
}) => {
  const [name, setName] = useState<string>(() => sanitize(defaultName) || 'YOU');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus + select-all so the player can type over the default instantly.
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(sanitize(e.target.value));
    try {
      sfx.blip();
    } catch {
      /* best-effort */
    }
  };

  const doSubmit = () => {
    if (submitted) return;
    const final = sanitize(name).trim() || 'YOU';
    setSubmitted(true);
    try {
      sfx.select();
    } catch {
      /* best-effort */
    }
    onSubmit(final);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  const handleSkip = () => {
    if (submitted || !onSkip) return;
    setSubmitted(true);
    try {
      sfx.blip();
    } catch {
      /* best-effort */
    }
    onSkip();
  };

  // The 12 character cells of the marquee-style name field.
  const cells = Array.from({ length: MAX_LEN }, (_, i) => name[i] ?? '');

  return (
    <motion.div
      className="pixel-panel scanline w-full max-w-xl mx-auto px-5 py-6 sm:px-8 sm:py-8 text-center"
      initial={{ scale: 0.92, y: 16, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      role="group"
      aria-label="New high score — enter your name"
      style={{
        // amber accent — the universal arcade "you scored!" color, regardless of mode
        ['--accent' as string]: 'var(--neon-amber)',
      }}
    >
      {/* ---- blinking arcade headline ---- */}
      <motion.h2
        className="font-pixel glow text-sm sm:text-xl leading-snug"
        style={{ color: 'var(--neon-amber)' }}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
      >
        ★ NEW HIGH SCORE! ★
      </motion.h2>

      {/* ---- score + rank reward ---- */}
      {typeof score === 'number' && (
        <motion.div
          className="mt-3"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
        >
          <div
            className="font-pixel text-2xl sm:text-4xl tabular-nums"
            style={{
              color: 'var(--neon-amber)',
              textShadow: '0 0 14px rgba(255,182,39,0.7), 3px 3px 0 #07030f',
            }}
          >
            {score.toLocaleString()}
          </div>
          {typeof rank === 'number' && rank > 0 && (
            <div className="font-pixel text-[0.55rem] sm:text-[0.65rem] text-neonInk/70 mt-2">
              RANK&nbsp;#{rank}&nbsp;ON&nbsp;THE&nbsp;BOARD
            </div>
          )}
        </motion.div>
      )}

      <p className="font-pixel text-[0.6rem] sm:text-xs text-neonInk/75 mt-4">
        ENTER YOUR NAME
      </p>

      {/* ---- name entry form ---- */}
      <form onSubmit={handleSubmit} className="mt-3">
        {/* Visual marquee of character cells (decorative). A real, focusable
            transparent <input> is overlaid so typing / IME / mobile all work. */}
        <div className="relative">
          <div
            className="flex justify-center gap-1.5 sm:gap-2 flex-wrap select-none"
            aria-hidden="true"
          >
            {cells.map((ch, i) => {
              const active = ch !== '';
              const isNext = i === name.length;
              return (
                <div
                  key={i}
                  className="font-pixel flex items-center justify-center"
                  style={{
                    width: 'clamp(1.3rem, 5.5vw, 2.1rem)',
                    height: 'clamp(1.9rem, 7.5vw, 2.9rem)',
                    fontSize: 'clamp(0.85rem, 3.2vw, 1.35rem)',
                    background: '#07030f',
                    border: `3px solid ${
                      active || isNext
                        ? 'var(--accent)'
                        : 'color-mix(in srgb, var(--accent) 35%, #2a1d44)'
                    }`,
                    color: 'var(--neon-ink)',
                    boxShadow:
                      active || isNext ? '0 0 12px -4px var(--accent)' : 'none',
                  }}
                >
                  {ch !== '' ? (
                    ch
                  ) : isNext && !submitted ? (
                    <motion.span
                      style={{ color: 'var(--accent)' }}
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    >
                      _
                    </motion.span>
                  ) : (
                    ''
                  )}
                </div>
              );
            })}
          </div>

          {/* The real input — visually hidden but focusable + interactive. */}
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={handleChange}
            maxLength={MAX_LEN}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Your name (up to 12 characters)"
            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
            style={{ textTransform: 'uppercase' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                doSubmit();
              }
            }}
            disabled={submitted}
          />
        </div>

        <p className="font-retro text-neonInk/45 text-sm sm:text-base mt-2">
          {name.length}/{MAX_LEN} — letters &amp; numbers, arcade-style
        </p>

        {/* ---- actions ---- */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="submit"
            className="arcade-btn font-pixel text-[0.7rem] sm:text-sm w-full sm:w-auto"
            disabled={submitted}
          >
            SUBMIT ►
          </button>
          {onSkip && (
            <button
              type="button"
              className="arcade-btn arcade-btn--ghost font-pixel text-[0.6rem] sm:text-xs w-full sm:w-auto"
              onClick={handleSkip}
              disabled={submitted}
            >
              SKIP
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default NameEntry;
