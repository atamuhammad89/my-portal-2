"use client";

import { Users, TrendingUp, Clock, DollarSign, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable } from "@/components/shared/data-table";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { useAdminOverviewQuery } from "@/hooks/admin/use-admin-overview-query";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

export function AdminOverviewShell() {
  const { data, isLoading, error } = useAdminOverviewQuery();

  return (
    <AdminPermissionGuard allow={["overview"]}>
      {isLoading ? (
        <LoadingSkeleton className="h-96 w-full" />
      ) : error ? (
        <ErrorState message="Admin overview could not be loaded." />
      ) : !data ? (
        <EmptyState title="No overview data" message="No platform overview metrics are available." />
      ) : (
        <div className="space-y-6">
          <PageHeader
            title="Platform Overview"
            description="Real-time metrics pulled from your database."
          />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Customers"
              value={String(data.metrics.totalUsers)}
              icon={<Users className="h-5 w-5" />}
              subtext="Registered users"
              sparklineColor="blue"
            />
            <StatCard
              label="Active Subscriptions"
              value={String(data.metrics.activeSubscriptions)}
              icon={<TrendingUp className="h-5 w-5" />}
              subtext="Currently active"
              sparklineColor="green"
            />
            <StatCard
              label="Total Minutes Used"
              value={data.metrics.totalMinutesUsed.toLocaleString() + " min"}
              icon={<Clock className="h-5 w-5" />}
              subtext="This month"
              sparklineColor="purple"
            />
            <StatCard
              label="Monthly Revenue (Active)"
              value={"$" + Number(data.metrics.totalRevenue).toLocaleString()}
              icon={<DollarSign className="h-5 w-5" />}
              subtext="This month"
              sparklineColor="orange"
            />
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden text-left">
            {/* Header row inside table card */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4.5 bg-[var(--surface-2)]">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-[var(--brand-500)]" />
                <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider font-sans">Recent Signups</h3>
              </div>
              <Link href="/admin/customers">
                <button className="rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--brand-500)] hover:bg-[var(--brand-50)] text-xs font-bold px-3 py-1.5 transition flex items-center gap-1 cursor-pointer">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>

            {data.recentSignups.length === 0 ? (
              <EmptyState title="No signups yet" message="No customers have signed up yet." />
            ) : (
              <DataTable
                rows={data.recentSignups}
                columns={[
                  {
                    key: "fullName",
                    label: "Name",
                    render: (val, row) => {
                      const name = String(val || row.email || "Customer");
                      const initial = name[0].toUpperCase();
                      const colors = [
                        { bg: "bg-blue-50 text-blue-600 border-blue-100", border: "border-blue-100" },
                        { bg: "bg-emerald-50 text-emerald-600 border-emerald-100", border: "border-emerald-100" },
                        { bg: "bg-amber-50 text-amber-600 border-amber-100", border: "border-amber-100" },
                        { bg: "bg-purple-50 text-purple-600 border-purple-100", border: "border-purple-100" }
                      ];
                      const color = colors[name.length % colors.length];
                      return (
                        <div className="flex items-center gap-3">
                          <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 border", color.bg, color.border)}>
                            {initial}
                          </div>
                          <span className="font-bold text-[var(--foreground)]">{name}</span>
                        </div>
                      );
                    }
                  },
                  { key: "email", label: "Email" },
                  {
                    key: "plan",
                    label: "Plan",
                    render: (val) => {
                      const planStr = String(val || "Pro");
                      const isPro = planStr.toLowerCase() === "pro";
                      return (
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-bold border",
                          isPro
                            ? "bg-blue-50 text-blue-700 border-blue-200/50"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                        )}>
                          {planStr}
                        </span>
                      );
                    }
                  },
                  {
                    key: "createdAt",
                    label: "Signed Up",
                    render: (val) => (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--muted-text)] font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{formatDateTime(String(val))}</span>
                      </div>
                    )
                  }
                ]}
              />
            )}
          </section>
        </div>
      )}
    </AdminPermissionGuard>
  );
}