import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export type StoredFile = {
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export function validateResumeFile(file: File) {
  if (!allowedTypes.has(file.type)) throw new Error("Resume must be a PDF, DOC or DOCX file");
  if (file.size > 5 * 1024 * 1024) throw new Error("Resume file must be 5MB or smaller");
}

function uploadDir() {
  return process.env.UPLOAD_DIR || "./uploads";
}

function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_STORAGE_BUCKET);
}

export async function storeResumeFile(userId: string, file: File): Promise<StoredFile> {
  validateResumeFile(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (supabaseConfigured()) {
    const base = `${process.env.SUPABASE_URL}/storage/v1/object/${process.env.SUPABASE_STORAGE_BUCKET}/${key}`;
    const response = await fetch(base, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
        "content-type": file.type,
        "x-upsert": "true"
      },
      body: buffer
    });
    if (!response.ok) throw new Error("Unable to upload resume to Supabase Storage");
    return { filePath: `supabase://${key}`, fileName: file.name, mimeType: file.type, sizeBytes: file.size };
  }

  const target = path.resolve(uploadDir(), key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer);
  return { filePath: `local://${key}`, fileName: file.name, mimeType: file.type, sizeBytes: file.size };
}

export async function readResumeFile(filePath: string) {
  if (filePath.startsWith("supabase://")) {
    const key = filePath.replace("supabase://", "");
    const response = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/${process.env.SUPABASE_STORAGE_BUCKET}/${key}`, {
      headers: {
        authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
      }
    });
    if (!response.ok) throw new Error("Unable to download resume from Supabase Storage");
    return Buffer.from(await response.arrayBuffer());
  }
  const key = filePath.replace("local://", "");
  return readFile(path.resolve(uploadDir(), key));
}

export async function deleteResumeFile(filePath?: string | null) {
  if (!filePath) return;
  if (filePath.startsWith("supabase://")) {
    const key = filePath.replace("supabase://", "");
    await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/${process.env.SUPABASE_STORAGE_BUCKET}/${key}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
      }
    });
    return;
  }
  await unlink(path.resolve(uploadDir(), filePath.replace("local://", ""))).catch(() => undefined);
}
