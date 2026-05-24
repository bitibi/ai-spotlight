export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-full border border-neutral-800 px-3 py-1 text-xs uppercase tracking-widest text-neutral-400">
        Practically AI
      </div>
      <h1 className="text-4xl font-semibold leading-tight">AI Spotlight</h1>
      <p className="text-neutral-400">
        The vote opens when the presenter starts the segment. Hang tight — your phone will pick it up automatically.
      </p>
      <div className="mt-8 h-2 w-16 animate-pulse rounded-full bg-neutral-700" />
    </main>
  );
}
