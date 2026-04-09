import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  // Cloud (PostgreSQL) — ใช้เมื่อ deploy บน Railway
  if (process.env.DATABASE_URL) {
    const { Pool } = require("pg");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter } as never);
  }

  // Local — ใช้ SQLite ไฟล์
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const path = require("path");
  const dbPath = path.resolve(process.cwd(), "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter } as never);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
