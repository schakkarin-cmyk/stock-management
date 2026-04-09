"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download, CheckCircle, User } from "lucide-react";
import * as XLSX from "xlsx";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CountEntry {
  id: string;
  systemQty: number;
  countQty: number | null;
  recheckQty: number | null;
  variance: number | null;
  status: string;
  countedBy: string | null;
  recheckedBy: string | null;
  countedAt: string | null;
  notes: string | null;
  product: {
    code: string;
    name: string;
    unit: string;
    location: string | null;
    category: string | null;
  };
}

interface Session {
  id: string;
  name: string;
  status: string;
  countedBy: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<CountEntry[]>([]);
  const [approver, setApprover] = useState("");
  const [approving, setApproving] = useState(false);

  const load = () => {
    Promise.all([
      fetch(`/api/sessions/${id}`).then((r) => r.json()),
      fetch(`/api/sessions/${id}/entries`).then((r) => r.json()),
    ]).then(([sess, ents]) => {
      setSession(sess);
      setEntries(ents);
    });
  };

  useEffect(() => { load(); }, [id]);

  if (!session) return <div className="p-8 text-gray-400 text-center">กำลังโหลด...</div>;

  const counted = entries.filter((e) => e.countQty !== null);
  const withVariance = counted.filter((e) => e.variance !== null && e.variance !== 0);
  const accuracy = counted.length > 0 ? ((counted.length - withVariance.length) / counted.length * 100).toFixed(1) : "0";

  const approve = async () => {
    if (!approver.trim()) { alert("กรุณากรอกชื่อผู้อนุมัติ"); return; }
    setApproving(true);
    await fetch(`/api/sessions/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedBy: approver }),
    });
    setApproving(false);
    load();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      entries.map((e) => ({
        "รหัสสินค้า": e.product.code,
        "ชื่อสินค้า": e.product.name,
        "หมวดหมู่": e.product.category,
        "ตำแหน่ง": e.product.location,
        "หน่วย": e.product.unit,
        "ยอดระบบ": e.systemQty,
        "ยอดนับครั้ง 1": e.countQty,
        "ยอดนับครั้ง 2 (รีเช็ค)": e.recheckQty,
        "ผลต่างสุดท้าย": e.variance,
        "สถานะ": e.status,
        "ผู้นับ": e.countedBy,
        "หมายเหตุ": e.notes,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    // Summary sheet
    const summary = XLSX.utils.json_to_sheet([
      { "รายการ": "รอบนับ", "ค่า": session.name },
      { "รายการ": "วันที่สร้าง", "ค่า": new Date(session.createdAt).toLocaleDateString("th-TH") },
      { "รายการ": "ผู้นับ", "ค่า": session.countedBy },
      { "รายการ": "ผู้อนุมัติ", "ค่า": session.approvedBy },
      { "รายการ": "สินค้าทั้งหมด", "ค่า": entries.length },
      { "รายการ": "สินค้าที่นับ", "ค่า": counted.length },
      { "รายการ": "มีผลต่าง", "ค่า": withVariance.length },
      { "รายการ": "ความแม่นยำ (%)", "ค่า": accuracy },
    ]);
    XLSX.utils.book_append_sheet(wb, summary, "Summary");
    XLSX.writeFile(wb, `report_${id}.xlsx`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <Link href={`/sessions/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} />
          กลับ
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">รายงานผลการนับสต๊อก</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Printer size={15} />
              พิมพ์
            </button>
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download size={15} />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">รายงานผลการนับสต๊อก</h1>
        <p className="text-sm">{session.name}</p>
        <p className="text-xs text-gray-500">พิมพ์เมื่อ: {new Date().toLocaleDateString("th-TH")}</p>
      </div>

      {/* Session Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">ข้อมูลรอบนับ</h2>
          <StatusBadge status={session.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">ชื่อรอบนับ</p>
            <p className="font-medium mt-0.5">{session.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">วันที่สร้าง</p>
            <p className="font-medium mt-0.5">{new Date(session.createdAt).toLocaleDateString("th-TH")}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ผู้นับ</p>
            <p className="font-medium mt-0.5">{session.countedBy || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ผู้อนุมัติ</p>
            <p className="font-medium mt-0.5">{session.approvedBy || "-"}</p>
          </div>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-800">{entries.length}</p>
          <p className="text-xs text-gray-500">สินค้าทั้งหมด</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{counted.length}</p>
          <p className="text-xs text-blue-600">สินค้าที่นับ</p>
        </div>
        <div className={`rounded-xl p-4 border text-center ${withVariance.length > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
          <p className={`text-2xl font-bold ${withVariance.length > 0 ? "text-red-600" : "text-green-600"}`}>{withVariance.length}</p>
          <p className={`text-xs ${withVariance.length > 0 ? "text-red-600" : "text-green-600"}`}>มีผลต่าง</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
          <p className="text-2xl font-bold text-green-600">{accuracy}%</p>
          <p className="text-xs text-green-600">ความแม่นยำ</p>
        </div>
      </div>

      {/* Approve */}
      {session.status !== "COMPLETED" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 print:hidden">
          <h2 className="font-semibold text-amber-800 mb-3">อนุมัติและปิดรอบนับ</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                placeholder="ชื่อผู้อนุมัติ"
                className="w-full pl-9 pr-4 py-2.5 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
            <button
              onClick={approve}
              disabled={approving}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              <CheckCircle size={15} />
              {approving ? "กำลังอนุมัติ..." : "อนุมัติปิดรอบนับ"}
            </button>
          </div>
        </div>
      )}

      {session.status === "COMPLETED" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 print:hidden">
          <CheckCircle size={20} className="text-green-600" />
          <div>
            <p className="text-green-800 font-medium">รอบนับนี้เสร็จสิ้นและได้รับการอนุมัติแล้ว</p>
            <p className="text-green-600 text-sm">อนุมัติโดย: {session.approvedBy}</p>
          </div>
        </div>
      )}

      {/* Detail Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">รายละเอียดผลการนับ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อสินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ตำแหน่ง</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดระบบ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดนับ 1</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดนับ 2</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ผลต่าง</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((e) => {
                const v = e.variance || 0;
                return (
                  <tr key={e.id} className={v !== 0 ? "bg-red-50/30" : "hover:bg-gray-50"}>
                    <td className="px-4 py-2.5 font-mono text-blue-600 text-xs">{e.product.code}</td>
                    <td className="px-4 py-2.5 font-medium">{e.product.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{e.product.location || "-"}</td>
                    <td className="px-4 py-2.5 text-right">{e.systemQty.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">{e.countQty?.toLocaleString() ?? "-"}</td>
                    <td className="px-4 py-2.5 text-right text-purple-600">{e.recheckQty?.toLocaleString() ?? "-"}</td>
                    <td className="px-4 py-2.5 text-right font-bold">
                      <span className={v > 0 ? "text-blue-600" : v < 0 ? "text-red-600" : "text-gray-400"}>
                        {v === 0 ? "—" : `${v > 0 ? "+" : ""}${v.toLocaleString()}`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center"><StatusBadge status={e.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
