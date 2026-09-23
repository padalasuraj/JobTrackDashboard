import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { reminderSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  return ok({
    reminders: await prisma.reminder.findMany({
      where: { userId: user.id },
      include: { application: { include: { job: { include: { company: true } } } } },
      orderBy: { scheduledAt: "asc" }
    })
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const body = reminderSchema.parse(await req.json());
    if (body.applicationId) {
      const app = await prisma.application.findFirst({ where: { id: body.applicationId, userId: user.id } });
      if (!app) return fail("Application not found", 404);
    }
    return ok({
      reminder: await prisma.reminder.create({
        data: { ...body, userId: user.id, scheduledAt: new Date(body.scheduledAt), completed: body.completed ?? false }
      })
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
