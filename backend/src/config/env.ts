import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DB_PATH: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ENABLE_SEED_DEFAULT_CREDENTIALS: boolean;
}

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_PATH: process.env.DB_PATH || "arkan_parts.db",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  ENABLE_SEED_DEFAULT_CREDENTIALS: parseBoolean(
    process.env.ENABLE_SEED_DEFAULT_CREDENTIALS,
    process.env.NODE_ENV !== "production",
  ),
};

if (!env.JWT_SECRET) {
  if (env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  // Development fallback to keep local onboarding simple.
  env.JWT_SECRET = "dev-only-change-me";
  console.warn(
    "[SECURITY] Using development JWT secret. Set JWT_SECRET in environment.",
  );
}

export default env;
