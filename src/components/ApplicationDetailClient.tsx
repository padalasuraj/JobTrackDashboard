"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { labelStatus, salaryLabel, statuses } from "@/lib/constants";
import { closingLabel } from "@/lib/insights";

type AppDetail = {
  id: string; status: string; appliedAt?: string | null; progressUrl?: string | null; recruiterUrl?: string | null; notes?: string | null;
  job: { title: string; jobId?: string | null; location?: string | null; salaryMin?: number | null; salaryMax?: number | null; salaryCurrency: string; closingDate?: string | null; applicationUrl?: string | null; jobUrl?: string | null; company: { name: string } };
  resume?: { id: string; name: string } | null; profile?: { id: string; label: string } | null;
  events: { id: string; type: string; description: string; timestamp: string }[];
  interviews: { id: string; round: string; scheduledAt: string; meetingUrl?: string | null; interviewer?: string | null; result?: string | null }[];
  reminders: { id: string; type: string; message: string; scheduledAt: string; completed: boolean }[];
  noteItems: { id: string; body: string; createdAt: string }[];
};

export function ApplicationDetailClient({ application, resumes, profiles }: { application: AppDetail; resumes: { id: string; name: string }[]; profiles: { id: string; label: string }[] }) {
  const router = useRouter();
  const [status, setStatus] = useState(application.status);
  const [message, setMessage] = useState("");

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch(`/api/applications/${application.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setMessage(res.ok ? "Saved" : data.error ?? "Unable to save");
    if (res.ok) router.refresh();
  }

  async function addInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.applicationId = application.id;
    await fetch("/api/interviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    router.refresh();
  }

  async function addReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.applicationId = application.id;
    await fetch("/api/reminders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    router.refresh();
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    await fetch("/api/notes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, applicationId: application.id }) });
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
    router.push("/applications");
  }

  return (
    <div className="grid">
      <div className="topbar"><div><h1>{application.job.company.name}</h1><p className="muted">{application.job.title}</p></div><button className="danger" onClick={remove}>Delete</button></div>
      <section className="panel">
        <div className="form-grid">
          <label>Status<select value={status} onChange={(e) => { setStatus(e.target.value); void patch({ status: e.target.value }); }}>{statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>Resume<select defaultValue={application.resume?.id ?? ""} onChange={(e) => patch({ resumeId: e.target.value || null })}><option value="">No resume</option>{resumes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
          <label>Profile<select defaultValue={application.profile?.id ?? ""} onChange={(e) => patch({ profileId: e.target.value || null })}><option value="">No profile</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
          <label>Progress URL<input defaultValue={application.progressUrl ?? ""} onBlur={(e) => patch({ progressUrl: e.target.value })} /></label>
          <label>Recruiter URL<input defaultValue={application.recruiterUrl ?? ""} onBlur={(e) => patch({ recruiterUrl: e.target.value })} /></label>
          <label>Applied date<input type="datetime-local" defaultValue={application.appliedAt?.slice(0, 16) ?? ""} onBlur={(e) => patch({ appliedAt: e.target.value ? new Date(e.target.value).toISOString() : null })} /></label>
        </div>
        <label>Notes<textarea defaultValue={application.notes ?? ""} onBlur={(e) => patch({ notes: e.target.value })} /></label>
        <p className="toast">{message}</p>
        <div className="row">
          {application.job.jobUrl ? <a className="button" href={application.job.jobUrl} target="_blank">Open Job</a> : null}
          {application.job.applicationUrl ? <a className="button" href={application.job.applicationUrl} target="_blank">Open Application Portal</a> : null}
        </div>
      </section>
      <section className="panel">
        <h2>Details</h2>
        <p><b>Job ID:</b> {application.job.jobId ?? "-"}</p><p><b>Location:</b> {application.job.location ?? "-"}</p><p><b>Package:</b> {salaryLabel(application.job.salaryMin, application.job.salaryMax, application.job.salaryCurrency)}</p><p><b>Closing:</b> {closingLabel(application.job.closingDate ? new Date(application.job.closingDate) : null)}</p><p><b>Status:</b> {labelStatus(application.status)}</p>
      </section>
      <section className="panel"><h2>Timeline</h2>{application.events.map((e) => <p key={e.id}>{new Date(e.timestamp).toLocaleDateString()} - {e.description}</p>)}</section>
      <section className="panel"><h2>Add Interview</h2><form className="form-grid" onSubmit={addInterview}><label>Round<input name="round" required /></label><label>Type<input name="type" /></label><label>Date/time<input type="datetime-local" name="scheduledAt" required onChange={(e) => { e.currentTarget.value; }} /></label><label>Duration minutes<input name="duration" type="number" /></label><label>Meeting link<input name="meetingUrl" /></label><label>Interviewer<input name="interviewer" /></label><button className="primary">Add Interview</button></form>{application.interviews.map((i) => <p key={i.id}>{new Date(i.scheduledAt).toLocaleString()} - {i.round} {i.meetingUrl ? <a href={i.meetingUrl} target="_blank">Open link</a> : null}</p>)}</section>
      <section className="panel"><h2>Add Reminder</h2><form className="form-grid" onSubmit={addReminder}><label>Type<select name="type"><option value="FOLLOW_UP">Follow-up</option><option value="APPLICATION_DEADLINE">Application deadline</option><option value="INTERVIEW">Interview</option><option value="OA">OA</option><option value="CUSTOM">Custom</option></select></label><label>Date/time<input type="datetime-local" name="scheduledAt" required /></label><label>Message<input name="message" required /></label><button className="primary">Add Reminder</button></form>{application.reminders.map((r) => <p key={r.id}>{new Date(r.scheduledAt).toLocaleString()} - {r.message} {r.completed ? "(done)" : ""}</p>)}</section>
      <section className="panel"><h2>Notes</h2><form onSubmit={addNote} className="row"><input name="body" placeholder="Add note" required /><button>Add Note</button></form>{application.noteItems.map((n) => <p key={n.id}>{n.body}</p>)}</section>
    </div>
  );
}
