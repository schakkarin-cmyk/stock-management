import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await (prisma as any).product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const before = await (prisma as any).product.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });

  const product = await (prisma as any).product.update({
    where: { id },
    data: {
      name: body.name ?? before.name,
      unit: body.unit ?? before.unit,
      category: body.category ?? before.category,
      location: body.location ?? before.location,
      systemQty: body.systemQty ?? before.systemQty,
    },
  });

  await createAuditLog({
    action: ACTIONS.PRODUCT_UPDATE,
    productId: id,
    before,
    after: product,
    notes: `อัปเดตสินค้า ${product.code}`,
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const before = await (prisma as any).product.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });

  await (prisma as any).product.delete({ where: { id } });

  await createAuditLog({
    action: ACTIONS.PRODUCT_DELETE,
    productId: id,
    before,
    notes: `ลบสินค้า ${before.code} - ${before.name}`,
  });

  return NextResponse.json({ success: true });
}
