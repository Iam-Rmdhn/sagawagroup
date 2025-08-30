import { Collection } from "@datastax/astra-db-ts";

// We'll create a separate collection for agreements
let agreementCollection: Collection | null = null;

// Initialize agreement collection
const initializeAgreementCollection = async () => {
  if (!agreementCollection) {
    const { DataAPIClient } = await import("@datastax/astra-db-ts");
    const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
    const database = client.db(process.env.ASTRA_DB_API_ENDPOINT!);

    // Create collection if it doesn't exist
    const collections = await database.listCollections();
    if (!collections.some((col) => col.name === "mitra_agreements")) {
      await database.createCollection("mitra_agreements");
      console.log("Created 'mitra_agreements' collection");
    }

    agreementCollection = database.collection("mitra_agreements");
  }
  return agreementCollection;
};

export interface AgreementRecord {
  _id?: string;
  namaMitra: string;
  noHp: string;
  email: string;
  sistemKemitraan: string;
  alamat: string;
  nilaiPaketUsaha: string;
  acceptedAt: string;
  createdAt: string;
  updatedAt: string;
}

export class AgreementService {
  /**
   * Check if mitra has already accepted the agreement by email
   */
  static async hasAcceptedAgreement(email: string): Promise<boolean> {
    try {
      console.log(`Checking agreement status for email: ${email}`);

      const collection = await initializeAgreementCollection();
      const result = await collection.findOne({ email });

      const hasAccepted = !!result;
      console.log(
        `Agreement status for ${email}: ${
          hasAccepted ? "ACCEPTED" : "NOT ACCEPTED"
        }`
      );
      return hasAccepted;
    } catch (error) {
      console.error("Error checking agreement status:", error);
      return false;
    }
  }

  /**
   * Save mitra's agreement acceptance
   */
  static async acceptAgreement(
    mitraId: string,
    data: {
      acceptedAt: string;
      userAgent?: string;
      ipAddress?: string;
      namaMitra?: string;
      noHp?: string;
      email?: string;
      sistemKemitraan?: string;
      alamat?: string;
      nilaiPaketUsaha?: string;
      agreementVersion?: string;
      agreementContent?: {
        title: string;
        signatureDeclaration: string;
        acceptedTerms: boolean;
      };
    }
  ): Promise<{ success: boolean; message: string; agreementId?: string }> {
    try {
      console.log(`Saving agreement for mitra: ${mitraId}`);

      const collection = await initializeAgreementCollection();

      // Check if already accepted
      const existingAgreement = (await collection.findOne({
        mitraId,
      })) as AgreementRecord | null;

      if (existingAgreement) {
        console.log(
          `Agreement already exists for mitra: ${mitraId}, updating mitra information`
        );

        // Update existing agreement with new mitra information
        const updateData = {
          updatedAt: new Date().toISOString(),
          namaMitra: data.namaMitra || existingAgreement.namaMitra || "",
          noHp: data.noHp || existingAgreement.noHp || "",
          email: data.email || existingAgreement.email || "",
          sistemKemitraan:
            data.sistemKemitraan || existingAgreement.sistemKemitraan || "",
          alamat: data.alamat || existingAgreement.alamat || "",
          nilaiPaketUsaha:
            data.nilaiPaketUsaha || existingAgreement.nilaiPaketUsaha || "",
        };

        const updateResult = await collection.updateOne(
          { mitraId },
          { $set: updateData }
        );

        if (updateResult.modifiedCount > 0) {
          console.log(`Agreement updated successfully for mitra: ${mitraId}`);
          return {
            success: true,
            message: "Agreement updated with new mitra information",
            agreementId: String(existingAgreement._id),
          };
        } else {
          console.log(`No changes made to agreement for mitra: ${mitraId}`);
          return {
            success: true,
            message: "Agreement already up to date",
            agreementId: String(existingAgreement._id),
          };
        }
      }

      // Insert new agreement record with complete mitra information
      const agreementRecord: AgreementRecord = {
        namaMitra: data.namaMitra || "",
        noHp: data.noHp || "",
        email: data.email || "",
        sistemKemitraan: data.sistemKemitraan || "",
        alamat: data.alamat || "",
        nilaiPaketUsaha: data.nilaiPaketUsaha || "",
        acceptedAt: data.acceptedAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await collection.insertOne(agreementRecord);

      if (result.insertedId) {
        console.log(
          `Agreement saved successfully for mitra: ${mitraId}, ID: ${result.insertedId}`
        );
        return {
          success: true,
          message: "Agreement accepted successfully",
          agreementId: String(result.insertedId),
        };
      } else {
        throw new Error("Failed to insert agreement record");
      }
    } catch (error) {
      console.error("Error saving agreement:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to save agreement",
      };
    }
  }

  /**
   * Get agreement details for a mitra by email
   */
  static async getAgreementDetails(
    email: string
  ): Promise<AgreementRecord | null> {
    try {
      console.log(`Getting agreement details for email: ${email}`);

      const collection = await initializeAgreementCollection();
      const result = (await collection.findOne({
        email,
      })) as AgreementRecord | null;

      if (result) {
        console.log(`Agreement found for email: ${email}`);
        return result;
      } else {
        console.log(`No agreement found for email: ${email}`);
        return null;
      }
    } catch (error) {
      console.error("Error getting agreement details:", error);
      return null;
    }
  }

  /**
   * Get all agreements (admin function)
   */
  static async getAllAgreements(): Promise<AgreementRecord[]> {
    try {
      console.log(`Getting all agreements`);

      const collection = await initializeAgreementCollection();
      const cursor = await collection.find({});
      const agreements = await cursor.toArray();

      console.log(`Found ${agreements.length} agreements`);
      return agreements as AgreementRecord[];
    } catch (error) {
      console.error("Error getting all agreements:", error);
      return [];
    }
  }
}
