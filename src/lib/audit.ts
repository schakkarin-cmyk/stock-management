import { prisma } from "./prisma";

interface AuditParams {
  action: string;
  actor?: string;
  sessionId?: string;
  productId?: string;
  before?: object | null;
  after?: object | null;
  notes?: string;
}

export async function createAuditLog(params: AuditParams) {
  return prisma.auditLog.create({
    data: {
      action: params.action,
      actor: params.actor ?? "System",
      sessionId: params.sessionId,
      productId: params.productId,
      before: params.before ? JSON.stringify(params.before) : null,
      after: params.after ? JSON.stringify(params.after) : null,
      notes: params.notes,
    },
  });
}

export const ACTIONS = {
  // Products
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRODUCT_DELETE: "PRODUCT_DELETE",
  // Sessions
  SESSION_CREATE: "SESSION_CREATE",
  SESSION_UPDATE: "SESSION_UPDATE",
  SESSION_STATUS_CHANGE: "SESSION_STATUS_CHANGE",
  // Documents
  DOC_PREPARE: "DOC_PREPARE",
  DOC_STATUS_UPDATE: "DOC_STATUS_UPDATE",
  // Counting
  COUNT_ENTRY: "COUNT_ENTRY",
  COUNT_UPDATE: "COUNT_UPDATE",
  // Recheck
  RECHECK_ENTRY: "RECHECK_ENTRY",
  // Approve
  SESSION_APPROVE: "SESSION_APPROVE",
  SESSION_COMPLETE: "SESSION_COMPLETE",
};
