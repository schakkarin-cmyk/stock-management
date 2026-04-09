import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("🌱 Seeding database...");

  const products = [
    { code: "FG-001", name: "สินค้า A ขนาดใหญ่", unit: "ชิ้น", category: "สำเร็จรูป", location: "A-01", systemQty: 100 },
    { code: "FG-002", name: "สินค้า B ขนาดกลาง", unit: "ชิ้น", category: "สำเร็จรูป", location: "A-02", systemQty: 250 },
    { code: "FG-003", name: "สินค้า C ขนาดเล็ก", unit: "กล่อง", category: "สำเร็จรูป", location: "B-01", systemQty: 80 },
    { code: "FG-004", name: "วัตถุดิบ D", unit: "กก.", category: "วัตถุดิบ", location: "C-01", systemQty: 500 },
    { code: "FG-005", name: "วัตถุดิบ E", unit: "ลิตร", category: "วัตถุดิบ", location: "C-02", systemQty: 320 },
    { code: "FG-006", name: "บรรจุภัณฑ์ F", unit: "ม้วน", category: "บรรจุภัณฑ์", location: "D-01", systemQty: 45 },
    { code: "FG-007", name: "บรรจุภัณฑ์ G", unit: "แผ่น", category: "บรรจุภัณฑ์", location: "D-02", systemQty: 1200 },
    { code: "FG-008", name: "อุปกรณ์ H", unit: "อัน", category: "อุปกรณ์", location: "E-01", systemQty: 30 },
    { code: "FG-009", name: "สินค้า I พิเศษ", unit: "ชิ้น", category: "สำเร็จรูป", location: "A-03", systemQty: 60 },
    { code: "FG-010", name: "สินค้า J", unit: "ถุง", category: "สำเร็จรูป", location: "B-02", systemQty: 175 },
  ];

  for (const p of products) {
    await (prisma as any).product.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }

  console.log(`✅ Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await (prisma as any).$disconnect();
  });
