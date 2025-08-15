import { DataAPIClient } from "@datastax/astra-db-ts";
import dotenv from "dotenv";

dotenv.config();

// AstraDB configuration
const ASTRA_DB_APPLICATION_TOKEN =
  process.env.ASTRA_DB_APPLICATION_TOKEN ||
  "AstraCS:GcAHBNyZJEGUYJkYkEiJRXbr:c5a57f749b2bd125acb835fa98b1bcf8af879b8dad1876778696b5a2788d4407";
const ASTRA_DB_API_ENDPOINT =
  process.env.ASTRA_DB_API_ENDPOINT ||
  "https://a1971aa5-5930-4854-82ef-747bd405cc0a-us-east-2.apps.astra.datastax.com";

// Initialize DataStax Astra DB client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const database = client.db(ASTRA_DB_API_ENDPOINT);

// Initialize collections
export const initializeCollections = async () => {
  try {
    // Create collections if they don't exist
    const collections = await database.listCollections();
    console.log("Existing collections:", collections);

    // Create users collection
    if (!collections.some((col) => col.name === "users")) {
      await database.createCollection("users");
      console.log("Created 'users' collection");
    }

    // Create mitra collection
    if (!collections.some((col) => col.name === "mitra")) {
      await database.createCollection("mitra");
      console.log("Created 'mitra' collection");
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

// Export collections
export const usersCollection = database.collection("users");
export const mitraCollection = database.collection("mitra");

// Initialize on startup
(async () => {
  try {
    await initializeCollections();
    console.log("Connected to AstraDB successfully");
  } catch (error) {
    console.error("Failed to connect to AstraDB:", error);
  }
})();
