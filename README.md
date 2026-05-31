# ⚔️ THE GAUNTLET

**Survive a boss-battle of AI VCs and earn your term sheet.**

The Gauntlet is a Gemini-powered fundraising flight simulator. Bring your real
company three ways — **paste your website URL**, **upload your pitch deck (PDF)**,
or just type a one-line idea. Gemini reads it and builds a structured **company
dossier**, which you review before stepping into the Arena to face **three AI
investor bosses** — a contrarian seed Skeptic, a brilliant technical Architect, and
a growth-obsessed Operator. Every question is **grounded on your extracted profile**,
not generic. Answer well and you drain their skepticism; answer poorly and you bleed
credibility. Survive all three and you reach the **$5M raise flow** — a shareable
verdict plus **matched investors with ready-to-send warm-intro emails**. Choke, and
you get the rejection card.

**The flow:** URL / PDF / idea intake → Gemini company analysis → dossier review →
grounded boss battle → **$5M investor-match raise** (win) or rejection (lose).

It plays like a boss-rush video game. It feels like a real pitch meeting.

---

## 🕹️ Retro arcade reskin + 3 difficulty modes

The whole experience is wrapped in a **pixel-retro arcade aesthetic** — a CRT
scanline/flicker/vignette overlay (pointer-events: none, never blocks clicks), a
readable `VT323` retro body font with `Press Start 2P` reserved for arcade buttons,
segmented HP bars, neon accents, and crunchy **SFX** with a persistent mute toggle.

Pick your fight at **three difficulty modes** — the accent color, copy, and boss
brutality shift per mode:

- **Fun** — gentler bosses, forgiving scoring. A warm-up lap.
- **Normal** — the real pitch drill, balanced damage.
- **Expert** — relentless follow-ups, punishing scoring. Term sheets are earned.

Mode drives `data-mode` on the shell (→ `--accent`), wired through `types.ts`
(`GameApi.mode` / `setMode`), `useGame.ts`, and `constants.ts` (`MODES` /
`DEFAULT_MODE` / `getMode()`).

---

## 🧠 The moat

Most "AI pitch coach" demos are a single chat box that says "great idea!" The Gauntlet is
different:

- **It reads your real company.** Paste a URL and Gemini's native **URL context** tool
  reads your live site; drop a pitch deck and it parses the PDF — no Firecrawl, no
  backend, no crawler. The result is a structured dossier (problem, market, traction,
  signals, red flags) that the whole game is grounded on.
- **Three distinct adversaries** mapped to the way real funds actually diligence a deal —
  **market** (TAM / why-now / moat), **technology** (feasibility / data advantage), and
  **GTM** (distribution / CAC-LTV / unit economics). It's the hackathon judging rubric,
  weaponized into gameplay.
- **Genuinely sharp, grounded feedback.** Every boss question and judgment is tied to
  *your* extracted profile — damage, self-damage, a cutting critique, and a relentless
  follow-up — not canned compliments.
- **A real outcome, not just a score.** Win and you reach the **$5M raise flow**: Gemini
  matches you against an event investor shortlist and drafts warm-intro emails you could
  actually send.
- **Game feel as a feature.** Animated skepticism HP bars, floating damage numbers, and
  smooth Framer Motion transitions make a $5M-product experience out of a pitch drill.
- **Shareable proof.** Win or lose, you get a screenshot-ready verdict card with one-tap
  share to X and LinkedIn — built-in virality.

---

## 🚀 Run locally

**Prerequisites:** Node 18+ and a Gemini API key.

```bash
# 1. install dependencies
npm install

# 2. add your key
cp .env.local.example .env.local
#   then edit .env.local and set GEMINI_API_KEY=your_key_here

# 3. start the dev server
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

Build for production with `npm run build`, preview with `npm run preview`.

---

## ☁️ Run in Google AI Studio

This app follows the AI Studio app pattern. When run inside AI Studio, the platform
injects your key into `process.env.API_KEY` automatically — no `.env.local` needed. The
Vite config wires `GEMINI_API_KEY` → both `process.env.API_KEY` and
`process.env.GEMINI_API_KEY` so the exact same code runs locally and in AI Studio.

**No backend required.** Website analysis uses Gemini's native **URL context** tool and
PDF intake uses `inlineData`, so the entire intake → analysis → battle → raise flow runs
purely client-side against the Gemini API — there is no Firecrawl, scraper, or server to
deploy.

---

## 🛠️ Tech

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** via CDN (no build step)
- **Framer Motion** for animation
- **@google/genai**, model `gemini-2.5-flash` (swappable to a Gemini 3 model in
  `constants.ts` when available). URL intake uses the native **URL context** tool;
  PDF intake uses `inlineData`; idea/PDF analysis and answer-judging use structured
  `responseSchema` JSON output.

---

*Built for the Gauntlet. Now go raise.*
