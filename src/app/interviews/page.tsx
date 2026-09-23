import { AppShell } from "@/components/AppShell";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InterviewsPage() {
  const user = await currentUser();
  const interviews = user ? await prisma.interview.findMany({ where: { application: { userId: user.id } }, include: { application: { include: { job: { include: { company: true } } } } }, orderBy: { scheduledAt: "asc" } }) : [];
  return <AppShell><div className="grid"><div className="topbar"><h1>Interview Tracking</h1></div><section className="grid cards">{interviews.map((i) => <div className="card" key={i.id}><h3>{i.application.job.company.name} - {i.round}</h3><p className="muted">{new Date(i.scheduledAt).toLocaleString()}</p><p>{i.application.job.title}</p>{i.meetingUrl ? <a className="button" href={i.meetingUrl} target="_blank">Open meeting</a> : null}</div>)}</section></div></AppShell>;
}
