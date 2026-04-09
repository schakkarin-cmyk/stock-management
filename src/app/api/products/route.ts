import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const products = await (prisma as any).product.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { code: { contains: search } },
            { name: { contains: search } },
          ],
        } : {},
        category ? { category } : {},
      ],
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, unit, category, location, systemQty } = body;

  if (!code || !name || !unit) {
    return NextResponse.json({ error: "กรุณากรอก รหัส, ชื่อ, และหน่วย" }, { status: 400 });
  }

  const existing = await (prisma as any).product.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
  }

  const product = await (prisma as any).product.create({
    data: { code, name, unit, category, location, systemQty: systemQty ?? 0 },
  });

  await createAuditLog({
    action: ACTIONS.PRODUCT_CREATE,
    productId: product.id,
    after: product,
    notes: `สร้างสินค้า ${code} - ${name}`,
  });

  return NextResponse.json(product, { status: 201 });
}
