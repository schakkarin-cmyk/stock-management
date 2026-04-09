import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { approvedBy } = body;

  const session = await (prisma as any).countSession.findUnique({
    where: { id },
    include: { entries: true },
  });
  if (!session) return NextResponse.json({ error: "ไม่พบรอบการนับ" }, { status: 404 });

  // อัปเดตสถานะ entries ที่ยังไม่ถูก approve
  await (prisma as any).countEntry.updateMany({
    where: { sessionId: id, status: { in: ["COUNTED", "RECHECKED"] } },
    data: { status: "APPROVED" },
  });

  // อัปเดต session
  const updated = await (prisma as any).countSession.update({
    where: { id },
    data: { status: "COMPLETED", approvedBy },
  });

  await createAuditLog({
    action: ACTIONS.SESSION_APPROVE,
    sessionId: id,
    actor: approvedBy || "System",
    notes: `อนุมัติและปิดรอบนับโดย ${approvedBy}`,
  });

  return NextResponse.json(updated);
}
