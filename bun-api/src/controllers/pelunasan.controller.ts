import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { MitraPelunasanModel } from "../models/mitra-pelunasan.model";
import { validateBankInput } from "../utils/bankvalidator";
import {
  normalizeUploadsPath,
  resolveBaseUrlFromRequest,
} from "../utils/url.utils";

export const pelunasanMitraController = async (
  req: Request
): Promise<Response> => {
  try {
    const formData = await req.formData();
    const baseUploadsUrl = resolveBaseUrlFromRequest(req);
    console.log(`[PELUNASAN UPLOAD] Using base URL: ${baseUploadsUrl}`);
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
    // Handle file upload
    const buktiTransfer = formData.get("buktiTransfer") as unknown as File;
    if (buktiTransfer && buktiTransfer.size > 0) {
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
      console.log(
        `[PELUNASAN UPLOAD] File saved with path: ${relativePath} (absolute preview: ${baseUploadsUrl}${relativePath})`
      );
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
    console.log("[DEBUG] Data pelunasan yang akan disimpan:", pelunasanData);
    // Simpan ke DB
    const result = await MitraPelunasanModel.create(pelunasanData);
    console.log("[DEBUG] Data pelunasan berhasil disimpan:", result);
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
