import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

export default async function RemindersPage() {
  const user = await currentUser();
  const reminders = user ? await prisma.reminder.findMany({ where: { userId: user.id }, include: { application: { include: { job: { include: { company: true } } } } }, orderBy: { scheduledAt: "asc" } }) : [];
  return <AppShell><div className="grid"><div className="topbar"><h1>Reminders</h1></div><section className="grid cards">{reminders.map((r) => <div className="card" key={r.id}><h3>{r.message}</h3><p className="muted">{new Date(r.scheduledAt).toLocaleString()} | {r.type} | {r.completed ? "Completed" : "Open"}</p><p>{r.application?.job.company.name} {r.application?.job.title}</p></div>)}</section></div></AppShell>;
}
