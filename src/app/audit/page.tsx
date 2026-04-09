"use client";
import { useEffect, useState } from "react";
import { History, Download, ChevronDown, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  notes: string | null;
  before: string | null;
  after: string | null;
  createdAt: string;
  session: { name: string } | null;
  product: { code: string; name: string } | null;
}

const ACTION_LABEL: Record<string, string> = {
  PRODUCT_CREATE: "สร้างสินค้า",
  PRODUCT_UPDATE: "อัปเดตสินค้า",
  PRODUCT_DELETE: "ลบสินค้า",
  SESSION_CREATE: "สร้างรอบนับ",
  SESSION_STATUS_CHANGE: "เปลี่ยนสถานะรอบนับ",
  SESSION_UPDATE: "อัปเดตรอบนับ",
  DOC_PREPARE: "เตรียมเอกสาร",
  DOC_STATUS_UPDATE: "อัปเดตสถานะเอกสาร",
  COUNT_ENTRY: "บันทึกยอดนับ",
  COUNT_UPDATE: "แก้ไขยอดนับ",
  RECHECK_ENTRY: "รีเช็คยอดนับ",
  SESSION_APPROVE: "อนุมัติรอบนับ",
  SESSION_COMPLETE: "ปิดรอบนับ",
};

const ACTION_COLOR: Record<string, string> = {
  PRODUCT_CREATE: "bg-blue-100 text-blue-700",
  PRODUCT_UPDATE: "bg-blue-50 text-blue-600",
  PRODUCT_DELETE: "bg-red-100 text-red-700",
  SESSION_CREATE: "bg-amber-100 text-amber-700",
  SESSION_STATUS_CHANGE: "bg-orange-100 text-orange-700",
  SESSION_UPDATE: "bg-amber-50 text-amber-600",
  DOC_PREPARE: "bg-purple-100 text-purple-700",
  DOC_STATUS_UPDATE: "bg-purple-50 text-purple-600",
  COUNT_ENTRY: "bg-green-100 text-green-700",
  COUNT_UPDATE: "bg-green-50 text-green-600",
  RECHECK_ENTRY: "bg-indigo-100 text-indigo-700",
  SESSION_APPROVE: "bg-teal-100 text-teal-700",
  SESSION_COMPLETE: "bg-teal-100 text-teal-700",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filterAction, setFilterAction] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const LIMIT = 50;

  const load = (off = 0) => {
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) });
    if (filterAction) params.set("action", filterAction);
    fetch(`/api/audit?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(off === 0 ? data.logs : (prev) => [...prev, ...data.logs]);
        setTotal(data.total);
        setOffset(off + LIMIT);
      });
  };

  useEffect(() => { setOffset(0); load(0); }, [filterAction]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      logs.map((log) => ({
        "วันที่-เวลา": new Date(log.createdAt).toLocaleString("th-TH"),
        "Action": ACTION_LABEL[log.action] ?? log.action,
        "ผู้ดำเนินการ": log.actor,
        "รอบนับ": log.session?.name ?? "",
        "สินค้า": log.product ? `${log.product.code} - ${log.product.name}` : "",
        "รายละเอียด": log.notes ?? "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AuditTrail");
    XLSX.writeFile(wb, `audit_trail_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Group logs by date
  const grouped: Record<string, AuditLog[]> = {};
  logs.forEach((log) => {
    const date = new Date(log.createdAt).toLocaleDateString("th-TH", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <History size={24} className="text-gray-600" />
              Audit Trail
            </h1>
            <p className="text-gray-500 text-sm mt-1">ประวัติการดำเนินงานทั้งหมด — {total.toLocaleString()} รายการ</p>
          </div>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={15} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500">กรองตาม Action:</label>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">ทั้งหมด</option>
          {Object.entries(ACTION_LABEL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, dateLogs]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-100" />
              {date}
              <div className="h-px flex-1 bg-gray-100" />
            </h2>
            <div className="space-y-2">
              {dateLogs.map((log) => {
                const isExpanded = expanded.has(log.id);
                const hasDetail = log.before || log.after;
                return (
                  <div key={log.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div
                      className={`flex items-start gap-3 p-4 ${hasDetail ? "cursor-pointer hover:bg-gray-50" : ""}`}
                      onClick={() => hasDetail && toggle(log.id)}
                    >
                      <div className="shrink-0 pt-0.5">
                        <span className={`inline-block text-xs font-medium px-2 py-1 rounded-md ${ACTION_COLOR[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                          {ACTION_LABEL[log.action] ?? log.action}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {log.notes && (
                          <p className="text-sm text-gray-700 font-medium line-clamp-2">{log.notes}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">👤 {log.actor}</span>
                          {log.session && <span className="text-xs text-gray-400">📋 {log.session.name}</span>}
                          {log.product && (
                            <span className="text-xs text-gray-400">
                              📦 {log.product.code} — {log.product.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        {hasDetail && (
                          isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && hasDetail && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50 grid grid-cols-2 gap-4">
                        {log.before && (
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">ก่อน</p>
                            <pre className="text-xs text-gray-600 bg-red-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(JSON.parse(log.before), null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.after && (
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1">หลัง</p>
                            <pre className="text-xs text-gray-600 bg-green-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(JSON.parse(log.after), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {logs.length < total && (
        <div className="text-center">
          <button
            onClick={() => load(offset)}
            className="px-6 py-2.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            โหลดเพิ่มเติม ({total - logs.length} รายการ)
          </button>
        </div>
      )}

      {logs.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <History size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">ยังไม่มีประวัติการดำเนินงาน</p>
        </div>
      )}
    </div>
  );
}
