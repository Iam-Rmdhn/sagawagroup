import { randomUUID } from "node:crypto";
import { ENV } from "../env";

interface UploadOptions {
  prefix?: string;
}

interface UploadResult {
  key: string;
  publicUrl: string;
}

const sanitizeFileName = (fileName: string): string => {
  if (!fileName) {
    return "file";
  }
  return fileName
    .replace(/[^a-zA-Z0-9.\-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(-100);
};

export const isSupabaseStorageEnabled = (): boolean => {
  return Boolean(ENV.SUPABASE_STORAGE_ENABLED);
};

export const uploadFileToSupabase = async (
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  if (!ENV.SUPABASE_STORAGE_ENABLED) {
    throw new Error("Supabase storage is not configured");
  }

  const prefixInput = options.prefix?.trim();
  const sanitizedPrefix = prefixInput
    ? prefixInput.replace(/^\/+/g, "").replace(/\/+/g, "/").replace(/\/+$/g, "")
    : "";
  const uniqueName = `${Date.now()}-${randomUUID()}-${sanitizeFileName(
    file.name
  )}`;
  const key = sanitizedPrefix ? `${sanitizedPrefix}/${uniqueName}` : uniqueName;

  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], {
    type: file.type || "application/octet-stream",
  });

  // Use Supabase REST API directly
  const uploadUrl = `${ENV.SUPABASE_STORAGE_ENDPOINT?.replace(
    "/storage/v1/s3",
    ""
  )}/storage/v1/object/${ENV.SUPABASE_STORAGE_BUCKET}/${key}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.SUPABASE_STORAGE_SECRET_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: blob,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase upload failed: ${response.status} ${errorText}`);
  }

  const publicBase = ENV.SUPABASE_STORAGE_PUBLIC_URL.replace(/\/$/, "");
  const publicUrl = `${publicBase}/${key}`;

  return { key, publicUrl };
};
