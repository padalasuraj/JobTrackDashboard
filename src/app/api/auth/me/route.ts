import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  return ok({ user: { id: user.id, name: user.name, email: user.email, emailVerifiedAt: user.emailVerifiedAt } });
}
