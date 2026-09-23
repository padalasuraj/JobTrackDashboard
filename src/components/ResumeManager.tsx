"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Resume = {
  id: string;
  name: string;
  targetRole?: string | null;
  version: string;
  fileName?: string | null;
  sizeBytes?: number | null;
  description?: string | null;
  isDefault: boolean;
  updatedAt: string;
};

export function ResumeManager() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/resumes");
    const data = await res.json();
    setResumes(data.resumes ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Uploading...");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/resumes/upload", { method: "POST", body: form });
    const data = await res.json();
    setMessage(res.ok ? "Resume uploaded" : data.error ?? "Unable to upload resume");
    if (res.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  async function setDefault(id: string) {
    await fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isDefault: true })
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this resume?")) return;
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid">
      <div className="topbar"><h1>Resume Management</h1></div>
      <form className="panel" onSubmit={submit}>
        <div className="form-grid">
          <label>Resume name<input name="name" required /></label>
          <label>Target role<input name="targetRole" /></label>
          <label>Version<input name="version" defaultValue="1.0" /></label>
          <label>File<input name="file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required /></label>
          <label>Description<textarea name="description" /></label>
          <label className="row"><input name="isDefault" type="checkbox" /> Mark default</label>
        </div>
        <button className="primary" style={{ marginTop: "1rem" }}>Upload resume</button>
        <p className="toast">{message}</p>
      </form>
      <section className="grid cards">
        {resumes.map((resume) => (
          <div className="card" key={resume.id}>
            <h3>{resume.name} {resume.isDefault ? <span className="pill">Default</span> : null}</h3>
            <p className="muted">{resume.targetRole ?? "No target role"} | v{resume.version} | {resume.fileName ?? "No file"}</p>
            <p className="muted">{resume.sizeBytes ? `${Math.round(resume.sizeBytes / 1024)} KB` : ""}</p>
            <div className="row">
              {resume.fileName ? <a className="button" href={`/api/resumes/${resume.id}/download`}>Download</a> : null}
              {!resume.isDefault ? <button onClick={() => setDefault(resume.id)}>Make default</button> : null}
              <button className="danger" onClick={() => remove(resume.id)}>Delete</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
