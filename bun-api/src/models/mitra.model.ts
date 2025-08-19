import { mitraCollection } from "../lib/db";
import { getCurrentTimestamp } from "../utils/date";

export interface Mitra {
  _id?: string;
  // Data Step 1
  sistemKemitraan: "Autopilot" | "Semi Autopilot" | "Self Managed";
  sales: string;
  paketUsaha: string;

  // Data Diri Mitra
  namaMitra: string;
  alamatMitra: string;
  noHp: string;
  email: string;

  // File uploads
  fotoKTP: string;

  // Nilai Paket Usaha
  nilaiPaketUsaha: "DP" | "Full Payment";
  hargaPaket: number;
  nominalDP: number;
  nominalFull: number;
  kekurangan: number;
  diskonHarian: number;
  yangHarusDibayar: number;

  // Bukti Transfer
  buktiTransfer: string;

  // Sumber Dana
  namaPengirim: string;
  noRekPengirim: string;
  bankPengirim: string;

  // Status
  status: "pending" | "approved" | "rejected";
  userID?: string;
  isApproved: boolean;

  // Timestamps
  createdAt: string; // Use ISO string format for AstraDB compatibility
  updatedAt: string;
}

export class MitraModel {
  static async create(
    mitraData: Omit<Mitra, "_id" | "createdAt" | "updatedAt">
  ): Promise<Mitra> {
    const now = getCurrentTimestamp(); // Use utility function
    const mitra: Mitra = {
      ...mitraData,
      status: mitraData.status || "pending",
      isApproved: mitraData.isApproved || false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await mitraCollection.insertOne(mitra);
    return { ...mitra, _id: result.insertedId as string };
  }

  static async findOne(filter: Partial<Mitra>): Promise<Mitra | null> {
    const result = await mitraCollection.findOne(filter);
    return result as Mitra | null;
  }

  static async findById(id: string): Promise<Mitra | null> {
    const result = await mitraCollection.findOne({ _id: id });
    return result as Mitra | null;
  }

  static async updateOne(
    filter: Partial<Mitra>,
    update: Partial<Mitra>
  ): Promise<boolean> {
    const result = await mitraCollection.updateOne(filter, {
      $set: {
        ...update,
        updatedAt: getCurrentTimestamp(), // Use utility function
      },
    });
    return result.modifiedCount > 0;
  }

  static async countDocuments(filter: Partial<Mitra> = {}): Promise<number> {
    const result = await mitraCollection.find(filter).toArray();
    return result.length;
  }

  static async save(mitra: Mitra): Promise<Mitra> {
    if (mitra._id) {
      await this.updateOne({ _id: mitra._id }, mitra);
      return mitra;
    } else {
      return await this.create(mitra);
    }
  }

  static async find(filter: Partial<Mitra> = {}): Promise<Mitra[]> {
    const result = await mitraCollection.find(filter).toArray();
    return result as Mitra[];
  }

  static async deleteOne(filter: Partial<Mitra>): Promise<boolean> {
    const result = await mitraCollection.deleteOne(filter);
    return result.deletedCount > 0;
  }
}
