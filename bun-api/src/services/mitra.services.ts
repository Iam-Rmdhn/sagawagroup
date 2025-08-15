import { UserModel } from "../models/user.model";
import { MitraModel } from "../models/mitra.model";
import { validateBankInput } from "../utils/bankvalidator";

export async function generateUserID(jenisUsaha: string) {
  let prefix = "";
  if (jenisUsaha === "Kagawa Coffee Corner") {
    prefix = "MKC";
  } else if (jenisUsaha === "Kagawa Ricebowl") {
    prefix = "MKR";
  } else if (jenisUsaha === "Kagawa Coffee & Ricebowl Corner") {
    prefix = "MKCR";
  } else if (jenisUsaha === "RM Nusantara") {
    prefix = "MWN";
  } else {
    throw new Error("Jenis usaha tidak dikenali");
  }

  const count = await MitraModel.countDocuments({ paketUsaha: jenisUsaha });
  const userID = `${prefix}${(count + 1).toString().padStart(4, "0")}`;

  return userID;
}

export async function registerMitra(mitraData: any) {
  try {
    // Validate and normalize bank name
    const validatedBank = validateBankInput(mitraData.bankPengirim);
    if (validatedBank) {
      mitraData.bankPengirim = validatedBank;
    }

    // Create new mitra record
    const newMitra = await MitraModel.create({
      sistemKemitraan: mitraData.sistemKemitraan,
      jenisUsaha: mitraData.jenisUsaha,
      paketUsaha: mitraData.paketUsaha,
      namaMitra: mitraData.namaMitra,
      alamatMitra: mitraData.alamatMitra,
      noHp: mitraData.noHp,
      email: mitraData.email,
      fotoKTP: mitraData.fotoKTP || "",
      fotoNPWP: mitraData.fotoNPWP || "",
      fotoMitra: mitraData.fotoMitra || "",
      nilaiPaketUsaha: mitraData.nilaiPaket,
      hargaPaket: parseInt(mitraData.hargaPaket),
      nominalDP: parseInt(mitraData.nominalDP),
      nominalFull: parseInt(mitraData.nominalFull),
      kekurangan: parseInt(mitraData.kekurangan),
      diskonHarian: parseInt(mitraData.diskonHarian),
      yangHarusDibayar: parseInt(mitraData.yangHarusDibayar),
      buktiTransfer: mitraData.buktiTransfer || "",
      namaPengirim: mitraData.namaPengirim,
      noRekPengirim: mitraData.noRekPengirim,
      bankPengirim: mitraData.bankPengirim,
      status: "pending",
      isApproved: false,
    });

    return {
      success: true,
      mitraId: newMitra._id,
      message: "Pendaftaran mitra berhasil disimpan",
    };
  } catch (error) {
    console.error("Error registering mitra:", error);
    throw new Error("Gagal menyimpan data mitra");
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
