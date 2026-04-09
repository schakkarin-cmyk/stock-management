"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Save, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CountEntry {
  id: string;
  systemQty: number;
  countQty: number | null;
  variance: number | null;
  status: string;
  countedBy: string | null;
  countedAt: string | null;
  notes: string | null;
  product: {
    id: string;
    code: string;
    name: string;
    unit: string;
    location: string | null;
  };
}

export default function CountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [entries, setEntries] = useState<CountEntry[]>([]);
  const [search, setSearch] = useState("");
  const [countedBy, setCountedBy] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "counted">("all");

  const load = () => {
    fetch(`/api/sessions/${id}/entries`)
      .then((r) => r.json())
      .then((data: CountEntry[]) => {
        setEntries(data);
        // Initialize input values with existing countQty
        const vals: Record<string, string> = {};
        const notes: Record<string, string> = {};
        data.forEach((e) => {
          vals[e.id] = e.countQty !== null ? String(e.countQty) : "";
          notes[e.id] = e.notes || "";
        });
        setInputValues(vals);
        setNoteValues(notes);
      });
  };

  useEffect(() => { load(); }, [id]);

  const saveEntry = async (entryId: string) => {
    const val = inputValues[entryId];
    if (val === "" || val === undefined) return;
    setSaving(entryId);
    await fetch(`/api/sessions/${id}/entries`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryId,
        countQty: Number(val),
        countedBy,
        notes: noteValues[entryId] || null,
      }),
    });
    setSaving(null);
    load();
  };

  const filtered = entries.filter((e) => {
    const matchSearch =
      !search ||
      e.product.code.toLowerCase().includes(search.toLowerCase()) ||
      e.product.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "pending" && e.status === "PENDING") ||
      (filter === "counted" && e.status !== "PENDING");
    return matchSearch && matchFilter;
  });

  const pending = entries.filter((e) => e.status === "PENDING").length;
  const counted = entries.filter((e) => e.status !== "PENDING").length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <Link href={`/sessions/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} />
          กลับ
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">บันทึกการนับ</h1>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-sm text-blue-600 font-medium">{counted} นับแล้ว</span>
          <span className="text-sm text-gray-400">{pending} รอนับ</span>
          <div className="h-1.5 flex-1 max-w-32 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${entries.length ? (counted / entries.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหารหัสหรือชื่อสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mr-2">ผู้นับ:</label>
          <input
            value={countedBy}
            onChange={(e) => setCountedBy(e.target.value)}
            placeholder="ชื่อผู้นับ"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-36"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(["all", "pending", "counted"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm ${filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              {f === "all" ? "ทั้งหมด" : f === "pending" ? "รอนับ" : "นับแล้ว"}
            </button>
          ))}
        </div>
      </div>

      {/* Count Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อสินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ตำแหน่ง</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดระบบ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 w-36">จำนวนที่นับได้</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หมายเหตุ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 w-16">บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">ไม่พบรายการ</td>
                </tr>
              )}
              {filtered.map((e) => {
                const val = inputValues[e.id] ?? "";
                const isDirty = val !== "" && Number(val) !== e.countQty;
                return (
                  <tr key={e.id} className={`hover:bg-gray-50 ${e.status !== "PENDING" ? "bg-green-50/30" : ""}`}>
                    <td className="px-4 py-2.5 font-mono text-blue-600 font-medium text-xs">{e.product.code}</td>
                    <td className="px-4 py-2.5 font-medium">{e.product.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{e.product.location || "-"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{e.systemQty.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        value={val}
                        onChange={(ev) => setInputValues((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                        onKeyDown={(ev) => ev.key === "Enter" && saveEntry(e.id)}
                        className={`w-full text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDirty ? "border-amber-400 bg-amber-50" : "border-gray-200"
                        }`}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        value={noteValues[e.id] ?? ""}
                        onChange={(ev) => setNoteValues((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="หมายเหตุ"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {e.status !== "PENDING" ? (
                        <CheckCircle2 size={16} className="text-green-500 mx-auto" />
                      ) : (
                        <StatusBadge status={e.status} />
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => saveEntry(e.id)}
                        disabled={val === "" || saving === e.id}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-30"
                      >
                        {saving === e.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Done */}
      {counted === entries.length && entries.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 size={20} />
            <span className="font-medium">นับครบทุกรายการแล้ว!</span>
          </div>
          <Link
            href={`/sessions/${id}`}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ไปหน้าเทียบยอด →
          </Link>
        </div>
      )}
    </div>
  );
}
