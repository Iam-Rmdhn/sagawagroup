import bcrypt from "bcryptjs";
import { UserModel, type User } from "../models/user.model";
import { generateToken } from "../utils/jwt";

export async function loginService(email: string, password: string) {
  const mitra = await UserModel.findOne({ email });
  if (!mitra) throw new Error("Mitra tidak ditemukan");

  const isMatch = await bcrypt.compare(password, mitra.password);
  if (!isMatch) throw new Error("Kredensial tidak valid");

  const token = generateToken({ id: mitra._id, email: mitra.email });

  // Remove password from response
  const { password: _, ...safeMitra } = mitra;

  return {
    user: safeMitra,
    token,
  };
}
