import { cookies } from "next/headers";
import { nanoid } from "nanoid";

const COOKIE_NAME = "ai_spotlight_pid";

export async function getOrCreateParticipantId(): Promise<{
  id: string;
  created: boolean;
}> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return { id: existing, created: false };
  const id = nanoid(16);
  jar.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return { id, created: true };
}

export async function getParticipantId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}
