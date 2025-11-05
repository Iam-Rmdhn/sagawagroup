import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { approveMitra, registerMitra } from "../services/mitra.services";
import {
  normalizeUploadsPath,
  resolveBaseUrlFromRequest,
} from "../utils/url.utils";

interface ApproveMitraBody {
  userId: string;
  email: string;
}

interface RegisterMitraBody {
  sistemKemitraan: string;
  sales: string;
  paketUsaha: string;
  rmNusantaraSubMenu?: string;
  namaMitra: string;
  alamatMitra: string;
  noHp: string;
  email: string;
  nilaiPaket: string;
  hargaPaket: number;
  nominalDP: string;
  nominalFull: string;
  kekurangan: string;
  diskonHarian: string;
  yangHarusDibayar: string;
  namaPengirim: string;
  noRekPengirim: string;
  bankPengirim: string;
}

export const registerMitraController = async (
  req: Request
): Promise<Response> => {
  try {
    const formData = await req.formData();

    const baseUploadsUrl = resolveBaseUrlFromRequest(req);
    console.log(`[IMAGE UPLOAD] Using base URL: ${baseUploadsUrl}`);

    // Extract form fields
    const mitraData: any = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "documents" && key !== "buktiTransfer") {
        mitraData[key] = value;
      }
    }

    // Ensure sales field is properly handled (it comes as 'sales' from frontend but might be mapped)
    if (!mitraData.sales && mitraData.jenisUsaha) {
      mitraData.sales = mitraData.jenisUsaha;
    }
    if (!mitraData.sales) {
      mitraData.sales = ""; // Set empty string if no sales data provided
    }

    // Handle file uploads - save files and store URLs
    const documents = formData.getAll("documents") as unknown as File[];
    const buktiTransfer = formData.get("buktiTransfer") as unknown as File;

    // Helper function to validate and save file and return URL
    const saveFileAndGetUrl = async (
      file: File
    ): Promise<{ absoluteUrl: string; relativePath: string }> => {
      console.log(`Saving file: ${file.name}, size: ${file.size} bytes`);

      // Validate file type - only allow JPG/PNG
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          `File type ${file.type} tidak diizinkan. Hanya menerima format JPG atau PNG.`
        );
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error(`Ukuran file terlalu besar. Maksimal 5MB.`);
      }

      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize filename
      const fileName = `${timestamp}_${originalName}`;

      // Save file to uploads directory
      const uploadsDir = join(process.cwd(), "uploads");
      await mkdir(uploadsDir, { recursive: true });

      const filePath = join(uploadsDir, fileName);
      await Bun.write(filePath, file);

      const relativePath = normalizeUploadsPath(`/uploads/${fileName}`);
      const absoluteUrl = `${baseUploadsUrl}${relativePath}`;
      console.log(
        `File saved successfully: ${absoluteUrl} (relative: ${relativePath})`
      );
      return { absoluteUrl, relativePath };
    };

    // Save and get URLs for document files
    console.log(`[IMAGE UPLOAD] Number of document files: ${documents.length}`);
    if (documents.length > 0) {
      if (documents[0] && documents[0].size > 0) {
        console.log(
          `[IMAGE UPLOAD] Processing KTP file: ${documents[0].name}, size: ${documents[0].size} bytes`
        );
        const savedKTP = await saveFileAndGetUrl(documents[0]);
        const normalizedKTPPath = normalizeUploadsPath(savedKTP.relativePath);
        mitraData.fotoKTP = normalizedKTPPath; // Store relative path
        mitraData.upload_ktp = normalizedKTPPath;
        console.log(
          `[IMAGE UPLOAD] Foto KTP saved with path: ${mitraData.fotoKTP} (absolute preview: ${savedKTP.absoluteUrl})`
        );
      } else {
        console.log(`[IMAGE UPLOAD] KTP file is empty or invalid`);
      }
    } else {
      console.log(`[IMAGE UPLOAD] No document files received`);
    }

    // Save and get URL for bukti transfer
    console.log(
      `[IMAGE UPLOAD] Bukti transfer file: ${
        buktiTransfer ? "exists" : "not found"
      }, size: ${buktiTransfer?.size || 0}`
    );
    if (buktiTransfer && buktiTransfer.size > 0) {
      console.log(
        `[IMAGE UPLOAD] Processing bukti transfer file: ${buktiTransfer.name}, size: ${buktiTransfer.size} bytes`
      );
      const savedTransfer = await saveFileAndGetUrl(buktiTransfer);
      const normalizedTransferPath = normalizeUploadsPath(
        savedTransfer.relativePath
      );
      mitraData.buktiTransfer = normalizedTransferPath; // Store relative path
      mitraData.upload_tf = normalizedTransferPath;
      console.log(
        `[IMAGE UPLOAD] Bukti Transfer saved with path: ${mitraData.buktiTransfer} (absolute preview: ${savedTransfer.absoluteUrl})`
      );
    } else {
      console.log(
        `[IMAGE UPLOAD] Bukti transfer file is empty or not received`
      );
    }

    // Ensure new fields are populated when legacy data exists
    if (!mitraData.upload_ktp && mitraData.fotoKTP) {
      const normalized = normalizeUploadsPath(mitraData.fotoKTP);
      mitraData.upload_ktp = normalized;
      mitraData.fotoKTP = normalized;
    }
    if (!mitraData.upload_tf && mitraData.buktiTransfer) {
      const normalized = normalizeUploadsPath(mitraData.buktiTransfer);
      mitraData.upload_tf = normalized;
      mitraData.buktiTransfer = normalized;
    }

    // Validate required fields
    const requiredFields = [
      "sistemKemitraan",
      "paketUsaha",
      "namaMitra",
      "alamatMitra",
      "noHp",
      "email",
      "nilaiPaket",
      "namaPengirim",
      "noRekPengirim",
      "bankPengirim",
    ];

    for (const field of requiredFields) {
      if (!mitraData[field]) {
        return new Response(
          JSON.stringify({ error: `Field ${field} wajib diisi` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Validate RM Nusantara sub menu if RM Nusantara is selected
    if (
      mitraData.paketUsaha === "RM Nusantara" &&
      !mitraData.rmNusantaraSubMenu
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Sub menu RM Nusantara wajib dipilih ketika memilih paket RM Nusantara",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log final mitraData before saving to database
    console.log(`[IMAGE UPLOAD] 📦 Final mitraData before DB save:`);
    console.log(`  - namaMitra: ${mitraData.namaMitra}`);
    console.log(`  - email: ${mitraData.email}`);
    console.log(`  - fotoKTP (stored): ${mitraData.fotoKTP || "EMPTY"}`);
    console.log(
      `  - buktiTransfer (stored): ${mitraData.buktiTransfer || "EMPTY"}`
    );
    console.log(`  - upload_ktp (NEW): ${mitraData.upload_ktp || "EMPTY"}`);
    console.log(`  - upload_tf (NEW): ${mitraData.upload_tf || "EMPTY"}`);

    const result = await registerMitra(mitraData);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in registerMitraController:", error);
    return new Response(
      JSON.stringify({
        error: "Gagal mendaftarkan mitra",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const approveMitraController = async (
  req: Request
): Promise<Response> => {
  const body = (await req.json()) as ApproveMitraBody;

  if (!body.userId || !body.email) {
    return new Response(
      JSON.stringify({ error: "userId dan email wajib diisi" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { userId, email } = body;

  try {
    const result = await approveMitra({ userId, email });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Gagal menyetujui mitra" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
