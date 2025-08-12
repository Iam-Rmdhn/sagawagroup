import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { generateToken } from "../utils/jwt";

export async function loginService(email: string, password: string) {
  const mitra = await User.findOne({ email });
  if (!mitra) throw new Error("Mitra tidak ditemukan");

  const isMatch = await bcrypt.compare(password, mitra.password);
  if (!isMatch) throw new Error("Kredensial tidak valid");

  const token = generateToken({ id: mitra._id, email: mitra.email });

  const { password: _, ...safeMitra } = mitra.toObject();

  return {
    user: safeMitra,
    token,
  };
}
