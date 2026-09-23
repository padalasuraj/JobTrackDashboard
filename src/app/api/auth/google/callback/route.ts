import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, fetchGoogleProfile, signInWithGoogle } from "@/lib/oauth";

const STATE_COOKIE = "jobtrack_google_oauth_state";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?oauth=invalid", req.url));
  }
  try {
    const token = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(token.access_token!);
    const { cookie } = await signInWithGoogle(profile);
    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    res.cookies.set(cookie);
    res.cookies.set({ name: STATE_COOKIE, value: "", path: "/", maxAge: 0 });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login?oauth=failed", req.url));
  }
}
