"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QuestionDef, SessionSnapshot } from "@/lib/types";

type StreamSnapshot = SessionSnapshot & { youId: string };

type Status = "connecting" | "live" | "reconnecting";

export default function VoterApp({ questions }: { questions: QuestionDef[] }) {
  const [snapshot, setSnapshot] = useState<StreamSnapshot | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [submitted, setSubmitted] = useState<Record<string, true>>({});

  useEffect(() => {
    const source = new EventSource("/api/stream");
    source.addEventListener("snapshot", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as StreamSnapshot;
        setSnapshot(data);
        setStatus("live");
      } catch {
        /* ignore */
      }
    });
    source.onerror = () => setStatus("reconnecting");
    source.onopen = () => setStatus("live");
    return () => source.close();
  }, []);

  const currentQ = useMemo(() => {
    if (!snapshot?.currentQuestionId) return null;
    return questions.find((q) => q.id === snapshot.currentQuestionId) ?? null;
  }, [questions, snapshot]);

  const submit = useCallback(
    async (payload: { questionId: string; optionIds?: string[]; text?: string }) => {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmitted((s) => ({ ...s, [payload.questionId]: true }));
      }
      return res.ok;
    },
    []
  );

  if (!snapshot) {
    return <Shell title="Connecting…" subtitle="Hang on, hooking you up." />;
  }

  if (snapshot.status === "lobby") {
    return (
      <Shell
        title="AI Spotlight"
        subtitle="The vote will open when the presenter starts the segment. Hang tight."
        status={status}
      />
    );
  }

  if (snapshot.status === "complete") {
    return (
      <Shell
        title="Thanks for voting!"
        subtitle="The deck is being generated live on stage right now."
        status={status}
      />
    );
  }

  if (!currentQ) {
    return <Shell title="Waiting…" subtitle="Next question coming up." status={status} />;
  }

  const isClosed = snapshot.currentQuestionState === "closed";
  const alreadyVoted = submitted[currentQ.id] === true;

  return (
    <Shell title={currentQ.prompt} status={status}>
      {alreadyVoted ? (
        <ResultsView question={currentQ} snapshot={snapshot} />
      ) : isClosed ? (
        <ResultsView question={currentQ} snapshot={snapshot} />
      ) : (
        <QuestionForm question={currentQ} onSubmit={submit} />
      )}
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  children,
  status,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  status?: Status;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pb-10 pt-8">
      <header className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-neutral-400">Practically AI</div>
        {status && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                status === "live"
                  ? "bg-emerald-400"
                  : status === "reconnecting"
                    ? "bg-amber-400"
                    : "bg-neutral-500"
              }`}
            />
            {status}
          </div>
        )}
      </header>
      <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
      {subtitle && <p className="text-neutral-400">{subtitle}</p>}
      {children}
    </main>
  );
}

function QuestionForm({
  question,
  onSubmit,
}: {
  question: QuestionDef;
  onSubmit: (p: { questionId: string; optionIds?: string[]; text?: string }) => Promise<boolean>;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (question.kind === "text") {
    const trimmed = text.trim();
    const canSubmit = trimmed.length > 0 && !busy;
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit) return;
          setBusy(true);
          setError(null);
          const ok = await onSubmit({ questionId: question.id, text: trimmed });
          setBusy(false);
          if (!ok) setError("Vote was rejected. The question may have closed.");
        }}
      >
        <textarea
          className="min-h-32 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-base text-neutral-100 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
          placeholder={question.placeholder}
          maxLength={280}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>{text.length}/280</span>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 disabled:opacity-40"
          >
            {busy ? "Sending…" : "Submit"}
          </button>
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </form>
    );
  }

  const isMulti = question.kind === "multi";
  const maxPicks = isMulti ? question.maxPicks : 1;
  const limitReached = picked.size >= maxPicks;
  const canSubmit = picked.size > 0 && !busy;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setBusy(true);
        setError(null);
        const ok = await onSubmit({
          questionId: question.id,
          optionIds: Array.from(picked),
        });
        setBusy(false);
        if (!ok) setError("Vote was rejected. The question may have closed.");
      }}
    >
      <p className="text-sm text-neutral-400">
        {isMulti ? `Pick up to ${maxPicks}.` : "Pick one."}
      </p>
      <div className="flex flex-col gap-2">
        {question.options.map((opt) => {
          const isPicked = picked.has(opt.id);
          const disabled = !isPicked && limitReached && isMulti;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                setPicked((current) => {
                  const next = new Set(current);
                  if (isMulti) {
                    if (next.has(opt.id)) next.delete(opt.id);
                    else if (next.size < maxPicks) next.add(opt.id);
                  } else {
                    next.clear();
                    next.add(opt.id);
                  }
                  return next;
                });
              }}
              className={`w-full rounded-xl border px-4 py-3.5 text-left text-base transition ${
                isPicked
                  ? "border-white bg-white text-neutral-950"
                  : disabled
                    ? "border-neutral-900 bg-neutral-950 text-neutral-600"
                    : "border-neutral-800 bg-neutral-900 text-neutral-100 hover:border-neutral-600"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-2 rounded-full bg-white px-5 py-3 text-base font-semibold text-neutral-950 disabled:opacity-40"
      >
        {busy ? "Sending…" : `Submit ${isMulti ? `(${picked.size}/${maxPicks})` : ""}`.trim()}
      </button>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </form>
  );
}

function ResultsView({
  question,
  snapshot,
}: {
  question: QuestionDef;
  snapshot: StreamSnapshot;
}) {
  if (question.kind === "text") {
    const responses = snapshot.textResponses[question.id] ?? [];
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-neutral-400">
          {responses.length} response{responses.length === 1 ? "" : "s"} so far. Eyes on the stage.
        </p>
        <ul className="flex flex-col gap-2">
          {responses.slice(-12).reverse().map((r, i) => (
            <li
              key={i}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
            >
              {r}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const tally = snapshot.tallies[question.id] ?? {};
  const voteCount = snapshot.voteCounts[question.id] ?? 0;
  const ranked = question.options
    .map((o) => ({ option: o, count: tally[o.id] ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...ranked.map((r) => r.count));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-neutral-400">
        Thanks — your vote is in. {voteCount} voter{voteCount === 1 ? "" : "s"} so far.
      </p>
      <ul className="flex flex-col gap-2">
        {ranked.map(({ option, count }) => {
          const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
          const w = (count / max) * 100;
          return (
            <li key={option.id} className="rounded-lg bg-neutral-900 p-3">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-neutral-200">{option.label}</span>
                <span className="tabular-nums text-neutral-400">
                  {count} · {pct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
                  style={{ width: `${w}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
