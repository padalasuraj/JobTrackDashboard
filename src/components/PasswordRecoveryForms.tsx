"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import "./public.css";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/config", { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEnabled(data.passwordResetEnabled === true);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Unable to connect. Refresh this page in a moment to try again.",
          );
      });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    const payload = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          data?.error ?? "Unable to send a reset link. Please try again.",
        );
        return;
      }
      setMessage(
        data?.message ??
          "If an account exists for this email, you’ll receive a link to reset its password.",
      );
    } catch {
      setError(
        "Unable to reach JobTrack. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="public-recovery">
      <Brand />
      <section className="public-recovery-card">
        <div className="public-step-icon">
          <Mail size={21} aria-hidden="true" />
        </div>
        <h1>Let’s get you back in.</h1>
        <p>Enter your account email and we’ll help you reset your password.</p>
        {enabled === false ? (
          <div className="public-auth-error" role="status">
            Password reset emails aren’t available right now. If you signed up
            with Google, use Google to sign in.
          </div>
        ) : (
          <form onSubmit={submit} className="public-recovery-form">
            <label htmlFor="recovery-email">
              Email address
              <input
                name="email"
                id="recovery-email"
                type="email"
                placeholder="you@gmail.com"
                autoComplete="email"
                required
                disabled={pending}
              />
            </label>
            <button
              className="public-button public-button-primary public-auth-submit"
              disabled={pending || enabled !== true}
            >
              {pending ? (
                <>
                  <LoaderCircle
                    size={16}
                    className="public-spin"
                    aria-hidden="true"
                  />
                  Sending reset link…
                </>
              ) : (
                <>
                  Send reset link <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        )}
        {message && (
          <p
            className="public-auth-success"
            role="status"
            style={{ marginTop: 19 }}
          >
            {message}
          </p>
        )}
        {error && (
          <p
            className="public-auth-error"
            role="alert"
            style={{ marginTop: 19 }}
          >
            {error}
          </p>
        )}
        <Link className="public-recovery-back" href="/login">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const payload = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    if (new TextEncoder().encode(String(payload.password ?? "")).length > 72) {
      setError(
        "Your password is too long. Please shorten it, especially if it includes emojis or accented characters.",
      );
      setPending(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, token }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          data?.error ??
            "This reset link may have expired. Request a new link to try again.",
        );
        return;
      }
      setComplete(true);
    } catch {
      setError(
        "Unable to reach JobTrack. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="public-recovery">
      <Brand />
      <section className="public-recovery-card">
        <div className="public-step-icon">
          <KeyRound size={21} aria-hidden="true" />
        </div>
        <h1>{complete ? "You’re ready to sign in." : "A fresh start."}</h1>
        {complete ? (
          <>
            <p>
              Your password has been updated. Sign in with your new password to
              open your workspace.
            </p>
            <Link
              className="public-button public-button-primary public-auth-submit"
              href="/login"
            >
              Continue to sign in <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </>
        ) : !token ? (
          <>
            <p>
              This link is missing its reset code. Request a new link to
              continue.
            </p>
            <Link
              className="public-button public-button-primary public-auth-submit"
              href="/forgot-password"
            >
              Request a reset link <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <p>
              Choose a new password with at least 10 characters to secure your
              workspace.
            </p>
            <form onSubmit={submit} className="public-recovery-form">
              <label htmlFor="new-password">
                New password
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={72}
                  placeholder="Create a strong password"
                  required
                  disabled={pending}
                />
              </label>
              {error && (
                <div className="public-auth-error" role="alert">
                  {error}
                </div>
              )}
              <button
                className="public-button public-button-primary public-auth-submit"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <LoaderCircle
                      className="public-spin"
                      size={16}
                      aria-hidden="true"
                    />
                    Updating password…
                  </>
                ) : (
                  <>
                    Update password <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
        <Link className="public-recovery-back" href="/login">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

export function VerifyEmailPanel() {
  return (
    <main className="public-recovery">
      <Brand />
      <section className="public-recovery-card">
        <div className="public-step-icon">
          <ShieldCheck size={21} aria-hidden="true" />
        </div>
        <h1>Your workspace is ready.</h1>
        <p>
          You can sign in with your email and password, or use Google if you
          created your account with Google.
        </p>
        <Link
          className="public-button public-button-primary public-auth-submit"
          href="/login"
        >
          Continue to sign in <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
