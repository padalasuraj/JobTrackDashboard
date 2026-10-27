import Link from "next/link";

export default function NotFound() {
  return (
    <main className="workspace-loading" style={{ padding: 30 }}>
      <span className="eyebrow">JOBTRACK · 404</span>
      <h1 style={{ fontSize: 32, letterSpacing: -1 }}>A little off track.</h1>
      <p className="muted">
        We couldn’t find that page. Your workspace is right this way.
      </p>
      <Link className="button primary" href="/">
        Back to home
      </Link>
    </main>
  );
}
