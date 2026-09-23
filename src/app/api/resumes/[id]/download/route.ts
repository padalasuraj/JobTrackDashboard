import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { readResumeFile } from "@/lib/storage";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const { id } = await ctx.params;
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume?.filePath) return fail("Resume file not found", 404);
    const file = await readResumeFile(resume.filePath);
    return new NextResponse(file, {
      headers: {
        "content-type": resume.mimeType || "application/octet-stream",
        "content-disposition": `attachment; filename="${resume.fileName || "resume"}"`
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
