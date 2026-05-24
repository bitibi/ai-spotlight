import { NextResponse } from "next/server";
import { getOrCreateParticipantId } from "@/lib/participant";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id: participantId } = await getOrCreateParticipantId();
  const store = getStore();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, reason: "bad body" }, { status: 400 });
  }
  const b = body as { questionId?: unknown; optionIds?: unknown; text?: unknown };
  if (typeof b.questionId !== "string") {
    return NextResponse.json({ ok: false, reason: "missing questionId" }, { status: 400 });
  }

  if (typeof b.text === "string") {
    const result = store.submitText(participantId, b.questionId, b.text);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }
  if (Array.isArray(b.optionIds) && b.optionIds.every((x) => typeof x === "string")) {
    const result = store.submitVote(participantId, b.questionId, b.optionIds as string[]);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }
  return NextResponse.json({ ok: false, reason: "need optionIds[] or text" }, { status: 400 });
}
