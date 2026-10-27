"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Link2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import "./public.css";

type AuthConfig = { googleEnabled: boolean; passwordResetEnabled: boolean };

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.93a6 6 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.51 3.83 1.52l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59A5.99 5.99 0 0 1 12 5.95Z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const register = mode === "register";
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [configFailed, setConfigFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setConfigFailed(false);
    fetch("/api/auth/config", { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setConfig({
          googleEnabled: data.googleEnabled === true,
          passwordResetEnabled: data.passwordResetEnabled === true,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfigFailed(true);
      });
    return () => controller.abort();
  }, [attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const payload = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    if (
      register &&
      new TextEncoder().encode(String(payload.password ?? "")).length > 72
    ) {
      setMessage(
        "Your password is too long. Please shorten it, especially if it includes emojis or accented characters.",
      );
      setPending(false);
      return;
    }
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(
          typeof data?.error === "string"
            ? data.error
            : "Unable to connect to your workspace. Please try again shortly.",
        );
        return;
      }
      if (!data?.user) {
        setMessage("We couldn’t finish signing you in. Please try again.");
        return;
      }
      router.push("/applications");
      router.refresh();
    } catch {
      setMessage(
        "Unable to reach JobTrack. Check your connection and try again. The server may need a moment to wake up.",
      );
    } finally {
      setPending(false);
    }
  }

  const oauthError = params.get("error");
  const oauthMessage =
    oauthError === "existing_email"
      ? "There’s already an email and password account for this address. Sign in using your password."
      : oauthError === "google_unavailable"
        ? "Google sign-in isn’t available right now. You can use your email and password below."
        : "Google sign-in couldn’t be completed. Try again or sign in with your email and password.";
  return (
    <main className="public-auth">
      <aside className="public-auth-story">
        <Brand light />
        <div className="public-auth-story-content">
          <div className="public-auth-kicker">
            <span /> YOUR NEXT CHAPTER STARTS HERE
          </div>
          <h1>
            A little more organized.
            <br />
            <span>A lot more focused.</span>
          </h1>
          <p>
            Give your job search a home. Keep the details close and your next
            step clear.
          </p>
          <div className="public-auth-mini-card">
            <span className="public-auth-mini-icon">
              <Link2 size={21} aria-hidden="true" />
            </span>
            <div>
              <strong>Every opportunity, connected.</strong>
              <p>
                Company. Status. The right links.
                <br />
                Right where you left them.
              </p>
            </div>
            <span className="public-auth-card-check">
              <Check size={15} aria-hidden="true" />
            </span>
          </div>
        </div>
        <div className="public-auth-story-footer">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>A private workspace for your applications.</span>
        </div>
      </aside>
      <section className="public-auth-main">
        <div className="public-auth-mobile-brand">
          <Brand />
        </div>
        <Link className="public-auth-back" href="/">
          <ArrowLeft size={15} aria-hidden="true" /> Back to home
        </Link>
        <div className="public-auth-form-wrap">
          <span className="public-mini-eyebrow">
            {register ? "LET’S GET YOU STARTED" : "YOUR WORKSPACE AWAITS"}
          </span>
          <h2>
            {register ? "Make room for what’s next." : "Good to see you again."}
          </h2>
          <p className="public-auth-intro">
            {register
              ? "Create your account and bring your job search together."
              : "Sign in to pick up where you left off."}
          </p>
          {config?.googleEnabled ? (
            <a className="public-google-button" href="/api/auth/google">
              <GoogleIcon /> Continue with Google
            </a>
          ) : (
            <button
              className="public-google-button"
              type="button"
              disabled
              aria-describedby="google-availability"
            >
              <GoogleIcon />
              {!config && !configFailed
                ? "Checking Google sign-in…"
                : "Continue with Google"}
            </button>
          )}
          {!config?.googleEnabled && (
            <p className="public-auth-availability" id="google-availability">
              {configFailed ? (
                <>
                  We couldn’t check Google sign-in.{" "}
                  <button
                    type="button"
                    className="public-inline-button"
                    onClick={() => setAttempt((v) => v + 1)}
                  >
                    Try again
                  </button>{" "}
                  or use email below.
                </>
              ) : config ? (
                "Google sign-in isn’t available right now. You can use email below."
              ) : (
                "The server may take a moment to connect."
              )}
            </p>
          )}
          <div className="public-auth-divider">
            <span />
            or continue with email
            <span />
          </div>
          <form onSubmit={submit} className="public-auth-form">
            {register && (
              <label htmlFor="auth-name">
                Full name
                <input
                  id="auth-name"
                  name="name"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={pending}
                />
              </label>
            )}
            <label htmlFor="auth-email">
              Email address
              <input
                id="auth-email"
                name="email"
                type="email"
                placeholder="you@gmail.com"
                autoComplete="email"
                required
                maxLength={254}
                disabled={pending}
              />
            </label>
            <label htmlFor="auth-password">
              <span className="public-password-label">
                Password
                {!register && config?.passwordResetEnabled && (
                  <Link href="/forgot-password">Forgot password?</Link>
                )}
              </span>
              <span className="public-password-input">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    register
                      ? "Create a strong password"
                      : "Enter your password"
                  }
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                  minLength={register ? 10 : undefined}
                  maxLength={72}
                  disabled={pending}
                  aria-describedby={register ? "password-hint" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={17} aria-hidden="true" />
                  ) : (
                    <Eye size={17} aria-hidden="true" />
                  )}
                </button>
              </span>
            </label>
            {register && (
              <p id="password-hint" className="public-password-hint">
                Use at least 10 characters. Your Gmail address works here too.
              </p>
            )}
            {(message || oauthError) && (
              <div className="public-auth-error" role="alert">
                {message || oauthMessage}
              </div>
            )}
            <button
              className="public-button public-button-primary public-auth-submit"
              type="submit"
              disabled={pending}
            >
              {pending ? (
                <>
                  <LoaderCircle
                    className="public-spin"
                    size={17}
                    aria-hidden="true"
                  />{" "}
                  {register ? "Creating your account…" : "Signing you in…"}
                </>
              ) : (
                <>
                  {register ? "Create account" : "Sign in"}{" "}
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
          <p className="public-auth-switch">
            {register ? "Already have an account?" : "New to JobTrack?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="public-auth-fineprint">
            <ShieldCheck size={14} aria-hidden="true" /> Your applications stay
            in your account. <Link href="/privacy">Privacy</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
