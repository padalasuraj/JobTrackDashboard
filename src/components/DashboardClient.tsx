"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { labelStatus, salaryLabel, statuses } from "@/lib/constants";
import { closingLabel } from "@/lib/insights";

type App = {
  id: string;
  status: string;
  appliedAt?: string;
  job: { title: string; jobId?: string; location?: string; salaryMin?: number; salaryMax?: number; salaryCurrency: string; closingDate?: string; company: { name: string } };
  resume?: { name: string } | null;
  interviews: { scheduledAt: string; round: string }[];
};

type DashboardData = {
  totals: Record<string, number>;
  counts: Record<string, number>;
  attention: { applicationId: string; message: string }[];
  upcomingInterviews: Record<string, string>[];
  applications: App[];
};

export function DashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard").then(async (res) => {
      const body = await res.json();
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok || !body.totals) {
        setError(body.error ?? "Unable to load dashboard");
        return;
      }
      setData(body);
    }).catch(() => setError("Unable to load dashboard"));
  }, [router]);

  if (error) return <div className="panel">{error}</div>;
  if (!data) return <div className="panel">Loading dashboard...</div>;
  const cards = [
    ["Total Applications", data.totals.total, ""],
    ["Applied", data.counts.APPLIED, "APPLIED"],
    ["In Progress", data.counts.IN_PROGRESS, "IN_PROGRESS"],
    ["Interviews", data.totals.interviews, "TECHNICAL_INTERVIEW"],
    ["Selected", data.counts.SELECTED, "SELECTED"],
    ["Offers", data.counts.OFFER, "OFFER"],
    ["Rejected", data.counts.REJECTED, "REJECTED"],
    ["Saved", data.counts.SAVED, "SAVED"],
    ["Closing Soon", data.totals.closingSoon, ""],
    ["Needs Action", data.totals.needsAction, ""]
  ];
  return (
    <div className="grid">
      <div className="topbar">
        <div><h1>Dashboard</h1><p className="muted">Live overview of your job pipeline.</p></div>
        <Link className="button primary" href="/add">Add Job</Link>
      </div>
      <div className="grid cards">
        {cards.map(([title, value, filter]) => <Link className="card" key={title} href={filter ? `/applications?status=${filter}` : "/applications"}><span className="muted">{title}</span><div className="stat">{value}</div></Link>)}
      </div>
      <section className="panel">
        <h2>{data.attention.length} things need your attention</h2>
        {data.attention.length ? data.attention.map((item) => <p key={item.applicationId + item.message}><Link href={`/applications/${item.applicationId}`}>{item.message}</Link></p>) : <p className="muted">No urgent actions right now.</p>}
      </section>
      <section className="panel">
        <h2>Upcoming interviews</h2>
        {data.upcomingInterviews.length ? data.upcomingInterviews.map((item) => <p key={item.id}><Link href={`/applications/${item.applicationId}`}>{new Date(item.scheduledAt).toLocaleString()} - {item.company} {item.round}</Link></p>) : <p className="muted">No upcoming interviews.</p>}
      </section>
      <ApplicationTable applications={data.applications} />
    </div>
  );
}

export function ApplicationTable({ applications }: { applications: App[] }) {
  return (
    <section className="panel">
      <h2>Applications</h2>
      <div className="table-wrap desktop-table">
        <table>
          <thead><tr><th>Company</th><th>Role</th><th>Job ID</th><th>Location</th><th>Package</th><th>Status</th><th>Applied</th><th>Closing</th><th>Next Interview</th><th>Resume</th><th>Actions</th></tr></thead>
          <tbody>{applications.map((app) => <tr key={app.id}>
            <td>{app.job.company.name}</td><td><Link href={`/applications/${app.id}`}>{app.job.title}</Link></td><td>{app.job.jobId ?? "-"}</td><td>{app.job.location ?? "-"}</td><td>{salaryLabel(app.job.salaryMin, app.job.salaryMax, app.job.salaryCurrency)}</td><td>{labelStatus(app.status)}</td><td>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}</td><td>{closingLabel(app.job.closingDate ? new Date(app.job.closingDate) : null)}</td><td>{app.interviews[0] ? new Date(app.interviews[0].scheduledAt).toLocaleString() : "-"}</td><td>{app.resume?.name ?? "-"}</td><td><Link className="button" href={`/applications/${app.id}`}>Open</Link></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="grid mobile-list">
        {applications.map((app) => <Link className="card" href={`/applications/${app.id}`} key={app.id}><b>{app.job.company.name}</b><span>{app.job.title}</span><span className="pill">{labelStatus(app.status)}</span><span className="muted">{closingLabel(app.job.closingDate ? new Date(app.job.closingDate) : null)}</span></Link>)}
      </div>
    </section>
  );
}

export function Filters({ initialStatus }: { initialStatus?: string }) {
  const [params, setParams] = useState({ status: initialStatus ?? "", search: "", salary: "any", closing: "", company: "", role: "", location: "" });
  function apply() {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    window.location.href = `/applications?${q.toString()}`;
  }
  return (
    <section className="panel">
      <div className="form-grid">
        <label>Search<input value={params.search} onChange={(e) => setParams({ ...params, search: e.target.value })} /></label>
        <label>Status<select value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value })}><option value="">Any</option>{statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Company<input value={params.company} onChange={(e) => setParams({ ...params, company: e.target.value })} /></label>
        <label>Role<input value={params.role} onChange={(e) => setParams({ ...params, role: e.target.value })} /></label>
        <label>Location<input value={params.location} onChange={(e) => setParams({ ...params, location: e.target.value })} /></label>
        <label>Package<select value={params.salary} onChange={(e) => setParams({ ...params, salary: e.target.value })}><option value="any">Any</option><option value="under5">Under 5 LPA</option><option value="5to8">5-8 LPA</option><option value="8to12">8-12 LPA</option><option value="12to20">12-20 LPA</option><option value="over20">20+ LPA</option><option value="undisclosed">Not disclosed</option></select></label>
        <label>Closing<select value={params.closing} onChange={(e) => setParams({ ...params, closing: e.target.value })}><option value="">Any</option><option value="today">Closing today</option><option value="threeDays">Within 3 days</option><option value="week">This week</option><option value="month">This month</option><option value="passed">Deadline passed</option><option value="none">No deadline</option></select></label>
      </div>
      <div className="row" style={{ marginTop: "1rem" }}><button className="primary" onClick={apply}>Apply filters</button><Link className="button" href="/applications">Clear filters</Link></div>
    </section>
  );
}
