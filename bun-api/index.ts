import {
  DataAPIClient,
  CollectionInsertManyError,
} from "@datastax/astra-db-ts";

const client = new DataAPIClient("AstraCS:x407");
const database = client.db("https:/a-us-east-2.apps.astra.datastax.com");
const collection = database.collection("sagawacluster");

(async function () {
  try {
    const result = await collection.insertMany([
      {
        nama: "Uta",
        umur: 20,
      },
      {
        nama_user: "Mugi my Bini",
        hobi: "ngeteh",
        pesan: ["HIDUP BLONDE!"],
      },
    ]);

    console.log("Data berhasil masuk:", result);
  } catch (error) {
    if (error instanceof CollectionInsertManyError) {
      console.log("Berhasil:", error.insertedIds());
    } else {
      console.error("Terjadi kesalahan saat menyisipkan data:", error);
    }
  }
})();
