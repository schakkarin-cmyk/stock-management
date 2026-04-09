import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function GET() {
  const sessions = await (prisma as any).countSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { entries: true, documents: true },
      },
    },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, notes, countedBy, productIds } = body;

  if (!name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อรอบการนับ" }, { status: 400 });
  }

  // สร้าง session
  const session = await (prisma as any).countSession.create({
    data: { name, notes, countedBy, status: "PREPARING" },
  });

  // ถ้าระบุ productIds ให้สร้าง entries ทันที (snapshot ยอดระบบ)
  if (productIds && productIds.length > 0) {
    const products = await (prisma as any).product.findMany({
      where: { id: { in: productIds } },
    });

    for (const product of products) {
      await (prisma as any).countEntry.create({
        data: {
          sessionId: session.id,
          productId: product.id,
          systemQty: product.systemQty,
          status: "PENDING",
        },
      });
    }
  }

  await createAuditLog({
    action: ACTIONS.SESSION_CREATE,
    sessionId: session.id,
    after: session,
    notes: `สร้างรอบนับ: ${name}`,
  });

  return NextResponse.json(session, { status: 201 });
}
