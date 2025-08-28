// Service to get mitra by email
import { MitraModel } from "../models/mitra.model";

export async function getMitraByEmail(email: string) {
  if (!email) return null;
  const mitra = await MitraModel.findOne({ email });
  return mitra;
}
