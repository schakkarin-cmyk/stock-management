import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docs = await (prisma as any).countDocument.findMany({
    where: { sessionId: id },
    orderBy: { docNumber: "asc" },
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { docNumber, location, assignedTo } = body;

  const doc = await (prisma as any).countDocument.create({
    data: { sessionId: id, docNumber, location, assignedTo, status: "PENDING" },
  });

  await createAuditLog({
    action: ACTIONS.DOC_PREPARE,
    sessionId: id,
    after: doc,
    notes: `สร้างเอกสาร ${docNumber}`,
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { docId, status } = body;

  const doc = await (prisma as any).countDocument.update({
    where: { id: docId, sessionId: id },
    data: { status },
  });

  await createAuditLog({
    action: ACTIONS.DOC_STATUS_UPDATE,
    sessionId: id,
    notes: `อัปเดตสถานะเอกสาร ${doc.docNumber}: ${status}`,
  });

  return NextResponse.json(doc);
}
