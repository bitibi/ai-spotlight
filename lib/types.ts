export type Option = { id: string; label: string };

export type QuestionDef = {
  id: string;
  prompt: string;
  presenterNote?: string;
  feedsReport: boolean;
} & (
  | { kind: "single"; options: Option[] }
  | { kind: "multi"; maxPicks: number; options: Option[] }
  | { kind: "text"; placeholder: string }
);

export type QuestionState = "idle" | "open" | "closed";

export type SessionStatus = "lobby" | "in-progress" | "complete";

export type Tallies = Record<string, Record<string, number>>;

export type TextResponses = Record<string, string[]>;

export type SessionSnapshot = {
  status: SessionStatus;
  currentQuestionId: string | null;
  currentQuestionState: QuestionState;
  questionStates: Record<string, QuestionState>;
  tallies: Tallies;
  textResponses: TextResponses;
  participantCount: number;
  voteCounts: Record<string, number>;
};

export type VotePayload =
  | { questionId: string; optionIds: string[]; text?: undefined }
  | { questionId: string; optionIds?: undefined; text: string };
