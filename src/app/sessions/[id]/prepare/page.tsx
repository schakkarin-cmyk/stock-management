"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Printer, Search, Check, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string | null;
  location: string | null;
  systemQty: number;
}

interface CountEntry {
  id: string;
  systemQty: number;
  status: string;
  product: Product;
}

interface CountDocument {
  id: string;
  docNumber: string;
  location: string | null;
  assignedTo: string | null;
  status: string;
}

interface Session {
  id: string;
  name: string;
  status: string;
}

export default function PreparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<CountEntry[]>([]);
  const [documents, setDocuments] = useState<CountDocument[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [docForm, setDocForm] = useState({ docNumber: "", location: "", assignedTo: "" });
  const [printing, setPrinting] = useState(false);

  const load = () => {
    Promise.all([
      fetch(`/api/sessions/${id}`).then((r) => r.json()),
      fetch(`/api/sessions/${id}/entries`).then((r) => r.json()),
      fetch(`/api/sessions/${id}/documents`).then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([sess, ents, docs, prods]) => {
      setSession(sess);
      setEntries(ents);
      setDocuments(docs);
      setAllProducts(prods);
    });
  };

  useEffect(() => { load(); }, [id]);

  const existingProductIds = new Set(entries.map((e) => e.product.id));
  const availableProducts = allProducts.filter(
    (p) =>
      !existingProductIds.has(p.id) &&
      (!search || p.code.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const addProducts = async () => {
    await fetch(`/api/sessions/${id}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: Array.from(selectedProducts) }),
    });
    setShowAddProduct(false);
    setSelectedProducts(new Set());
    setSearch("");
    load();
  };

  const addDocument = async () => {
    if (!docForm.docNumber.trim()) return;
    await fetch(`/api/sessions/${id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docForm),
    });
    setShowAddDoc(false);
    setDocForm({ docNumber: "", location: "", assignedTo: "" });
    load();
  };

  const printDoc = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  };

  if (!session) return <div className="p-8 text-gray-400 text-center">กำลังโหลด...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href={`/sessions/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 print:hidden">
          <ArrowLeft size={14} />
          กลับ
        </Link>
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">เตรียมเอกสาร</h1>
            <p className="text-gray-500 text-sm mt-1">{session.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Plus size={15} />
              เพิ่มสินค้า
            </button>
            <button
              onClick={() => setShowAddDoc(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Plus size={15} />
              เพิ่มเอกสาร
            </button>
            <button
              onClick={printDoc}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-800"
            >
              <Printer size={15} />
              พิมพ์ใบนับ
            </button>
          </div>
        </div>
      </div>

      {/* Print Area */}
      <div className="print-area hidden print:block">
        <h2 className="text-xl font-bold text-center mb-2">ใบนับสต๊อก — {session.name}</h2>
        <p className="text-center text-sm mb-6">วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}</p>
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-3 py-2 text-left">ลำดับ</th>
              <th className="border border-gray-400 px-3 py-2 text-left">รหัสสินค้า</th>
              <th className="border border-gray-400 px-3 py-2 text-left">ชื่อสินค้า</th>
              <th className="border border-gray-400 px-3 py-2 text-left">ตำแหน่ง</th>
              <th className="border border-gray-400 px-3 py-2 text-left">หน่วย</th>
              <th className="border border-gray-400 px-3 py-2 text-center w-24">จำนวนนับ</th>
              <th className="border border-gray-400 px-3 py-2 text-left w-32">ผู้นับ</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id}>
                <td className="border border-gray-400 px-3 py-3">{i + 1}</td>
                <td className="border border-gray-400 px-3 py-3 font-mono text-sm">{e.product.code}</td>
                <td className="border border-gray-400 px-3 py-3">{e.product.name}</td>
                <td className="border border-gray-400 px-3 py-3">{e.product.location || ""}</td>
                <td className="border border-gray-400 px-3 py-3">{e.product.unit}</td>
                <td className="border border-gray-400 px-3 py-3"></td>
                <td className="border border-gray-400 px-3 py-3"></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between mt-8 text-sm">
          <div>ผู้นับ: ________________</div>
          <div>ผู้ตรวจสอบ: ________________</div>
          <div>วันที่นับ: ________________</div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">เอกสารการนับ ({documents.length})</h2>
        </div>
        {documents.length === 0 ? (
          <p className="p-5 text-sm text-gray-400 text-center">ยังไม่มีเอกสาร</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="font-medium text-gray-800">{doc.docNumber}</span>
                  {doc.location && <span className="text-xs text-gray-400 ml-2">📍 {doc.location}</span>}
                  {doc.assignedTo && <span className="text-xs text-gray-400 ml-2">👤 {doc.assignedTo}</span>}
                </div>
                <StatusBadge status={doc.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">สินค้าในรอบนับ ({entries.length} รายการ)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อสินค้า</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หน่วย</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ตำแหน่ง</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดระบบ (Snapshot)</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">ยังไม่มีสินค้า กรุณาเพิ่มสินค้า</td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-600 font-medium">{e.product.code}</td>
                  <td className="px-4 py-3">{e.product.name}</td>
                  <td className="px-4 py-3 text-gray-500">{e.product.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{e.product.location || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{e.systemQty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold">เพิ่มสินค้าเข้ารอบนับ</h2>
              <button onClick={() => setShowAddProduct(false)}><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาสินค้า..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {availableProducts.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(p.id)}
                      onChange={() => {
                        setSelectedProducts((prev) => {
                          const next = new Set(prev);
                          next.has(p.id) ? next.delete(p.id) : next.add(p.id);
                          return next;
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <div className="flex-1">
                      <span className="font-mono text-xs text-blue-600">{p.code}</span>{" "}
                      <span className="text-sm text-gray-800">{p.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{p.systemQty} {p.unit}</span>
                  </label>
                ))}
                {availableProducts.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">ไม่พบสินค้าที่สามารถเพิ่มได้</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setShowAddProduct(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">ยกเลิก</button>
              <button onClick={addProducts} disabled={selectedProducts.size === 0} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
                <Check size={14} /> เพิ่ม ({selectedProducts.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold">เพิ่มเอกสารการนับ</h2>
              <button onClick={() => setShowAddDoc(false)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">เลขที่เอกสาร *</label>
                <input
                  value={docForm.docNumber}
                  onChange={(e) => setDocForm({ ...docForm, docNumber: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น DOC-001"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">โซน/ตำแหน่ง</label>
                <input
                  value={docForm.location}
                  onChange={(e) => setDocForm({ ...docForm, location: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="โซน A"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ผู้รับผิดชอบ</label>
                <input
                  value={docForm.assignedTo}
                  onChange={(e) => setDocForm({ ...docForm, assignedTo: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อผู้นับ"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setShowAddDoc(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">ยกเลิก</button>
              <button onClick={addDocument} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
                <Check size={14} /> บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
