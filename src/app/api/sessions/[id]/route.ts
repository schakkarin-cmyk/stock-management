import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await (prisma as any).countSession.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { docNumber: "asc" } },
      entries: {
        include: { product: true },
        orderBy: { product: { code: "asc" } },
      },
      _count: { select: { entries: true, documents: true } },
    },
  });
  if (!session) return NextResponse.json({ error: "ไม่พบรอบการนับ" }, { status: 404 });
  return NextResponse.json(session);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const before = await (prisma as any).countSession.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "ไม่พบรอบการนับ" }, { status: 404 });

  const session = await (prisma as any).countSession.update({
    where: { id },
    data: {
      name: body.name ?? before.name,
      notes: body.notes ?? before.notes,
      countedBy: body.countedBy ?? before.countedBy,
      approvedBy: body.approvedBy ?? before.approvedBy,
      status: body.status ?? before.status,
    },
  });

  if (body.status && body.status !== before.status) {
    await createAuditLog({
      action: ACTIONS.SESSION_STATUS_CHANGE,
      sessionId: id,
      before: { status: before.status },
      after: { status: body.status },
      notes: `เปลี่ยนสถานะ: ${before.status} → ${body.status}`,
    });
  } else {
    await createAuditLog({
      action: ACTIONS.SESSION_UPDATE,
      sessionId: id,
      before,
      after: session,
    });
  }

  return NextResponse.json(session);
}
