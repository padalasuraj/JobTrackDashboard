import { hashPassword, sessionCookie, signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`;
}

export function googleAuthorizationUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code"
    })
  });
  const token = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !token.access_token) throw new Error(token.error_description || token.error || "Google OAuth token exchange failed");
  return token;
}

export async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error("Unable to read Google profile");
  return (await response.json()) as GoogleProfile;
}

export async function signInWithGoogle(profile: GoogleProfile) {
  if (!profile.email) throw new Error("Google did not return an email address");
  const email = profile.email.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.sub }, { email }] }
  });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          googleId: profile.sub,
          avatarUrl: profile.picture ?? existing.avatarUrl,
          emailVerifiedAt: existing.emailVerifiedAt ?? (profile.email_verified ? new Date() : null)
        }
      })
    : await prisma.user.create({
        data: {
          name: profile.name || email.split("@")[0],
          email,
          googleId: profile.sub,
          avatarUrl: profile.picture ?? null,
          emailVerifiedAt: profile.email_verified ? new Date() : null,
          passwordHash: await hashPassword(crypto.randomUUID())
        }
      });
  return { user, cookie: sessionCookie(signSession({ id: user.id, email: user.email, name: user.name })) };
}
