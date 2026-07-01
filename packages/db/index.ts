import { PrismaClient } from "./src/generated/prisma/client.ts";

export const prismaClient = new PrismaClient({adapter:process.env.DATABASE_URL});