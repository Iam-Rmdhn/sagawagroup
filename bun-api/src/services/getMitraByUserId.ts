// Service to get mitra by userID
import { MitraModel } from "../models/mitra.model";

export async function getMitraByUserId(userID: string) {
  if (!userID) return null;
  const mitra = await MitraModel.findOne({ userID });
  return mitra;
}
