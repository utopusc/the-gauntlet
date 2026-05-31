import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CompanyInput, GameApi, GameMode } from '../types';
import { BOSSES, MODES, getMode } from '../constants';
import { fileToBase64, formatBytes, isPdf } from '../lib/pdf';
import { sfx } from '../lib/sfx';

interface OnboardScreenProps {
  game: GameApi;
}

const ACCENT_HEX: Record<string, string> = {
  cyan: '#22f0ff',
  violet: '#b15bff',
  amber: '#ffb627',
};

function accentHex(accent: string): string {
  if (accent.startsWith('#')) return accent;
  return ACCENT_HEX[accent] ?? '#22f0ff';
}

/** Map a GameMode -> data-mode attribute value so child .accent classes recolor. */
function dataModeOf(mode: GameMode): 'fun' | 'normal' | 'expert' {
  return mode === 'fun' || mode === 'expert' ? mode : 'normal';
}

const EXAMPLES = [
  'Uber for in-home senior care, dispatched by AI',
  'A vector DB that runs entirely on-device',
  'AI copilot that negotiates your SaaS bills',
];

const ANALYZING_STEPS = [
  'READING SITE & DECK...',
  'EXTRACTING WEDGE & MOAT...',
  'SNIFFING OUT RED FLAGS...',
  'BRIEFING THE THREE PARTNERS...',
];

/* ---------------------------------------------------------------------------
 * Retro "INSERT COIN" mute toggle — pinned top-right of the cabinet.
 * Wired to sfx.toggleMute(); reflects sfx.muted live.
 * ------------------------------------------------------------------------- */
function MuteToggle() {
  const [muted, setMuted] = useState<boolean>(sfx.muted);
  return (
    <button
      type="button"
      aria-pressed={!muted}
      aria-label={muted ? 'Sound off — tap to enable' : 'Sound on — tap to mute'}
      onClick={() => setMuted(sfx.toggleMute())}
      className="font-pixel pixel-panel scanline flex items-center gap-2 px-3 py-2 text-[8px] text-neonInk transition-transform active:translate-x-[2px] active:translate-y-[2px] sm:text-[9px]"
    >
      <span className="text-sm leading-none">{muted ? '🔇' : '🔊'}</span>
      <span className="glow">{muted ? 'SFX OFF' : 'SFX ON'}</span>
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * The retro "READING SITE & DECK..." loader shown while game.analyzing is true.
 * Cycles honest progress lines so the founder never stares at a dead spinner
 * during the Gemini round-trip. Themed to the active mode accent.
 * ------------------------------------------------------------------------- */
function AnalyzingLoader({ game }: { game: GameApi }) {
  const [step, setStep] = useState(0);
  const mode = getMode(game.mode);

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
      : 'YOUR PITCH';

  return (
    <div
      data-mode={dataModeOf(game.mode)}
      className="flex flex-1 flex-col items-center justify-center py-16"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pixel-panel scanline relative grid h-32 w-32 place-items-center"
      >
        {/* spinning pixel reticle */}
        <motion.span
          aria-hidden
          className="absolute inset-2 border-[3px] border-dashed"
          style={{ borderColor: mode.accent }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="text-4xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        >
          🔎
        </motion.span>
      </motion.div>

      <p className="font-pixel glow mt-8 text-[9px] tracking-[0.25em] text-neonAmber">
        DUE DILIGENCE IN PROGRESS
      </p>
      <h2 className="font-pixel glow mt-4 max-w-md truncate text-center text-base text-neonInk sm:text-xl">
        SIZING UP {String(source).toUpperCase()}
      </h2>

      {/* indeterminate segmented loader bar (reuses HP-bar look) */}
      <div className="mt-6 w-64 max-w-full">
        <div className="hp-bar">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              className="hp-seg"
              style={{ ['--hp-color' as string]: mode.accent }}
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.08,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="font-pixel text-[10px] tracking-[0.18em] text-neonInk/70"
          >
            {ANALYZING_STEPS[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * MODE SELECTOR — three arcade cards (FUN / NORMAL / EXPERT). The active card
 * is highlighted with its accent + a "1P SELECT" marquee. Clicking a card calls
 * game.setMode(m.id) (the only call needed) and plays sfx.select().
 * ------------------------------------------------------------------------- */
function ModeSelector({ game }: { game: GameApi }) {
  const select = (m: GameMode) => {
    if (m === game.mode) return;
    game.setMode(m);
    sfx.select();
  };

  return (
    <div>
      <p className="font-pixel mb-3 text-center text-[9px] tracking-[0.25em] text-neonInk/45">
        SELECT YOUR RUN
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODES.map((m, i) => {
          const active = m.id === game.mode;
          return (
            <motion.button
              key={m.id}
              type="button"
              data-mode={dataModeOf(m.id)}
              onClick={() => select(m.id)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 + i * 0.06 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              aria-pressed={active}
              className={`pixel-panel scanline relative flex flex-col items-center gap-2 px-3 py-4 text-center transition-all ${
                active ? 'opacity-100' : 'opacity-55 hover:opacity-90'
              }`}
              style={{
                // dim inactive cards toward grey; active uses full mode accent
                ['--accent' as string]: active ? m.accent : '#3a2d52',
              }}
            >
              {/* active marquee */}
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-pixel absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[7px] text-bg"
                    style={{ background: m.accent }}
                  >
                    ▶ 1P
                  </motion.span>
                )}
              </AnimatePresence>

              <span className="pixelated text-3xl leading-none" aria-hidden>
                {m.emoji}
              </span>
              <span
                className="font-pixel text-[13px]"
                style={{ color: active ? m.accent : '#7e6fa0' }}
              >
                {m.label}
              </span>
              <span className="font-retro text-[15px] leading-tight text-neonInk/60">
                {m.tagline}
              </span>

              {/* difficulty meter — filled segs by mode order */}
              <span className="mt-1 flex gap-1" aria-hidden>
                {MODES.map((_, di) => (
                  <span
                    key={di}
                    className="h-1.5 w-3"
                    style={{
                      background: di <= i ? m.accent : '#2a1d44',
                      opacity: active ? 1 : 0.6,
                    }}
                  />
                ))}
              </span>
            </motion.button>
          );
        })}
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

  const activeMode = getMode(game.mode);
  const trimmedUrl = url.trim();
  const trimmedIdea = idea.trim();
  const hasAnything = Boolean(trimmedUrl || trimmedIdea || pdfBase64);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setPdfError(null);
    if (!isPdf(file)) {
      setPdfError('THAT IS NOT A PDF. UPLOAD YOUR PITCH DECK OR ONE-PAGER AS A PDF.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setPdfError('THAT PDF IS OVER 12 MB. TRIM IT DOWN AND TRY AGAIN.');
      return;
    }
    setReading(true);
    try {
      const b64 = await fileToBase64(file);
      setPdfBase64(b64);
      setPdfName(file.name);
      setPdfSize(file.size);
      sfx.select();
    } catch (err) {
      console.error('[gauntlet] PDF read failed:', err);
      setPdfError('COULD NOT READ THAT FILE. TRY A DIFFERENT PDF.');
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
    sfx.select();
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
    <div
      data-mode={dataModeOf(game.mode)}
      className="flex flex-1 flex-col items-center justify-center py-8"
    >
      {/* Top arcade bar: INSERT COIN eyebrow + MUTE */}
      <div className="mb-6 flex w-full max-w-2xl items-center justify-between gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-pixel pixel-panel scanline flex items-center gap-2 px-3 py-2 text-[8px] tracking-[0.18em] text-neonInk sm:text-[9px]"
        >
          <motion.span
            className="inline-block h-2 w-2"
            style={{ background: activeMode.accent }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="glow">INSERT COIN · GEMINI</span>
        </motion.div>
        <MuteToggle />
      </div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="font-pixel text-center text-2xl leading-[1.4] tracking-tight sm:text-4xl md:text-5xl"
      >
        <span className="text-neonInk">THE</span>{' '}
        <motion.span
          className="glow inline-block text-neonMagenta"
          animate={{
            textShadow: [
              '0 0 6px #ff36d8, 0 0 22px rgba(255,54,216,0.6)',
              '0 0 10px #22f0ff, 0 0 30px rgba(34,240,255,0.7)',
              '0 0 6px #ff36d8, 0 0 22px rgba(255,54,216,0.6)',
            ],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          GAUNTLET
        </motion.span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="font-retro mt-5 max-w-xl text-center text-lg text-neonInk/65 sm:text-xl"
      >
        Drop your site, your deck, or one sharp line. Three AI investors read it,
        then grill you on it. Drain their skepticism before they shred your
        credibility — and walk out with a term sheet.
      </motion.p>

      {/* MODE SELECTOR — above the intake fields */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="mt-8 w-full max-w-2xl"
      >
        <ModeSelector game={game} />
      </motion.div>

      {/* Intake card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 w-full max-w-2xl space-y-4"
      >
        {/* URL */}
        <div className="pixel-panel scanline flex items-center gap-2 px-4 py-3">
          <span className="text-neonInk/40">🌐</span>
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              sfx.blip();
            }}
            placeholder="YOURCOMPANY.COM — WE'LL READ YOUR SITE"
            className="font-retro w-full !border-0 bg-transparent text-lg text-neonInk placeholder-neonInk/30 outline-none focus:!shadow-none sm:text-xl"
          />
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
            <div className="pixel-panel scanline flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl">📄</span>
                <div className="min-w-0">
                  <p className="font-retro truncate text-base text-neonInk">{pdfName}</p>
                  <p className="font-pixel text-[8px] text-neonGreen">
                    {formatBytes(pdfSize)} · READY
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearPdf();
                  sfx.blip();
                }}
                className="font-pixel shrink-0 border-2 border-neonRed/60 px-3 py-1.5 text-[8px] text-neonRed transition-colors hover:bg-neonRed hover:text-bg"
              >
                REMOVE
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
              className="font-pixel flex w-full items-center justify-center gap-3 border-[3px] border-dashed border-neonInk/20 bg-bgPanel/40 px-4 py-4 text-[9px] tracking-[0.12em] text-neonInk/55 transition-colors hover:border-[color:var(--accent)] hover:text-neonInk"
            >
              <span className="text-base">📎</span>
              {reading ? 'READING YOUR DECK...' : 'UPLOAD PITCH DECK (PDF) — OPTIONAL'}
            </button>
          )}
          {pdfError && (
            <p className="font-pixel mt-2 text-[8px] leading-relaxed text-neonRed">{pdfError}</p>
          )}
        </div>

        {/* Idea */}
        <div className="pixel-panel scanline px-1 pt-1">
          <textarea
            value={idea}
            onChange={(e) => {
              setIdea(e.target.value.slice(0, 240));
              sfx.blip();
            }}
            onKeyDown={onIdeaKeyDown}
            rows={2}
            placeholder="…or just describe what you're building in one line"
            className="font-retro w-full resize-none !border-0 bg-transparent px-3 py-3 text-lg text-neonInk placeholder-neonInk/30 outline-none focus:!shadow-none sm:text-xl"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="font-pixel text-[8px] tabular-nums text-neonInk/30">{idea.length}/240</span>
            <span className="font-pixel hidden text-[8px] text-neonInk/30 sm:block">
              SITE + DECK + LINE = SHARPEST READ
            </span>
          </div>
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setIdea(ex);
                sfx.blip();
              }}
              className="font-retro border-2 border-neonInk/15 bg-bgPanel/40 px-3 py-1.5 text-base text-neonInk/55 transition-colors hover:border-[color:var(--accent)] hover:text-neonInk"
            >
              {ex}
            </button>
          ))}
        </div>

        {game.error && (
          <div className="pixel-panel font-retro px-4 py-3 text-base text-neonRed" style={{ ['--accent' as string]: 'var(--neon-red)' }}>
            {game.error}
          </div>
        )}

        <motion.button
          type="button"
          onClick={enter}
          disabled={!hasAnything || reading}
          whileTap={hasAnything && !reading ? { scale: 0.97 } : undefined}
          className="arcade-btn font-pixel w-full text-sm sm:text-base"
        >
          {hasAnything ? '▶ ANALYZE' : 'ADD A SITE, DECK, OR LINE'}
        </motion.button>
      </motion.div>

      {/* Boss preview — pixel-framed portraits */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="mt-12 w-full max-w-3xl"
      >
        <p className="font-pixel mb-5 text-center text-[9px] tracking-[0.22em] text-neonInk/40">
          ⚔ THREE BOSSES STAND BETWEEN YOU AND THE ROUND ⚔
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BOSSES.map((boss, i) => {
            const hex = accentHex(boss.accent);
            return (
              <motion.div
                key={boss.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.44 + i * 0.08 }}
                whileHover={{ y: -3 }}
                className="pixel-panel scanline relative p-4"
                style={{ ['--accent' as string]: hex }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="pixelated grid h-14 w-14 shrink-0 place-items-center border-[3px] bg-bg text-3xl"
                    style={{
                      borderColor: hex,
                      boxShadow: `0 0 18px ${hex}66, inset 0 0 12px ${hex}44`,
                    }}
                    aria-hidden
                  >
                    {boss.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="font-pixel truncate text-[10px] text-neonInk">{boss.name}</p>
                    <p className="font-pixel glow mt-1 truncate text-[8px]" style={{ color: hex }}>
                      {boss.title}
                    </p>
                  </div>
                </div>
                <p className="font-retro mt-3 text-base leading-snug text-neonInk/50">
                  Hammers <span className="text-neonInk/80">{boss.focus}</span>.
                </p>
              </motion.div>
            );
          })}
        </div>
        <p className="font-pixel mt-5 text-center text-[8px] tracking-[0.12em] text-neonInk/25">
          MARKET · TECHNOLOGY · GO-TO-MARKET
        </p>
      </motion.div>
    </div>
  );
}

export default OnboardScreen;
