"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ClipboardList, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Session {
  id: string;
  name: string;
  status: string;
  countedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { entries: number; documents: number };
}

const STATUS_ORDER = ["PREPARING", "COUNTING", "COMPARING", "RECHECKING", "COMPLETED"];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch("/api/sessions").then((r) => r.json()).then(setSessions);
  }, []);

  const active = sessions.filter((s) => s.status !== "COMPLETED");
  const completed = sessions.filter((s) => s.status === "COMPLETED");

  const statusStep = (status: string) => STATUS_ORDER.indexOf(status);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รอบนับสต๊อก</h1>
          <p className="text-gray-500 text-sm mt-1">รายการรอบนับทั้งหมด</p>
        </div>
        <Link
          href="/sessions/new"
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          สร้างรอบนับใหม่
        </Link>
      </div>

      {/* Active Sessions */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">กำลังดำเนินการ ({active.length})</h2>
          <div className="space-y-3">
            {active.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all block"
              >
                <div className="bg-amber-50 p-3 rounded-xl">
                  <ClipboardList size={22} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{s.name}</h3>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-xs text-gray-400">{s._count.entries} รายการสินค้า</span>
                    {s.countedBy && <span className="text-xs text-gray-400">ผู้นับ: {s.countedBy}</span>}
                    <span className="text-xs text-gray-400">
                      อัปเดต: {new Date(s.updatedAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-1 mt-2">
                    {STATUS_ORDER.slice(0, 4).map((st, i) => (
                      <div
                        key={st}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= statusStep(s.status) ? "bg-amber-400" : "bg-gray-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">ยังไม่มีรอบนับ</p>
          <p className="text-gray-400 text-sm mt-1">เริ่มต้นด้วยการสร้างรอบนับใหม่</p>
          <Link href="/sessions/new" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={15} />
            สร้างรอบนับใหม่
          </Link>
        </div>
      )}

      {/* Completed Sessions */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">เสร็จสิ้นแล้ว ({completed.length})</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">ชื่อรอบนับ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">รายการ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">อนุมัติโดย</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {completed.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s._count.entries}</td>
                    <td className="px-4 py-3 text-gray-500">{(s as any).approvedBy || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.updatedAt).toLocaleDateString("th-TH")}</td>
                    <td className="px-4 py-3">
                      <Link href={`/sessions/${s.id}/report`} className="text-xs text-blue-600 hover:underline">
                        ดูรายงาน
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
