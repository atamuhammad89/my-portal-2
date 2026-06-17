// "use client";

// import { Bell, Menu, Search } from "lucide-react";
// import { adminRoleLabels } from "@/types/admin/roles";
// import { useAdminRole } from "@/hooks/admin/use-admin-role";

// type AdminTopHeaderProps = {
//   title: string;
// };

// export function AdminTopHeader({ title }: AdminTopHeaderProps) {
//   const { role } = useAdminRole();

//   return (
//     <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur lg:px-6">
//       <div className="flex items-center gap-3">
//         <button className="rounded-md border p-2 text-slate-600 lg:hidden">
//           <Menu className="h-4 w-4" />
//         </button>
//         <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
//       </div>

//       <div className="flex items-center gap-3">
//         <div className="hidden items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 md:flex">
//           <Search className="h-4 w-4 text-slate-500" />
//           <span className="text-sm text-slate-500">Search platform data</span>
//         </div>
//         <button className="rounded-md border p-2 text-slate-600">
//           <Bell className="h-4 w-4" />
//         </button>
//         <div className="hidden rounded-full bg-slate-900 px-3 py-1 text-sm text-white md:block">
//           {adminRoleLabels[role]}
//         </div>
//       </div>
//     </header>
//   );
// }
"use client";

import { Bell, Menu, Search } from "lucide-react";
import { adminRoleLabels } from "@/types/admin/roles";
import { useAdminRole } from "@/hooks/admin/use-admin-role";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";

type AdminTopHeaderProps = {
  title: string;
};

export function AdminTopHeader({ title }: AdminTopHeaderProps) {
  const { role } = useAdminRole();
  const user = useAuthStore((s) => s.user);
  const setAdminSidebarOpen = useUIStore((s) => s.setAdminSidebarOpen);

  return (
    <header
      className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4 backdrop-blur lg:px-6"
      style={{
        background: "var(--header-bg)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--header-shadow)"
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAdminSidebarOpen(true)}
          className="rounded-md border p-2 text-slate-400 lg:hidden cursor-pointer hover:bg-white/5 transition-colors"
          style={{ borderColor: "var(--border)" }}
          aria-label="Open admin sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        {/* User profile with avatar */}
        <div className="flex items-center gap-2 px-1.5 py-1 rounded-xl transition hover:bg-[var(--surface-2)]">
          <div className="h-8.5 w-8.5 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--brand-100)] flex items-center justify-center text-xs font-bold text-[var(--brand-500)] shadow-sm">
            {user?.fullName
              ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
              : user?.email?.slice(0, 2).toUpperCase() ?? "A"}
          </div>
          <div className="hidden flex-col md:flex text-left">
            <span className="text-xs font-bold text-[var(--foreground)] leading-tight">
              {user?.fullName ?? user?.email}
            </span>
            <span className="text-[10px] font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              {adminRoleLabels[role]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}