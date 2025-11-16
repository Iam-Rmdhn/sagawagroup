/**
 * Test Supabase Storage Connection
 * Script untuk verifikasi konfigurasi Supabase Storage
 */

import { ENV } from "./src/env";
import {
  uploadFileToSupabase,
  isSupabaseStorageEnabled,
} from "./src/utils/supabaseStorage";

console.log("\n🔍 Testing Supabase Storage Configuration...\n");

// Step 1: Check if Supabase is enabled
console.log("Step 1: Checking Supabase Storage status");
console.log(`  SUPABASE_STORAGE_ENABLED: ${ENV.SUPABASE_STORAGE_ENABLED}`);

if (!isSupabaseStorageEnabled()) {
  console.log("\n❌ Supabase Storage is NOT enabled");
  console.log("\nTo enable:");
  console.log("  1. Set SUPABASE_STORAGE_ENABLED=true in .env file");
  console.log("  2. Configure all required environment variables");
  process.exit(1);
}

console.log("  ✅ Supabase Storage is enabled\n");

// Step 2: Check configuration
console.log("Step 2: Checking environment variables");
console.log(
  `  SUPABASE_STORAGE_ENDPOINT: ${ENV.SUPABASE_STORAGE_ENDPOINT || "NOT SET"}`
);
console.log(
  `  SUPABASE_STORAGE_BUCKET: ${ENV.SUPABASE_STORAGE_BUCKET || "NOT SET"}`
);
console.log(
  `  SUPABASE_STORAGE_REGION: ${ENV.SUPABASE_STORAGE_REGION || "NOT SET"}`
);
console.log(
  `  SUPABASE_STORAGE_PUBLIC_URL: ${
    ENV.SUPABASE_STORAGE_PUBLIC_URL || "NOT SET"
  }`
);

// Mask keys for security
const maskKey = (key?: string) => {
  if (!key) return "NOT SET";
  if (key.length < 20) return "INVALID (too short)";
  return `${key.substring(0, 15)}...${key.substring(key.length - 10)}`;
};

console.log(
  `  SUPABASE_STORAGE_ACCESS_KEY: ${maskKey(ENV.SUPABASE_STORAGE_ACCESS_KEY)}`
);
console.log(
  `  SUPABASE_STORAGE_SECRET_KEY: ${maskKey(ENV.SUPABASE_STORAGE_SECRET_KEY)}`
);

// Check for missing configuration
const missingVars: string[] = [];
if (!ENV.SUPABASE_STORAGE_ENDPOINT)
  missingVars.push("SUPABASE_STORAGE_ENDPOINT");
if (!ENV.SUPABASE_STORAGE_BUCKET) missingVars.push("SUPABASE_STORAGE_BUCKET");
if (!ENV.SUPABASE_STORAGE_REGION) missingVars.push("SUPABASE_STORAGE_REGION");
if (!ENV.SUPABASE_STORAGE_PUBLIC_URL)
  missingVars.push("SUPABASE_STORAGE_PUBLIC_URL");
if (!ENV.SUPABASE_STORAGE_ACCESS_KEY)
  missingVars.push("SUPABASE_STORAGE_ACCESS_KEY");
if (!ENV.SUPABASE_STORAGE_SECRET_KEY)
  missingVars.push("SUPABASE_STORAGE_SECRET_KEY");

if (missingVars.length > 0) {
  console.log("\n❌ Missing required environment variables:");
  missingVars.forEach((v) => console.log(`   - ${v}`));
  console.log("\nPlease set these in your .env file");
  process.exit(1);
}

console.log("  ✅ All environment variables are set\n");

// Step 3: Test upload
console.log("Step 3: Testing file upload to Supabase");
console.log("  Creating test file...");

// Create a test image file (1x1 pixel PNG)
const testImageData = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02,
  0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44,
  0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01,
  0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

const testFile = new File([testImageData], "test-upload.png", {
  type: "image/png",
});
console.log(`  Test file created: ${testFile.name} (${testFile.size} bytes)`);

console.log("  Uploading to Supabase Storage...");

try {
  const result = await uploadFileToSupabase(testFile, {
    prefix: "test",
  });

  console.log("\n✅ Upload successful!");
  console.log(`  File key: ${result.key}`);
  console.log(`  Public URL: ${result.publicUrl}`);

  console.log("\n🎉 Supabase Storage is working correctly!");
  console.log("\nYou can verify the file at:");
  console.log(`  ${result.publicUrl}`);

  console.log("\n📝 Next steps:");
  console.log(
    "  1. Check if the file appears in Supabase Dashboard > Storage > mitraPhotos"
  );
  console.log("  2. Try uploading a real file from the form");
  console.log("  3. Delete the test file from bucket if needed");

  process.exit(0);
} catch (error) {
  console.log("\n❌ Upload failed!");
  console.error(
    `  Error: ${error instanceof Error ? error.message : String(error)}`
  );

  if (error instanceof Error && error.message.includes("InvalidAccessKeyId")) {
    console.log("\n🔧 Solution:");
    console.log("  1. Go to Supabase Dashboard: https://app.supabase.com");
    console.log("  2. Select your project");
    console.log("  3. Go to Settings > API");
    console.log("  4. Copy the 'anon' key and 'service_role' key");
    console.log("  5. Update your .env file:");
    console.log("     SUPABASE_STORAGE_ACCESS_KEY=<anon_key>");
    console.log("     SUPABASE_STORAGE_SECRET_KEY=<service_role_key>");
    console.log("  6. Restart the server and run this test again");
  } else if (
    error instanceof Error &&
    error.message.includes("Access denied")
  ) {
    console.log("\n🔧 Solution:");
    console.log("  1. Go to Supabase Dashboard > Storage > mitraPhotos");
    console.log("  2. Click 'Policies' tab");
    console.log("  3. Add policies to allow service_role to upload");
    console.log("  4. Make sure bucket is set as 'Public'");
  }

  console.log("\n📖 For detailed setup guide, see:");
  console.log(
    "  /root/web_company_profile/sagawagroup/bun-api/SETUP-SUPABASE-STORAGE.md"
  );

  process.exit(1);
}
