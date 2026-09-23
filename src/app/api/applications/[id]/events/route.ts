import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({ type: z.string().min(1), description: z.string().min(1), timestamp: z.string().datetime().optional() });

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const { id } = await ctx.params;
    const application = await prisma.application.findFirst({ where: { id, userId: user.id } });
    if (!application) return fail("Application not found", 404);
    const body = schema.parse(await req.json());
    const event = await prisma.applicationEvent.create({
      data: { applicationId: id, type: body.type, description: body.description, timestamp: body.timestamp ? new Date(body.timestamp) : new Date() }
    });
    return ok({ event }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
