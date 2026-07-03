import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

import { PrismaClient } from "./src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
console.log("DATABASE URL ====> ", process.env.DATABASE_URL);

// check for the url error
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL missing");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prismaClient = new PrismaClient({
  adapter,
});
