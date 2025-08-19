import { adminCollection } from "../lib/db";

export interface Admin {
  _id?: string;
  email: string;
  password: string;
  nama: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminModel {
  static async create(
    adminData: Omit<Admin, "_id" | "createdAt" | "updatedAt">
  ): Promise<Admin> {
    const now = new Date();
    const admin: Admin = {
      ...adminData,
      role: adminData.role || "admin",
      createdAt: now,
      updatedAt: now,
    };

    const result = await adminCollection.insertOne(admin);
    return { ...admin, _id: result.insertedId as string };
  }

  static async findOne(filter: Partial<Admin>): Promise<Admin | null> {
    const result = await adminCollection.findOne(filter);
    return result as Admin | null;
  }

  static async findById(id: string): Promise<Admin | null> {
    const result = await adminCollection.findOne({ _id: id });
    return result as Admin | null;
  }

  static async updateOne(
    filter: Partial<Admin>,
    update: Partial<Admin>
  ): Promise<boolean> {
    const result = await adminCollection.updateOne(filter, {
      $set: {
        ...update,
        updatedAt: new Date(),
      },
    });
    return result.modifiedCount > 0;
  }

  static async deleteOne(filter: Partial<Admin>): Promise<boolean> {
    const result = await adminCollection.deleteOne(filter);
    return result.deletedCount > 0;
  }

  static async find(filter: Partial<Admin> = {}): Promise<Admin[]> {
    const cursor = adminCollection.find(filter);
    const result = await cursor.toArray();
    return result as Admin[];
  }
}
