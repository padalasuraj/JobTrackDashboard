import { NextRequest } from "next/server";
import { hashPassword, sessionCookie, signSession } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (typeof token !== "string" || typeof password !== "string" || password.length < 8) {
      return fail("A valid token and password of at least 8 characters are required", 422);
    }
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } }
    });
    if (!user) return fail("Invalid or expired reset link", 400);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password), resetToken: null, resetTokenExpiry: null }
    });
    const res = ok({ user: { id: updated.id, email: updated.email, name: updated.name } });
    res.cookies.set(sessionCookie(signSession({ id: updated.id, email: updated.email, name: updated.name })));
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
