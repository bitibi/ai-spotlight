import { EventEmitter } from "node:events";
import { QUESTIONS } from "./questions";
import type {
  QuestionState,
  SessionSnapshot,
  SessionStatus,
  Tallies,
  TextResponses,
} from "./types";

type StoreState = {
  questionStates: Record<string, QuestionState>;
  currentQuestionId: string | null;
  participants: Set<string>;
  // questionId -> participantId -> Set<optionId>
  votes: Record<string, Map<string, Set<string>>>;
  // questionId -> participantId -> string
  textVotes: Record<string, Map<string, string>>;
};

function freshState(): StoreState {
  const questionStates: Record<string, QuestionState> = {};
  const votes: Record<string, Map<string, Set<string>>> = {};
  const textVotes: Record<string, Map<string, string>> = {};
  for (const q of QUESTIONS) {
    questionStates[q.id] = "idle";
    votes[q.id] = new Map();
    textVotes[q.id] = new Map();
  }
  return {
    questionStates,
    currentQuestionId: null,
    participants: new Set(),
    votes,
    textVotes,
  };
}

// Singleton across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __aiSpotlightStore: SessionStore | undefined;
}

class SessionStore {
  private state: StoreState = freshState();
  private emitter = new EventEmitter();

  constructor() {
    // Higher cap because each connected client adds a listener
    this.emitter.setMaxListeners(0);
  }

  registerParticipant(participantId: string): void {
    if (!this.state.participants.has(participantId)) {
      this.state.participants.add(participantId);
      this.broadcast();
    }
  }

  advance(): { ok: true; id: string | null } | { ok: false; reason: string } {
    const idx = this.state.currentQuestionId
      ? QUESTIONS.findIndex((q) => q.id === this.state.currentQuestionId)
      : -1;

    if (this.state.currentQuestionId) {
      this.state.questionStates[this.state.currentQuestionId] = "closed";
    }

    const next = QUESTIONS[idx + 1];
    if (!next) {
      this.state.currentQuestionId = null;
      this.broadcast();
      return { ok: true, id: null };
    }
    this.state.currentQuestionId = next.id;
    this.state.questionStates[next.id] = "open";
    this.broadcast();
    return { ok: true, id: next.id };
  }

  closeCurrent(): void {
    if (this.state.currentQuestionId) {
      this.state.questionStates[this.state.currentQuestionId] = "closed";
      this.broadcast();
    }
  }

  reset(): void {
    this.state = freshState();
    this.broadcast();
  }

  submitVote(
    participantId: string,
    questionId: string,
    optionIds: string[]
  ): { ok: true } | { ok: false; reason: string } {
    const question = QUESTIONS.find((q) => q.id === questionId);
    if (!question) return { ok: false, reason: "unknown question" };
    if (question.kind === "text") return { ok: false, reason: "text question; use text vote" };
    if (this.state.questionStates[questionId] !== "open")
      return { ok: false, reason: "question not open" };

    const validOptionIds = new Set(question.options.map((o) => o.id));
    const filtered = Array.from(new Set(optionIds.filter((id) => validOptionIds.has(id))));
    if (filtered.length === 0) return { ok: false, reason: "no valid options" };

    if (question.kind === "single" && filtered.length !== 1)
      return { ok: false, reason: "single-choice expects exactly one option" };
    if (question.kind === "multi" && filtered.length > question.maxPicks)
      return { ok: false, reason: `at most ${question.maxPicks} picks` };

    this.state.participants.add(participantId);
    this.state.votes[questionId].set(participantId, new Set(filtered));
    this.broadcast();
    return { ok: true };
  }

  submitText(
    participantId: string,
    questionId: string,
    text: string
  ): { ok: true } | { ok: false; reason: string } {
    const question = QUESTIONS.find((q) => q.id === questionId);
    if (!question) return { ok: false, reason: "unknown question" };
    if (question.kind !== "text") return { ok: false, reason: "not a text question" };
    if (this.state.questionStates[questionId] !== "open")
      return { ok: false, reason: "question not open" };
    const trimmed = text.trim().slice(0, 280);
    if (!trimmed) return { ok: false, reason: "empty text" };

    this.state.participants.add(participantId);
    this.state.textVotes[questionId].set(participantId, trimmed);
    this.broadcast();
    return { ok: true };
  }

  hasVoted(participantId: string, questionId: string): boolean {
    return (
      this.state.votes[questionId]?.has(participantId) ||
      this.state.textVotes[questionId]?.has(participantId)
    );
  }

  snapshot(): SessionSnapshot {
    const tallies: Tallies = {};
    const voteCounts: Record<string, number> = {};
    for (const q of QUESTIONS) {
      tallies[q.id] = {};
      voteCounts[q.id] = 0;
      if (q.kind !== "text") {
        for (const opt of q.options) tallies[q.id][opt.id] = 0;
        for (const picks of this.state.votes[q.id].values()) {
          voteCounts[q.id] += 1;
          for (const pickId of picks) {
            tallies[q.id][pickId] = (tallies[q.id][pickId] ?? 0) + 1;
          }
        }
      } else {
        voteCounts[q.id] = this.state.textVotes[q.id].size;
      }
    }

    const textResponses: TextResponses = {};
    for (const q of QUESTIONS) {
      if (q.kind === "text") {
        textResponses[q.id] = Array.from(this.state.textVotes[q.id].values());
      }
    }

    const allClosed = QUESTIONS.every((q) => this.state.questionStates[q.id] === "closed");
    const anyTouched = QUESTIONS.some((q) => this.state.questionStates[q.id] !== "idle");
    const status: SessionStatus =
      !anyTouched ? "lobby" : allClosed && this.state.currentQuestionId === null ? "complete" : "in-progress";

    return {
      status,
      currentQuestionId: this.state.currentQuestionId,
      currentQuestionState: this.state.currentQuestionId
        ? this.state.questionStates[this.state.currentQuestionId]
        : "idle",
      questionStates: { ...this.state.questionStates },
      tallies,
      textResponses,
      participantCount: this.state.participants.size,
      voteCounts,
    };
  }

  subscribe(listener: (snapshot: SessionSnapshot) => void): () => void {
    const wrapped = () => listener(this.snapshot());
    this.emitter.on("change", wrapped);
    return () => {
      this.emitter.off("change", wrapped);
    };
  }

  private broadcast(): void {
    this.emitter.emit("change");
  }
}

export function getStore(): SessionStore {
  if (!globalThis.__aiSpotlightStore) {
    globalThis.__aiSpotlightStore = new SessionStore();
  }
  return globalThis.__aiSpotlightStore;
}
