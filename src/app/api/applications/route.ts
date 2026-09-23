import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { applicationWhere } from "@/lib/insights";
import { fail, handleApiError, ok, parseDate } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/validation";

const include = {
  job: { include: { company: true } },
  resume: true,
  profile: true,
  interviews: { orderBy: { scheduledAt: "asc" as const } },
  reminders: { orderBy: { scheduledAt: "asc" as const } },
  events: { orderBy: { timestamp: "desc" as const } }
};

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "updated";
  const orderBy: Prisma.ApplicationOrderByWithRelationInput =
    sort === "applied" ? { appliedAt: "desc" } : sort === "closing" ? { job: { closingDate: "asc" } } : { updatedAt: "desc" };
  const applications = await prisma.application.findMany({
    where: applicationWhere(user.id, searchParams),
    include,
    orderBy
  });
  return ok({ applications });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const body = applicationSchema.parse(await req.json());
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: body.jobId,
        resumeId: body.resumeId || null,
        profileId: body.profileId || null,
        status: body.status,
        appliedAt: parseDate(body.appliedAt) ?? (body.status === "APPLIED" ? new Date() : null),
        progressUrl: body.progressUrl || null,
        recruiterUrl: body.recruiterUrl || null,
        notes: body.notes || null,
        events: {
          create: [
            { type: "application", description: body.status === "APPLIED" ? "Application submitted" : "Job saved", timestamp: new Date() }
          ]
        }
      },
      include
    });
    return ok({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("This job is already tracked in your account", 409);
    }
    return handleApiError(error);
  }
}
