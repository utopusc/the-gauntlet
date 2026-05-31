import React from 'react';
import { motion } from 'framer-motion';
import type { CompanyProfile, GameApi } from '../types';
import { Button } from './ui/Button';

interface ProfileScreenProps {
  game: GameApi;
}

/* A single labelled dossier field. */
const Field: React.FC<{ label: string; value: string; delay: number }> = ({
  label,
  value,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
  >
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
      {label}
    </p>
    <p className="text-sm leading-relaxed text-white/80">{value}</p>
  </motion.div>
);

/* Chip list for signals (positive) / red flags (negative). */
const ChipList: React.FC<{
  label: string;
  items: string[];
  tone: 'good' | 'bad';
  delay: number;
}> = ({ label, items, tone, delay }) => {
  const color = tone === 'good' ? '#34d399' : '#fb7185';
  const bg = tone === 'good' ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)';
  const border = tone === 'good' ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.3)';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
    >
      <p className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <li
            key={`${label}-${i}`}
            className="rounded-full border px-3 py-1 text-xs text-white/80"
            style={{ background: bg, borderColor: border }}
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

  // Defensive: should not render without a profile, but never strand the user.
  if (!profile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="text-lg text-white/60">No dossier to review yet…</p>
        <Button variant="outline" onClick={game.reset}>
          Back to start
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/70">
          Diligence dossier
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
          {profile.name}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-base text-white/55">{profile.tagline}</p>
        <p className="mx-auto mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/45 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span className="truncate">{profile.sourceNote}</span>
        </p>
      </motion.div>

      {game.error && (
        <div className="mx-auto mt-5 w-full max-w-2xl rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200">
          {game.error}
        </div>
      )}

      {/* Dossier grid */}
      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Problem" value={profile.problem} delay={0.1} />
        <Field label="Solution" value={profile.solution} delay={0.14} />
        <Field label="Market" value={profile.market} delay={0.18} />
        <Field label="Traction" value={profile.traction} delay={0.22} />
        <Field label="Team" value={profile.team} delay={0.26} />
        <Field label="Business model" value={profile.businessModel} delay={0.3} />
      </div>

      {/* Signals + red flags */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ChipList label="Signals" items={profile.signals} tone="good" delay={0.34} />
        <ChipList label="Red flags the room will attack" items={profile.redFlags} tone="bad" delay={0.38} />
      </div>

      {/* The ask + CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, duration: 0.45 }}
        className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 text-center backdrop-blur"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
            You're raising
          </p>
          <p className="mt-1 text-3xl font-black tracking-tight text-cyan-200">
            {profile.askAmount}
          </p>
        </div>
        <p className="max-w-md text-sm text-white/55">
          This is what the partners read before you walked in. Step into the arena and
          defend it — three rounds each, vague answers cost you credibility.
        </p>
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Button variant="ghost" size="md" className="flex-1" onClick={game.reset}>
            ← Edit intake
          </Button>
          <Button
            variant="primary"
            size="md"
            glow
            className="flex-1"
            onClick={game.enterArena}
          >
            ⚔️ Face the partners
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default ProfileScreen;
