import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { deleteResumeFile } from "@/lib/storage";
import { resumeSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const { id } = await ctx.params;
    const body = resumeSchema.partial().parse(await req.json());
    const existing = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Resume not found", 404);
    if (body.isDefault) await prisma.resume.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    return ok({ resume: await prisma.resume.update({ where: { id }, data: body }) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const { id } = await ctx.params;
  const existing = await prisma.resume.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail("Resume not found", 404);
  await deleteResumeFile(existing.filePath);
  await prisma.resume.delete({ where: { id } });
  return ok({ ok: true });
}
