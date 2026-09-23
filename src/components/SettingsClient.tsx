"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsClient({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!payload.password) delete payload.password;
    const res = await fetch("/api/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setMessage(res.ok ? "Account updated" : data.error ?? "Unable to update");
    router.refresh();
  }
  async function remove() {
    if (!confirm("Delete your account and all JobTrack data?")) return;
    await fetch("/api/account", { method: "DELETE" });
    router.push("/register");
  }
  return (
    <div className="grid">
      <div className="topbar"><h1>Settings</h1></div>
      <form className="panel" onSubmit={save}>
        <div className="form-grid">
          <label>Name<input name="name" defaultValue={name} required /></label>
          <label>Email<input value={email} disabled /></label>
          <label>New password<input name="password" type="password" minLength={8} /></label>
        </div>
        <button className="primary" style={{ marginTop: "1rem" }}>Save account</button>
        <p className="toast">{message}</p>
      </form>
      <section className="panel">
        <h2>Danger zone</h2>
        <p className="muted">Deleting your account removes your profiles, resumes, applications, interviews, reminders and notes.</p>
        <button className="danger" onClick={remove}>Delete account</button>
      </section>
    </div>
  );
}
