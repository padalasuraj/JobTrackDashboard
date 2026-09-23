import { NextRequest, NextResponse } from "next/server";
import { hashPassword, sessionCookie, signSession } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { handleApiError, fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) return fail("An account with this email already exists", 409);
    const verificationToken = crypto.randomUUID();
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        verificationToken
      }
    });
    await sendVerificationEmail(user.email, verificationToken);
    const token = signSession({ id: user.id, email: user.email, name: user.name });
    const res = ok({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
    res.cookies.set(sessionCookie(token));
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
