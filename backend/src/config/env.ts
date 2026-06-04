import dotenv from "dotenv";

dotenv.config();

type Env = {
  NODE_ENV: string;
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
};

const requiredVariables = ["MONGO_URI", "JWT_SECRET"] as const;

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const port = Number(process.env.PORT ?? 5000);

if (Number.isNaN(port) || port <= 0) {
  throw new Error("PORT must be a positive number");
}

export const env: Env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: port,
  MONGO_URI: process.env.MONGO_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d"
};
