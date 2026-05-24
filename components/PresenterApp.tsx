"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuestionDef, SessionSnapshot } from "@/lib/types";

type Status = "connecting" | "live" | "reconnecting";

export default function PresenterApp({
  questions,
  adminKey,
  voterUrl,
  qrDataUrl,
}: {
  questions: QuestionDef[];
  adminKey: string;
  voterUrl: string;
  qrDataUrl: string;
}) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    const source = new EventSource("/api/stream");
    source.addEventListener("snapshot", (e) => {
      try {
        setSnapshot(JSON.parse((e as MessageEvent).data) as SessionSnapshot);
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

  const advanceLabel = useMemo(() => {
    if (!snapshot) return "Start";
    if (snapshot.status === "lobby") return "Open Q0";
    if (snapshot.status === "complete") return "Done";
    if (!snapshot.currentQuestionId) return "Open next";
    const idx = questions.findIndex((q) => q.id === snapshot.currentQuestionId);
    const next = questions[idx + 1];
    return next ? `Open ${next.id.toUpperCase()}` : "Finish";
  }, [snapshot, questions]);

  async function call(path: string, method: "POST" | "GET" = "POST") {
    return fetch(`${path}?key=${encodeURIComponent(adminKey)}`, { method });
  }

  async function copyReport() {
    const res = await call("/api/admin/report", "GET");
    if (!res.ok) return;
    const md = await res.text();
    try {
      await navigator.clipboard.writeText(md);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      // Fallback: open a new tab with the markdown
      const win = window.open();
      if (win) {
        win.document.body.innerText = md;
      }
    }
  }

  if (!snapshot) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p className="text-neutral-400">Connecting…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-6 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm uppercase tracking-widest text-neutral-400">
            Practically AI · Presenter
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${
              status === "live"
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-amber-500/10 text-amber-300"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                status === "live" ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            {status}
          </span>
          <span className="text-xs text-neutral-500">
            {snapshot.participantCount} participant{snapshot.participantCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => call("/api/admin/close")}
            disabled={!currentQ || snapshot.currentQuestionState !== "open"}
            className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900 disabled:opacity-40"
          >
            Close vote
          </button>
          <button
            onClick={() => call("/api/admin/advance")}
            className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
          >
            {advanceLabel}
          </button>
          <button
            onClick={copyReport}
            className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900"
          >
            {copyState === "copied" ? "Copied ✓" : "Copy report"}
          </button>
          <button
            onClick={() => {
              if (confirm("Reset the whole session?")) call("/api/admin/reset");
            }}
            className="rounded-full border border-rose-900 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-950/50"
          >
            Reset
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
          {currentQ ? (
            <ActiveQuestion question={currentQ} snapshot={snapshot} />
          ) : snapshot.status === "lobby" ? (
            <Lobby voterUrl={voterUrl} />
          ) : (
            <Complete />
          )}
        </div>
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="mb-2 text-xs uppercase tracking-widest text-neutral-400">
              Join URL
            </div>
            <div className="rounded-lg bg-white p-3">
              <img
                src={qrDataUrl}
                alt="QR code to join the vote"
                className="block h-auto w-full"
              />
            </div>
            <div className="mt-3 break-all text-sm text-neutral-300">{voterUrl}</div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
            <div className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Progress</div>
            <ol className="flex flex-col gap-1.5">
              {questions.map((q) => {
                const state = snapshot.questionStates[q.id] ?? "idle";
                const isCurrent = snapshot.currentQuestionId === q.id;
                return (
                  <li
                    key={q.id}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 ${
                      isCurrent
                        ? "bg-white/10 text-white"
                        : state === "closed"
                          ? "text-neutral-500"
                          : "text-neutral-300"
                    }`}
                  >
                    <span>
                      <span className="mr-2 inline-block w-6 text-xs uppercase text-neutral-500">
                        {q.id}
                      </span>
                      {q.prompt}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {state === "open" ? "open" : state === "closed" ? "closed" : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </section>
    </main>
  );
}

function ActiveQuestion({
  question,
  snapshot,
}: {
  question: QuestionDef;
  snapshot: SessionSnapshot;
}) {
  const state = snapshot.currentQuestionState;
  const voteCount = snapshot.voteCounts[question.id] ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400">
          <span>{question.id}</span>
          <span>·</span>
          <span>{state}</span>
          <span>·</span>
          <span>{voteCount} votes</span>
        </div>
        <h2 className="mt-1 text-3xl font-semibold leading-tight">{question.prompt}</h2>
        {question.presenterNote && (
          <p className="mt-2 text-sm text-neutral-500">{question.presenterNote}</p>
        )}
      </div>

      {question.kind === "text" ? (
        <TextStream responses={snapshot.textResponses[question.id] ?? []} />
      ) : (
        <BarChart
          options={question.options}
          tally={snapshot.tallies[question.id] ?? {}}
          voteCount={voteCount}
        />
      )}
    </div>
  );
}

function BarChart({
  options,
  tally,
  voteCount,
}: {
  options: { id: string; label: string }[];
  tally: Record<string, number>;
  voteCount: number;
}) {
  const ranked = options
    .map((o) => ({ option: o, count: tally[o.id] ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...ranked.map((r) => r.count));

  return (
    <ul className="flex flex-col gap-2.5">
      {ranked.map(({ option, count }) => {
        const pct = voteCount > 0 ? Math.round((count / voteCount) * 100) : 0;
        const w = (count / max) * 100;
        return (
          <li key={option.id}>
            <div className="mb-1 flex items-center justify-between text-base">
              <span className="text-neutral-100">{option.label}</span>
              <span className="tabular-nums text-neutral-400">
                {count} · {pct}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
                style={{ width: `${w}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TextStream({ responses }: { responses: string[] }) {
  if (responses.length === 0) {
    return <p className="text-neutral-500">Waiting for responses…</p>;
  }

  // Group by normalized phrase so duplicates merge into one larger entry.
  // Keep the first occurrence's casing for display.
  const grouped = new Map<string, { display: string; count: number }>();
  for (const r of responses) {
    const key = r.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key) continue;
    const existing = grouped.get(key);
    if (existing) existing.count += 1;
    else grouped.set(key, { display: r.trim(), count: 1 });
  }

  const phrases = Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...phrases.map((p) => p.count));

  // Curated palette — enough variation to feel alive, not so much it screams.
  const palette = [
    "text-neutral-100",
    "text-emerald-300",
    "text-sky-300",
    "text-amber-200",
    "text-rose-300",
    "text-violet-300",
  ];

  return (
    <div className="flex min-h-48 flex-wrap items-center justify-center gap-x-6 gap-y-3 px-2 py-6">
      {phrases.map((p, i) => {
        // sqrt scaling so a 5x phrase doesn't dwarf singletons
        const scale = Math.sqrt(p.count / maxCount);
        const fontSizePx = Math.round(20 + scale * 44); // 20px → 64px
        const opacity = 0.7 + scale * 0.3;
        const color = palette[i % palette.length];
        return (
          <span
            key={p.display}
            className={`font-semibold leading-tight ${color}`}
            style={{ fontSize: `${fontSizePx}px`, opacity }}
            title={p.count > 1 ? `${p.count} mentions` : undefined}
          >
            {p.display}
          </span>
        );
      })}
    </div>
  );
}

function Lobby({ voterUrl }: { voterUrl: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs uppercase tracking-widest text-neutral-400">Lobby</div>
      <h2 className="text-3xl font-semibold leading-tight">Scan the QR to join.</h2>
      <p className="text-neutral-400">
        Press <span className="font-medium text-neutral-100">Open Q0</span> when you&rsquo;re ready
        to kick off.
      </p>
      <p className="break-all text-sm text-neutral-500">{voterUrl}</p>
    </div>
  );
}

function Complete() {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs uppercase tracking-widest text-emerald-400">Voting complete</div>
      <h2 className="text-3xl font-semibold leading-tight">Copy the report and paste into Claude.</h2>
      <p className="text-neutral-400">The button is in the top bar.</p>
    </div>
  );
}
