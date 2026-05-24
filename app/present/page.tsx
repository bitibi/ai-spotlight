import { headers } from "next/headers";
import QRCode from "qrcode";
import PresenterApp from "@/components/PresenterApp";
import { isAdminAuthorized } from "@/lib/admin";
import { QUESTIONS } from "@/lib/questions";

export const dynamic = "force-dynamic";

export default async function PresentPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key = "" } = await searchParams;
  if (!isAdminAuthorized(key)) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Presenter view</h1>
          <p className="mt-2 text-neutral-400">
            Append <code className="rounded bg-neutral-900 px-1.5 py-0.5">?key=…</code> to the URL
            with the admin key.
          </p>
        </div>
      </main>
    );
  }

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const voterUrl = `${protocol}://${host}/`;

  const qrDataUrl = await QRCode.toDataURL(voterUrl, {
    margin: 1,
    width: 480,
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });

  return (
    <PresenterApp
      questions={QUESTIONS}
      adminKey={key}
      voterUrl={voterUrl}
      qrDataUrl={qrDataUrl}
    />
  );
}
