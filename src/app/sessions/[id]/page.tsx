"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, ClipboardCheck, GitCompare, RefreshCw, BarChart3,
  ChevronRight, ArrowLeft
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Session {
  id: string;
  name: string;
  status: string;
  countedBy: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  documents: Array<{ id: string; docNumber: string; location: string | null; assignedTo: string | null; status: string }>;
  entries: Array<{ id: string; status: string; variance: number | null; product: { code: string; name: string } }>;
  _count: { entries: number; documents: number };
}

const STEPS = [
  { key: "PREPARING", label: "เตรียมเอกสาร", icon: FileText, href: "prepare" },
  { key: "COUNTING", label: "บันทึกการนับ", icon: ClipboardCheck, href: "count" },
  { key: "COMPARING", label: "เทียบยอด", icon: GitCompare, href: "compare" },
  { key: "RECHECKING", label: "รีเช็ค", icon: RefreshCw, href: "recheck" },
  { key: "COMPLETED", label: "รายงาน", icon: BarChart3, href: "report" },
];

const STATUS_ORDER = ["PREPARING", "COUNTING", "COMPARING", "RECHECKING", "COMPLETED"];

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);

  const load = () => {
    fetch(`/api/sessions/${id}`).then((r) => r.json()).then(setSession);
  };

  useEffect(() => { load(); }, [id]);

  if (!session) {
    return <div className="p-8 text-gray-400 text-center">กำลังโหลด...</div>;
  }

  const currentStepIdx = STATUS_ORDER.indexOf(session.status);
  const counted = session.entries.filter((e) => e.status !== "PENDING").length;
  const withVariance = session.entries.filter((e) => e.variance !== null && e.variance !== 0).length;
  const rechecked = session.entries.filter((e) => e.status === "RECHECKED" || e.status === "APPROVED").length;

  const advanceStatus = async (newStatus: string) => {
    await fetch(`/api/sessions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/sessions" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} />
          กลับไปรายการรอบนับ
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{session.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={session.status} />
              {session.countedBy && (
                <span className="text-sm text-gray-500">ผู้นับ: {session.countedBy}</span>
              )}
              <span className="text-sm text-gray-400">
                สร้าง: {new Date(session.createdAt).toLocaleDateString("th-TH")}
              </span>
            </div>
            {session.notes && (
              <p className="text-sm text-gray-500 mt-1">{session.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-4">ขั้นตอนการนับสต๊อก</h2>
        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isDone = i < currentStepIdx;
            const isCurrent = i === currentStepIdx;
            const isLocked = i > currentStepIdx;
            return (
              <div key={step.key} className="flex items-center gap-2 flex-1">
                <Link
                  href={`/sessions/${id}/${step.href}`}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl flex-1 text-center transition-colors ${
                    isCurrent
                      ? "bg-amber-50 border-2 border-amber-400"
                      : isDone
                      ? "bg-green-50 border-2 border-green-300 hover:bg-green-100"
                      : "bg-gray-50 border-2 border-gray-100 opacity-50 pointer-events-none"
                  }`}
                >
                  <Icon
                    size={20}
                    className={isCurrent ? "text-amber-600" : isDone ? "text-green-600" : "text-gray-400"}
                  />
                  <span className={`text-xs font-medium ${
                    isCurrent ? "text-amber-700" : isDone ? "text-green-700" : "text-gray-400"
                  }`}>
                    {step.label}
                  </span>
                </Link>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-800">{session._count.entries}</p>
          <p className="text-xs text-gray-500 mt-0.5">รายการทั้งหมด</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{counted}</p>
          <p className="text-xs text-gray-500 mt-0.5">นับแล้ว</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-orange-500">{withVariance}</p>
          <p className="text-xs text-gray-500 mt-0.5">มีผลต่าง</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-purple-600">{rechecked}</p>
          <p className="text-xs text-gray-500 mt-0.5">รีเช็คแล้ว</p>
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">ดำเนินการขั้นตอนถัดไป</h2>
        {session.status === "PREPARING" && (
          <div className="flex items-center gap-3">
            <Link href={`/sessions/${id}/prepare`} className="flex-1 flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <span className="text-sm font-medium text-blue-700">เตรียมเอกสาร & เพิ่มสินค้า</span>
              <ChevronRight size={16} className="text-blue-500" />
            </Link>
            {session._count.entries > 0 && (
              <button
                onClick={() => advanceStatus("COUNTING")}
                className="px-4 py-3 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                เริ่มนับสต๊อก →
              </button>
            )}
          </div>
        )}
        {session.status === "COUNTING" && (
          <div className="flex items-center gap-3">
            <Link href={`/sessions/${id}/count`} className="flex-1 flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
              <div>
                <span className="text-sm font-medium text-amber-700">บันทึกยอดนับ</span>
                <span className="ml-2 text-xs text-amber-500">{counted}/{session._count.entries} รายการ</span>
              </div>
              <ChevronRight size={16} className="text-amber-500" />
            </Link>
            {counted === session._count.entries && (
              <button
                onClick={() => advanceStatus("COMPARING")}
                className="px-4 py-3 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                เทียบยอด →
              </button>
            )}
          </div>
        )}
        {session.status === "COMPARING" && (
          <div className="flex items-center gap-3">
            <Link href={`/sessions/${id}/compare`} className="flex-1 flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <span className="text-sm font-medium text-orange-700">ดูผลการเทียบยอด</span>
              <ChevronRight size={16} className="text-orange-500" />
            </Link>
            <button
              onClick={() => advanceStatus(withVariance > 0 ? "RECHECKING" : "COMPLETED")}
              className="px-4 py-3 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              {withVariance > 0 ? `รีเช็ค (${withVariance}) →` : "เสร็จสิ้น →"}
            </button>
          </div>
        )}
        {session.status === "RECHECKING" && (
          <div className="flex items-center gap-3">
            <Link href={`/sessions/${id}/recheck`} className="flex-1 flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div>
                <span className="text-sm font-medium text-purple-700">รีเช็คยอดนับ</span>
                <span className="ml-2 text-xs text-purple-500">{rechecked}/{withVariance} รายการ</span>
              </div>
              <ChevronRight size={16} className="text-purple-500" />
            </Link>
            <button
              onClick={() => advanceStatus("COMPLETED")}
              className="px-4 py-3 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              ปิดรอบนับ →
            </button>
          </div>
        )}
        {session.status === "COMPLETED" && (
          <Link href={`/sessions/${id}/report`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <span className="text-sm font-medium text-green-700">ดูรายงานผลการนับสต๊อก</span>
            <ChevronRight size={16} className="text-green-500" />
          </Link>
        )}
      </div>

      {/* Documents */}
      {session.documents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">เอกสารการนับ ({session.documents.length})</h2>
            <Link href={`/sessions/${id}/prepare`} className="text-xs text-blue-600 hover:underline">จัดการเอกสาร</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {session.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-800">{doc.docNumber}</span>
                  {doc.location && <span className="text-xs text-gray-400 ml-2">📍 {doc.location}</span>}
                  {doc.assignedTo && <span className="text-xs text-gray-400 ml-2">👤 {doc.assignedTo}</span>}
                </div>
                <StatusBadge status={doc.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
