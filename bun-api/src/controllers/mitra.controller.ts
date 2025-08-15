import { approveMitra, registerMitra } from "../services/mitra.services";

interface ApproveMitraBody {
  userId: string;
  email: string;
}

interface RegisterMitraBody {
  sistemKemitraan: string;
  jenisUsaha: string;
  paketUsaha: string;
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

    // Handle file uploads (for now, we'll just store file names)
    // In production, you'd upload these to cloud storage
    const documents = formData.getAll("documents") as unknown as File[];
    const buktiTransfer = formData.get("buktiTransfer") as unknown as File;

    if (documents.length > 0) {
      mitraData.fotoKTP = documents[0]?.name || "";
      mitraData.fotoNPWP = documents[1]?.name || "";
      mitraData.fotoMitra = documents[2]?.name || "";
    }

    if (buktiTransfer) {
      mitraData.buktiTransfer = buktiTransfer.name;
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
