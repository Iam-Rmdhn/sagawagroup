import { randomUUID } from "node:crypto";
import { ENV } from "../env";

interface UploadOptions {
  prefix?: string;
  bucket?: string; // Optional custom bucket name
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

  // Use custom bucket if specified, otherwise use default
  const bucketName = options.bucket || ENV.SUPABASE_STORAGE_BUCKET;

  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], {
    type: file.type || "application/octet-stream",
  });

  // Use Supabase REST API directly
  const uploadUrl = `${ENV.SUPABASE_STORAGE_ENDPOINT?.replace(
    "/storage/v1/s3",
    ""
  )}/storage/v1/object/${bucketName}/${key}`;

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

  // Robust URL Construction
  let projectBaseUrl = "";

  if (ENV.SUPABASE_STORAGE_PUBLIC_URL) {
    const url = String(ENV.SUPABASE_STORAGE_PUBLIC_URL);
    const match = url.match(/^(https?:\/\/[^\/]+)/);
    if (match) projectBaseUrl = match[1];
  }

  if (!projectBaseUrl && ENV.SUPABASE_STORAGE_ENDPOINT) {
    const end = String(ENV.SUPABASE_STORAGE_ENDPOINT);
    const match = end.match(/^(https?:\/\/[^\/]+)/);
    if (match) projectBaseUrl = match[1];
  }

  if (!projectBaseUrl) {
    projectBaseUrl = "https://rnrxmpmvoqxcdpazikwe.supabase.co";
  }

  const publicUrl = `${projectBaseUrl}/storage/v1/object/public/${bucketName}/${key}`;

  return { key, publicUrl };
};

// Convenience function to upload to ads bucket (photoIklan)
export const uploadAdsImageToSupabase = async (
  file: File,
  options: Omit<UploadOptions, 'bucket'> = {}
): Promise<UploadResult> => {
  return uploadFileToSupabase(file, {
    ...options,
    bucket: "photoIklan"
  });
};

export const deleteFileFromSupabase = async (
  key: string,
  bucketName: string = "photoIklan"
): Promise<boolean> => {
  if (!ENV.SUPABASE_STORAGE_ENABLED) return false;
  if (!key) return false;

  const endpoint = ENV.SUPABASE_STORAGE_ENDPOINT?.replace("/storage/v1/s3", "").replace(/\/+$/, "");
  const url = `${endpoint}/storage/v1/object/${bucketName}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${ENV.SUPABASE_STORAGE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefixes: [key]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to delete file from Supabase: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`Successfully deleted file from Supabase: ${key}`);
    return true;
  } catch (error) {
    console.error("Error deleting file from Supabase:", error);
    return false;
  }
};
