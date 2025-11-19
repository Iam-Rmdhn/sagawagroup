import dotenv from "dotenv";
import path from "path";

// Load environment variables based on NODE_ENV
// This will automatically load .env.development or .env.production
const nodeEnv = process.env.NODE_ENV || "development";

// Determine which environment file to load
const envFile =
  nodeEnv === "production" ? ".env.production" : ".env.development";

// Try multiple paths for the environment file
const possiblePaths = [
  path.resolve(process.cwd(), envFile),
  path.resolve(process.cwd(), "..", envFile),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env"),
];

let result: dotenv.DotenvConfigOutput = {};
for (const envPath of possiblePaths) {
  result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`Loaded environment variables from: ${envPath}`);
    break;
  }
}

// Check if the environment file was loaded successfully
if (result.error) {
  console.warn(
    `Warning: Could not load ${envFile} or .env from common locations, using default environment variables`
  );
}

// Function to get required environment variables
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

// Function to get environment variables with defaults
function getEnvVar(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

function getOptionalEnvVar(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

// Function to parse comma-separated values
function parseArray(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

// Function to parse boolean values
function parseBoolean(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

// Validate NODE_ENV
const VALID_NODE_ENVS = ["development", "production", "test"];
if (!VALID_NODE_ENVS.includes(nodeEnv)) {
  throw new Error(`NODE_ENV must be one of: ${VALID_NODE_ENVS.join(", ")}`);
}

// Validate and parse PORT
const port = getEnvVar("PORT", nodeEnv === "production" ? "5000" : "3000");
const portNum = parseInt(port, 10);
if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
  throw new Error("PORT must be a valid number between 1 and 65535");
}

// Supabase storage configuration
const supabaseStorageEnabled = parseBoolean(
  process.env.SUPABASE_STORAGE_ENABLED,
  false
);

const supabaseEndpoint = getOptionalEnvVar("SUPABASE_STORAGE_ENDPOINT") ?? "";
const supabasePublicUrl =
  getOptionalEnvVar("SUPABASE_STORAGE_PUBLIC_URL") ?? "";
const supabaseBucket =
  getOptionalEnvVar("SUPABASE_STORAGE_BUCKET") ?? "mitraPhotos";
const supabaseRegion =
  getOptionalEnvVar("SUPABASE_STORAGE_REGION") ?? "us-east-1";
const supabaseAccessKey = getOptionalEnvVar("SUPABASE_STORAGE_ACCESS_KEY");
const supabaseSecretKey = getOptionalEnvVar("SUPABASE_STORAGE_SECRET_KEY");

if (supabaseStorageEnabled) {
  const missing: string[] = [];
  if (!supabaseEndpoint) missing.push("SUPABASE_STORAGE_ENDPOINT");
  if (!supabasePublicUrl) missing.push("SUPABASE_STORAGE_PUBLIC_URL");
  if (!supabaseBucket) missing.push("SUPABASE_STORAGE_BUCKET");
  if (!supabaseRegion) missing.push("SUPABASE_STORAGE_REGION");
  if (!supabaseAccessKey) missing.push("SUPABASE_STORAGE_ACCESS_KEY");
  if (!supabaseSecretKey) missing.push("SUPABASE_STORAGE_SECRET_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Supabase storage enabled but missing required env vars: ${missing.join(
        ", "
      )}`
    );
  }
}

// // Google Drive configuration
// const googleDriveEnabled = parseBoolean(
//   process.env.GOOGLE_DRIVE_ENABLED,
//   false
// );

// const googleDriveServiceAccountKeyPath = getEnvVar(
//   "GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_PATH",
//   "./service-account-key.json"
// );
// const googleDriveFolderId = getOptionalEnvVar("GOOGLE_DRIVE_FOLDER_ID") ?? "";

// if (googleDriveEnabled && !googleDriveFolderId) {
//   throw new Error(
//     "Google Drive enabled but GOOGLE_DRIVE_FOLDER_ID is not set"
//   );
// }

// Export the environment configuration
export const ENV = {
  NODE_ENV: nodeEnv,
  PORT: portNum,
  BASE_URL: getEnvVar(
    "BASE_URL",
    nodeEnv === "production"
      ? "https://www.sagawagroup.id"
      : "http://localhost:3000"
  ),
  CORS_ORIGIN: parseArray(process.env.CORS_ORIGIN),
  CORS_CREDENTIALS: parseBoolean(process.env.CORS_CREDENTIALS, false),
  JWT_SECRET: getRequiredEnvVar("JWT_SECRET"),
  ASTRA_DB_APPLICATION_TOKEN: getRequiredEnvVar("ASTRA_DB_APPLICATION_TOKEN"),
  ASTRA_DB_API_ENDPOINT: getRequiredEnvVar("ASTRA_DB_API_ENDPOINT"),
  PUBLIC_API_URL: getEnvVar(
    "PUBLIC_API_URL",
    nodeEnv === "production"
      ? "https://www.sagawagroup.id"
      : "http://localhost:3000"
  ),
  LOG_LEVEL: getEnvVar(
    "LOG_LEVEL",
    nodeEnv === "production" ? "info" : "debug"
  ),
  SUPABASE_STORAGE_ENABLED: supabaseStorageEnabled,
  SUPABASE_STORAGE_ENDPOINT: supabaseEndpoint,
  SUPABASE_STORAGE_PUBLIC_URL: supabasePublicUrl,
  SUPABASE_STORAGE_BUCKET: supabaseBucket,
  SUPABASE_STORAGE_REGION: supabaseRegion,
  SUPABASE_STORAGE_ACCESS_KEY: supabaseAccessKey,
  SUPABASE_STORAGE_SECRET_KEY: supabaseSecretKey,
  // GOOGLE_DRIVE_ENABLED: googleDriveEnabled,
  // GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_PATH: googleDriveServiceAccountKeyPath,
  // GOOGLE_DRIVE_FOLDER_ID: googleDriveFolderId,
};

// Log environment info in development
if (nodeEnv === "development") {
  console.log(`Loaded environment variables from: ${envFile}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);
  console.log(`Port: ${ENV.PORT}`);
}
