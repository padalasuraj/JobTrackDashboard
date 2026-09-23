import { NextRequest } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email === "string") {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (user) {
        const resetToken = crypto.randomUUID();
        await prisma.user.update({
          where: { id: user.id },
          data: { resetToken, resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 60) }
        });
        await sendPasswordResetEmail(user.email, resetToken);
      }
    }
    return ok({ message: "If an account exists, a reset link has been sent." });
  } catch (error) {
    return handleApiError(error);
  }
}
