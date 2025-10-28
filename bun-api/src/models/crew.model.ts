import { crewCollection } from "../lib/db";
import { getCurrentTimestamp } from "../utils/date";

export interface Crew {
  _id?: string;
  nama: string;
  email: string;
  password: string;
  divisi:
    | "IT & Digital"
    | "Finance"
    | "Digital Marketing"
    | "Produksi"
    | "Supervisor"
    | "Crew";
  kemitraan?: string | null;
  subBrand?: string | null;
  outlet?: string | null;
  nomorHP: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export class CrewModel {
  static async create(
    crewData: Omit<Crew, "_id" | "createdAt" | "updatedAt">
  ): Promise<Crew> {
    const now = getCurrentTimestamp();
    const crew: Crew = {
      ...crewData,
      status: crewData.status || "active",
      kemitraan: crewData.kemitraan || null,
      subBrand: crewData.subBrand || null,
      outlet: crewData.outlet || null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await crewCollection.insertOne(crew);
    return { ...crew, _id: result.insertedId as string };
  }

  static async findOne(filter: Partial<Crew>): Promise<Crew | null> {
    const result = await crewCollection.findOne(filter);
    return result as Crew | null;
  }

  static async findById(id: string): Promise<Crew | null> {
    const result = await crewCollection.findOne({ _id: id });
    return result as Crew | null;
  }

  static async find(filter: Partial<Crew> = {}): Promise<Crew[]> {
    const result = await crewCollection.find(filter).toArray();
    return result as Crew[];
  }

  static async updateOne(
    filter: Partial<Crew>,
    update: Partial<Crew>
  ): Promise<boolean> {
    const result = await crewCollection.updateOne(filter, {
      $set: {
        ...update,
        updatedAt: getCurrentTimestamp(),
      },
    });
    return result.modifiedCount > 0;
  }

  static async updateById(
    id: string,
    updates: Partial<Omit<Crew, "_id" | "createdAt">>
  ): Promise<Crew | null> {
    const now = getCurrentTimestamp();
    const updatedData = {
      ...updates,
      updatedAt: now,
    };

    const result = await crewCollection.updateOne(
      { _id: id },
      { $set: updatedData }
    );

    if (result.modifiedCount > 0) {
      return await this.findById(id);
    }
    return null;
  }

  static async deleteOne(filter: Partial<Crew>): Promise<boolean> {
    const result = await crewCollection.deleteOne(filter);
    return result.deletedCount > 0;
  }

  static async deleteById(id: string): Promise<boolean> {
    return await this.deleteOne({ _id: id });
  }

  static async countDocuments(filter: Partial<Crew> = {}): Promise<number> {
    const result = await crewCollection.find(filter).toArray();
    return result.length;
  }

  static async save(crew: Crew): Promise<Crew> {
    if (crew._id) {
      await this.updateOne({ _id: crew._id }, crew);
      return crew;
    } else {
      return await this.create(crew);
    }
  }
}
