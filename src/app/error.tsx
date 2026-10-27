"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="workspace-loading" style={{ padding: 30 }}>
      <span className="eyebrow">JOBTRACK</span>
      <h1 style={{ fontSize: 28 }}>Let’s try that again.</h1>
      <p className="muted">
        The page couldn’t load. Give it another try in a moment.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
