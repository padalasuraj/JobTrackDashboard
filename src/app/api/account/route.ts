import { NextRequest } from "next/server";
import { clearSessionCookie, hashPassword, requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ name: z.string().min(2).optional(), password: z.string().min(8).optional() });

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const body = schema.parse(await req.json());
    return ok({
      user: await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name, passwordHash: body.password ? await hashPassword(body.password) : undefined },
        select: { id: true, name: true, email: true }
      })
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  await prisma.user.delete({ where: { id: user.id } });
  const res = ok({ ok: true });
  res.cookies.set(clearSessionCookie());
  return res;
}
