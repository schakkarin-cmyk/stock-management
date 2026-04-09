"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, Check, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string | null;
  location: string | null;
  systemQty: number;
}

const emptyForm = { code: "", name: "", unit: "", category: "", location: "", systemQty: 0 };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/products${q}`)
      .then((r) => r.json())
      .then(setProducts);
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setError(""); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ code: p.code, name: p.name, unit: p.unit, category: p.category || "", location: p.location || "", systemQty: p.systemQty });
    setError("");
    setShowForm(true);
  };

  const save = async () => {
    setLoading(true);
    setError("");
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "เกิดข้อผิดพลาด"); return; }
      setShowForm(false);
      load();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`ยืนยันลบสินค้า "${name}"?`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      products.map((p) => ({
        "รหัสสินค้า": p.code,
        "ชื่อสินค้า": p.name,
        "หน่วย": p.unit,
        "หมวดหมู่": p.category,
        "ตำแหน่ง": p.location,
        "ยอดในระบบ": p.systemQty,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products.xlsx");
  };

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target?.result as ArrayBuffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);
      for (const row of rows) {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: String(row["รหัสสินค้า"] || row.code || ""),
            name: String(row["ชื่อสินค้า"] || row.name || ""),
            unit: String(row["หน่วย"] || row.unit || "ชิ้น"),
            category: String(row["หมวดหมู่"] || row.category || ""),
            location: String(row["ตำแหน่ง"] || row.location || ""),
            systemQty: Number(row["ยอดในระบบ"] || row.systemQty || 0),
          }),
        });
      }
      load();
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายการสินค้า</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} รายการ</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Upload size={15} />
            นำเข้า Excel
            <input type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
          </label>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={15} />
            ส่งออก Excel
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} />
            เพิ่มสินค้า
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหารหัสหรือชื่อสินค้า..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อสินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หน่วย</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หมวดหมู่</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ตำแหน่ง</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดในระบบ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">ไม่พบสินค้า</td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-blue-600 font-medium">{p.code}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{p.location || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{p.systemQty.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(p.id, p.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">รหัสสินค้า *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    disabled={!!editingId}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="FG-001"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">หน่วย *</label>
                  <input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชิ้น, กล่อง..."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อสินค้า *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อสินค้า"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">หมวดหมู่</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="สำเร็จรูป..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">ตำแหน่ง</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A-01..."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ยอดในระบบ</label>
                <input
                  type="number"
                  value={form.systemQty}
                  onChange={(e) => setForm({ ...form, systemQty: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={save} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Check size={14} />
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
