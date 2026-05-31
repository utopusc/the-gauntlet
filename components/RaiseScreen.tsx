import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GameApi, InvestorMatch, Verdict } from '../types';
import { ShareCard } from './ShareCard';
import { NameEntry } from './NameEntry';
import { Button } from './ui/Button';
import { buildShareText, shareToX, shareToLinkedIn } from '../lib/share';
import { sfx } from '../lib/sfx';

interface RaiseScreenProps {
  game: GameApi;
  /** Open the App-owned HIGH SCORES (leaderboard) overlay. */
  onOpenLeaderboard: () => void;
}

/** Map a final score to an arcade RANK letter. */
function rankFor(score: number): { rank: string; color: string } {
  if (score >= 8000) return { rank: 'S', color: 'var(--neon-cyan)' };
  if (score >= 5000) return { rank: 'A', color: 'var(--neon-green)' };
  if (score >= 3000) return { rank: 'B', color: 'var(--neon-violet)' };
  if (score >= 1500) return { rank: 'C', color: 'var(--neon-amber)' };
  return { rank: 'D', color: 'var(--neon-amber)' };
}

/* ---------------------------------------------------------------------------
 * FINAL SCORE board — the big arcade run total + per-component breakdown + rank.
 * Counts up on mount; reads game.score / game.scoreBreakdown / game.bestCombo.
 * ------------------------------------------------------------------------- */
const FinalScore: React.FC<{ game: GameApi }> = ({ game }) => {
  const total = Math.max(0, Math.round(game.score));
  const bd = game.scoreBreakdown;
  const { rank, color } = rankFor(total);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(eased * total));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const rows: Array<{ label: string; value: number | string }> = bd
    ? [
        { label: 'BASE', value: bd.base.toLocaleString() },
        { label: 'SPEED', value: `+${bd.speed.toLocaleString()}` },
        { label: 'COMBO', value: `+${bd.combo.toLocaleString()}` },
        { label: 'BONUS', value: `+${bd.bonuses.toLocaleString()}` },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="pixel-panel scanline flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8"
      style={{ ['--accent' as any]: color }}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        {/* big total */}
        <div className="flex flex-col items-center sm:items-start">
          <span className="font-pixel text-[9px] tracking-[0.3em] text-neonInk/55">
            FINAL SCORE
          </span>
          <span
            className="font-pixel glow text-5xl tabular-nums leading-none sm:text-7xl"
            style={{ color }}
          >
            {shown.toLocaleString()}
          </span>
          <span className="font-pixel mt-2 text-[8px] tracking-[0.25em] text-neonInk/45">
            BEST COMBO ×{game.bestCombo}
          </span>
        </div>

        {/* rank badge */}
        <motion.div
          initial={{ scale: 1.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: -4 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 12 }}
          className="font-pixel glow grid h-24 w-24 shrink-0 place-items-center border-[3px] text-5xl"
          style={{ color, borderColor: color, boxShadow: `0 0 18px ${color}` }}
          aria-label={`Rank ${rank}`}
        >
          {rank}
        </motion.div>
      </div>

      {/* breakdown rows */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t-[3px] border-black pt-4 sm:grid-cols-4">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-1">
              <span className="font-pixel text-[8px] tracking-[0.2em] text-neonInk/45">
                {r.label}
              </span>
              <span className="font-pixel tabular-nums text-sm text-neonInk">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ---------------------------------------------------------------------------
 * Fundability high-score — arcade scoreboard counting up to the verdict score.
 * Replaces the old SVG ring with a big pixel readout that fits the cabinet vibe.
 * ------------------------------------------------------------------------- */
const FundabilityScore: React.FC<{ score: number }> = ({ score }) => {
  const clamped = Math.max(0, Math.min(100, score));
  const [shown, setShown] = useState(0);

  // count-up tick — pure cosmetic, no logic dependency
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(eased * clamped));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <span className="font-pixel text-[9px] tracking-[0.3em] text-neonInk/55">
        FUNDABILITY
      </span>
      <div className="flex items-end gap-1.5">
        <span className="font-pixel text-6xl tabular-nums text-neonGreen glow sm:text-7xl">
          <span style={{ ['--accent' as any]: 'var(--neon-green)' }}>{shown}</span>
        </span>
        <span className="font-pixel pb-2 text-xl text-neonInk/40">/100</span>
      </div>
      <span className="font-pixel text-[8px] tracking-[0.25em] text-neonGreen">
        HIGH SCORE
      </span>
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * Warmth badge — hot / warm / cold thesis-fit signal, pixel-styled.
 * ------------------------------------------------------------------------- */
const WARMTH_META: Record<
  InvestorMatch['warmth'],
  { label: string; color: string }
> = {
  hot: { label: 'HOT FIT', color: 'var(--neon-green)' },
  warm: { label: 'WARM', color: 'var(--neon-amber)' },
  cold: { label: 'COLD', color: 'var(--neon-violet)' },
};

/* ---------------------------------------------------------------------------
 * Build a mailto: link prefilled with the generated warm intro. Honest framing:
 * this opens the founder's own mail client with a draft they can send.
 * ------------------------------------------------------------------------- */
function buildMailto(match: InvestorMatch, companyName: string): string {
  const subject = `Intro: ${companyName} — request to pitch`;
  const body = `${match.introEmail}\n\n—\nSent via THE GAUNTLET`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ---------------------------------------------------------------------------
 * One investor match card: fund/partner, warmth, thesis fit, copyable intro,
 * and a "Book meeting" CTA (mailto draft). Pixel-panel arcade styling.
 * ------------------------------------------------------------------------- */
const InvestorCard: React.FC<{
  match: InvestorMatch;
  index: number;
  companyName: string;
}> = ({ match, index, companyName }) => {
  const [copied, setCopied] = useState(false);
  const warmth = WARMTH_META[match.warmth] ?? WARMTH_META.warm;

  const copyIntro = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(match.introEmail);
      } else {
        const ta = document.createElement('textarea');
        ta.value = match.introEmail;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      sfx.blip();
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="pixel-panel scanline relative flex flex-col p-5"
      style={{ ['--accent' as any]: warmth.color }}
    >
      {/* header: fund + partner + warmth */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-pixel text-xs leading-relaxed text-neonInk">
            {match.fund}
          </h3>
          <p className="mt-1 truncate text-lg text-neonInk/55">{match.partner}</p>
        </div>
        <span
          className="font-pixel inline-flex shrink-0 items-center gap-1.5 border-[3px] px-2 py-1 text-[8px] tracking-wider"
          style={{ color: warmth.color, borderColor: warmth.color }}
        >
          <span className="h-1.5 w-1.5" style={{ background: warmth.color }} />
          {warmth.label}
        </span>
      </div>

      {/* thesis fit */}
      <p
        className="mt-3 border-l-[3px] pl-3 text-lg leading-snug text-neonInk/80"
        style={{ borderColor: warmth.color }}
      >
        {match.thesisFit}
      </p>

      {/* copyable intro email */}
      <div className="mt-4 border-[3px] border-black bg-black/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-pixel text-[8px] tracking-[0.2em] text-neonInk/40">
            WARM INTRO — DRAFT
          </span>
          <button
            type="button"
            onClick={copyIntro}
            className="font-pixel border-[3px] border-black px-2 py-1 text-[8px] tracking-wider text-neonInk/70 transition-transform active:translate-x-[2px] active:translate-y-[2px]"
            style={{ background: copied ? warmth.color : 'transparent', color: copied ? '#07030f' : undefined }}
          >
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
        <p className="whitespace-pre-line text-lg leading-snug text-neonInk/85">
          {match.introEmail}
        </p>
      </div>

      {/* CTA: open a prefilled mail draft (honest: a draft, not a booked meeting) */}
      <a
        href={buildMailto(match, companyName)}
        onClick={() => sfx.select()}
        className="arcade-btn font-pixel mt-4 inline-flex items-center justify-center gap-2 text-[10px] leading-relaxed"
      >
        BOOK MEETING — SEND INTRO
      </a>
    </motion.div>
  );
};

/* ---------------------------------------------------------------------------
 * Matching skeletons while RaiseScreen waits on game.matching.
 * ------------------------------------------------------------------------- */
const MatchingLoader: React.FC = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    {[0, 1, 2].map((i) => (
      <div key={i} className="pixel-panel scanline p-5">
        <div className="font-pixel animate-pulse text-[10px] tracking-widest text-neonInk/50">
          MATCHING…
        </div>
        <div className="mt-4 h-3 w-2/3 animate-pulse bg-neonInk/15" />
        <div className="mt-2 h-3 w-1/2 animate-pulse bg-neonInk/10" />
        <div className="mt-4 h-16 w-full animate-pulse bg-neonInk/5" />
      </div>
    ))}
  </div>
);

/* ===========================================================================
 * RaiseScreen — the WIN payoff: arcade YOU WIN + $5M raise + investor shortlist.
 * ========================================================================= */
export const RaiseScreen: React.FC<RaiseScreenProps> = ({ game, onOpenLeaderboard }) => {
  const { verdict, companyProfile, investors, matching, reset } = game;

  // Track whether the player has saved their high-score this run (drives the
  // swap from <NameEntry> to the VIEW LEADERBOARD reveal). lastEntry persists
  // across the screen lifetime in the hook, so seed from it too.
  const [saved, setSaved] = useState<boolean>(Boolean(game.lastEntry));

  // Victory fanfare on mount.
  useEffect(() => {
    sfx.win();
  }, []);

  const handleSave = (name: string) => {
    game.saveScore(name);
    setSaved(true);
  };

  const companyName = companyProfile?.name?.trim() || 'Your company';
  const pitch =
    companyProfile?.tagline?.trim() ||
    companyName ||
    game.companyInput?.idea?.trim() ||
    'A startup that cleared the Gauntlet.';

  // Defensive: should not happen (only routed here on a win with a verdict).
  if (!verdict) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-pixel text-sm text-neonInk/80">TALLYING THE TERM SHEET…</p>
        <Button onClick={reset} variant="outline">
          BACK TO START
        </Button>
      </div>
    );
  }

  const verdictForShare: Verdict = verdict;
  const shareText = buildShareText(verdictForShare, pitch);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-10 px-2 py-12 sm:py-16">
      {/* ---- YOU WIN / $5M RAISE banner ---- */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl text-center"
      >
        <motion.div
          initial={{ scale: 2.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 12 }}
          className="font-pixel text-4xl tracking-widest text-neonGreen glow sm:text-6xl"
        >
          <span style={{ ['--accent' as any]: 'var(--neon-green)' }}>YOU&nbsp;WIN!</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-5 font-pixel text-xl leading-relaxed text-neonCyan glow-cyan sm:text-3xl"
        >
          $5M RAISE UNLOCKED
        </motion.h1>
        <p className="mx-auto mt-4 max-w-xl text-xl leading-snug text-neonInk/60">
          You drained all three partners. {companyName} survived THE GAUNTLET — here is
          your high score and a matched shortlist of funds in the room.
        </p>
      </motion.div>

      {/* ---- FINAL SCORE board (total + breakdown + rank) ---- */}
      <FinalScore game={game} />

      {/* ---- high-score save / leaderboard ---- */}
      <div className="flex w-full max-w-xl flex-col items-center gap-4">
        {game.qualifies && !saved ? (
          <NameEntry onSubmit={handleSave} />
        ) : saved ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pixel-panel scanline flex w-full flex-col items-center gap-3 p-5 text-center"
            style={{ ['--accent' as any]: 'var(--neon-green)' }}
          >
            <p className="font-pixel text-[10px] tracking-[0.2em] text-neonGreen glow">
              <span style={{ ['--accent' as any]: 'var(--neon-green)' }}>
                ★ SCORE SAVED — YOU MADE THE BOARD
              </span>
            </p>
            <Button variant="primary" size="md" glow className="w-full" onClick={onOpenLeaderboard}>
              🏆 VIEW LEADERBOARD
            </Button>
          </motion.div>
        ) : null}
      </div>

      {/* ---- high-score + verdict line ---- */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pixel-panel scanline flex w-full max-w-3xl flex-col items-center gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8"
        style={{ ['--accent' as any]: 'var(--neon-green)' }}
      >
        <FundabilityScore score={verdict.score} />
        <div className="text-center sm:text-left">
          <div className="font-pixel text-[9px] tracking-[0.25em] text-neonGreen">
            INVESTOR VERDICT
          </div>
          <h2 className="mt-2 font-pixel text-base leading-relaxed text-neonInk sm:text-lg">
            {verdict.oneLiner}
          </h2>
          <blockquote className="mt-3 border-l-[3px] border-neonGreen pl-3 text-xl italic text-neonInk/75">
            "{verdict.investorQuote}"
          </blockquote>
        </div>
      </motion.div>

      {/* ---- matched investors ---- */}
      <div className="w-full max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-pixel text-[11px] tracking-[0.2em] text-neonInk/55">
            MATCHED FROM THE ROOM
          </h3>
          <span className="text-lg text-neonInk/35">
            Generated matches + draft warm intros — yours to send.
          </span>
        </div>

        {matching ? (
          <MatchingLoader />
        ) : investors.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {investors.map((m, i) => (
              <InvestorCard
                key={`${m.fund}-${i}`}
                match={m}
                index={i}
                companyName={companyName}
              />
            ))}
          </div>
        ) : (
          <div className="pixel-panel scanline p-6 text-center text-lg text-neonInk/60">
            The partners are still comparing notes on the perfect match — your score
            already clears the bar.
          </div>
        )}
      </div>

      {/* ---- shareable high-score card + actions ---- */}
      <div className="flex w-full flex-col items-center gap-6">
        <ShareCard
          verdict={verdictForShare}
          idea={pitch}
          finalScore={game.score}
          bestCombo={game.bestCombo}
          rank={rankFor(Math.max(0, Math.round(game.score))).rank}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex w-full max-w-xl flex-col items-center gap-3"
        >
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button variant="outline" size="md" className="flex-1" onClick={() => shareToX(shareText)}>
              <span aria-hidden>𝕏</span> SHARE THE RAISE
            </Button>
            <Button variant="outline" size="md" className="flex-1" onClick={() => shareToLinkedIn()}>
              <span aria-hidden>in</span> POST ON LINKEDIN
            </Button>
          </div>
          <Button variant="outline" size="md" className="w-full" onClick={onOpenLeaderboard}>
            🏆 LEADERBOARD
          </Button>
          <Button variant="primary" size="lg" glow className="w-full" onClick={reset}>
            ⚔ PLAY AGAIN
          </Button>
          <p className="mt-1 text-center text-base text-neonInk/45">
            These are generated matches and draft intros — copy one, tweak it, and send it for real.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RaiseScreen;
