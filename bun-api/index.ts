import {
  DataAPIClient,
  CollectionInsertManyError,
} from "@datastax/astra-db-ts";

const client = new DataAPIClient(
  "AstraCS:GcAHBNyZJEGUYJkYkEiJRXbr:c5a57f749b2bd125acb835fa98b1bcf8af879b8dad1876778696b5a2788d4407"
);
const database = client.db(
  "https://a1971aa5-5930-4854-82ef-747bd405cc0a-us-east-2.apps.astra.datastax.com"
);
const collection = database.collection("sagawacluster");

(async function () {
  try {
    const result = await collection.insertMany([
      {
        nama: "Mugi my kisah",
        umur: 20,
      },
      {
        nama_user: "Mugi Blonde",
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
