import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { resumeSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return fail("Unauthorized", 401);
  return ok({ resumes: await prisma.resume.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] }) });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const body = resumeSchema.parse(await req.json());
    if (body.isDefault) await prisma.resume.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    const resume = await prisma.resume.create({ data: { ...body, userId: user.id, filePath: body.fileName ? `uploads/${user.id}/${body.fileName}` : null } });
    return ok({ resume }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
