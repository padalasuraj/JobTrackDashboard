import { NextRequest } from "next/server";
import { format, startOfMonth } from "date-fns";
import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { job: { include: { company: true } }, resume: true, events: true, interviews: true }
  });
  const byStatus = new Map<string, number>();
  const byCompany = new Map<string, number>();
  const byRole = new Map<string, number>();
  const byResume = new Map<string, number>();
  const byMonth = new Map<string, number>();
  for (const app of applications) {
    byStatus.set(app.status, (byStatus.get(app.status) ?? 0) + 1);
    byCompany.set(app.job.company.name, (byCompany.get(app.job.company.name) ?? 0) + 1);
    byRole.set(app.job.title, (byRole.get(app.job.title) ?? 0) + 1);
    byResume.set(app.resume?.name ?? "No resume", (byResume.get(app.resume?.name ?? "No resume") ?? 0) + 1);
    byMonth.set(format(startOfMonth(app.createdAt), "MMM yyyy"), (byMonth.get(format(startOfMonth(app.createdAt), "MMM yyyy")) ?? 0) + 1);
  }
  const interviewCount = applications.reduce((sum, app) => sum + app.interviews.length, 0);
  return ok({
    total: applications.length,
    interviewConversion: applications.length ? Math.round((interviewCount / applications.length) * 100) : 0,
    rejected: byStatus.get("REJECTED") ?? 0,
    selected: byStatus.get("SELECTED") ?? 0,
    offers: byStatus.get("OFFER") ?? 0,
    byStatus: Array.from(byStatus, ([name, value]) => ({ name, value })),
    byCompany: Array.from(byCompany, ([name, value]) => ({ name, value })).slice(0, 10),
    byRole: Array.from(byRole, ([name, value]) => ({ name, value })).slice(0, 10),
    byResume: Array.from(byResume, ([name, value]) => ({ name, value })),
    byMonth: Array.from(byMonth, ([name, value]) => ({ name, value }))
  });
}
