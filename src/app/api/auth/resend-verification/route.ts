import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    if (user.emailVerifiedAt) return ok({ sent: false, message: "Email is already verified" });
    const token = user.verificationToken || crypto.randomUUID();
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: token } });
    const result = await sendVerificationEmail(user.email, token);
    return ok({ sent: true, provider: result.provider });
  } catch (error) {
    return handleApiError(error);
  }
}
