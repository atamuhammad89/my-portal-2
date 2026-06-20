"use client";

import { useState, useEffect } from "react";
import { useAdminResellersQuery } from "@/hooks/admin/use-admin-resellers-query";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, Eye, Users, DollarSign, X, UserPlus, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function AdminResellersPage() {
  const queryClient = useQueryClient();
  const { data: resellers = [], isLoading, error } = useAdminResellersQuery();
  const [search, setSearch] = useState("");
  const [selectedReseller, setSelectedReseller] = useState<any | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // States for updating reseller commission rate
  const [resellerRate, setResellerRate] = useState("0.00");
  const [updatingRate, setUpdatingRate] = useState(false);
  const [rateSuccess, setRateSuccess] = useState(false);
  const [rateError, setRateError] = useState("");

  useEffect(() => {
    if (selectedReseller) {
      setResellerRate(selectedReseller.defaultCommissionRate.toString());
      setRateSuccess(false);
      setRateError("");
    }
  }, [selectedReseller]);

  const handleUpdateRate = async () => {
    if (!selectedReseller) return;
    setUpdatingRate(true);
    setRateSuccess(false);
    setRateError("");
    try {
      await apiClient.patch(`/admin/customers/${selectedReseller.id}`, {
        commissionRate: parseFloat(resellerRate),
      });
      setRateSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["admin", "resellers"] });
      // Keep selected reseller state up to date
      setSelectedReseller((prev: any) =>
        prev
          ? {
              ...prev,
              defaultCommissionRate: parseFloat(resellerRate),
            }
          : null
      );
    } catch (err: any) {
      setRateError(err?.message || "Failed to update rate.");
    } finally {
      setUpdatingRate(false);
    }
  };

  const filtered = resellers.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
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
    return <ErrorState message="Could not load resellers data." />;
  }

  // Calculate totals
  const totalClients = resellers.reduce((acc, r) => acc + r.clientsCount, 0);
  const totalRevenue = resellers.reduce((acc, r) => acc + r.totalRevenue, 0);
  const totalCommission = resellers.reduce((acc, r) => acc + r.totalCommission, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resellers Management"
        description="Monitor registered resellers, view their customer counts, and track profit margins."
      />

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Resellers */}
        <div
          className="flex items-center gap-4 rounded-2xl border p-5 relative overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">Total Resellers</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-0.5">{resellers.length}</p>
          </div>
        </div>

        {/* Total Clients Referred */}
        <div
          className="flex items-center gap-4 rounded-2xl border p-5 relative overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">Total Referred Clients</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-0.5">{totalClients}</p>
          </div>
        </div>

        {/* Total Commission Payouts */}
        <div
          className="flex items-center gap-4 rounded-2xl border p-5 relative overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">Monthly Comm. Payouts</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-0.5">${totalCommission.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3.5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search resellers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-4 py-2 text-sm text-[var(--foreground)] placeholder-slate-500 outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition"
          />
        </div>
        <button
          onClick={() => setAssignModalOpen(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-4 py-2 text-sm font-bold text-[var(--brand-btn-text)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Assign Customer
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No resellers found" message="No resellers matched your search." />
      ) : (
        <div
          className="overflow-x-auto rounded-2xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Reseller Info</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Joined</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Referred Clients</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Default Rate</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Monthly Client Revenue</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)]">Monthly Comm. Paid</th>
                <th className="px-6 py-4 font-semibold text-[var(--subtle-text)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b last:border-b-0 hover:bg-slate-500/5 transition-colors"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[var(--foreground)]">{r.fullName}</div>
                    <div className="text-xs text-[var(--muted-text)] mt-0.5">{r.email}</div>
                  </td>
                  <td className="px-6 py-4 text-[var(--foreground)]">
                    {dayjs(r.createdAt).format("DD MMM YYYY")}
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--foreground)]">
                    {r.clientsCount} {r.clientsCount === 1 ? "client" : "clients"}
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--foreground)]">
                    {(r.defaultCommissionRate * 100).toFixed(0)}%
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--foreground)]">
                    ${r.totalRevenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-[var(--brand-500)]">
                    ${r.totalCommission.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedReseller(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] bg-[var(--surface-2)] hover:bg-[var(--surface)] transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reseller Details modal */}
      {selectedReseller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-3xl rounded-2xl shadow-2xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <span className="text-sm font-semibold text-[var(--foreground)]">Reseller Detail View</span>
                <h2 className="text-lg font-bold text-[var(--brand-500)] mt-0.5">{selectedReseller.fullName}</h2>
              </div>
              <button
                onClick={() => setSelectedReseller(null)}
                className="rounded-lg p-1.5 text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted-text)]">Email Address</p>
                  <p className="text-sm font-medium text-[var(--foreground)] mt-0.5 truncate">{selectedReseller.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted-text)]">Monthly Client Revenue</p>
                  <p className="text-sm font-bold text-[var(--foreground)] mt-0.5">${selectedReseller.totalRevenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted-text)]">Reseller Commission (Monthly)</p>
                  <p className="text-sm font-bold text-[var(--brand-500)] mt-0.5">${selectedReseller.totalCommission.toFixed(2)}</p>
                </div>
              </div>

              {/* Commission Settings Panel */}
              <div
                className="bg-[var(--surface-2)] p-4 rounded-xl border space-y-3"
                style={{ borderColor: "var(--border)" }}
              >
                <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Commission Settings</h4>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5 flex-1 max-w-[200px]">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted-text)]">Default Commission Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={resellerRate}
                      onChange={(e) => setResellerRate(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-500)]"
                    />
                  </div>
                  <button
                    onClick={handleUpdateRate}
                    disabled={updatingRate}
                    className="rounded-xl bg-[var(--brand-500)] px-4 py-2 text-xs font-bold text-[var(--brand-btn-text)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition disabled:opacity-50 cursor-pointer"
                  >
                    {updatingRate ? "Saving…" : "Save Rate"}
                  </button>
                  {rateSuccess && (
                    <span className="text-xs text-[var(--success-fg)] font-medium flex items-center gap-1 self-center pb-2">
                      ✓ Saved
                    </span>
                  )}
                  {rateError && (
                    <span className="text-xs text-[var(--danger-fg)] font-medium flex items-center gap-1 self-center pb-2">
                      Error: {rateError}
                    </span>
                  )}
                </div>
              </div>

              {/* Referred Clients List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Assigned Clients ({selectedReseller.clientsCount})</h3>
                {selectedReseller.clients.length === 0 ? (
                  <div className="text-center py-6 text-sm text-[var(--muted-text)] bg-[var(--surface-2)] border rounded-xl" style={{ borderColor: "var(--border)" }}>
                    No clients assigned to this reseller yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                          <th className="px-4 py-3 font-semibold text-[var(--subtle-text)]">Client</th>
                          <th className="px-4 py-3 font-semibold text-[var(--subtle-text)]">Status</th>
                          <th className="px-4 py-3 font-semibold text-[var(--subtle-text)]">Active Subscription</th>
                          <th className="px-4 py-3 font-semibold text-[var(--subtle-text)]">Sub Price</th>
                          <th className="px-4 py-3 font-semibold text-[var(--subtle-text)]">Comm Rate</th>
                          <th className="px-4 py-3 font-semibold text-[var(--subtle-text)] text-right">Comm Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReseller.clients.map((c: any) => (
                          <tr
                            key={c.id}
                            className="border-b last:border-b-0 hover:bg-slate-500/5 transition-colors"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <td className="px-4 py-3">
                              <div className="font-semibold text-[var(--foreground)]">{c.fullName}</div>
                              <div className="text-[10px] text-[var(--muted-text)] mt-0.5">{c.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.25 text-[10px] font-semibold ${
                                  c.isActive
                                    ? "bg-[var(--success-bg)] text-[var(--success-fg)] border border-[var(--success-border)]"
                                    : "bg-[var(--danger-bg)] text-[var(--danger-fg)] border border-[var(--danger-border)]"
                                }`}
                              >
                                {c.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[var(--foreground)] font-medium">
                              {c.planName}
                            </td>
                            <td className="px-4 py-3 text-[var(--foreground)]">
                              ${c.monthlyPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-[var(--foreground)] font-medium">
                              {(c.commissionRate * 100).toFixed(0)}%
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-[var(--brand-500)]">
                              ${c.monthlyCommission.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setSelectedReseller(null)}
                className="rounded-xl border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Customer Modal */}
      {assignModalOpen && (
        <AssignCustomerModal
          resellers={resellers}
          onClose={() => setAssignModalOpen(false)}
        />
      )}
    </div>
  );
}

function AssignCustomerModal({
  resellers,
  onClose,
}: {
  resellers: any[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [resellerId, setResellerId] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    apiClient.get("/admin/customers")
      .then((res) => {
        const list = (res.data ?? []).filter((u: any) => u.role === "owner");
        setCustomers(list);
      })
      .catch((err) => console.error("Error loading customers", err));
  }, []);

  const handleAssign = async () => {
    setErrorMsg("");
    setSuccess(false);
    if (!customerId) {
      setErrorMsg("Please select a customer.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.patch(`/admin/customers/${customerId}`, {
        resellerId: resellerId || null,
      });
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["admin", "resellers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to assign customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-[var(--brand-500)]">
            <UserPlus className="h-4 w-4" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Assign Customer to Reseller</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Select Customer */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">Select Customer (Owner)</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                const selected = customers.find((c) => c.id === e.target.value);
                if (selected) {
                  setResellerId(selected.resellerId || "");
                }
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition cursor-pointer"
            >
              <option value="" className="bg-[var(--surface-2)]">Select a customer...</option>
              {customers.map((c) => {
                const assignedReseller = resellers.find((r) => r.id === c.resellerId);
                const suffix = assignedReseller ? ` (Current: ${assignedReseller.fullName})` : "";
                return (
                  <option key={c.id} value={c.id} className="bg-[var(--surface-2)]">
                    {c.fullName} ({c.email}){suffix}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Select Reseller */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--subtle-text)] uppercase tracking-wider">Assigned Reseller</label>
            <select
              value={resellerId}
              onChange={(e) => setResellerId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-500)] focus:ring-1 focus:ring-[var(--brand-500)]/30 transition cursor-pointer"
            >
              <option value="" className="bg-[var(--surface-2)]">None (Unassign)</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id} className="bg-[var(--surface-2)]">
                  {r.fullName} ({r.email})
                </option>
              ))}
            </select>
          </div>

          {errorMsg && (
            <p className="rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] px-3 py-2 text-xs text-[var(--danger-fg)]">
              {errorMsg}
            </p>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] px-3 py-2 text-xs text-[var(--success-fg)]">
              <CheckCircle2 className="h-4 w-4" />
              Customer assigned successfully.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="rounded-xl bg-[var(--brand-500)] px-5 py-2 text-sm font-bold text-[var(--brand-btn-text)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Assigning…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
