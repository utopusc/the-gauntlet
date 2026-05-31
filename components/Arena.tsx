import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameApi } from '../types';
import { getMode } from '../constants';
import { sfx } from '../lib/sfx';
import { BossCard } from './BossCard';
import { HpBar } from './HpBar';
import { AnswerInput } from './AnswerInput';
import { Timer } from './Timer';
import { ScoreHud } from './ScoreHud';

interface ArenaProps {
  game: GameApi;
}

// Rating -> arcade label + color. Drives the rebuttal badge + dmg-pop variant.
const RATING_META: Record<
  string,
  { label: string; color: string; popVariant: string }
> = {
  killer: { label: 'KILLER', color: 'var(--neon-green)', popVariant: '' },
  solid: { label: 'SOLID', color: 'var(--neon-cyan)', popVariant: '' },
  weak: { label: 'WEAK', color: 'var(--neon-red)', popVariant: ' dmg-pop--crit' },
};

interface FloatPop {
  id: number;
  text: string;
  variant: string;
  x: number;
}

function QuestionBlock({ question, loading }: { question: string; loading: boolean }) {
  if (loading && !question) {
    return (
      <div className="font-pixel flex items-center gap-2 text-[10px] text-neonInk/60 sm:text-xs">
        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}>
          ◼
        </motion.span>
        LOADING QUESTION...
      </div>
    );
  }
  return (
    <motion.p
      key={question}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-xl leading-snug text-neonInk sm:text-3xl"
    >
      <span className="mr-1 opacity-40" style={{ color: 'var(--accent)' }}>
        &gt;
      </span>
      {question}
    </motion.p>
  );
}

export function Arena({ game }: ArenaProps) {
  const boss = game.currentBoss;
  const result = game.lastResult;
  const profile = game.companyProfile;
  const mode = getMode(game.mode);

  // ---- arcade FX state ----------------------------------------------------
  const [muted, setMutedState] = useState(sfx.muted);
  const [pops, setPops] = useState<FloatPop[]>([]);
  const [bossHit, setBossHit] = useState(false);
  const [koFlash, setKoFlash] = useState(false);
  const [fightFlash, setFightFlash] = useState(false);

  // Refs to detect transitions across renders.
  const resultRef = useRef<typeof result>(null);
  const bossIdRef = useRef<string | null>(null);
  const defeatedCountRef = useRef(0);
  const phaseRef = useRef(game.phase);

  // "ROUND N / FIGHT!" stinger whenever a new boss steps up.
  useEffect(() => {
    if (!boss) return;
    if (bossIdRef.current === boss.id) return;
    bossIdRef.current = boss.id;
    setFightFlash(true);
    const t = window.setTimeout(() => setFightFlash(false), 1150);
    return () => window.clearTimeout(t);
  }, [boss?.id]);

  // React to a freshly judged answer: pop damage, shake/flash the boss, sfx.hit.
  useEffect(() => {
    if (!result || result === resultRef.current) return;
    resultRef.current = result;

    const meta = RATING_META[result.rating] ?? RATING_META.solid;
    const dmg = Math.round(result.damage);
    const self = Math.round(result.selfDamage);

    // Floating boss-damage number.
    if (dmg > 0) {
      const id = Date.now() + Math.random();
      setPops((p) => [...p, { id, text: `-${dmg}`, variant: meta.popVariant, x: 50 + (Math.random() * 30 - 15) }]);
      window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1000);
    }
    // Floating self-damage (credibility) number, offset + red.
    if (self > 0) {
      const id = Date.now() + Math.random() + 1;
      setPops((p) => [...p, { id, text: `-${self}!`, variant: ' dmg-pop--crit', x: 28 + (Math.random() * 16 - 8) }]);
      window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1000);
    }

    // Boss hit reaction + SFX.
    if (dmg > 0) {
      sfx.hit();
      setBossHit(false);
      // next frame so the class re-applies and the animation re-triggers
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setBossHit(true));
      });
      window.setTimeout(() => setBossHit(false), 460);
    }
  }, [result]);

  // K.O. when the number of defeated bosses goes up. Win/lose stings on phase flip.
  useEffect(() => {
    const defeated = game.bosses.filter((b) => b.defeated).length;
    if (defeated > defeatedCountRef.current) {
      defeatedCountRef.current = defeated;
      setKoFlash(true);
      sfx.ko();
      window.setTimeout(() => setKoFlash(false), 1450);
    } else {
      defeatedCountRef.current = defeated;
    }
  }, [game.bosses]);

  // Victory / defeat fanfare the instant the phase resolves (Arena may briefly
  // still be mounted as App transitions out).
  useEffect(() => {
    if (phaseRef.current === game.phase) return;
    if (game.phase === 'win') sfx.win();
    if (game.phase === 'lose') sfx.lose();
    phaseRef.current = game.phase;
  }, [game.phase]);

  const toggleMute = () => {
    const next = sfx.toggleMute();
    setMutedState(next);
  };

  if (!boss) {
    return (
      <div className="flex flex-1 items-center justify-center" data-mode={mode.id}>
        <span className="font-pixel animate-pulse text-xs text-neonInk/60">LOADING ARENA...</span>
      </div>
    );
  }

  const ratingMeta = result ? RATING_META[result.rating] ?? RATING_META.solid : null;

  // Speed-tier badge color (mirrors ScoreHud): FAST=green, QUICK=cyan, OK=amber, TIME OUT=red.
  const speedColor =
    game.lastSpeed === 'FAST'
      ? 'var(--neon-green)'
      : game.lastSpeed === 'QUICK'
        ? 'var(--neon-cyan)'
        : game.lastSpeed === 'TIME OUT'
          ? 'var(--neon-red)'
          : 'var(--neon-amber)';

  // What grounds the fight: the site if we read one, else the uploaded deck, else the idea.
  const groundedSource = game.companyInput?.url
    ? 'your site'
    : game.companyInput?.pdfName
      ? 'your deck'
      : 'your pitch';

  const roundLabel = `ROUND ${game.currentBossIndex + 1}`;

  return (
    // data-mode drives --accent for every .pixel-panel / .arcade-btn / .glow inside.
    <div data-mode={mode.id} className="relative flex flex-1 flex-col gap-4">
      {/* ===== Top status row: mode badge + company + grounding chip + mute ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="font-pixel inline-flex items-center gap-1.5 border-2 px-2 py-1 text-[8px] leading-none sm:text-[9px]"
            style={{ borderColor: mode.accent, color: mode.accent, boxShadow: `0 0 14px -4px ${mode.accent}` }}
            title={mode.tagline}
          >
            <span>{mode.emoji}</span>
            {mode.label}
          </span>
          <div className="min-w-0">
            <p className="font-pixel text-[7px] text-neonInk/40">NOW DEFENDING</p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="max-w-[16rem] truncate text-base font-bold text-neonInk sm:text-lg">
                {profile?.name || 'Your company'}
              </p>
              <span
                className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-sm"
                style={{ borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)', color: 'var(--accent)' }}
              >
                <span className="inline-block h-1.5 w-1.5" style={{ background: 'var(--accent)' }} />
                grounded on {groundedSource}
              </span>
            </div>
          </div>
        </div>

        {/* Corner HUD cluster: live SCORE/COMBO + mute toggle. */}
        <div className="flex items-start gap-3">
          <ScoreHud
            score={game.score}
            combo={game.combo}
            lastPoints={game.lastPoints}
            lastSpeed={game.lastSpeed}
          />
          <button
            type="button"
            onClick={toggleMute}
            className="arcade-btn arcade-btn--ghost mt-0.5 text-[8px] sm:text-[9px]"
            aria-pressed={muted}
            title={muted ? 'Sound off — click to enable' : 'Sound on — click to mute'}
          >
            {muted ? '🔇 MUTE' : '🔊 SFX'}
          </button>
        </div>
      </div>

      {/* ===== Boss progress pips ===== */}
      <div className="flex items-center justify-center gap-2">
        {game.bosses.map((b, i) => {
          const isCurrent = i === game.currentBossIndex;
          const color = b.defeated ? 'var(--neon-green)' : isCurrent ? 'var(--accent)' : '#2a1d44';
          return (
            <React.Fragment key={b.id}>
              <motion.span
                className="inline-block h-3 w-3 border-2"
                style={{ borderColor: color, background: b.defeated || isCurrent ? color : 'transparent' }}
                animate={{ scale: isCurrent ? [1, 1.25, 1] : 1, opacity: b.defeated || isCurrent ? 1 : 0.4 }}
                transition={{ duration: 1, repeat: isCurrent ? Infinity : 0, ease: 'easeInOut' }}
                title={b.name}
              />
              {i < game.bosses.length - 1 && (
                <span
                  className="inline-block h-0.5 w-5 sm:w-8"
                  style={{ background: b.defeated ? 'var(--neon-green)' : '#2a1d44' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ===== Boss portrait + boss HP (with FX overlays) ===== */}
      <div className="pixel-panel scanline relative p-4 sm:p-5">
        <BossCard boss={boss} speaking={game.loading} hit={bossHit} />
        <div className="mt-4">
          <HpBar value={boss.hp} max={boss.maxHp} accent={boss.accent} label="Skepticism" />
        </div>

        {/* Floating damage numbers anchored over the portrait area */}
        <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
          {pops.map((p) => (
            <span
              key={p.id}
              className={`dmg-pop absolute top-8`.concat(p.variant)}
              style={{ left: `${p.x}%`, transform: 'translateX(-50%)' }}
            >
              {p.text}
            </span>
          ))}
        </div>

        {/* ROUND N / FIGHT! stinger */}
        <AnimatePresence>
          {fightFlash && (
            <motion.div
              key="fight"
              className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/40"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="fight-flash text-2xl sm:text-4xl">{roundLabel}</div>
                <div className="fight-flash mt-2 text-3xl sm:text-5xl" style={{ animationDelay: '0.18s' }}>
                  FIGHT!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* K.O. slam */}
        <AnimatePresence>
          {koFlash && (
            <motion.div
              key="ko"
              className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/55"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="ko-flash text-5xl sm:text-7xl">K.O.</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== Question (retro speech panel) + countdown clock ===== */}
      <div className="pixel-panel scanline relative overflow-hidden p-4 sm:p-6">
        <div className="pointer-events-none absolute -right-6 -top-6 text-7xl opacity-[0.07]">{boss.emoji}</div>
        <div className="mb-3 flex items-end justify-between gap-4">
          <p className="font-pixel text-[8px] sm:text-[9px]" style={{ color: 'var(--accent)' }}>
            {boss.name} ASKS
          </p>
          {/* Countdown lives right beside the question. Paused while the boss thinks/judges. */}
          <div className="w-32 shrink-0 sm:w-44">
            <Timer timeLeft={game.timeLeft} timeLimit={game.timeLimit} paused={game.loading} />
          </div>
        </div>
        <QuestionBlock question={game.question} loading={game.loading} />
      </div>

      {/* ===== Last result / critique ===== */}
      <AnimatePresence mode="wait">
        {result && ratingMeta && (
          <motion.div
            key={result.critique}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="pixel-panel scanline p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span
                  className="font-pixel border-2 px-2 py-1 text-[8px] leading-none"
                  style={{ borderColor: ratingMeta.color, color: ratingMeta.color }}
                >
                  {ratingMeta.label} REBUTTAL
                </span>
                {/* Speed tier from the clock at submit (FAST/QUICK/OK/TIME OUT). */}
                {game.lastSpeed && (
                  <span
                    className="font-pixel border-2 px-2 py-1 text-[8px] leading-none"
                    style={{ borderColor: speedColor, color: speedColor }}
                    title="How fast you answered"
                  >
                    {game.lastSpeed}
                    {game.lastPoints && game.lastPoints > 0 ? ` +${game.lastPoints.toLocaleString()}` : ''}
                  </span>
                )}
                {result.damage > 0 && (
                  <span className="font-pixel text-[8px]" style={{ color: 'var(--neon-green)' }}>
                    -{Math.round(result.damage)} SKEPTICISM
                  </span>
                )}
                {result.selfDamage > 0 && (
                  <span className="font-pixel text-[8px]" style={{ color: 'var(--neon-red)' }}>
                    -{Math.round(result.selfDamage)} CREDIBILITY
                  </span>
                )}
              </div>
              <p className="text-lg leading-relaxed text-neonInk/85 sm:text-xl">{result.critique}</p>
              {result.followUp && (
                <p className="mt-3 border-l-[3px] pl-3 text-base italic text-neonInk/55 sm:text-lg" style={{ borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)' }}>
                  {result.followUp}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Error ===== */}
      {game.error && (
        <div
          className="border-[3px] px-4 py-3 text-base"
          style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)', background: 'rgba(255,46,76,0.08)' }}
        >
          {game.error}
        </div>
      )}

      {/* ===== Founder credibility + answer input ===== */}
      <div className="mt-auto flex flex-col gap-4 pt-2">
        <div className="pixel-panel scanline p-4">
          <HpBar value={game.founderHp} max={game.founderMaxHp} accent="var(--neon-green)" label="Your credibility" />
        </div>
        <AnswerInput onSubmit={(a) => game.submitAnswer(a)} disabled={game.loading} />
      </div>
    </div>
  );
}
