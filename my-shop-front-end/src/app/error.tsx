"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen grid place-content-center text-center gap-4">
      <h1 className="text-2xl">The shop is temporarily unavailable</h1>
      <button onClick={reset} className="rounded bg-black text-white p-3">
        Try again
      </button>
    </main>
  );
}
