import { DataAPIClient } from "@datastax/astra-db-ts";

const client = new DataAPIClient("AstraCS:x407");
const db = client.db("https:/a-us-east-2.apps.astra.datastax.com");

(async () => {
  const colls = await db.listCollections();
  console.log("Connected to AstraDB:", colls);
})();
