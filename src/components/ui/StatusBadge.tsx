const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PREPARING: { label: "เตรียมเอกสาร", className: "bg-blue-100 text-blue-700" },
  COUNTING: { label: "กำลังนับ", className: "bg-yellow-100 text-yellow-700" },
  COMPARING: { label: "เทียบยอด", className: "bg-orange-100 text-orange-700" },
  RECHECKING: { label: "รีเช็ค", className: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "เสร็จสิ้น", className: "bg-green-100 text-green-700" },
  PENDING: { label: "รอนับ", className: "bg-gray-100 text-gray-600" },
  COUNTED: { label: "นับแล้ว", className: "bg-blue-100 text-blue-700" },
  RECHECKED: { label: "รีเช็คแล้ว", className: "bg-purple-100 text-purple-700" },
  APPROVED: { label: "อนุมัติ", className: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "กำลังดำเนินการ", className: "bg-yellow-100 text-yellow-700" },
  DONE: { label: "เสร็จ", className: "bg-green-100 text-green-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
