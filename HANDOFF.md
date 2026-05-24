# Practically AI — Interactive AI Spotlight (Handoff Brief)

## Project goal

Replace the static "AI Spotlight" news slides at the **Practically AI** meetup (software engineers, monthly) with a **live, interactive segment**:

1. Audience scans a QR code on the screen, joins via phone — **no login**.
2. They answer 3–4 short questions that **filter** the news pile Tibor has pre-collected for the past month.
3. Responses are exported as a report.
4. Report is pasted **live on stage** into Claude (with the slide-generation skill).
5. The deck is generated in front of the audience and presented immediately.

The interactive vote is not just engagement — it is the **prompt input** for slide generation, with the deck appearing live as the wow moment.

## Constraints

- **Time:** ~10 min slot, slight overrun OK if impressive (target 10–13 min).
- **No login** — friction kills participation in a 10-min window.
- **Audience:** software engineers, headcount TBD (need to size for concurrent phones).
- **Deployment:** Originally local-only POC; will be deployed to Tibor's personal Google Cloud project on the target machine.

## How we got to the final question set (key decisions)

1. **First framing question:** does the audience vote *steer* the segment live, or *feed a report* that generates slides? → Decided: feed a report → Claude → slides, live on stage.

2. **Initial drift (corrected):** I first proposed free-text questions like "what AI tool did you try this month?" and "what use case was frustrating?". Tibor rightly pushed back: those are **orthogonal to news filtering**. The AI Spotlight is specifically about news from the past month, so questions must **filter a pre-collected news pile**, not generate fresh content.

3. **Refocus:** questions map to actual axes of the news pile — *which labs*, *which categories*, *what aesthetic*.

4. **Design question added last** — Tibor's idea. Identified as the **highest-stakes wow moment** because design choice is instantly visible when the deck appears: if Claude nails the aesthetic, applause; if it whiffs, that's also memorable as a model-capability moment.

5. **Predictable bar charts are fine.** The interactivity itself is the value; the live-generated deck is the payoff. We're not optimizing for surprising data.

6. **Single-choice on design (not multi)** — conflicting style votes muddle the prompt; deck has one look.

7. **"Surprise me" dropped from design Q** — kills the audience-steered feel.

## Final question set

Order: **Q0 → Q1 → Q2 → Q4**, with Q3 (open-text) as an "if time allows" closer.

### Q0 — Opener (one tap, ~5 sec)
*"Do you use AI tools daily at work?"*
- Yes, can't live without them
- Sometimes
- Barely / not yet

*Purpose:* warm the room, get phones out, normalize participation. **Does not feed the deck.**

### Q1 — WHO (multi-select, pick up to 3, ~20 sec)
*"Whose news do you want to hear about?"*
- Anthropic
- OpenAI
- Google / DeepMind
- Meta
- xAI
- Microsoft
- Amazon
- Chinese labs (DeepSeek, Qwen, Kimi…)
- Small labs & open source
- Hardware (Nvidia, AMD, custom silicon)

*Feeds deck:* which labs to lead with. (10 options is on the high end for mobile — may want to trim to 7–8.)

### Q2 — WHAT KIND (multi-select, pick up to 2, ~20 sec)
*"What kind of news matters most?"*
- New model releases & benchmarks
- Dev tools & coding agents
- Research & technical breakthroughs
- Business, funding, acquisitions
- Controversy, regulation, policy
- Real-world use cases & demos
- Hardware & infrastructure

*Feeds deck:* which category to weight.

### Q3 — OPEN TEXT (optional, ~45 sec, skip if running long)
*"One AI thing from the past month I shouldn't miss?"* (free text)

*Purpose:* catches blind spots, becomes an "audience hot takes" closing slide. Big engagement spike when people see their own words on screen.

### Q4 — DESIGN (single-choice, ~15 sec)
*"What should the slides look like?"*
- **Minimalist** — clean, lots of whitespace, Apple keynote vibes
- **Dark terminal** — monospace, green-on-black, hacker aesthetic
- **Retro synthwave** — neon, grids, 80s vaporwave
- **Editorial magazine** — big typography, photo-led, NYT / The Verge
- **Brutalist** — raw, oversized type, intentionally rough

*Considered and dropped:* "playful illustrated" (Claude's slide skill shakier here), "corporate" (boring, wastes a slot), "surprise me" (kills audience agency).

## Stage flow

1. Tibor intros AI Spotlight, has news pile context ready.
2. QR code appears on screen → audience joins (no login).
3. Run Q0 → Q1 → Q2 → Q4 (and Q3 if time).
4. Show results bar charts as each question closes.
5. Export report.
6. Paste into Claude (with slide-generation skill) live on stage.
7. Watch deck generate.
8. Present generated deck for remaining ~6–7 min.

## Time budget

| Stage | Time |
|---|---|
| Voting (Q0+Q1+Q2+Q4) | ~2 min |
| + Open-text Q3 | +1 min |
| Paste + generate in Claude | ~1–1.5 min |
| Present deck | ~6–7 min |
| **Total** | **10–13 min** |

## Open items / decisions still needed for build

- **Tech stack** — suggested Node + WebSocket for live results, but open to alternatives (Bun, Python). Pick what's fastest to deploy to Google Cloud (App Engine / Cloud Run?).
- **Networking** — Google Cloud deployment removes the same-Wi-Fi / tunnel problem, but verify low latency for live results.
- **Concurrent phones** — need rough headcount to size correctly.
- **Presenter view** — live bar chart per question, word cloud for open-text, "next question" control.
- **Report export format** — markdown is probably best (paste-friendly for Claude). Needs to summarize Q1/Q2 results as weighted instructions and dump Q3 free-text verbatim.
- **Prompt template** — the report should be wrapped in a prompt that tells Claude: "Generate a slide deck recapping the last month's AI news, weighted by these audience preferences, in this aesthetic. Use the news context I've already provided."
- **News pile prep** — Tibor still needs to prepare the news pile that Claude will draw from. Could be a markdown doc loaded into the same Claude conversation before pasting the report.

## Things explicitly NOT in scope

- Authentication / accounts
- Persistence across meetups (each session is standalone)
- Anything pushed to a remote repo other than the user's own Google Cloud project
