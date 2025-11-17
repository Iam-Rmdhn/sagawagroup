import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { MitraPelunasanModel } from "../models/mitra-pelunasan.model";
import { validateBankInput } from "../utils/bankvalidator";
import {
  normalizeUploadsPath,
  resolveBaseUrlFromRequest,
} from "../utils/url.utils";
import {
  isSupabaseStorageEnabled,
  uploadFileToSupabase,
} from "../utils/supabaseStorage";

export const pelunasanMitraController = async (
  req: Request
): Promise<Response> => {
  try {
    const formData = await req.formData();
    const baseUploadsUrl = resolveBaseUrlFromRequest(req);
    console.log(`[PELUNASAN UPLOAD] Using base URL: ${baseUploadsUrl}`);

    const supabaseEnabled = isSupabaseStorageEnabled();
    console.log(
      `[PELUNASAN UPLOAD] Supabase storage enabled: ${
        supabaseEnabled ? "yes" : "no"
      }`
    );

    const pelunasanData: any = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "buktiTransfer") pelunasanData[key] = value;
    }

    // Validasi dan normalisasi nama bank pengirim
    if (pelunasanData.bankPengirim) {
      const validBank = validateBankInput(pelunasanData.bankPengirim);
      if (!validBank) {
        return new Response(
          JSON.stringify({
            error: "Nama bank pengirim tidak valid atau tidak dikenali.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      pelunasanData.bankPengirim = validBank;
    }

    // Handle file upload - Supabase Storage or Local
    const buktiTransfer = formData.get("buktiTransfer") as unknown as File;
    if (buktiTransfer && buktiTransfer.size > 0) {
      // Validate file type - only allow JPG/PNG
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(buktiTransfer.type)) {
        return new Response(
          JSON.stringify({
            error: `File type ${buktiTransfer.type} tidak diizinkan. Hanya menerima format JPG atau PNG.`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validate file size (1MB max)
      const maxSize = 1 * 1024 * 1024; // 1MB
      if (buktiTransfer.size > maxSize) {
        return new Response(
          JSON.stringify({
            error: `Ukuran file terlalu besar. Maksimal 1MB.`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (supabaseEnabled) {
        // Upload to Supabase Storage
        console.log(
          `[PELUNASAN UPLOAD] Uploading to Supabase bucket folder: pelunasan`
        );
        const uploadResult = await uploadFileToSupabase(buktiTransfer, {
          prefix: "mitra/pelunasan",
        });
        console.log(
          `[PELUNASAN UPLOAD] Supabase upload complete: ${uploadResult.publicUrl}`
        );

        // Store both legacy path and new Supabase URL
        pelunasanData.buktiTransfer = uploadResult.publicUrl; // Store full Supabase URL
        pelunasanData.buktiTransferPath = uploadResult.publicUrl;
        pelunasanData.upload_tf = uploadResult.publicUrl; // New field for consistency

        console.log(
          `[PELUNASAN UPLOAD] File saved to Supabase: ${uploadResult.publicUrl}`
        );
      } else {
        // Fallback to local storage
        const timestamp = Date.now();
        const originalName = buktiTransfer.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${timestamp}_${originalName}`;
        const uploadsDir = join(process.cwd(), "uploads");
        await mkdir(uploadsDir, { recursive: true });

        const filePath = join(uploadsDir, fileName);
        await Bun.write(filePath, buktiTransfer);

        const relativePath = normalizeUploadsPath(`/uploads/${fileName}`);
        pelunasanData.buktiTransfer = relativePath;
        pelunasanData.buktiTransferPath = relativePath;
        pelunasanData.upload_tf = relativePath; // New field for consistency

        console.log(
          `[PELUNASAN UPLOAD] File saved locally with path: ${relativePath} (absolute preview: ${baseUploadsUrl}${relativePath})`
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Bukti transfer wajib diupload" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log data pelunasan yang akan disimpan
    console.log(
      "[PELUNASAN DEBUG] Data pelunasan yang akan disimpan:",
      pelunasanData
    );
    console.log("  - buktiTransfer (legacy):", pelunasanData.buktiTransfer);
    console.log("  - upload_tf (new):", pelunasanData.upload_tf);
    console.log("  - Supabase enabled:", supabaseEnabled ? "YES" : "NO");

    // Simpan ke DB
    const result = await MitraPelunasanModel.create(pelunasanData);
    console.log("[PELUNASAN DEBUG] Data pelunasan berhasil disimpan:", result);
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in pelunasanMitraController:", error);
    return new Response(
      JSON.stringify({
        error: "Gagal mengirim pelunasan",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
