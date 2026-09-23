import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "jobtrack_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

function secret() {
  return process.env.AUTH_SECRET ?? "development-secret-change-me-for-production";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash?: string | null) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function signSession(user: SessionUser) {
  return jwt.sign(user, secret(), { expiresIn: "14d" });
}

export function verifySessionToken(token?: string) {
  if (!token) return null;
  try {
    return jwt.verify(token, secret()) as SessionUser;
  } catch {
    return null;
  }
}

export async function currentUser() {
  const store = await cookies();
  const session = verifySessionToken(store.get(COOKIE_NAME)?.value);
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, emailVerifiedAt: true }
  });
}

export function userFromRequest(req: NextRequest) {
  return verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
}

export async function requireUser(req: NextRequest) {
  const session = userFromRequest(req);
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.id } });
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}
