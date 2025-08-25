import { UserModel } from "../models/user.model";
import { MitraModel } from "../models/mitra.model";
import { validateBankInput } from "../utils/bankvalidator";

export async function generateUserID(paketUsaha: string) {
  let prefix = "";
  if (paketUsaha === "Kagawa Coffee Corner") {
    prefix = "MKC";
  } else if (paketUsaha === "Kagawa Ricebowl") {
    prefix = "MKR";
  } else if (paketUsaha === "Kagawa Coffee & Ricebowl Corner") {
    prefix = "MKCR";
  } else if (paketUsaha === "RM Nusantara") {
    prefix = "MWN";
  } else {
    throw new Error("Jenis usaha tidak dikenali");
  }

  const count = await MitraModel.countDocuments({ paketUsaha: paketUsaha });
  const userID = `${prefix}${(count + 1).toString().padStart(4, "0")}`;

  return userID;
}

export async function registerMitra(mitraData: any) {
  try {
    // Log incoming data for debugging
    console.log("Registering mitra with data:", {
      sistemKemitraan: mitraData.sistemKemitraan,
      sales: mitraData.sales,
      jenisUsaha: mitraData.jenisUsaha, // For debugging mapping
      paketUsaha: mitraData.paketUsaha,
      email: mitraData.email,
      hargaPaket: mitraData.hargaPaket,
      yangHarusDibayar: mitraData.yangHarusDibayar,
    });

    // Validate and normalize bank name
    const validatedBank = validateBankInput(mitraData.bankPengirim);
    if (validatedBank) {
      mitraData.bankPengirim = validatedBank;
    }

    console.log("Creating mitra record...");

    // Create new mitra record
    const newMitra = await MitraModel.create({
      sistemKemitraan: mitraData.sistemKemitraan,
      sales: mitraData.sales || "", // Handle sales field properly, allow empty string
      paketUsaha: mitraData.paketUsaha,
      rmNusantaraSubMenu: mitraData.rmNusantaraSubMenu || "", // Add RM Nusantara sub menu
      namaMitra: mitraData.namaMitra,
      alamatMitra: mitraData.alamatMitra,
      noHp: mitraData.noHp,
      email: mitraData.email,
      fotoKTP: mitraData.fotoKTP || "",
      nilaiPaketUsaha: mitraData.nilaiPaket,
      hargaPaket: parseInt(mitraData.hargaPaket) || 0,
      nominalDP: parseInt(mitraData.nominalDP) || 0,
      nominalFull: parseInt(mitraData.nominalFull) || 0,
      kekurangan: parseInt(mitraData.kekurangan) || 0,
      diskonHarian: parseInt(mitraData.diskonHarian) || 0,
      yangHarusDibayar: parseInt(mitraData.yangHarusDibayar) || 0,
      buktiTransfer: mitraData.buktiTransfer || "",
      namaPengirim: mitraData.namaPengirim,
      noRekPengirim: mitraData.noRekPengirim,
      bankPengirim: mitraData.bankPengirim,
      status: "pending",
      isApproved: false,
    });

    console.log("Mitra record created successfully:", newMitra._id);

    return {
      success: true,
      mitraId: newMitra._id,
      message: "Pendaftaran mitra berhasil disimpan",
    };
  } catch (error) {
    console.error("Error registering mitra:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    throw new Error(
      "Gagal menyimpan data mitra: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}

export async function approveMitra({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const mitra = await MitraModel.findOne({ _id: userId, email });
  if (!mitra) throw new Error("Mitra tidak ditemukan");

  if (!mitra.isApproved) {
    const userID = await generateUserID(mitra.paketUsaha);

    await MitraModel.updateOne(
      { _id: userId },
      {
        isApproved: true,
        userID: userID,
        status: "approved",
      }
    );
  }

  return {
    userID: mitra.userID,
    nama: mitra.namaMitra,
    jenisUsaha: mitra.paketUsaha,
  };
}
