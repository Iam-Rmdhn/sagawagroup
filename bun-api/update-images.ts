import { initializeCollections } from "./src/lib/db";
import { MitraModel } from "./src/models/mitra.model";

// Sample image URLs for demo (KTP dan Transfer saja)
const sampleImages = {
  ktp: "http://localhost:5000/uploads/sample-ktp.jpg",
  transfer: "http://localhost:5000/uploads/sample-transfer.jpg",
};

async function updateMitraImages() {
  try {
    console.log("Updating mitra images to URL format...");
    3;

    // Initialize database connection
    await initializeCollections();

    // Get all mitra records
    const mitras = await MitraModel.find({});
    console.log(`Found ${mitras.length} mitra records`);

    let updated = 0;
    for (const mitra of mitras) {
      const updates: any = {};

      // Convert base64 or filename to URL format
      if (mitra.fotoKTP && !mitra.fotoKTP.startsWith("http")) {
        if (mitra.fotoKTP.startsWith("uploaded:")) {
          // Convert uploaded:filename to URL
          const filename = mitra.fotoKTP.replace("uploaded:", "");
          updates.fotoKTP = `http://localhost:5000/uploads/${filename}`;
        } else if (mitra.fotoKTP.startsWith("data:")) {
          // Replace base64 with sample URL
          updates.fotoKTP = sampleImages.ktp;
        } else if (mitra.fotoKTP.includes(".")) {
          // Plain filename to URL
          updates.fotoKTP = `http://localhost:5000/uploads/${mitra.fotoKTP}`;
        }
      }

      if (mitra.buktiTransfer && !mitra.buktiTransfer.startsWith("http")) {
        if (mitra.buktiTransfer.startsWith("uploaded:")) {
          // Convert uploaded:filename to URL
          const filename = mitra.buktiTransfer.replace("uploaded:", "");
          updates.buktiTransfer = `http://localhost:5000/uploads/${filename}`;
        } else if (mitra.buktiTransfer.startsWith("data:")) {
          // Replace base64 with sample URL
          updates.buktiTransfer = sampleImages.transfer;
        } else if (mitra.buktiTransfer.includes(".")) {
          // Plain filename to URL
          updates.buktiTransfer = `http://localhost:5000/uploads/${mitra.buktiTransfer}`;
        }
      }

      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        await MitraModel.updateOne({ _id: mitra._id }, updates);
        console.log(
          `Updated mitra: ${mitra.namaMitra} with URLs:`,
          Object.keys(updates)
        );
        updated++;
      }
    }

    console.log(`Successfully updated ${updated} mitra records to URL format`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating images:", error);
    process.exit(1);
  }
}

// Run the update
updateMitraImages();
