import { mitraLoginCollection } from "../lib/db";
import { getCurrentTimestamp } from "../utils/date";

export interface MitraLogin {
  _id?: string;
  email: string;
  password: string; // hashed password
  namaMitra: string;
  mitraId: string; // reference to mitra collection
  sales?: string;
  paketUsaha?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export class MitraLoginModel {
  static async create(
    loginData: Omit<MitraLogin, "_id" | "createdAt" | "updatedAt">
  ): Promise<MitraLogin> {
    const now = getCurrentTimestamp();
    // Pastikan email dinormalisasi sebelum simpan
    let normalizedEmail = loginData.email.trim().toLowerCase();
    try {
      // Gunakan validator jika tersedia
      const validator = await import("validator");
      normalizedEmail =
        validator.default.normalizeEmail(normalizedEmail) || normalizedEmail;
    } catch {}
    const newLogin: Omit<MitraLogin, "_id"> = {
      ...loginData,
      email: normalizedEmail,
      createdAt: now,
      updatedAt: now,
    };

    const result = await mitraLoginCollection.insertOne(newLogin);
    return { ...newLogin, _id: result.insertedId as string };
  }

  static async findByEmail(email: string): Promise<MitraLogin | null> {
    // Validasi dan normalisasi email (termasuk titik) dengan regex standar dan validator
    const emailRegex = /^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/;
    let cleanEmail = email.trim().toLowerCase();
    try {
      const validator = await import("validator");
      cleanEmail = validator.default.normalizeEmail(cleanEmail) || cleanEmail;
    } catch {}
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("Format email tidak valid");
    }
    // Ambil user dengan email sama persis (case-insensitive, tanpa $regex)
    const result = await mitraLoginCollection.findOne({ email: cleanEmail });
    if (result) return result as MitraLogin;
    // Jika tidak ketemu, fallback: cari semua dan bandingkan manual (untuk data lama)
    const all = await mitraLoginCollection.find({}).toArray();
    const found = all.find((u: any) => {
      let uEmail = (u.email || "").trim().toLowerCase();
      try {
        const validator = require("validator");
        uEmail = validator.normalizeEmail(uEmail) || uEmail;
      } catch {}
      return uEmail === cleanEmail;
    });
    return found ? (found as MitraLogin) : null;
  }

  static async findById(id: string): Promise<MitraLogin | null> {
    const result = await mitraLoginCollection.findOne({ _id: id });
    return result as MitraLogin | null;
  }

  static async findByMitraId(mitraId: string): Promise<MitraLogin | null> {
    const result = await mitraLoginCollection.findOne({ mitraId });
    return result as MitraLogin | null;
  }

  static async updateById(
    id: string,
    updates: Partial<Omit<MitraLogin, "_id" | "createdAt">>
  ): Promise<MitraLogin | null> {
    const now = getCurrentTimestamp();
    const updatedData = {
      ...updates,
      updatedAt: now,
    };

    const result = await mitraLoginCollection.updateOne(
      { _id: id },
      { $set: updatedData }
    );

    if (result.modifiedCount > 0) {
      return await this.findById(id);
    }
    return null;
  }

  static async updateLastLogin(email: string): Promise<void> {
    const now = getCurrentTimestamp();
    let cleanEmail = email.trim().toLowerCase();
    try {
      const validator = await import("validator");
      cleanEmail = validator.default.normalizeEmail(cleanEmail) || cleanEmail;
    } catch {}
    await mitraLoginCollection.updateOne(
      { email: cleanEmail },
      { $set: { lastLogin: now, updatedAt: now } }
    );
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await mitraLoginCollection.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  static async deleteByMitraId(mitraId: string): Promise<boolean> {
    const result = await mitraLoginCollection.deleteOne({ mitraId });
    return result.deletedCount > 0;
  }

  static async findAll(): Promise<MitraLogin[]> {
    const result = await mitraLoginCollection.find({}).toArray();
    return result as MitraLogin[];
  }

  static async countActive(): Promise<number> {
    const result = await mitraLoginCollection.find({ isActive: true });
    const docs = await result.toArray();
    return docs.length;
  }
}
