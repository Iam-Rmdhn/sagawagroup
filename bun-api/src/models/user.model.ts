import { usersCollection } from "../lib/db";

export interface User {
  _id?: string;
  email: string;
  password: string;
  nama: string;
  sales: string;
  userID?: string;
  isApproved: boolean;
  isPaidOff?: boolean;
  statusPelunasan?: string; // 'lunas' | 'belum' | undefined
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  static async create(
    userData: Omit<User, "_id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    const now = new Date();
    const user: User = {
      ...userData,
      isApproved: userData.isApproved || false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await usersCollection.insertOne(user);
    return { ...user, _id: result.insertedId as string };
  }

  static async findOne(filter: Partial<User>): Promise<User | null> {
    const result = await usersCollection.findOne(filter);
    return result as User | null;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await usersCollection.findOne({ _id: id });
    return result as User | null;
  }

  static async updateOne(
    filter: Partial<User>,
    update: Partial<User>
  ): Promise<boolean> {
    const result = await usersCollection.updateOne(filter, {
      $set: {
        ...update,
        updatedAt: new Date(),
      },
    });
    return result.modifiedCount > 0;
  }

  static async countDocuments(filter: Partial<User> = {}): Promise<number> {
    return await usersCollection.estimatedDocumentCount();
  }

  static async save(user: User): Promise<User> {
    if (user._id) {
      await this.updateOne({ _id: user._id }, user);
      return user;
    } else {
      return await this.create(user);
    }
  }
}
