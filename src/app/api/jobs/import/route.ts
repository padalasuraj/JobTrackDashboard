import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { extractJobFromUrl } from "@/lib/extract";
import { fail, handleApiError, ok } from "@/lib/http";
import { z } from "zod";

const schema = z.object({ url: z.string().url() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return fail("Unauthorized", 401);
    const { url } = schema.parse(await req.json());
    return ok(await extractJobFromUrl(url));
  } catch (error) {
    return handleApiError(error);
  }
}
