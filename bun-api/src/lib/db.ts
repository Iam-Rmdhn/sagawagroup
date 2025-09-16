import { DataAPIClient } from "@datastax/astra-db-ts";
import * as dotenv from "dotenv";

dotenv.config();

// AstraDB configuration
const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;
const ASTRA_DB_API_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;

if (!ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_API_ENDPOINT) {
  throw new Error("Database credentials not found in environment variables");
}

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

    if (!collections.some((col) => col.name === "admin_login")) {
      await database.createCollection("admin_login");
      console.log("Created 'admin_login' collection");
    }

    // Create mitra_pelunasan collection
    if (!collections.some((col) => col.name === "mitra_pelunasan")) {
      await database.createCollection("mitra_pelunasan");
      console.log("Created 'mitra_pelunasan' collection");
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
export const adminCollection = database.collection("admin_login");
export const mitraLoginCollection = database.collection("mitra_login");
export const mitraPelunasanCollection = database.collection("mitra_pelunasan");

// Initialize on startup
(async () => {
  try {
    await initializeCollections();
    console.log("Connected to AstraDB successfully");
  } catch (error) {
    console.error("Failed to connect to AstraDB:", error);
  }
})();
