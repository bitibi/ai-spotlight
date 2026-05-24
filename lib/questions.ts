import type { QuestionDef } from "./types";

export const QUESTIONS: QuestionDef[] = [
  {
    id: "q0",
    kind: "single",
    prompt: "Do you use AI tools daily at work?",
    presenterNote: "Opener — warms the room, does not feed the deck.",
    feedsReport: false,
    options: [
      { id: "daily", label: "Yes, can't live without them" },
      { id: "sometimes", label: "Sometimes" },
      { id: "barely", label: "Barely / not yet" },
    ],
  },
  {
    id: "q1",
    kind: "multi",
    maxPicks: 3,
    prompt: "Whose news do you want to hear about?",
    presenterNote: "Pick up to 3 — drives which labs the deck leads with.",
    feedsReport: true,
    options: [
      { id: "anthropic", label: "Anthropic" },
      { id: "openai", label: "OpenAI" },
      { id: "google", label: "Google / DeepMind" },
      { id: "meta", label: "Meta" },
      { id: "xai", label: "xAI" },
      { id: "microsoft", label: "Microsoft" },
      { id: "amazon", label: "Amazon" },
      { id: "chinese", label: "Chinese labs (DeepSeek, Qwen, Kimi…)" },
      { id: "open-source", label: "Small labs & open source" },
      { id: "hardware", label: "Hardware (Nvidia, AMD, custom silicon)" },
    ],
  },
  {
    id: "q2",
    kind: "multi",
    maxPicks: 2,
    prompt: "What kind of news matters most?",
    presenterNote: "Pick up to 2 — drives which category the deck weights.",
    feedsReport: true,
    options: [
      { id: "models", label: "New model releases & benchmarks" },
      { id: "devtools", label: "Dev tools & coding agents" },
      { id: "research", label: "Research & technical breakthroughs" },
      { id: "business", label: "Business, funding, acquisitions" },
      { id: "policy", label: "Controversy, regulation, policy" },
      { id: "usecases", label: "Real-world use cases & demos" },
      { id: "hardware", label: "Hardware & infrastructure" },
    ],
  },
  {
    id: "q3",
    kind: "text",
    prompt: "One AI thing from the past month I shouldn't miss?",
    presenterNote: "Open text — catches blind spots; shown verbatim in the report.",
    feedsReport: true,
    placeholder: "Tap to type…",
  },
  {
    id: "q4",
    kind: "single",
    prompt: "What should the slides look like?",
    presenterNote: "Single-choice — the deck has one look.",
    feedsReport: true,
    options: [
      { id: "minimalist", label: "Minimalist — clean, lots of whitespace, Apple keynote vibes" },
      { id: "dark-terminal", label: "Dark terminal — monospace, green-on-black, hacker aesthetic" },
      { id: "synthwave", label: "Retro synthwave — neon, grids, 80s vaporwave" },
      { id: "editorial", label: "Editorial magazine — big typography, photo-led, NYT / The Verge" },
      { id: "brutalist", label: "Brutalist — raw, oversized type, intentionally rough" },
    ],
  },
];

export function findQuestion(id: string): QuestionDef | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
