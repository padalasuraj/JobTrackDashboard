import { NextRequest } from "next/server";
import { sessionCookie, signSession, verifyPassword } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) return fail("Invalid email or password", 401);
    const res = ok({ user: { id: user.id, name: user.name, email: user.email } });
    res.cookies.set(sessionCookie(signSession({ id: user.id, email: user.email, name: user.name })));
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
