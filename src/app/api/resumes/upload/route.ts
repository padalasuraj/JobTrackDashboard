import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { storeResumeFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("Resume file is required", 422);
    const isDefault = form.get("isDefault") === "on" || form.get("isDefault") === "true";
    if (isDefault) await prisma.resume.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    const stored = await storeResumeFile(user.id, file);
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        name: String(form.get("name") || stored.fileName),
        targetRole: String(form.get("targetRole") || "") || null,
        version: String(form.get("version") || "1.0"),
        description: String(form.get("description") || "") || null,
        isDefault,
        ...stored
      }
    });
    return ok({ resume }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
