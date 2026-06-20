"use client";

import { useState } from "react";
import { useResellerCustomersQuery } from "@/hooks/use-reseller-queries";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Search } from "lucide-react";

export default function ResellerCustomersPage() {
  const { data: customers = [], isLoading, error } = useResellerCustomersQuery();
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-20 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Could not load customer data." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Customers"
        description="View subscription statuses and commission margins for your clients."
      />

      {/* Filter and Search Bar */}
      <div
        className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-4 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition"
          />
        </div>
      </div>

      {/* Customers Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No customers found" message="None of your customers matched the search criteria." />
      ) : (
        <div
          className="overflow-x-auto rounded-2xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Client Info</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Status</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Subscription Plan</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Plan Pricing</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">My Comm. Rate</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)] text-right">Monthly Comm.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sub = c.subscription;
                return (
                  <tr
                    key={c.id}
                    className="border-b last:border-b-0 hover:bg-slate-500/5 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--foreground)]">{c.fullName}</div>
                      <div className="text-xs text-[var(--muted-text)] mt-0.5">{c.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          c.isActive
                            ? "bg-[var(--success-bg)] text-[var(--success-fg)] border border-[var(--success-border)]"
                            : "bg-[var(--danger-bg)] text-[var(--danger-fg)] border border-[var(--danger-border)]"
                        }`}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sub ? (
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{sub.planName}</div>
                          <div className="text-xs text-[var(--muted-text)] mt-0.5">
                            Status: <span className="capitalize">{sub.status}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[var(--muted-text)]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sub ? (
                        <div>
                          <div className="font-medium text-[var(--foreground)]">${sub.monthlyPrice}/mo</div>
                          <div className="text-xs text-[var(--muted-text)] mt-0.5">
                            {sub.minutesUsed.toFixed(0)} / {sub.totalMinutes} mins
                          </div>
                        </div>
                      ) : (
                        <span className="text-[var(--muted-text)]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[var(--foreground)]">
                        {(c.commissionRate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-[var(--brand-500)] text-base">
                        ${c.monthlyCommission.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
