import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({ applicationId: z.string(), body: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const body = schema.parse(await req.json());
    const app = await prisma.application.findFirst({ where: { id: body.applicationId, userId: user.id } });
    if (!app) return fail("Application not found", 404);
    return ok({ note: await prisma.note.create({ data: body }) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
