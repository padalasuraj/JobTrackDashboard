import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const { id } = await ctx.params;
  const existing = await prisma.reminder.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail("Reminder not found", 404);
  const body = await req.json();
  return ok({ reminder: await prisma.reminder.update({ where: { id }, data: { completed: Boolean(body.completed) } }) });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  const { id } = await ctx.params;
  const existing = await prisma.reminder.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail("Reminder not found", 404);
  await prisma.reminder.delete({ where: { id } });
  return ok({ ok: true });
}
