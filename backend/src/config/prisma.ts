import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: requiredEnv("DATABASE_USER"),
  password: requiredEnv("DATABASE_PASSWORD"),
  database: requiredEnv("DATABASE_NAME"),
  connectionLimit: 5,
});

export const prisma = new PrismaClient({ adapter });