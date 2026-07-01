import { PrismaClient } from "@/generated/prisma/client";

export const prismaClient = new PrismaClient({adapter:process.env.DATABASE_URL});