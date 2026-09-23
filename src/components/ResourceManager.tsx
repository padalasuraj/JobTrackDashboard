"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Field = { name: string; label: string; type?: string; required?: boolean; options?: [string, string][] };

export function ResourceManager({ title, endpoint, fields }: { title: string; endpoint: string; fields: Field[] }) {
  const [items, setItems] = useState<Record<string, string | boolean>[]>([]);
  const [message, setMessage] = useState("");
  const key = endpoint.replace("/", "");
  const load = useCallback(async () => {
    const res = await fetch(`/api${endpoint}`);
    const data = await res.json();
    setItems(data[key] ?? []);
  }, [endpoint, key]);

  useEffect(() => { void load(); }, [load]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: Record<string, FormDataEntryValue | boolean> = Object.fromEntries(new FormData(event.currentTarget).entries());
    for (const field of fields) {
      if (field.type === "checkbox") payload[field.name] = payload[field.name] === "on";
    }
    const res = await fetch(`/api${endpoint}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setMessage(res.ok ? "Saved" : data.error ?? "Unable to save");
    if (res.ok) {
      event.currentTarget.reset();
      await load();
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api${endpoint}/${id}`, { method: "DELETE" });
    await load();
  }
  return (
    <div className="grid">
      <div className="topbar"><h1>{title}</h1></div>
      <form className="panel" onSubmit={submit}>
        <div className="form-grid">
          {fields.map((field) => <label key={field.name}>{field.label}{field.options ? <select name={field.name}>{field.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> : field.type === "textarea" ? <textarea name={field.name} required={field.required} /> : <input name={field.name} type={field.type ?? "text"} required={field.required} />}</label>)}
        </div>
        <button className="primary" style={{ marginTop: "1rem" }}>Save</button>
        <p className="toast">{message}</p>
      </form>
      <section className="grid cards">
        {items.map((item) => <div className="card" key={String(item.id)}><h3>{String(item.name ?? item.label ?? item.message ?? item.round)}</h3><p className="muted">{Object.entries(item).filter(([k]) => !["id", "userId", "passwordHash"].includes(k)).slice(0, 6).map(([k, v]) => `${k}: ${String(v ?? "-")}`).join(" | ")}</p><button className="danger" onClick={() => remove(String(item.id))}>Delete</button></div>)}
      </section>
    </div>
  );
}
