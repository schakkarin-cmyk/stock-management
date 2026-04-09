"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface CountEntry {
  id: string;
  systemQty: number;
  countQty: number | null;
  variance: number | null;
  status: string;
  product: {
    code: string;
    name: string;
    unit: string;
    location: string | null;
  };
}

export default function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [entries, setEntries] = useState<CountEntry[]>([]);
  const [filterVariance, setFilterVariance] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${id}/entries`).then((r) => r.json()).then(setEntries);
  }, [id]);

  const counted = entries.filter((e) => e.countQty !== null);
  const withVariance = counted.filter((e) => e.variance !== null && e.variance !== 0);
  const noVariance = counted.filter((e) => e.variance === 0);
  const pending = entries.filter((e) => e.countQty === null);

  const displayed = filterVariance ? withVariance : counted;

  const totalVarianceValue = withVariance.reduce((sum, e) => sum + (e.variance || 0), 0);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      counted.map((e) => ({
        "รหัสสินค้า": e.product.code,
        "ชื่อสินค้า": e.product.name,
        "ตำแหน่ง": e.product.location,
        "หน่วย": e.product.unit,
        "ยอดระบบ": e.systemQty,
        "ยอดนับจริง": e.countQty,
        "ผลต่าง": e.variance,
        "สถานะ": e.variance === 0 ? "ตรงกัน" : e.variance! > 0 ? "เกิน" : "ขาด",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comparison");
    XLSX.writeFile(wb, `comparison_${id}.xlsx`);
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <Link href={`/sessions/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} />
          กลับ
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">เทียบยอด</h1>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={15} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-800">{counted.length}</p>
          <p className="text-xs text-gray-500">รายการที่นับ</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
          <p className="text-2xl font-bold text-green-600">{noVariance.length}</p>
          <p className="text-xs text-green-600">ตรงกัน</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center">
          <p className="text-2xl font-bold text-red-600">{withVariance.length}</p>
          <p className="text-xs text-red-600">มีผลต่าง</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
          <p className={`text-2xl font-bold ${totalVarianceValue > 0 ? "text-blue-600" : totalVarianceValue < 0 ? "text-red-600" : "text-gray-600"}`}>
            {totalVarianceValue > 0 ? "+" : ""}{totalVarianceValue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">ผลต่างรวม</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filterVariance}
            onChange={(e) => setFilterVariance(e.target.checked)}
            className="rounded border-gray-300 text-blue-600"
          />
          แสดงเฉพาะรายการที่มีผลต่าง ({withVariance.length})
        </label>
        {pending.length > 0 && (
          <span className="text-sm text-amber-600 font-medium">⚠️ ยังไม่ได้นับ {pending.length} รายการ</span>
        )}
      </div>

      {/* Compare Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อสินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ตำแหน่ง</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดระบบ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดนับจริง</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ผลต่าง</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">%</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">ไม่มีรายการ</td>
                </tr>
              )}
              {displayed.map((e) => {
                const v = e.variance || 0;
                const pct = e.systemQty > 0 ? ((v / e.systemQty) * 100).toFixed(1) : "—";
                const rowClass =
                  v === 0
                    ? "hover:bg-gray-50"
                    : v > 0
                    ? "bg-blue-50/40 hover:bg-blue-50"
                    : "bg-red-50/40 hover:bg-red-50";
                return (
                  <tr key={e.id} className={rowClass}>
                    <td className="px-4 py-2.5 font-mono text-blue-600 font-medium text-xs">{e.product.code}</td>
                    <td className="px-4 py-2.5 font-medium">{e.product.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{e.product.location || "-"}</td>
                    <td className="px-4 py-2.5 text-right">{e.systemQty.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{e.countQty?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-bold ${v > 0 ? "text-blue-600" : v < 0 ? "text-red-600" : "text-gray-400"}`}>
                        {v === 0 ? "—" : `${v > 0 ? "+" : ""}${v.toLocaleString()}`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-gray-500">{pct}{pct !== "—" ? "%" : ""}</td>
                    <td className="px-4 py-2.5 text-center">
                      {v === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <Minus size={12} /> ตรงกัน
                        </span>
                      ) : v > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          <TrendingUp size={12} /> เกิน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <TrendingDown size={12} /> ขาด
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Link href={`/sessions/${id}`} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          กลับหน้าภาพรวม
        </Link>
      </div>
    </div>
  );
}
