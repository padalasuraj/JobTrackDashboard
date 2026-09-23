import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok, parseDate } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { jobSchema } from "@/lib/validation";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const { id } = await ctx.params;
  const job = await prisma.job.findUnique({ where: { id }, include: { company: true } });
  if (!job) return fail("Job not found", 404);
  return ok({ job });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const { id } = await ctx.params;
    const body = jobSchema.partial().parse(await req.json());
    const job = await prisma.job.update({
      where: { id },
      data: {
        title: body.title,
        jobId: body.jobId,
        location: body.location,
        workMode: body.workMode,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        salaryCurrency: body.salaryCurrency,
        experience: body.experience,
        employmentType: body.employmentType,
        description: body.description,
        skills: body.skills,
        jobUrl: body.jobUrl || undefined,
        applicationUrl: body.applicationUrl || undefined,
        companyUrl: body.companyUrl || undefined,
        postedDate: parseDate(body.postedDate),
        closingDate: parseDate(body.closingDate),
        source: body.source
      },
      include: { company: true }
    });
    return ok({ job });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const { id } = await ctx.params;
  await prisma.job.delete({ where: { id } });
  return ok({ ok: true });
}
