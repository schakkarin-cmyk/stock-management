import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "ระบบนับสต๊อก | Stock Count Management",
  description: "ระบบจัดการนับสต๊อกสินค้า พร้อม Audit Trail",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <div className="flex h-full min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
