import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const { id } = await ctx.params;
    const existing = await prisma.profile.findFirst({ where: { id, userId: user.id } });
    if (!existing) return fail("Profile not found", 404);
    return ok({ profile: await prisma.profile.update({ where: { id }, data: profileSchema.partial().parse(await req.json()) }) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const { id } = await ctx.params;
  const existing = await prisma.profile.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail("Profile not found", 404);
  await prisma.profile.delete({ where: { id } });
  return ok({ ok: true });
}
