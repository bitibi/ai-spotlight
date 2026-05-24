import { QUESTIONS } from "./questions";
import type { SessionSnapshot } from "./types";

const PROMPT_HEADER = `# AI Spotlight — Audience Report

You are generating a slide deck for the **Practically AI** monthly meetup, recapping the last month's AI news. The audience just voted on what they want to see and what aesthetic they want. Use the news pile already loaded into this conversation; weight your selection by the preferences below.

Constraints:
- ~5–7 slides, presentable in ~6 minutes.
- Lead with the highest-weighted labs from Q1 (in roughly that order).
- Weight the story mix toward the highest-ranked categories from Q2.
- Apply the Q4 design choice consistently across every slide — that is the single non-negotiable.
- End with an "Audience Hot Takes" slide using the Q3 free-text responses verbatim (cleaning typos only).

`;

export function buildReport(snapshot: SessionSnapshot): string {
  const lines: string[] = [PROMPT_HEADER.trim(), ""];

  lines.push(`Participants: ${snapshot.participantCount}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const q of QUESTIONS) {
    if (!q.feedsReport) continue;
    const voteCount = snapshot.voteCounts[q.id] ?? 0;
    lines.push(`## ${q.prompt}`);
    lines.push("");

    if (q.kind === "text") {
      const responses = snapshot.textResponses[q.id] ?? [];
      if (responses.length === 0) {
        lines.push("_(no responses)_");
      } else {
        lines.push(`Responses: ${responses.length}`);
        lines.push("");
        for (const r of responses) {
          lines.push(`- "${r.replace(/"/g, '\\"')}"`);
        }
      }
    } else {
      const tally = snapshot.tallies[q.id] ?? {};
      const ranked = q.options
        .map((o) => ({ option: o, count: tally[o.id] ?? 0 }))
        .sort((a, b) => b.count - a.count);
      const denom = q.kind === "single" ? voteCount : voteCount; // share of voters
      lines.push(`Voters: ${voteCount}${q.kind === "multi" ? ` (pick up to ${q.maxPicks})` : ""}`);
      lines.push("");
      for (const { option, count } of ranked) {
        const pct = denom > 0 ? Math.round((count / denom) * 100) : 0;
        lines.push(`- **${option.label}** — ${pct}% (${count}/${denom || 0})`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}
