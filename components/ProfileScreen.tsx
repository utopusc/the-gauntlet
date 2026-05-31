import React from 'react';
import { motion } from 'framer-motion';
import type { CompanyProfile, GameApi, GameMode } from '../types';
import { getMode } from '../constants';
import { sfx } from '../lib/sfx';

interface ProfileScreenProps {
  game: GameApi;
}

/** Map a GameMode -> data-mode attribute value so child .accent classes recolor. */
function dataModeOf(mode: GameMode): 'fun' | 'normal' | 'expert' {
  return mode === 'fun' || mode === 'expert' ? mode : 'normal';
}

/* A single labelled dossier "PLAYER STATS" field. */
const Field: React.FC<{ label: string; value: string; delay: number }> = ({
  label,
  value,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="pixel-panel scanline p-4"
  >
    <p className="font-pixel glow mb-2 text-[8px] tracking-[0.18em]">{label}</p>
    <p className="font-retro text-lg leading-snug text-neonInk/85">{value}</p>
  </motion.div>
);

/* Chip list for signals (green) / red flags (amber). */
const ChipList: React.FC<{
  label: string;
  items: string[];
  tone: 'good' | 'bad';
  delay: number;
}> = ({ label, items, tone, delay }) => {
  // signals = green chips, redFlags = amber chips (per spec)
  const color = tone === 'good' ? 'var(--neon-green)' : 'var(--neon-amber)';
  const dot = tone === 'good' ? '#39ff8b' : '#ffb627';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="pixel-panel scanline p-4"
    >
      <p
        className="font-pixel mb-3 flex items-center gap-2 text-[8px] tracking-[0.16em]"
        style={{ color: dot, textShadow: `0 0 8px ${dot}88` }}
      >
        <span className="inline-block h-2 w-2" style={{ background: dot }} />
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <li
            key={`${label}-${i}`}
            className="font-retro border-2 px-3 py-1 text-base text-neonInk/90"
            style={{
              borderColor: color,
              background: tone === 'good' ? 'rgba(57,255,139,0.1)' : 'rgba(255,182,39,0.1)',
              boxShadow: `inset 0 0 10px -4px ${dot}`,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export function ProfileScreen({ game }: ProfileScreenProps) {
  const profile: CompanyProfile | null = game.companyProfile;
  const mode = getMode(game.mode);

  // Defensive: should not render without a profile, but never strand the user.
  if (!profile) {
    return (
      <div
        data-mode={dataModeOf(game.mode)}
        className="flex flex-1 flex-col items-center justify-center gap-6 text-center"
      >
        <p className="font-pixel glow text-sm text-neonInk/70">NO DOSSIER TO REVIEW YET...</p>
        <button
          type="button"
          onClick={() => {
            sfx.blip();
            game.reset();
          }}
          className="arcade-btn arcade-btn--ghost font-pixel text-xs"
        >
          ◀ BACK TO START
        </button>
      </div>
    );
  }

  return (
    <div data-mode={dataModeOf(game.mode)} className="flex flex-1 flex-col py-6">
      {/* Header — PLAYER STATS readout */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center"
      >
        <p className="font-pixel glow text-[9px] tracking-[0.28em] text-neonAmber">
          ★ PLAYER STATS · DILIGENCE DOSSIER ★
        </p>
        <h1 className="font-pixel glow mt-4 text-2xl leading-[1.4] tracking-tight text-neonInk sm:text-3xl">
          {profile.name}
        </h1>
        <p className="font-retro mx-auto mt-3 max-w-2xl text-lg text-neonInk/60">
          {profile.tagline}
        </p>
        <p className="font-pixel pixel-panel scanline mx-auto mt-4 inline-flex max-w-full items-center gap-2 px-3 py-2 text-[8px] text-neonInk/55">
          <span className="inline-block h-2 w-2" style={{ background: mode.accent }} />
          <span className="truncate">{profile.sourceNote}</span>
        </p>
      </motion.div>

      {game.error && (
        <div
          className="pixel-panel font-retro mx-auto mt-5 w-full max-w-2xl px-4 py-3 text-center text-base text-neonAmber"
          style={{ ['--accent' as string]: 'var(--neon-amber)' }}
        >
          {game.error}
        </div>
      )}

      {/* Dossier grid */}
      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="PROBLEM" value={profile.problem} delay={0.1} />
        <Field label="SOLUTION" value={profile.solution} delay={0.14} />
        <Field label="MARKET" value={profile.market} delay={0.18} />
        <Field label="TRACTION" value={profile.traction} delay={0.22} />
        <Field label="TEAM" value={profile.team} delay={0.26} />
        <Field label="BUSINESS MODEL" value={profile.businessModel} delay={0.3} />
      </div>

      {/* Signals + red flags */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ChipList label="SIGNALS" items={profile.signals} tone="good" delay={0.34} />
        <ChipList label="RED FLAGS — THE ROOM WILL ATTACK" items={profile.redFlags} tone="bad" delay={0.38} />
      </div>

      {/* The ask + CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, duration: 0.45 }}
        className="pixel-panel scanline mt-8 flex flex-col items-center gap-4 p-6 text-center"
      >
        <div>
          <p className="font-pixel text-[8px] tracking-[0.22em] text-neonInk/45">YOU'RE RAISING</p>
          <p className="font-pixel glow mt-3 text-2xl tracking-tight" style={{ color: mode.accent }}>
            {profile.askAmount}
          </p>
        </div>
        <p className="font-retro max-w-md text-lg leading-snug text-neonInk/60">
          This is what the partners read before you walked in. Step into the arena and
          defend it — vague answers cost you credibility.
        </p>
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              sfx.blip();
              game.reset();
            }}
            className="arcade-btn arcade-btn--ghost font-pixel flex-1 text-xs"
          >
            ◀ EDIT INTAKE
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.select();
              game.enterArena();
            }}
            className="arcade-btn font-pixel flex-1 text-xs"
          >
            ⚔ ENTER THE GAUNTLET
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ProfileScreen;
