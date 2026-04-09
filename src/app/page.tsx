"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ClipboardList, CheckCircle, Activity } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface DashboardData {
  totalProducts: number;
  activeSessions: number;
  completedSessions: number;
  recentSessions: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    _count: { entries: number };
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    actor: string;
    notes: string;
    createdAt: string;
    session: { name: string } | null;
    product: { code: string; name: string } | null;
  }>;
}

const ACTION_LABEL: Record<string, string> = {
  PRODUCT_CREATE: "สร้างสินค้า",
  PRODUCT_UPDATE: "อัปเดตสินค้า",
  PRODUCT_DELETE: "ลบสินค้า",
  SESSION_CREATE: "สร้างรอบนับ",
  SESSION_STATUS_CHANGE: "เปลี่ยนสถานะรอบนับ",
  SESSION_UPDATE: "อัปเดตรอบนับ",
  DOC_PREPARE: "เตรียมเอกสาร",
  COUNT_ENTRY: "บันทึกยอดนับ",
  COUNT_UPDATE: "แก้ไขยอดนับ",
  RECHECK_ENTRY: "รีเช็คยอดนับ",
  SESSION_APPROVE: "อนุมัติรอบนับ",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-gray-400 text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ด</h1>
        <p className="text-gray-500 text-sm mt-1">ภาพรวมระบบนับสต๊อก</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">สินค้าทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-800">{data.totalProducts.toLocaleString()}</p>
            </div>
          </div>
          <Link href="/products" className="mt-3 text-xs text-blue-600 hover:underline block">
            จัดการสินค้า →
          </Link>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-lg">
              <ClipboardList size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">รอบนับที่กำลังดำเนินการ</p>
              <p className="text-2xl font-bold text-gray-800">{data.activeSessions}</p>
            </div>
          </div>
          <Link href="/sessions" className="mt-3 text-xs text-amber-600 hover:underline block">
            ดูรอบนับทั้งหมด →
          </Link>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2.5 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">รอบนับที่เสร็จสิ้น</p>
              <p className="text-2xl font-bold text-gray-800">{data.completedSessions}</p>
            </div>
          </div>
          <Link href="/sessions" className="mt-3 text-xs text-green-600 hover:underline block">
            ดูรายงาน →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">รอบนับล่าสุด</h2>
            <Link href="/sessions" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentSessions.length === 0 && (
              <p className="p-5 text-sm text-gray-400 text-center">ยังไม่มีรอบนับ</p>
            )}
            {data.recentSessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s._count.entries} รายการ •{" "}
                    {new Date(s.createdAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-gray-500" />
              กิจกรรมล่าสุด
            </h2>
            <Link href="/audit" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด</Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-auto">
            {data.recentAuditLogs.length === 0 && (
              <p className="p-5 text-sm text-gray-400 text-center">ยังไม่มีกิจกรรม</p>
            )}
            {data.recentAuditLogs.map((log) => (
              <div key={log.id} className="p-3 px-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </span>
                    {log.notes && (
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{log.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">โดย {log.actor}</p>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">เริ่มต้นใช้งาน</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/products"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
          >
            <Package size={24} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-700">จัดการสินค้า</span>
          </Link>
          <Link
            href="/sessions/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-center"
          >
            <ClipboardList size={24} className="text-amber-500" />
            <span className="text-sm font-medium text-gray-700">สร้างรอบนับใหม่</span>
          </Link>
          <Link
            href="/sessions"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-center"
          >
            <CheckCircle size={24} className="text-green-500" />
            <span className="text-sm font-medium text-gray-700">ดูรอบนับทั้งหมด</span>
          </Link>
          <Link
            href="/audit"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-center"
          >
            <Activity size={24} className="text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Audit Trail</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
