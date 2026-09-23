import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("jobtrack_session")?.value;
  const user = verifySessionToken(token);
  const isAuth = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  const isApp = req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/add") || req.nextUrl.pathname.startsWith("/applications") || req.nextUrl.pathname.startsWith("/resumes") || req.nextUrl.pathname.startsWith("/profiles") || req.nextUrl.pathname.startsWith("/interviews") || req.nextUrl.pathname.startsWith("/reminders") || req.nextUrl.pathname.startsWith("/analytics") || req.nextUrl.pathname.startsWith("/settings");
  if (isApp && !user) return NextResponse.redirect(new URL("/login", req.url));
  if (isAuth && user) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
