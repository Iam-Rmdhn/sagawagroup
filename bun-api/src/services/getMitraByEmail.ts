// Service to get mitra by email
import { MitraModel } from "../models/mitra.model";
import { UserModel } from "../models/user.model";

export async function getMitraByEmail(email: string) {
  if (!email) return null;
  const mitra = await MitraModel.findOne({ email });
  if (!mitra) return null;
  // Ambil status pelunasan dari user
  const user = await UserModel.findOne({ email });
  if (user) {
    mitra.isPaidOff = user.isPaidOff || false;
    mitra.statusPelunasan = user.statusPelunasan || "";
  }
  return mitra;
}
