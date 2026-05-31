# THE GAUNTLET — 60–90s Live Demo Playcast Script

**Purpose:** Screen-recorded walkthrough of the *actual app*, narrated. This is the "show, don't tell" companion to the pitch video. Target run length: 75 seconds (hard cap 90s).
**Capture:** Screen-record at 60fps, cursor visible, UI audio ON (HP-drain SFX and victory sting sell the game feel). Pre-stage the idea text so typing is fast and clean.

**Legend:** `[ACTION]` = what we do on screen · `[VO]` = narrator · `[SCREEN]` = what the viewer sees.

---

### BEAT 0 — TITLE (0:00–0:05)
**[SCREEN]** App landing: arena gate, single input field, three locked boss silhouettes (MARKET · TECH · GTM) with full HP bars.
**[VO]** "This is THE GAUNTLET, running live. One idea, three Gemini investor bosses. Let's fight."

### BEAT 1 — TYPE THE IDEA (0:05–0:15)
**[ACTION]** Type into the input: **"A subscription app that uses AI to plan and auto-book weekly meal kits for busy families."** Hit **ENTER FIGHT**.
**[SCREEN]** Gate opens. **Boss 1 — THE MARKET BOSS** steps forward, HP bar full at 100.
**[VO]** "I type my startup in one line and walk into the arena. First up — the Market Boss."

### BEAT 2 — FIGHT THE MARKET BOSS (0:15–0:38)
**[SCREEN]** Boss question appears in a chat-style attack bubble:
> *"Meal kits are a graveyard — Blue Apron lost 90% of its value. What's your wedge, and why does AI change the unit economics that killed everyone before you?"*
**[ACTION]** Type a tight answer: **"Wedge is auto-rebooking — we cut churn by removing the weekly decision. AI plans around what's already in your fridge, so per-order food cost drops ~20%."**
**[SCREEN]** Gemini scores the answer live — a small "+specificity, +moat" tag flashes, and the **Market Boss HP drains from 100 → 41** with a satisfying hit SFX and screen-shake.
**[VO]** "Gemini reads my answer in real time. It rewards specificity and a real moat — watch the boss's HP drop. Vague answers? Those cost ME health."
**[ACTION]** (Optional, if time) One weak follow-up answer → founder's own HP ticks down slightly to show the two-way stakes.

### BEAT 3 — FAST-FORWARD THROUGH TECH + GTM (0:38–0:52)
**[SCREEN]** Speed-ramp / quick cuts: **Boss 2 TECH** ("what breaks at 100k weekly auto-orders?") and **Boss 3 GTM** ("CAC payback on a $9/mo plan?") each take a hit, HP bars draining to zero in sequence.
**[VO]** "The Tech boss hammers what breaks at scale. The GTM boss demands my CAC math. Three rounds, three HP bars, one survivor."

### BEAT 4 — VICTORY + THE VERDICT CARD (0:52–1:10)
**[SCREEN]** Final HP hits zero → **VICTORY** flash, confetti, victory sting. The **Term Sheet card** flips into center frame:
> **FUNDABILITY: 84 / 100**
> **Strengths:** Clear churn-killing wedge · credible margin story
> **Fatal gap:** No proof of CAC payback under 12 months
> **The question you ducked:** "What happens when Amazon copies the auto-rebook?"
**[VO]** "Beat all three and you get the verdict — a shareable Term Sheet card. Eighty-four out of a hundred. My strengths, my fatal gap, and the exact question a real VC would've killed me on."

### BEAT 5 — THE SHARE + CTA (1:10–1:20)
**[ACTION]** Tap **SHARE** → the card drops into a mock social post: *"I scored 84/100 in THE GAUNTLET. Think your startup survives?"*
**[SCREEN]** End frame: logo, URL, "Powered by Gemini."
**[VO]** "Every run ends in a card built to be posted. Think your idea is fundable? Step into the Gauntlet."

---

## SAFE FALLBACK NOTE (read before recording)
If the **live Gemini call fails, times out, or returns malformed JSON during the demo**, do NOT debug on camera. Use one of these, in priority order:
1. **Pre-recorded golden run.** Keep a clean, pre-captured 75s screen recording of the exact fight above (idea → HP drain → 84/100 card) as the primary asset. Narrate over it. This is the *default* deliverable — a flaky live API should never be the single point of failure for a hackathon demo.
2. **Local cached/mock mode.** Ship a `DEMO_MODE` flag that serves a deterministic scored response (fixed questions + the 84/100 card) from a local fixture, so HP-drain and card generation always fire regardless of network. Toggle it on for any live presentation.
3. **Static card screenshot.** Worst case, cut straight to a high-res still of the Term Sheet card and narrate the value prop. The verdict card is the memorable artifact; everything before it is setup.

**Honesty note for judges:** the score is a calibrated *rehearsal* signal against a VC-question rubric — we present it as practice-grade diagnostic, not an investment verdict on the company. Say so on camera; it builds trust with real VCs in the room.
