"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Search } from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string | null;
  location: string | null;
  systemQty: number;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [countedBy, setCountedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const filtered = products.filter(
    (p) =>
      !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
    setSelectAll(!selectAll);
  };

  const submit = async () => {
    if (!name.trim()) { setError("กรุณากรอกชื่อรอบการนับ"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          countedBy,
          notes,
          productIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "เกิดข้อผิดพลาด"); return; }
      router.push(`/sessions/${data.id}/prepare`);
    } finally {
      setLoading(false);
    }
  };

  // Group by category
  const categories = [...new Set(filtered.map((p) => p.category || "ไม่ระบุหมวด"))];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">สร้างรอบนับใหม่</h1>
        <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลและเลือกสินค้าที่ต้องการนับ</p>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">ข้อมูลรอบนับ</h2>
        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อรอบการนับ *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="เช่น นับสต๊อกประจำเดือน เม.ย. 2026"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">ผู้รับผิดชอบนับ</label>
            <input
              value={countedBy}
              onChange={(e) => setCountedBy(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ชื่อ-นามสกุล"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">หมายเหตุ</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">เลือกสินค้าที่ต้องการนับ</h2>
            <span className="text-sm text-blue-600 font-medium">{selected.size} รายการที่เลือก</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหารหัส, ชื่อ, หมวดหมู่..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600"
              />
              เลือกทั้งหมด ({filtered.length})
            </label>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {categories.map((cat) => {
            const catProducts = filtered.filter((p) => (p.category || "ไม่ระบุหมวด") === cat);
            return (
              <div key={cat}>
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {cat} ({catProducts.length})
                </div>
                {catProducts.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-600 font-medium">{p.code}</span>
                        <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{p.unit}</span>
                        {p.location && <span className="text-xs text-gray-400">📍 {p.location}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{p.systemQty.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          <X size={15} />
          ยกเลิก
        </button>
        <button
          onClick={submit}
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Check size={15} />
          {loading ? "กำลังสร้าง..." : "สร้างรอบนับ"}
        </button>
      </div>
    </div>
  );
}
