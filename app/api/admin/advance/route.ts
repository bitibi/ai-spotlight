import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!isAdminAuthorized(key)) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }
  const result = getStore().advance();
  return NextResponse.json(result);
}
