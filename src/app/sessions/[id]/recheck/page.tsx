"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle2, AlertTriangle } from "lucide-react";

interface CountEntry {
  id: string;
  systemQty: number;
  countQty: number | null;
  recheckQty: number | null;
  variance: number | null;
  status: string;
  countedBy: string | null;
  notes: string | null;
  product: {
    code: string;
    name: string;
    unit: string;
    location: string | null;
  };
}

export default function RecheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [entries, setEntries] = useState<CountEntry[]>([]);
  const [recheckedBy, setRecheckedBy] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});

  const load = () => {
    fetch(`/api/sessions/${id}/entries`)
      .then((r) => r.json())
      .then((data: CountEntry[]) => {
        setEntries(data);
        const vals: Record<string, string> = {};
        const notes: Record<string, string> = {};
        data.forEach((e) => {
          vals[e.id] = e.recheckQty !== null ? String(e.recheckQty) : e.countQty !== null ? String(e.countQty) : "";
          notes[e.id] = e.notes || "";
        });
        setInputValues(vals);
        setNoteValues(notes);
      });
  };

  useEffect(() => { load(); }, [id]);

  // Show only entries with variance
  const recheckItems = entries.filter((e) => e.variance !== null && e.variance !== 0 && e.countQty !== null);
  const rechecked = recheckItems.filter((e) => e.status === "RECHECKED" || e.status === "APPROVED");

  const saveRecheck = async (entryId: string) => {
    const val = inputValues[entryId];
    if (val === "") return;
    setSaving(entryId);
    await fetch(`/api/sessions/${id}/recheck`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryId,
        recheckQty: Number(val),
        recheckedBy,
        notes: noteValues[entryId] || null,
      }),
    });
    setSaving(null);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <Link href={`/sessions/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} />
          กลับ
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">รีเช็คยอดนับ</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              รายการที่มีผลต่าง — {recheckItems.length} รายการ
              <span className="ml-2 text-purple-600">{rechecked.length} รีเช็คแล้ว</span>
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mr-2">ผู้รีเช็ค:</label>
            <input
              value={recheckedBy}
              onChange={(e) => setRecheckedBy(e.target.value)}
              placeholder="ชื่อผู้รีเช็ค"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white w-36"
            />
          </div>
        </div>
      </div>

      {recheckItems.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle2 size={36} className="text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">ไม่มีรายการที่มีผลต่าง</p>
          <p className="text-green-600 text-sm mt-1">ยอดนับตรงกับยอดระบบทั้งหมด</p>
        </div>
      )}

      {recheckItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อสินค้า</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดระบบ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดนับครั้ง 1</th>
                  <th className="text-right px-4 py-3 font-medium text-red-600">ผลต่าง</th>
                  <th className="text-center px-4 py-3 font-medium text-purple-600 w-36">ยอดนับครั้ง 2</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">หมายเหตุ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 w-16">บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recheckItems.map((e) => {
                  const v = e.variance || 0;
                  const val = inputValues[e.id] ?? "";
                  const isRechecked = e.status === "RECHECKED" || e.status === "APPROVED";
                  const newVariance = val !== "" ? Number(val) - e.systemQty : null;
                  return (
                    <tr key={e.id} className={isRechecked ? "bg-purple-50/30" : ""}>
                      <td className="px-4 py-2.5 font-mono text-blue-600 font-medium text-xs">{e.product.code}</td>
                      <td className="px-4 py-2.5 font-medium">
                        {e.product.name}
                        {!isRechecked && <AlertTriangle size={12} className="inline ml-1 text-amber-500" />}
                      </td>
                      <td className="px-4 py-2.5 text-right">{e.systemQty.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right">{e.countQty?.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-red-600">
                        {v > 0 ? "+" : ""}{v.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="relative">
                          <input
                            type="number"
                            value={val}
                            onChange={(ev) => setInputValues((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                            onKeyDown={(ev) => ev.key === "Enter" && saveRecheck(e.id)}
                            className={`w-full text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                              isRechecked ? "border-purple-200 bg-purple-50" : "border-amber-300 bg-amber-50"
                            }`}
                          />
                          {newVariance !== null && newVariance !== 0 && (
                            <span className={`absolute -top-4 right-0 text-xs font-medium ${newVariance > 0 ? "text-blue-600" : "text-red-600"}`}>
                              {newVariance > 0 ? "+" : ""}{newVariance}
                            </span>
                          )}
                        </div>
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
                        {isRechecked ? (
                          <CheckCircle2 size={16} className="text-purple-500 mx-auto" />
                        ) : (
                          <button
                            onClick={() => saveRecheck(e.id)}
                            disabled={val === "" || saving === e.id}
                            className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-30"
                          >
                            {saving === e.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rechecked.length === recheckItems.length && recheckItems.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-700">
            <CheckCircle2 size={20} />
            <span className="font-medium">รีเช็คครบทุกรายการแล้ว!</span>
          </div>
          <Link href={`/sessions/${id}`} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            ไปสรุปผล →
          </Link>
        </div>
      )}
    </div>
  );
}
