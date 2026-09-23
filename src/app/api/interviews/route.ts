import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { interviewSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  return ok({
    interviews: await prisma.interview.findMany({
      where: { application: { userId: user.id } },
      include: { application: { include: { job: { include: { company: true } } } } },
      orderBy: { scheduledAt: "asc" }
    })
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const body = interviewSchema.parse(await req.json());
    const app = await prisma.application.findFirst({ where: { id: body.applicationId, userId: user.id } });
    if (!app) return fail("Application not found", 404);
    const interview = await prisma.interview.create({
      data: { ...body, scheduledAt: new Date(body.scheduledAt), applicationId: app.id }
    });
    await prisma.applicationEvent.create({ data: { applicationId: app.id, type: "interview", description: `${body.round} scheduled`, timestamp: new Date(body.scheduledAt) } });
    return ok({ interview }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
