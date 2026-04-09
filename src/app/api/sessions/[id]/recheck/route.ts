import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { entryId, recheckQty, recheckedBy, notes } = body;

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
      recheckQty,
      recheckedBy,
      recheckedAt: new Date(),
      // variance ใช้ recheckQty ถ้ามี
      variance: recheckQty - before.systemQty,
      status: "RECHECKED",
      notes,
    },
    include: { product: true },
  });

  await createAuditLog({
    action: ACTIONS.RECHECK_ENTRY,
    sessionId: id,
    productId: before.productId,
    before: { countQty: before.countQty, recheckQty: before.recheckQty },
    after: { recheckQty, variance: entry.variance },
    actor: recheckedBy || "System",
    notes: `รีเช็คยอดนับ ${before.product.code}: ${recheckQty} ${before.product.unit}`,
  });

  return NextResponse.json(entry);
}
