import { NextRequest } from "next/server";
import { addDays, startOfDay } from "date-fns";
import { requireUser } from "@/lib/auth";
import { needsAction } from "@/lib/insights";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { statuses } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: {
      job: { include: { company: true } },
      resume: true,
      profile: true,
      interviews: { orderBy: { scheduledAt: "asc" } },
      reminders: { orderBy: { scheduledAt: "asc" } }
    },
    orderBy: { updatedAt: "desc" }
  });
  const counts = Object.fromEntries(statuses.map(([status]) => [status, 0])) as Record<string, number>;
  for (const app of applications) counts[app.status] += 1;
  const today = startOfDay(new Date());
  const closingSoon = applications.filter((app) => app.job.closingDate && app.job.closingDate >= today && app.job.closingDate <= addDays(today, 7)).length;
  const attention = applications.flatMap(needsAction).slice(0, 8);
  const upcomingInterviews = applications.flatMap((app) =>
    app.interviews.filter((interview) => interview.scheduledAt >= new Date()).map((interview) => ({
      id: interview.id,
      applicationId: app.id,
      company: app.job.company.name,
      role: app.job.title,
      round: interview.round,
      scheduledAt: interview.scheduledAt,
      meetingUrl: interview.meetingUrl
    }))
  ).slice(0, 6);
  return ok({
    counts,
    totals: {
      total: applications.length,
      interviews: counts.TECHNICAL_INTERVIEW + counts.HR_INTERVIEW + counts.PHONE_SCREEN,
      closingSoon,
      needsAction: attention.length
    },
    attention,
    upcomingInterviews,
    applications
  });
}
