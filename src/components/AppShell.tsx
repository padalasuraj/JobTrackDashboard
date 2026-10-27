"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { initials, type User } from "@/lib/tracker";

const UserContext = createContext<User | null>(null);
export function useUser() {
  return useContext(UserContext);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);
  useEffect(() => {
    const controller = new AbortController();
    api<{ user: User }>("/api/auth/me", { signal: controller.signal })
      .then((result) => setUser(result.user))
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (err instanceof ApiError && err.status === 401)
          router.replace("/login");
        else setError(err.message);
      });
    return () => controller.abort();
  }, [router, attempt]);
  async function logout() {
    setLoggingOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out.");
      setLoggingOut(false);
    }
  }
  return (
    <UserContext.Provider value={user}>
      <div className="workspace">
        <a className="skip-link" href="#workspace-content">
          Skip to content
        </a>
        {menuOpen && (
          <button
            className="sidebar-scrim"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <aside className={`workspace-sidebar ${menuOpen ? "is-open" : ""}`}>
          <Link className="workspace-brand" href="/">
            <span className="brand-symbol">
              <BriefcaseBusiness size={22} strokeWidth={1.8} />
            </span>
            JobTrack<span className="brand-period">.</span>
          </Link>
          <button
            className="icon-button sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
          <div className="workspace-switch">
            <span className="workspace-avatar">P</span>
            <div>
              <strong>Personal workspace</strong>
              <span>Your job search, organized</span>
            </div>
          </div>
          <p className="nav-caption">WORKSPACE</p>
          <nav className="workspace-nav" aria-label="Main navigation">
            <Link
              className="active"
              aria-current="page"
              href="/applications"
              onClick={() => setMenuOpen(false)}
            >
              <LayoutGrid size={19} /> Applications <ChevronRight size={15} />
            </Link>
          </nav>
          <div className="sidebar-note">
            <span className="note-decoration">↗</span>
            <p>
              Small steps.
              <br />
              <strong>Big next chapter.</strong>
            </p>
            <span>One application at a time.</span>
          </div>
          <div className="sidebar-bottom">
            <div className="privacy-note">
              <ShieldCheck size={15} />
              <span>Private to your account</span>
            </div>
            <div className="workspace-user">
              <span className="user-avatar">
                {initials(user?.name || "You")}
              </span>
              <div>
                <strong>{user?.name || "Your account"}</strong>
                <span title={user?.email}>
                  {user?.email || "Loading workspace…"}
                </span>
              </div>
              <button
                className="icon-button"
                title="Sign out"
                aria-label="Sign out"
                onClick={logout}
                disabled={loggingOut}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>
        <div className="workspace-main">
          <header className="workspace-topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>Applications</strong>
            </div>
            <Link href="/" className="back-to-site">
              JobTrack home <ArrowUpRight size={14} />
            </Link>
          </header>
          <main id="workspace-content" className="workspace-content">
            {error && (
              <div className="error-banner" role="alert">
                {error}
                <button
                  className="text-button"
                  onClick={() => {
                    setError("");
                    setAttempt((a) => a + 1);
                  }}
                >
                  Try again
                </button>
              </div>
            )}
            {user
              ? children
              : !error && (
                  <div className="workspace-loading" role="status">
                    <div className="loading-spinner" />
                    <h2>Opening your workspace</h2>
                    <p className="muted">
                      Getting everything ready for your next move.
                    </p>
                    <p className="muted small">
                      The first visit may take a little longer.
                    </p>
                  </div>
                )}
          </main>
        </div>
      </div>
    </UserContext.Provider>
  );
}
