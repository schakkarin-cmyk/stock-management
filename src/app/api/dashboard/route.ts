import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [
    totalProducts,
    activeSessions,
    completedSessions,
    recentSessions,
    recentAuditLogs,
  ] = await Promise.all([
    (prisma as any).product.count(),
    (prisma as any).countSession.count({
      where: { status: { not: "COMPLETED" } },
    }),
    (prisma as any).countSession.count({
      where: { status: "COMPLETED" },
    }),
    (prisma as any).countSession.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { entries: true } },
      },
    }),
    (prisma as any).auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        session: { select: { name: true } },
        product: { select: { code: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    totalProducts,
    activeSessions,
    completedSessions,
    recentSessions,
    recentAuditLogs,
  });
}
