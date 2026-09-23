import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok, parseDate } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { jobSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const jobs = await prisma.job.findMany({ include: { company: true }, orderBy: { updatedAt: "desc" } });
  return ok({ jobs });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const body = jobSchema.parse(await req.json());
    const company = await prisma.company.upsert({
      where: { name: body.company },
      update: { websiteUrl: body.companyUrl || undefined },
      create: { name: body.company, websiteUrl: body.companyUrl || null }
    });
    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title: body.title,
        jobId: body.jobId || null,
        location: body.location || null,
        workMode: body.workMode,
        salaryMin: body.salaryMin || null,
        salaryMax: body.salaryMax || null,
        salaryCurrency: body.salaryCurrency,
        experience: body.experience || null,
        employmentType: body.employmentType || null,
        description: body.description || null,
        skills: body.skills || null,
        jobUrl: body.jobUrl || null,
        applicationUrl: body.applicationUrl || null,
        companyUrl: body.companyUrl || null,
        postedDate: parseDate(body.postedDate),
        closingDate: parseDate(body.closingDate),
        source: body.source || null
      },
      include: { company: true }
    });
    return ok({ job }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
