"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Working...");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Something went wrong");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="panel" onSubmit={submit} style={{ maxWidth: 460, margin: "8vh auto" }}>
      <h1>{mode === "login" ? "Welcome back" : "Create your JobTrack account"}</h1>
      <p className="muted">Track every application, deadline, interview, reminder, resume and profile in one place.</p>
      <div className="grid">
        {mode === "register" && <label>Name<input name="name" required minLength={2} /></label>}
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required minLength={8} /></label>
        <button className="primary">{mode === "login" ? "Log in" : "Register"}</button>
        <a className="button" href="/api/auth/google">Continue with Google</a>
      </div>
      <p className="toast">{message}</p>
      <p className="muted">
        {mode === "login" ? "No account yet? " : "Already registered? "}
        <Link className="button" href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Register" : "Log in"}</Link>
        {mode === "login" ? <Link className="button" href="/forgot-password">Forgot password</Link> : null}
      </p>
    </form>
  );
}
