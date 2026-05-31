# ⚔️ THE GAUNTLET

**Survive a boss-battle of AI VCs and earn your term sheet.**

The Gauntlet is a Gemini-powered fundraising flight simulator. Type your one-line
startup idea, step into the Arena, and face **three AI investor bosses** — a contrarian
seed Skeptic, a brilliant technical Architect, and a growth-obsessed Operator. Each one
fires a brutal, *specific* question generated live by Gemini. Answer well and you drain
their skepticism. Answer poorly and you bleed credibility. Survive all three and you walk
away with a shareable **Term Sheet** verdict. Choke, and you get the rejection card.

It plays like a boss-rush video game. It feels like a real pitch meeting.

---

## 🧠 The moat

Most "AI pitch coach" demos are a single chat box that says "great idea!" The Gauntlet is
different:

- **Three distinct adversaries** mapped to the way real funds actually diligence a deal —
  **market** (TAM / why-now / moat), **technology** (feasibility / data advantage), and
  **GTM** (distribution / CAC-LTV / unit economics). It's the hackathon judging rubric,
  weaponized into gameplay.
- **Genuinely sharp feedback.** Gemini judges every answer against real fundraising
  objections — damage, self-damage, a cutting critique, and a relentless follow-up — not
  canned compliments.
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

---

## 🛠️ Tech

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** via CDN (no build step)
- **Framer Motion** for animation
- **@google/genai** with structured `responseSchema` JSON output, model `gemini-2.5-flash`
  (swappable to a Gemini 3 model in `constants.ts` when available)

---

*Built for the Gauntlet. Now go raise.*
