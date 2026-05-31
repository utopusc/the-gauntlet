# THE GAUNTLET — Submission

**Survive a boss-battle of AI VCs and earn your term sheet.** A Gemini-powered
fundraising flight simulator: type your one-line startup idea, fight three AI
investor bosses (Market · Tech · GTM), and walk away with a shareable fundability
verdict. Built for the GDG Stanford × Red Bull Basement hackathon.

- **GitHub (public):** https://github.com/utopusc/the-gauntlet
- **Engine:** `@google/genai`, model `gemini-2.5-flash` (structured `responseSchema` JSON output; swappable in `constants.ts`)
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
4. **Run.** Type a one-line startup idea → **ENTER FIGHT** → battle the three bosses.

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

**Build status:** ✅ Green. `npm install` (115 pkgs, 0 vulnerabilities) and
`npm run build` (vite/rollup, 405 modules) both exit 0. The only output is an
advisory >500 kB chunk note — not an error.

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
ships **three distinct adversaries** mapped to how funds actually diligence —
market (TAM/why-now/moat), tech (feasibility/data advantage), GTM
(distribution/CAC-LTV) — with real game feel (animated HP bars, damage numbers,
Framer Motion) and a built-in viral loop (every play ends in a postable verdict card).

*Built for the Gauntlet. Now go raise.*
