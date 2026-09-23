"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setMessage(data.message ?? (res.ok ? "Check your email." : "Unable to send reset link"));
  }

  return (
    <form className="panel" onSubmit={submit} style={{ maxWidth: 460, margin: "8vh auto" }}>
      <h1>Reset your password</h1>
      <p className="muted">Enter your account email and JobTrack will send a reset link.</p>
      <label>Email<input name="email" type="email" required /></label>
      <button className="primary" style={{ marginTop: "1rem" }}>Send reset link</button>
      <p className="toast">{message}</p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, token: params.get("token") })
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error ?? "Unable to reset password");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="panel" onSubmit={submit} style={{ maxWidth: 460, margin: "8vh auto" }}>
      <h1>Choose a new password</h1>
      <label>New password<input name="password" type="password" required minLength={8} /></label>
      <button className="primary" style={{ marginTop: "1rem" }}>Reset password</button>
      <p className="toast">{message}</p>
    </form>
  );
}

export function VerifyEmailPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState(params.get("error") ? "Verification link is invalid or expired." : "Verifying...");

  useEffect(() => {
    const token = params.get("token");
    if (!token || params.get("error")) return;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token })
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) return setMessage(data.error ?? "Unable to verify email");
      router.push("/dashboard?verified=1");
      router.refresh();
    }).catch(() => setMessage("Unable to verify email"));
  }, [params, router]);

  return (
    <section className="panel" style={{ maxWidth: 560, margin: "8vh auto" }}>
      <h1>Email verification</h1>
      <p className="toast">{message}</p>
    </section>
  );
}
