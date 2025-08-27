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
  mitraId: string;
  acceptedAt: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export class AgreementService {
  /**
   * Check if mitra has already accepted the agreement
   */
  static async hasAcceptedAgreement(mitraId: string): Promise<boolean> {
    try {
      console.log(`Checking agreement status for mitra: ${mitraId}`);

      const collection = await initializeAgreementCollection();
      const result = await collection.findOne({ mitraId });

      const hasAccepted = !!result;
      console.log(
        `Agreement status for ${mitraId}: ${
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
    }
  ): Promise<{ success: boolean; message: string; agreementId?: string }> {
    try {
      console.log(`Saving agreement for mitra: ${mitraId}`);

      // Check if already accepted
      const alreadyAccepted = await this.hasAcceptedAgreement(mitraId);
      if (alreadyAccepted) {
        console.log(`Agreement already exists for mitra: ${mitraId}`);
        return {
          success: true,
          message: "Agreement already accepted",
        };
      }

      // Insert new agreement record
      const collection = await initializeAgreementCollection();
      const agreementRecord: AgreementRecord = {
        mitraId,
        acceptedAt: data.acceptedAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
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
   * Get agreement details for a mitra
   */
  static async getAgreementDetails(
    mitraId: string
  ): Promise<AgreementRecord | null> {
    try {
      console.log(`Getting agreement details for mitra: ${mitraId}`);

      const collection = await initializeAgreementCollection();
      const result = (await collection.findOne({
        mitraId,
      })) as AgreementRecord | null;

      if (result) {
        console.log(`Agreement found for mitra: ${mitraId}`);
        return result;
      } else {
        console.log(`No agreement found for mitra: ${mitraId}`);
        return null;
      }
    } catch (error) {
      console.error("Error getting agreement details:", error);
      return null;
    }
  }
}
