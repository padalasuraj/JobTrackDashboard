import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  return ok({ profiles: await prisma.profile.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }) });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const body = profileSchema.parse(await req.json());
    return ok({ profile: await prisma.profile.create({ data: { ...body, userId: user.id } }) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
