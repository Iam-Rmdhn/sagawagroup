import { User } from "../models/user.model";

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

  const count = await User.countDocuments({ jenisUsaha });
  const userID = `${prefix}${(count + 1).toString().padStart(4, "0")}`;

  return userID;
}

export async function approveMitra({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const mitra = await User.findOne({ _id: userId, email });
  if (!mitra) throw new Error("Mitra tidak ditemukan");

  if (!mitra.isApproved) {
    mitra.isApproved = true;
    mitra.userID = await generateUserID(mitra.jenisUsaha);
    await mitra.save();
  }

  return {
    userID: mitra.userID,
    nama: mitra.nama,
    jenisUsaha: mitra.jenisUsaha,
  };
}
