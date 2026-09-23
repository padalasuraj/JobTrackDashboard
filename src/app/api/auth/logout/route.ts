import { clearSessionCookie } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function POST() {
  const res = ok({ ok: true });
  res.cookies.set(clearSessionCookie());
  return res;
}
