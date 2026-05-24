import { isAdminAuthorized } from "@/lib/admin";
import { buildReport } from "@/lib/report";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!isAdminAuthorized(key)) {
    return new Response("forbidden", { status: 403 });
  }
  const md = buildReport(getStore().snapshot());
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ai-spotlight-report.md"',
    },
  });
}
