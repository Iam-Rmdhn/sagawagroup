import dotenv from "dotenv";
import path from "path";

// Load environment variables based on NODE_ENV
// This will automatically load .env.development or .env.production
const nodeEnv = process.env.NODE_ENV || "development";

// Determine which environment file to load
const envFile = 
  nodeEnv === "production" 
    ? ".env.production" 
    : ".env.development";

// Load the appropriate environment file
const envPath = path.resolve(process.cwd(), envFile);
const result = dotenv.config({ path: envPath });

// Check if the environment file was loaded successfully
if (result.error) {
  console.warn(`Warning: Could not load ${envFile}, using default environment variables`);
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

// Function to parse comma-separated values
function parseArray(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map(item => item.trim()).filter(item => item.length > 0);
}

// Function to parse boolean values
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

// Validate NODE_ENV
const VALID_NODE_ENVS = ["development", "production", "test"];
if (!VALID_NODE_ENVS.includes(nodeEnv)) {
  throw new Error(`NODE_ENV must be one of: ${VALID_NODE_ENVS.join(", ")}`);
}

// Validate and parse PORT
const port = getEnvVar("PORT", nodeEnv === "production" ? "5000" : "6000");
const portNum = parseInt(port, 10);
if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
  throw new Error("PORT must be a valid number between 1 and 65535");
}

// Export the environment configuration
export const ENV = {
  NODE_ENV: nodeEnv,
  PORT: portNum,
  BASE_URL: getEnvVar("BASE_URL", nodeEnv === "production" ? "https://www.sagawagroup.id" : "http://localhost:6000"),
  CORS_ORIGIN: parseArray(process.env.CORS_ORIGIN),
  CORS_CREDENTIALS: parseBoolean(process.env.CORS_CREDENTIALS, false),
  JWT_SECRET: getRequiredEnvVar("JWT_SECRET"),
  ASTRA_DB_APPLICATION_TOKEN: getRequiredEnvVar("ASTRA_DB_APPLICATION_TOKEN"),
  ASTRA_DB_API_ENDPOINT: getRequiredEnvVar("ASTRA_DB_API_ENDPOINT"),
  PUBLIC_API_URL: getEnvVar("PUBLIC_API_URL", nodeEnv === "production" ? "https://www.sagawagroup.id" : "http://localhost:6000"),
  LOG_LEVEL: getEnvVar("LOG_LEVEL", nodeEnv === "production" ? "info" : "debug"),
};

// Log environment info in development
if (nodeEnv === "development") {
  console.log(`Loaded environment variables from: ${envFile}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);
  console.log(`Port: ${ENV.PORT}`);
}