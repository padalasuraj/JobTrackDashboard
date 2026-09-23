import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { googleAuthorizationUrl, googleConfigured } from "@/lib/oauth";

const STATE_COOKIE = "jobtrack_google_oauth_state";

export async function GET(req: NextRequest) {
  if (!googleConfigured()) return fail("Google OAuth is not configured", 503);
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(googleAuthorizationUrl(state));
  res.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600
  });
  return res;
}
