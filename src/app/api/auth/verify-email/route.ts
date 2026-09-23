import { NextRequest, NextResponse } from "next/server";
import { sessionCookie, signSession } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") return fail("Verification token is required", 422);
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return fail("Invalid or expired verification link", 400);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), verificationToken: null }
    });
    const res = ok({ user: { id: updated.id, name: updated.name, email: updated.email, emailVerifiedAt: updated.emailVerifiedAt } });
    res.cookies.set(sessionCookie(signSession({ id: updated.id, email: updated.email, name: updated.name })));
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/verify-email?error=missing", req.url));
  const response = await POST(new NextRequest(req.url, { method: "POST", body: JSON.stringify({ token }) }));
  if (!response.ok) return NextResponse.redirect(new URL("/verify-email?error=invalid", req.url));
  const redirect = NextResponse.redirect(new URL("/dashboard?verified=1", req.url));
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}
