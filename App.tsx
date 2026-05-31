import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from './hooks/useGame';
import { OnboardScreen } from './components/OnboardScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { Arena } from './components/Arena';
import { RaiseScreen } from './components/RaiseScreen';
import { VerdictScreen } from './components/VerdictScreen';

const phaseTransition = {
  initial: { opacity: 0, scale: 0.98, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -14 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export default function App() {
  const game = useGame();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#05060d] text-white antialiased">
      {/* Animated background layers */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-grid" />
        <motion.div
          aria-hidden
          className="absolute -top-1/3 left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.18), transparent 60%)' }}
          animate={{ x: ['-50%', '-35%', '-65%', '-50%'], y: [0, 30, -20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute top-1/4 -right-40 h-[60vh] w-[60vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 60%)' }}
          animate={{ x: [0, -40, 20, 0], y: [0, 40, -30, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-40 left-1/4 h-[55vh] w-[55vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent 60%)' }}
          animate={{ x: [0, 30, -25, 0], y: [0, -25, 25, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05060d]" />
      </div>

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
              <OnboardScreen game={game} />
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
              <RaiseScreen game={game} />
            </motion.div>
          )}
          {game.phase === 'lose' && (
            <motion.div key="verdict" {...phaseTransition} className="flex flex-1 flex-col">
              <VerdictScreen game={game} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
