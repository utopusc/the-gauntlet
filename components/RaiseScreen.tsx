import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameApi, InvestorMatch, Verdict } from '../types';
import { ShareCard } from './ShareCard';
import { Button } from './ui/Button';
import { buildShareText, shareToX, shareToLinkedIn } from '../lib/share';

interface RaiseScreenProps {
  game: GameApi;
}

/* ---------------------------------------------------------------------------
 * Fundability ring — same visual language as ShareCard's ScoreRing, sized for
 * the raise hero. Kept local so this screen owns its own banner composition.
 * ------------------------------------------------------------------------- */
const RING_SIZE = 188;
const RING_STROKE = 13;
const RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const FundabilityRing: React.FC<{ score: number }> = ({ score }) => {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id="raiseRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={RING_STROKE}
        />
        <motion.circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#raiseRingGrad)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.55))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-6xl font-black tabular-nums text-cyan-200"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        >
          {clamped}
        </motion.span>
        <span className="text-[10px] font-semibold tracking-[0.25em] text-slate-400">
          FUNDABILITY
        </span>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * Warmth badge — hot / warm / cold thesis-fit signal.
 * ------------------------------------------------------------------------- */
const WARMTH_META: Record<
  InvestorMatch['warmth'],
  { label: string; color: string; bg: string; border: string }
> = {
  hot: {
    label: 'HOT FIT',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.4)',
  },
  warm: {
    label: 'WARM',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.4)',
  },
  cold: {
    label: 'COLD',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.4)',
  },
};

/* ---------------------------------------------------------------------------
 * Build a mailto: link prefilled with the generated warm intro. Honest framing:
 * this opens the founder's own mail client with a draft they can send — it does
 * not literally book a meeting. (A real calendar link could swap in here later.)
 * ------------------------------------------------------------------------- */
function buildMailto(match: InvestorMatch, companyName: string): string {
  const subject = `Intro: ${companyName} — request to pitch`;
  const body = `${match.introEmail}\n\n—\nSent via THE GAUNTLET`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ---------------------------------------------------------------------------
 * One investor match card: fund/partner, warmth, thesis fit, copyable intro,
 * and a "Book meeting" CTA (mailto draft).
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
        // Fallback for non-secure contexts (e.g. AI Studio iframe quirks).
        const ta = document.createElement('textarea');
        ta.value = match.introEmail;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
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
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur sm:p-6"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${warmth.color}, transparent)` }}
      />

      {/* header: fund + partner + warmth */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-white">{match.fund}</h3>
          <p className="truncate text-sm text-white/55">{match.partner}</p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wider"
          style={{ color: warmth.color, background: warmth.bg, borderColor: warmth.border }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: warmth.color }} />
          {warmth.label}
        </span>
      </div>

      {/* thesis fit */}
      <p className="mt-3 border-l-2 border-white/15 pl-3 text-sm leading-relaxed text-white/75">
        {match.thesisFit}
      </p>

      {/* copyable intro email */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
            Warm intro — draft
          </span>
          <button
            type="button"
            onClick={copyIntro}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70 transition-colors hover:border-cyan-300/50 hover:text-cyan-200"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">
          {match.introEmail}
        </p>
      </div>

      {/* CTA: open a prefilled mail draft (honest: a draft, not a booked meeting) */}
      <a
        href={buildMailto(match, companyName)}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-300 px-5 py-3 text-sm font-black tracking-tight text-slate-950 shadow-[0_0_30px_-6px_rgba(52,211,153,0.6)] transition-transform hover:scale-[1.015] active:scale-[0.985]"
      >
        ✉️ Book meeting — send intro
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
      <div
        key={i}
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
      >
        <div className="shimmer h-5 w-2/3 rounded-full" />
        <div className="shimmer mt-2 h-3 w-1/2 rounded-full" />
        <div className="shimmer mt-4 h-16 w-full rounded-xl" />
        <div className="shimmer mt-4 h-10 w-full rounded-xl" />
      </div>
    ))}
  </div>
);

/* ===========================================================================
 * RaiseScreen — the WIN payoff: $5M raise unlocked + matched investor shortlist.
 * ========================================================================= */
export const RaiseScreen: React.FC<RaiseScreenProps> = ({ game }) => {
  const { verdict, companyProfile, investors, matching, reset } = game;

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
        <p className="text-lg text-slate-300">Tallying the term sheet…</p>
        <Button onClick={reset} variant="outline">
          Back to start
        </Button>
      </div>
    );
  }

  const verdictForShare: Verdict = verdict;
  const shareText = buildShareText(verdictForShare, pitch);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-10 px-4 py-12 sm:py-16">
      {/* ---- $5M RAISE banner ---- */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl text-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 180, damping: 14 }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-emerald-200 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Cleared to pitch
        </motion.div>
        <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">
          <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-200 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(52,211,153,0.45)]">
            $5M RAISE UNLOCKED
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/55 sm:text-base">
          You drained all three partners. {companyName} survived the Gauntlet — here is your
          fundability score and a matched shortlist of funds in the room.
        </p>
      </motion.div>

      {/* ---- fundability ring + verdict line ---- */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full max-w-3xl flex-col items-center gap-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 backdrop-blur sm:flex-row sm:gap-8 sm:p-8"
      >
        <FundabilityRing score={verdict.score} />
        <div className="text-center sm:text-left">
          <div className="text-[11px] font-bold tracking-[0.3em] text-emerald-300">
            INVESTOR VERDICT
          </div>
          <h2 className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">
            {verdict.oneLiner}
          </h2>
          <blockquote className="mt-3 border-l-2 border-emerald-400/30 pl-3 text-sm italic text-white/70">
            “{verdict.investorQuote}”
          </blockquote>
        </div>
      </motion.div>

      {/* ---- matched investors ---- */}
      <div className="w-full max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-white/45">
            Matched from the room
          </h3>
          <span className="text-[11px] text-white/30">
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
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/55 backdrop-blur">
            The partners are still comparing notes on the perfect match — your score
            already clears the bar.
          </div>
        )}
      </div>

      {/* ---- shareable hero card ---- */}
      <div className="flex w-full flex-col items-center gap-6">
        <ShareCard verdict={verdictForShare} idea={pitch} />

        {/* ---- actions ---- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex w-full max-w-xl flex-col items-center gap-3"
        >
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => shareToX(shareText)}
            >
              <span aria-hidden>𝕏</span> Share the raise
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => shareToLinkedIn()}
            >
              <span aria-hidden>in</span> Post on LinkedIn
            </Button>
          </div>
          <Button variant="primary" size="lg" glow className="w-full" onClick={reset}>
            ⚔️ Pitch another company
          </Button>
          <p className="mt-1 text-center text-xs text-slate-500">
            These are generated matches and draft intros — copy one, tweak it, and send it for real.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RaiseScreen;
