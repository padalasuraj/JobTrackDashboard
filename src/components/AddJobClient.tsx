"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { workModes } from "@/lib/constants";

type Draft = Record<string, string | number | null | string[]>;

const fields = [
  ["company", "Company"],
  ["title", "Role"],
  ["jobId", "Job ID"],
  ["location", "Location"],
  ["salaryMin", "Salary min"],
  ["salaryMax", "Salary max"],
  ["experience", "Experience"],
  ["employmentType", "Employment type"],
  ["skills", "Skills"],
  ["closingDate", "Closing date"],
  ["jobUrl", "Job URL"],
  ["applicationUrl", "Application URL"],
  ["companyUrl", "Company URL"]
];

export function AddJobClient() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<Draft>({ company: "", title: "", workMode: "UNKNOWN", salaryCurrency: "INR" });
  const [message, setMessage] = useState("");
  const [jobId, setJobId] = useState("");

  async function fetchJob() {
    setMessage("Fetching job page...");
    const res = await fetch("/api/jobs/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error ?? "Unable to import");
    setDraft({ ...data, company: data.company || "", title: data.title || "", jobUrl: data.jobUrl || url, applicationUrl: data.applicationUrl || url });
    setMessage(data.extractionNotes?.length ? data.extractionNotes.join(" ") : "Job extracted. Review and edit before saving.");
  }

  async function saveJob(applied: boolean) {
    setMessage("Saving...");
    const res = await fetch("/api/jobs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error ?? "Unable to save job");
    setJobId(data.job.id);
    if (applied) {
      const appRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: data.job.id, status: "APPLIED", appliedAt: new Date().toISOString() })
      });
      const app = await appRes.json();
      if (!appRes.ok) return setMessage(app.error ?? "Job saved, but application could not be created");
      router.push(`/applications/${app.application.id}`);
    } else {
      setMessage("Job saved.");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void saveJob(false);
  }

  return (
    <div className="grid">
      <div className="topbar"><h1>Add / Import Job</h1></div>
      <section className="panel">
        <div className="row">
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste job application URL" />
          <button className="primary" onClick={fetchJob} type="button">Fetch Job</button>
        </div>
        <p className="toast">{message}</p>
      </section>
      <form className="panel" onSubmit={submit}>
        <h2>Review job details</h2>
        <div className="form-grid">
          {fields.map(([key, label]) => (
            <label key={key}>{label}<input type={key.includes("Date") ? "datetime-local" : "text"} value={(draft[key] as string | number | null) ?? ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>
          ))}
          <label>Work mode<select value={(draft.workMode as string) ?? "UNKNOWN"} onChange={(event) => setDraft({ ...draft, workMode: event.target.value })}>{workModes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        </div>
        <label>Description<textarea value={(draft.description as string) ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <div className="row" style={{ marginTop: "1rem" }}>
          <button className="primary" type="submit">Save Job</button>
          <button type="button" onClick={() => saveJob(true)}>I Applied</button>
          {draft.jobUrl ? <a className="button" href={String(draft.jobUrl)} target="_blank">View Job</a> : null}
          {jobId ? <a className="button" href={`/add?job=${jobId}`}>Saved</a> : null}
        </div>
      </form>
    </div>
  );
}
