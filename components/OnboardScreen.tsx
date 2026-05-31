import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CompanyInput, GameApi } from '../types';
import { BOSSES } from '../constants';
import { fileToBase64, formatBytes, isPdf } from '../lib/pdf';

interface OnboardScreenProps {
  game: GameApi;
}

const ACCENT_HEX: Record<string, string> = {
  cyan: '#22d3ee',
  violet: '#8b5cf6',
  amber: '#f59e0b',
};

function accentHex(accent: string): string {
  if (accent.startsWith('#')) return accent;
  return ACCENT_HEX[accent] ?? '#22d3ee';
}

const EXAMPLES = [
  'Uber for in-home senior care, dispatched by AI',
  'A vector DB that runs entirely on-device',
  'AI copilot that negotiates your SaaS bills',
];

const ANALYZING_STEPS = [
  'Reading your site & deck…',
  'Extracting the wedge and the moat…',
  'Sniffing out the red flags…',
  'Briefing the three partners…',
];

/* ---------------------------------------------------------------------------
 * The "reading your site & deck" loader shown while game.analyzing is true.
 * Cycles through honest progress lines so the founder never stares at a dead
 * spinner during the Gemini round-trip.
 * ------------------------------------------------------------------------- */
function AnalyzingLoader({ game }: { game: GameApi }) {
  const [step, setStep] = useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % ANALYZING_STEPS.length);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const source = game.companyInput?.url
    ? game.companyInput.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : game.companyInput?.pdfName
      ? game.companyInput.pdfName
      : 'your pitch';

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative grid h-28 w-28 place-items-center"
      >
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ borderTopColor: '#22d3ee' }}
        />
        <motion.span
          className="absolute inset-3 rounded-full border-2 border-violet-400/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ borderBottomColor: '#8b5cf6' }}
        />
        <span className="text-3xl">🔎</span>
      </motion.div>

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
        Due diligence in progress
      </p>
      <h2 className="mt-2 max-w-md truncate text-center text-xl font-black text-white sm:text-2xl">
        Sizing up {source}
      </h2>

      <div className="mt-5 h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="text-sm text-white/55"
          >
            {ANALYZING_STEPS[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function OnboardScreen({ game }: OnboardScreenProps) {
  const [url, setUrl] = useState('');
  const [idea, setIdea] = useState('');
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number>(0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // While the model is reading the sources, swap the whole screen for the loader.
  if (game.phase === 'analyzing' || game.analyzing) {
    return <AnalyzingLoader game={game} />;
  }

  const trimmedUrl = url.trim();
  const trimmedIdea = idea.trim();
  const hasAnything = Boolean(trimmedUrl || trimmedIdea || pdfBase64);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setPdfError(null);
    if (!isPdf(file)) {
      setPdfError('That is not a PDF. Upload your pitch deck or one-pager as a PDF.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setPdfError('That PDF is over 12 MB. Trim it down and try again.');
      return;
    }
    setReading(true);
    try {
      const b64 = await fileToBase64(file);
      setPdfBase64(b64);
      setPdfName(file.name);
      setPdfSize(file.size);
    } catch (err) {
      console.error('[gauntlet] PDF read failed:', err);
      setPdfError('Could not read that file. Try a different PDF.');
    } finally {
      setReading(false);
    }
  };

  const clearPdf = () => {
    setPdfBase64(null);
    setPdfName(null);
    setPdfSize(0);
    setPdfError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const enter = () => {
    if (!hasAnything) return;
    const input: CompanyInput = {};
    if (trimmedUrl) input.url = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
    if (trimmedIdea) input.idea = trimmedIdea;
    if (pdfBase64 && pdfName) {
      input.pdfBase64 = pdfBase64;
      input.pdfName = pdfName;
    }
    void game.analyze(input);
  };

  const onIdeaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      enter();
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8">
      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 backdrop-blur"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
        Powered by Gemini
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center text-5xl font-black leading-[0.9] tracking-tighter sm:text-7xl md:text-8xl"
      >
        <span className="bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">
          THE
        </span>{' '}
        <span className="bg-gradient-to-r from-cyan-300 via-violet-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(139,92,246,0.5)]">
          GAUNTLET
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mt-5 max-w-xl text-center text-base text-white/55 sm:text-lg"
      >
        Drop your site, your deck, or one sharp line. Three AI investors read it,
        then grill you on it. Drain their skepticism before they shred your
        credibility — and walk out with a term sheet.
      </motion.p>

      {/* Intake card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        className="mt-9 w-full max-w-2xl space-y-4"
      >
        {/* URL */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-1 backdrop-blur transition-colors focus-within:border-cyan-400/50 focus-within:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="text-white/30">🌐</span>
            <input
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourcompany.com — we'll read your site"
              className="w-full bg-transparent text-base text-white placeholder-white/30 outline-none sm:text-lg"
            />
          </div>
        </div>

        {/* PDF dropzone */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {pdfName ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/5 px-4 py-3 backdrop-blur">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl">📄</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{pdfName}</p>
                  <p className="text-[11px] text-white/40">{formatBytes(pdfSize)} · ready to read</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearPdf}
                className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60 transition-colors hover:border-rose-300/50 hover:text-rose-200"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFile(e.dataTransfer.files?.[0]);
              }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 text-sm text-white/50 transition-colors hover:border-cyan-400/40 hover:text-white/80"
            >
              <span className="text-lg">📎</span>
              {reading ? 'Reading your deck…' : 'Upload your pitch deck (PDF) — optional'}
            </button>
          )}
          {pdfError && (
            <p className="mt-2 text-xs text-rose-300">{pdfError}</p>
          )}
        </div>

        {/* Idea */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-1 backdrop-blur transition-colors focus-within:border-cyan-400/50 focus-within:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value.slice(0, 240))}
            onKeyDown={onIdeaKeyDown}
            rows={2}
            placeholder="…or just describe what you're building in one line"
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-base text-white placeholder-white/30 outline-none sm:text-lg"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="font-mono text-[11px] tabular-nums text-white/25">{idea.length}/240</span>
            <span className="hidden text-[11px] text-white/25 sm:block">Site + deck + line = the sharpest read.</span>
          </div>
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setIdea(ex)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/45 transition-colors hover:border-white/20 hover:text-white/80"
            >
              {ex}
            </button>
          ))}
        </div>

        {game.error && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {game.error}
          </div>
        )}

        <motion.button
          type="button"
          onClick={enter}
          disabled={!hasAnything || reading}
          whileHover={hasAnything && !reading ? { scale: 1.02 } : undefined}
          whileTap={hasAnything && !reading ? { scale: 0.98 } : undefined}
          className={`w-full rounded-2xl px-6 py-4 text-lg font-black tracking-tight transition-all ${
            hasAnything && !reading
              ? 'bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 text-black shadow-[0_0_50px_rgba(139,92,246,0.5)]'
              : 'cursor-not-allowed border border-white/10 bg-white/5 text-white/30'
          }`}
        >
          {hasAnything ? 'Enter the Gauntlet →' : 'Add a site, deck, or line to begin'}
        </motion.button>
      </motion.div>

      {/* Boss preview */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        className="mt-12 w-full max-w-3xl"
      >
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Three bosses stand between you and the round
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BOSSES.map((boss, i) => {
            const hex = accentHex(boss.accent);
            return (
              <motion.div
                key={boss.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
              >
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${hex}, transparent)` }}
                />
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-black/40 text-2xl"
                    style={{ boxShadow: `0 0 22px ${hex}55, inset 0 0 14px ${hex}33` }}
                  >
                    {boss.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{boss.name}</p>
                    <p className="truncate text-xs" style={{ color: hex }}>
                      {boss.title}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/45">
                  Hammers <span className="text-white/70">{boss.focus}</span>.
                </p>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[11px] text-white/25">
          Market · Technology · Go-to-market — the same axes real funds grade you on.
        </p>
      </motion.div>
    </div>
  );
}

export default OnboardScreen;
