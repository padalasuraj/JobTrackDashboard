import { Prisma } from "@prisma/client";
import { addDays, differenceInCalendarDays, endOfMonth, endOfWeek, isBefore, startOfDay } from "date-fns";

export function closingLabel(date?: Date | null) {
  if (!date) return "No deadline";
  const days = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
  if (days < 0) return "Deadline passed";
  if (days === 0) return "Closing today";
  if (days === 1) return "Closing tomorrow";
  return `Closing in ${days} days`;
}

export function applicationWhere(userId: string, params: URLSearchParams): Prisma.ApplicationWhereInput {
  const search = params.get("search")?.trim();
  const status = params.get("status");
  const closing = params.get("closing");
  const salary = params.get("salary");
  const today = startOfDay(new Date());
  const where: Prisma.ApplicationWhereInput = { userId };

  if (status) where.status = status;
  if (params.get("company")) where.job = { company: { name: { contains: params.get("company") ?? "" } } };
  if (params.get("role")) where.job = { ...where.job as object, title: { contains: params.get("role") ?? "" } };
  if (params.get("location")) where.job = { ...where.job as object, location: { contains: params.get("location") ?? "" } };
  if (params.get("workMode")) where.job = { ...where.job as object, workMode: params.get("workMode") as never };
  if (params.get("resumeId")) where.resumeId = params.get("resumeId");

  if (search) {
    where.OR = [
      { notes: { contains: search } },
      { job: { title: { contains: search } } },
      { job: { jobId: { contains: search } } },
      { job: { location: { contains: search } } },
      { job: { skills: { contains: search } } },
      { job: { company: { name: { contains: search } } } }
    ];
  }

  if (salary && salary !== "any") {
    const ranges: Record<string, Prisma.JobWhereInput> = {
      under5: { salaryMax: { lt: 500000 } },
      "5to8": { salaryMin: { lte: 800000 }, salaryMax: { gte: 500000 } },
      "8to12": { salaryMin: { lte: 1200000 }, salaryMax: { gte: 800000 } },
      "12to20": { salaryMin: { lte: 2000000 }, salaryMax: { gte: 1200000 } },
      over20: { salaryMax: { gte: 2000000 } },
      undisclosed: { salaryMin: null, salaryMax: null }
    };
    where.job = { ...where.job as object, ...ranges[salary] };
  }

  if (closing) {
    const map: Record<string, Prisma.DateTimeNullableFilter<"Job">> = {
      today: { gte: today, lt: addDays(today, 1) },
      threeDays: { gte: today, lte: addDays(today, 3) },
      week: { gte: today, lte: endOfWeek(today) },
      month: { gte: today, lte: endOfMonth(today) },
      passed: { lt: today },
      none: { equals: null }
    };
    where.job = { ...where.job as object, closingDate: map[closing] };
  }

  return where;
}

export function needsAction(app: {
  id: string;
  status: string;
  progressUrl?: string | null;
  job: { title: string; applicationUrl?: string | null; closingDate?: Date | null; company: { name: string } };
  interviews: { scheduledAt: Date; round: string }[];
  reminders: { scheduledAt: Date; completed: boolean; message: string }[];
}) {
  const items: { applicationId: string; message: string; severity: "high" | "medium" | "low" }[] = [];
  const today = startOfDay(new Date());
  const soon = addDays(today, 3);
  if (app.job.closingDate && app.job.closingDate >= today && app.job.closingDate <= soon) {
    items.push({ applicationId: app.id, message: `${app.job.company.name} closes ${closingLabel(app.job.closingDate).toLowerCase()}`, severity: "high" });
  }
  if (app.job.closingDate && isBefore(app.job.closingDate, today) && app.status === "SAVED") {
    items.push({ applicationId: app.id, message: `${app.job.company.name} deadline passed`, severity: "medium" });
  }
  for (const interview of app.interviews) {
    const days = differenceInCalendarDays(startOfDay(interview.scheduledAt), today);
    if (days === 0 || days === 1) {
      items.push({ applicationId: app.id, message: `${app.job.company.name} ${interview.round} ${days === 0 ? "today" : "tomorrow"}`, severity: "high" });
    }
  }
  for (const reminder of app.reminders) {
    if (!reminder.completed && reminder.scheduledAt <= new Date()) {
      items.push({ applicationId: app.id, message: `${app.job.company.name}: ${reminder.message}`, severity: "medium" });
    }
  }
  if (app.status === "OA" && !app.progressUrl) {
    items.push({ applicationId: app.id, message: `${app.job.company.name} OA is pending`, severity: "medium" });
  }
  if (!app.job.applicationUrl) {
    items.push({ applicationId: app.id, message: `${app.job.company.name} is missing an application URL`, severity: "low" });
  }
  return items;
}
