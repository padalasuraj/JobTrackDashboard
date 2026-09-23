import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok, parseDate } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/validation";

const include = {
  job: { include: { company: true } },
  resume: true,
  profile: true,
  interviews: { orderBy: { scheduledAt: "asc" as const } },
  reminders: { orderBy: { scheduledAt: "asc" as const } },
  events: { orderBy: { timestamp: "desc" as const } },
  noteItems: { orderBy: { createdAt: "desc" as const } }
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const { id } = await ctx.params;
  const application = await prisma.application.findFirst({ where: { id, userId: user.id }, include });
  if (!application) return fail("Application not found", 404);
  return ok({ application });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const { id } = await ctx.params;
    const body = applicationSchema.partial().parse(await req.json());
    const existing = await prisma.application.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Application not found", 404);
    const application = await prisma.application.update({
      where: { id },
      data: {
        resumeId: body.resumeId,
        profileId: body.profileId,
        status: body.status,
        appliedAt: parseDate(body.appliedAt),
        progressUrl: body.progressUrl,
        recruiterUrl: body.recruiterUrl,
        notes: body.notes,
        events: body.status && body.status !== existing.status ? { create: { type: "status", description: `Status changed to ${body.status}` } } : undefined
      },
      include
    });
    return ok({ application });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const { id } = await ctx.params;
  const existing = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail("Application not found", 404);
  await prisma.application.delete({ where: { id } });
  return ok({ ok: true });
}
