import { crewCollection } from "./src/lib/db";
import * as bcrypt from "bcryptjs";

async function addPasswordToExistingCrew() {
  try {
    console.log(
      "Starting migration: Adding password field to existing crew records..."
    );

    // Find all crew records that don't have a password field
    const crewWithoutPassword = await crewCollection
      .find({
        password: { $exists: false },
      })
      .toArray();

    console.log(
      `Found ${crewWithoutPassword.length} crew records without password field`
    );

    if (crewWithoutPassword.length === 0) {
      console.log(
        "No crew records need password migration. All records already have password field."
      );
      return;
    }

    // Default password for existing crew (they should change this after first login)
    const defaultPassword = "password123";
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    // Update each crew record to add the password field
    const updatePromises = crewWithoutPassword.map(async (crew: any) => {
      return crewCollection.updateOne(
        { _id: crew._id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    console.log(
      `Successfully added password field to ${crewWithoutPassword.length} crew records`
    );
    console.log("Migration completed successfully!");
    console.log(`Default password set to: ${defaultPassword}`);
    console.log(
      "Please inform crew members to change their password after first login."
    );
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run the migration
addPasswordToExistingCrew()
  .then(() => {
    console.log("Migration script finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
