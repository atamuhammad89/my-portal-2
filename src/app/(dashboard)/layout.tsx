import { AppSidebar } from "@/components/shared/app-sidebar";
import { TopHeader } from "@/components/shared/top-header";


export default function DashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <TopHeader title="Customer Dashboard" />
        <main className="flex-1 p-4 lg:p-6 bg-background">
          {children}
        </main>
        <footer
          className="flex items-center justify-center py-3.5 px-6 text-xs"
          style={{
            borderTop: "1px solid var(--border-light)",
            background: "rgba(6, 10, 19, 0.5)",
            color: "var(--subtle-text)"
          }}
        >
          <span>
            Powered by{" "}
            <span
              className="font-semibold text-[var(--brand-500)]"
              style={{ textShadow: "0 0 10px rgba(0, 240, 255, 0.2)" }}
            >
              CallAutomate
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}

