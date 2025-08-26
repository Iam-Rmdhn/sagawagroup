import { approveMitra, registerMitra } from "../services/mitra.services";

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
  hargaPaket: string;
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

    // Helper function to save file and return URL
    const saveFileAndGetUrl = async (file: File): Promise<string> => {
      console.log(`Saving file: ${file.name}, size: ${file.size} bytes`);

      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize filename
      const fileName = `${timestamp}_${originalName}`;

      // Save file to uploads directory
      const filePath = `uploads/${fileName}`;
      await Bun.write(filePath, file);

      // Return URL - use environment variable or fallback to localhost
      const baseUrl =
        process.env.BASE_URL || `http://localhost:${process.env.PORT || 9999}`;
      const url = `${baseUrl}/uploads/${fileName}`;
      console.log(`File saved successfully: ${url}`);
      return url;
    };

    // Save and get URLs for document files
    if (documents.length > 0) {
      if (documents[0] && documents[0].size > 0) {
        console.log(
          `Processing KTP file: ${documents[0].name}, size: ${documents[0].size} bytes`
        );
        mitraData.fotoKTP = await saveFileAndGetUrl(documents[0]);
      }
    }

    // Save and get URL for bukti transfer
    if (buktiTransfer && buktiTransfer.size > 0) {
      console.log(
        `Processing bukti transfer file: ${buktiTransfer.name}, size: ${buktiTransfer.size} bytes`
      );
      mitraData.buktiTransfer = await saveFileAndGetUrl(buktiTransfer);
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
