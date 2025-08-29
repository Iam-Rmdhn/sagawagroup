import { mitraPelunasanCollection } from "../lib/db";
import { getCurrentTimestamp } from "../utils/date";

export interface MitraPelunasan {
  _id?: string;
  namaMitra: string;
  alamatMitra: string;
  noHp: string;
  email: string;
  paketUsaha: string;
  nominalPelunasan: number;
  namaPengirim: string;
  noRekPengirim: string;
  bankPengirim: string;
  buktiTransfer: string; // URL/filepath
  statusPelunasan?: string; // 'lunas' | 'belum' | undefined
  createdAt: string;
  updatedAt: string;
}

export class MitraPelunasanModel {
  static async create(
    data: Omit<MitraPelunasan, "_id" | "createdAt" | "updatedAt">
  ): Promise<MitraPelunasan> {
    const now = getCurrentTimestamp();
    const newData: Omit<MitraPelunasan, "_id"> = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const result = await mitraPelunasanCollection.insertOne(newData);
    return { ...newData, _id: result.insertedId as string };
  }

  static async findOne(
    filter: Partial<MitraPelunasan>
  ): Promise<MitraPelunasan | null> {
    const result = await mitraPelunasanCollection.findOne(filter);
    return result as MitraPelunasan | null;
  }

  static async findById(id: string): Promise<MitraPelunasan | null> {
    const result = await mitraPelunasanCollection.findOne({ _id: String(id) });
    return result as MitraPelunasan | null;
  }

  static async updateOne(
    filter: Partial<MitraPelunasan>,
    update: Partial<MitraPelunasan>
  ): Promise<boolean> {
    const result = await mitraPelunasanCollection.updateOne(filter, {
      $set: {
        ...update,
        updatedAt: getCurrentTimestamp(),
      },
    });
    return result.modifiedCount > 0;
  }

  static async save(pelunasan: MitraPelunasan): Promise<MitraPelunasan> {
    if (pelunasan._id) {
      await this.updateOne({ _id: pelunasan._id }, pelunasan);
      return pelunasan;
    } else {
      return await this.create(pelunasan);
    }
  }

  static async find(
    filter: Partial<MitraPelunasan> = {}
  ): Promise<MitraPelunasan[]> {
    const result = await mitraPelunasanCollection.find(filter).toArray();
    return result as MitraPelunasan[];
  }

  static async deleteOne(filter: Partial<MitraPelunasan>): Promise<boolean> {
    const result = await mitraPelunasanCollection.deleteOne(filter);
    return result.deletedCount > 0;
  }

  static async updateById(
    id: string,
    updates: Partial<Omit<MitraPelunasan, "_id" | "createdAt">>
  ): Promise<MitraPelunasan | null> {
    const now = getCurrentTimestamp();
    const updatedData = {
      ...updates,
      updatedAt: now,
    };
    const result = await mitraPelunasanCollection.updateOne(
      { _id: String(id) },
      { $set: updatedData }
    );
    if (result.modifiedCount > 0) {
      return await this.findById(id);
    }
    return null;
  }

  static async findByEmail(email: string): Promise<MitraPelunasan[]> {
    return (await mitraPelunasanCollection
      .find({ email })
      .toArray()) as MitraPelunasan[];
  }

  static async findAll(): Promise<MitraPelunasan[]> {
    return (await mitraPelunasanCollection
      .find({})
      .toArray()) as MitraPelunasan[];
  }
}
