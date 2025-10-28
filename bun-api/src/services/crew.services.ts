import * as bcrypt from "bcryptjs";
import { CrewModel, type Crew } from "../models/crew.model";
import { generateToken } from "../utils/jwt";

// Login service untuk crew
export async function crewLoginService(email: string, password: string) {
  const crew = await CrewModel.findOne({ email });
  if (!crew) throw new Error("Email tidak terdaftar");

  if (crew.status !== "active") throw new Error("Akun tidak aktif");

  const isMatch = await bcrypt.compare(password, crew.password);
  if (!isMatch) throw new Error("Password salah");

  // Generate JWT token
  const token = generateToken({
    id: crew._id,
    email: crew.email,
    role: "crew",
  });

  // Remove password from response
  const { password: _, ...safeCrew } = crew;

  return {
    success: true,
    message: "Login berhasil",
    data: {
      token,
      user: safeCrew,
    },
  };
}

// Service untuk mendapatkan profile crew
export async function getCrewProfileService(crewId: string) {
  const crew = await CrewModel.findById(crewId);
  if (!crew) {
    throw new Error("Crew tidak ditemukan");
  }

  // Remove password from response
  const { password: _, ...safeCrew } = crew;

  return {
    success: true,
    data: safeCrew,
  };
}

// Service untuk mendapatkan semua crew (untuk admin)
export async function getAllCrewService() {
  const crews = await CrewModel.find({});

  // Remove passwords from response
  const safeCrews = crews.map(({ password: _, ...crew }) => crew);

  return {
    success: true,
    data: safeCrews,
    total: safeCrews.length,
  };
}
