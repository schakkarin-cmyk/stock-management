import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const productId = searchParams.get("productId");
  const action = searchParams.get("action");
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  const logs = await (prisma as any).auditLog.findMany({
    where: {
      ...(sessionId ? { sessionId } : {}),
      ...(productId ? { productId } : {}),
      ...(action ? { action } : {}),
    },
    include: {
      session: { select: { name: true } },
      product: { select: { code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await (prisma as any).auditLog.count({
    where: {
      ...(sessionId ? { sessionId } : {}),
      ...(productId ? { productId } : {}),
      ...(action ? { action } : {}),
    },
  });

  return NextResponse.json({ logs, total });
}
