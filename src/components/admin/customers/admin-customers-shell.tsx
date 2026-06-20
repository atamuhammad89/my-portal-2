// src/components/admin/customers/admin-customers-shell.tsx
"use client";

import { useMemo, useState } from "react";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAdminCustomersQuery } from "@/hooks/admin/use-admin-customers-query";
import { AdminCustomerEditModal } from "@/components/admin/customers/admin-customer-edit-modal";
import { AdminCustomerCreateModal } from "@/components/admin/customers/admin-customer-create-modal";
import { AdminCustomer } from "@/types/admin/customer";
import { formatDateTime } from "@/utils/format";
import { Search, Pencil, UserPlus, CheckCircle2 } from "lucide-react";

type StatusFilter = "all" | "active" | "inactive";

function getRoleBadgeStyles(role: string) {
  if (role === "super_admin") {
    return {
      bg: "var(--danger-bg)",
      color: "var(--danger-fg)",
      border: "var(--danger-border, rgba(244, 63, 94, 0.25))",
    };
  }
  if (role === "reseller") {
    return {
      bg: "var(--warning-bg)",
      color: "var(--warning-fg)",
      border: "rgba(245, 158, 11, 0.25)",
    };
  }
  return {
    bg: "var(--brand-100)",
    color: "var(--brand-500)",
    border: "var(--brand-200)",
  };
}

export function AdminCustomersShell() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: customers = [],
    isLoading,
    error,
  } = useAdminCustomersQuery({
    search: query || undefined,
    status: statusFilter,
  });

  const filteredRows = useMemo(() => {
    const q = query.toLowerCase();
    return customers.filter((c) => {
      const match =
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.tenantId ?? "").toLowerCase().includes(q);
      const statusMatch =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? c.isActive
            : !c.isActive;
      return match && statusMatch;
    });
  }, [customers, query, statusFilter]);

  const tableRows = filteredRows.map((c) => ({
    id: c.id,
    _customer: c, // pass full customer for edit
    fullName: c.fullName,
    email: c.email,
    role: c.role,
    isActive: c.isActive,
    createdAt: c.createdAt,
  }));

  return (
    <AdminPermissionGuard allow={["customers"]}>
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="All users with role owner or member."
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, or tenant ID…"
              className="w-full rounded-xl border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 cursor-pointer"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <option value="all" className="bg-[var(--surface-2)]">All Statuses</option>
            <option value="active" className="bg-[var(--surface-2)]">Active</option>
            <option value="inactive" className="bg-[var(--surface-2)]">Inactive</option>
          </select>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-4 py-2 text-sm font-bold text-[var(--brand-btn-text)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Insert User
          </button>
        </div>

        {isLoading ? (
          <LoadingSkeleton className="h-80 w-full" />
        ) : error ? (
          <ErrorState message="Customers could not be loaded." />
        ) : tableRows.length === 0 ? (
          <EmptyState
            title="No customers found"
            message="Try changing filters or search query."
          />
        ) : (
          <DataTable
            rows={tableRows}
            columns={[
              {
                key: "fullName",
                label: "Name",
                render: (v) => (
                  <span className="font-semibold text-[var(--foreground)]">
                    {String(v)}
                  </span>
                ),
              },
              {
                key: "email",
                label: "Email",
                render: (v) => {
                  const emailStr = String(v);
                  const isGmail = emailStr.trim().toLowerCase().endsWith("@gmail.com");
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-sm font-medium text-[var(--muted-text)]">{emailStr}</span>
                      {isGmail ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[var(--success-fg)] bg-[var(--success-bg)] px-1.5 py-0.5 rounded-full border border-[var(--success-fg)]/25 w-max">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[var(--danger-fg)] bg-[var(--danger-bg)] px-1.5 py-0.5 rounded-full border border-[var(--danger-fg)]/25 w-max">
                          Unverified
                        </span>
                      )}
                    </div>
                  );
                }
              },
              {
                key: "role",
                label: "Role",
                render: (v) => {
                  const s = getRoleBadgeStyles(String(v));
                  return (
                    <span
                      className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
                      style={{ background: s.bg, color: s.color, borderColor: s.border }}
                    >
                      {String(v).replace("_", " ")}
                    </span>
                  );
                },
              },
              {
                key: "isActive",
                label: "Account",
                render: (v) => (
                  <StatusBadge
                    text={v ? "Active" : "Inactive"}
                    variant={v ? "success" : "neutral"}
                  />
                ),
              },
              {
                key: "createdAt",
                label: "Joined",
                render: (v) => formatDateTime(String(v)),
              },
              {
                key: "_customer",
                label: "Actions",
                render: (v) => (
                  <button
                    onClick={() => setEditingCustomer(v as AdminCustomer)}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--surface)] hover:text-brand-cyan hover:border-brand-cyan/30 cursor-pointer"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted-text)" }}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                ),
              },
            ]}
          />
        )}
      </div>

      {/* Edit Modal */}
      {editingCustomer && (
        <AdminCustomerEditModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <AdminCustomerCreateModal
          onClose={() => setIsCreateOpen(false)}
        />
      )}
    </AdminPermissionGuard>
  );
}
