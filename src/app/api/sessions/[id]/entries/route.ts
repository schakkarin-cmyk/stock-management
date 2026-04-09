import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

// GET: ดึง entries ทั้งหมดในรอบนับ
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entries = await (prisma as any).countEntry.findMany({
    where: { sessionId: id },
    include: { product: true },
    orderBy: { product: { code: "asc" } },
  });
  return NextResponse.json(entries);
}

// POST: เพิ่มสินค้าเข้ารอบนับ
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { productIds } = body;

  const session = await (prisma as any).countSession.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "ไม่พบรอบการนับ" }, { status: 404 });

  const products = await (prisma as any).product.findMany({
    where: { id: { in: productIds } },
  });

  const created = [];
  for (const product of products) {
    // ตรวจสอบว่ามีอยู่แล้วหรือไม่
    const existing = await (prisma as any).countEntry.findFirst({
      where: { sessionId: id, productId: product.id },
    });
    if (existing) continue;

    const entry = await (prisma as any).countEntry.create({
      data: {
        sessionId: id,
        productId: product.id,
        systemQty: product.systemQty,
        status: "PENDING",
      },
      include: { product: true },
    });
    created.push(entry);
  }

  if (created.length > 0) {
    await createAuditLog({
      action: ACTIONS.DOC_PREPARE,
      sessionId: id,
      notes: `เพิ่มสินค้า ${created.length} รายการเข้ารอบนับ`,
    });
  }

  return NextResponse.json(created, { status: 201 });
}

// PATCH: บันทึกยอดนับ
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { entryId, countQty, countedBy, notes } = body;

  const before = await (prisma as any).countEntry.findUnique({
    where: { id: entryId },
    include: { product: true },
  });
  if (!before || before.sessionId !== id) {
    return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  }

  const entry = await (prisma as any).countEntry.update({
    where: { id: entryId },
    data: {
      countQty,
      countedBy,
      countedAt: new Date(),
      variance: countQty - before.systemQty,
      status: "COUNTED",
      notes,
    },
    include: { product: true },
  });

  await createAuditLog({
    action: before.countQty !== null ? ACTIONS.COUNT_UPDATE : ACTIONS.COUNT_ENTRY,
    sessionId: id,
    productId: before.productId,
    before: { countQty: before.countQty },
    after: { countQty, variance: entry.variance },
    actor: countedBy || "System",
    notes: `บันทึกยอดนับ ${before.product.code}: ${countQty} ${before.product.unit}`,
  });

  return NextResponse.json(entry);
}
