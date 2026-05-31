import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from './hooks/useGame';
import { OnboardScreen } from './components/OnboardScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { Arena } from './components/Arena';
import { RaiseScreen } from './components/RaiseScreen';
import { VerdictScreen } from './components/VerdictScreen';
import { Leaderboard } from './components/Leaderboard';
import { sfx } from './lib/sfx';

const phaseTransition = {
  initial: { opacity: 0, scale: 0.98, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -14 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

/* ---------------------------------------------------------------------------
 * Persistent MUTE toggle — pixel chip, fixed top-right above the CRT overlay.
 * Default = sound ON; reflects sfx.muted (which restores from localStorage).
 * ------------------------------------------------------------------------- */
const MuteToggle: React.FC = () => {
  const [muted, setMuted] = useState<boolean>(sfx.muted);

  const toggle = () => {
    const next = sfx.toggleMute(); // returns NEW muted state, plays a blip when unmuting
    setMuted(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
      title={muted ? 'Sound OFF — click to unmute' : 'Sound ON — click to mute'}
      className="font-pixel fixed right-3 top-3 z-[9100] flex items-center gap-2 border-[3px] border-black bg-bgPanel px-2.5 py-2 text-[9px] uppercase tracking-wider text-neonInk shadow-hard transition-transform active:translate-x-[2px] active:translate-y-[2px] sm:right-4 sm:top-4"
      style={{ boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)' }}
    >
      <span aria-hidden className={muted ? 'text-neonRed' : 'text-neonGreen'}>
        {muted ? '🔇' : '🔊'}
      </span>
      <span className={muted ? 'text-neonRed' : 'text-neonGreen'}>
        {muted ? 'SFX OFF' : 'SFX ON'}
      </span>
    </button>
  );
};

export default function App() {
  const game = useGame();

  // App owns the HIGH SCORES overlay so any screen (Onboard intro, win, lose)
  // can open it via the onOpenLeaderboard callback. highlightId flashes the
  // freshly-saved entry when the player just entered their name.
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const openLeaderboard = () => {
    sfx.select();
    setShowLeaderboard(true);
  };
  const closeLeaderboard = () => setShowLeaderboard(false);

  return (
    // data-mode drives --accent across the whole shell (.pixel-panel / .arcade-btn / .glow)
    <div
      data-mode={game.mode}
      className="relative min-h-screen w-full overflow-x-hidden bg-bg font-retro text-neonInk antialiased"
    >
      {/* CRT scanline + flicker + vignette overlay — mounted ONCE, never blocks clicks */}
      <div className="crt" aria-hidden />

      {/* Arcade background glow layers (subtle, behind everything) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -top-1/3 left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)' }}
          animate={{ x: ['-50%', '-40%', '-60%', '-50%'], y: [0, 26, -18, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute top-1/4 -right-40 h-[60vh] w-[60vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(177,91,255,0.16), transparent 60%)' }}
          animate={{ x: [0, -36, 18, 0], y: [0, 36, -28, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-40 left-1/4 h-[55vh] w-[55vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,182,39,0.12), transparent 60%)' }}
          animate={{ x: [0, 28, -22, 0], y: [0, -22, 22, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Persistent MUTE toggle (above CRT) */}
      <MuteToggle />

      {/* Phase router
          onboard / analyzing -> OnboardScreen (intake + "reading your site & deck" loader)
          profile             -> ProfileScreen (extracted dossier)
          arena               -> Arena (grounded boss fight)
          win                 -> RaiseScreen ($5M raise + matched investors)
          lose                -> VerdictScreen (rejection post-mortem) */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <AnimatePresence mode="wait">
          {(game.phase === 'onboard' || game.phase === 'analyzing') && (
            <motion.div key="onboard" {...phaseTransition} className="flex flex-1 flex-col">
              <OnboardScreen game={game} onOpenLeaderboard={openLeaderboard} />
            </motion.div>
          )}
          {game.phase === 'profile' && (
            <motion.div key="profile" {...phaseTransition} className="flex flex-1 flex-col">
              <ProfileScreen game={game} />
            </motion.div>
          )}
          {game.phase === 'arena' && (
            <motion.div key="arena" {...phaseTransition} className="flex flex-1 flex-col">
              <Arena game={game} />
            </motion.div>
          )}
          {game.phase === 'win' && (
            <motion.div key="raise" {...phaseTransition} className="flex flex-1 flex-col">
              <RaiseScreen game={game} onOpenLeaderboard={openLeaderboard} />
            </motion.div>
          )}
          {game.phase === 'lose' && (
            <motion.div key="verdict" {...phaseTransition} className="flex flex-1 flex-col">
              <VerdictScreen game={game} onOpenLeaderboard={openLeaderboard} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HIGH SCORES overlay — App-owned, openable from any screen. Highlights
          the entry the player just saved (game.lastEntry) when present.
          Leaderboard renders its own full-screen overlay, so we mount it only
          while open (it has no `open` prop — presence === visible). */}
      <AnimatePresence>
        {showLeaderboard && (
          <Leaderboard
            key="leaderboard"
            onClose={closeLeaderboard}
            highlightId={game.lastEntry?.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
