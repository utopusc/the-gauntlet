# THE GAUNTLET — Submission

**Survive a boss-battle of AI VCs and earn your term sheet.** A Gemini-powered
fundraising flight simulator: drop in your **company website URL**, **upload your
pitch deck (PDF)**, or type a one-line idea — Gemini reads it and builds a real
company dossier, three AI investor bosses (Market · Tech · GTM) grill you on
**your actual business**, and a win unlocks a **$5M raise flow** with matched
investors and ready-to-send warm intros. Built for the GDG Stanford × Red Bull
Basement hackathon.

**The flow:** URL / PDF / idea intake → Gemini company analysis → dossier review
→ grounded boss battle → **$5M investor-match raise** (win) or rejection card (lose).

- **GitHub (public):** https://github.com/utopusc/the-gauntlet
- **Engine:** `@google/genai`, model `gemini-2.5-flash` (swappable in `constants.ts`)
- **Website analysis:** Gemini's native **URL context** tool — **no Firecrawl, no
  backend, no crawler**. Pure-client; runs unchanged in AI Studio. (PDF intake
  uses `inlineData`; idea/PDF/judging paths use structured `responseSchema` JSON.)
- **Stack:** Vite + React 18 + TypeScript · Tailwind (CDN) · Framer Motion

---

## ☁️ Run in Google AI Studio (judge-fastest path)

This app follows the AI Studio app pattern. AI Studio injects the key into
`process.env.API_KEY` automatically — no `.env.local` needed. `vite.config.ts`
wires `GEMINI_API_KEY` → both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`,
so the same code runs locally and in AI Studio unchanged.

1. Open Google AI Studio → **Build** (apps) → create / import an app.
2. **Import the repo:** point it at `https://github.com/utopusc/the-gauntlet`
   (or upload / paste the project files — all source is in the repo root:
   `index.html`, `index.tsx`, `App.tsx`, `components/`, `hooks/`, `services/`,
   `constants.ts`, `prompts.ts`, `types.ts`, `vite.config.ts`).
3. **Set the key:** ensure a valid **`GEMINI_API_KEY`** is configured in the
   AI Studio environment (Studio maps it into `process.env.API_KEY` for you).
4. **Run.** Paste your **company URL** (or upload a **pitch PDF**, or type an idea)
   → Gemini analyzes it → review the dossier → **ENTER THE ARENA** → battle the
   three bosses → win to reach the **$5M raise** screen with matched investors.

> Website analysis uses Gemini's native **URL context** tool — there is **no
> backend, scraper, or Firecrawl dependency** to configure. Everything runs in the
> browser against the Gemini API.
>
> If you see "great idea!"-style fluff or no questions, the key isn't wired —
> recheck step 3. The bosses are deliberately brutal; that's the product.

---

## 💻 Run locally

**Prerequisites:** Node 18+ and a Gemini API key.

```bash
git clone https://github.com/utopusc/the-gauntlet.git
cd the-gauntlet

# 1. install
npm install

# 2. add your key
cp .env.local.example .env.local
#    edit .env.local → GEMINI_API_KEY=your_key_here

# 3. run
npm run dev          # dev server, typically http://localhost:5173
```

Production: `npm run build` → output in `dist/`; preview with `npm run preview`.

**Build status:** ✅ Green. `npm install` and `npm run build` (vite v6.4.2,
408 modules) both exit 0. The only output is an advisory >500 kB chunk note
(gzip 162 kB) — a code-splitting suggestion, not an error.

---

## 🎬 Demo & pitch assets

All in this `submission/` folder:

- **1-minute demo (live app walkthrough):** [`DEMO-1MIN.md`](./DEMO-1MIN.md) — beat-by-beat screen-record script, 75s target / 90s hard cap, cursor + UI audio on.
- **2-minute pitch:** [`PITCH-2MIN.md`](./PITCH-2MIN.md) — investor-facing narrative pitch.
- **One-pager:** [`ONE-PAGER.md`](./ONE-PAGER.md) — problem / product / moat / market.
- **Share copy (the growth loop):** [`SHARE-COPY.md`](./SHARE-COPY.md) — X + LinkedIn launch posts, verdict-card hooks, hashtag sets.

---

## 📣 Share copy (ready to post)

**Verdict-card hook (printed on every shareable card):**
> I scored 84/100 in THE GAUNTLET. My startup survived 3 AI VCs. Does yours?
> ⚔️ Market boss · Tech boss · GTM boss — beaten. *the-gauntlet · powered by Gemini*

**X / Twitter launch:**
> I built THE GAUNTLET 🥊
> Type your startup idea → fight 3 AI VC bosses (Market, Tech, GTM) → each has an HP bar → sharp answers drain it, hand-waving drains YOU.
> Survive all 3 = a shareable fundability score.
> Powered by @Google Gemini. I scored 84/100. Think yours survives? 🔗 https://github.com/utopusc/the-gauntlet

**Hashtags:** `#GDGStanford #RedBullBasement #TheGauntlet #Gemini #GoogleGemini #startups #founders #bossbattle`

Full post variants, LinkedIn copy, and guardrails in [`SHARE-COPY.md`](./SHARE-COPY.md).

---

## 🧠 Why it wins

Most "AI pitch coach" demos are one chat box that says "great idea!" The Gauntlet
**reads your real company** — paste a URL or drop your pitch deck and Gemini builds
an actual dossier — then ships **three distinct adversaries** mapped to how funds
actually diligence: market (TAM/why-now/moat), tech (feasibility/data advantage),
GTM (distribution/CAC-LTV). Every question is **grounded on your extracted profile**,
not generic. Win and you don't just get a score — you reach a **$5M raise flow**
with matched investors and warm-intro emails you could actually send. Real game
feel (animated HP bars, damage numbers, Framer Motion) and a built-in viral loop
(every play ends in a postable verdict card).

*Built for the Gauntlet. Now go raise.*
