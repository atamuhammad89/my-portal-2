import { AdminSidebar } from "@/components/admin/shared/admin-sidebar";
import { AdminTopHeader } from "@/components/admin/shared/admin-top-header";

export default function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <AdminTopHeader title="Internal Admin Panel" />
        <main className="flex-1 p-4 lg:p-6 bg-background">{children}</main>
        <footer
          className="flex items-center justify-center py-3.5 px-6 text-xs"
          style={{
            borderTop: "1px solid var(--border-light)",
            background: "var(--footer-bg)",
            color: "var(--subtle-text)"
          }}
        >
          <span>
            Powered by{" "}
            <span
              className="font-semibold text-[var(--brand-500)]"
              style={{ textShadow: "var(--footer-glow)" }}
            >
              CallAutomate
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}