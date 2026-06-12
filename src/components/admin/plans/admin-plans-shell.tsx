"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { useAdminPlansQuery, useAdminPlanMutations } from "@/hooks/admin/use-admin-plans-query";
import { AdminPlan, AdminPlanInput } from "@/services/admin/adminPlansService";

const EMPTY_FORM: AdminPlanInput = {
  name: "",
  display_name: "",
  monthly_price: 0,
  total_minutes: 0,
  price_per_minute: 0,
  description: "",
  is_active: true,
  stripe_price_id: null,
  features: [],
  is_featured: false,
};

export function AdminPlansShell() {
  const { data: plans = [], isLoading, error } = useAdminPlansQuery();
  const { createPlan, updatePlan, deletePlan } = useAdminPlanMutations();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<AdminPlanInput>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState("");

  function openCreate() {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setNewFeature("");
    setModalOpen(true);
  }

  function openEdit(plan: AdminPlan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      display_name: plan.display_name,
      monthly_price: plan.monthly_price,
      total_minutes: plan.total_minutes,
      price_per_minute: plan.price_per_minute,
      description: plan.description ?? "",
      is_active: plan.is_active,
      stripe_price_id: plan.stripe_price_id ?? null,
      features: plan.features ?? [],
      is_featured: plan.is_featured ?? false,
    });
    setFormError(null);
    setNewFeature("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPlan(null);
    setFormError(null);
    setNewFeature("");
  }

  function addFeature() {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    setForm((f) => ({ ...f, features: [...(f.features ?? []), trimmed] }));
    setNewFeature("");
  }

  function removeFeature(index: number) {
    setForm((f) => ({
      ...f,
      features: (f.features ?? []).filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ id: editingPlan.id, input: form });
      } else {
        await createPlan.mutateAsync(form);
      }
      closeModal();
    } catch (err: any) {
      setFormError(err?.message ?? "Something went wrong.");
    }
  }

  async function handleDelete(planId: string) {
    try {
      await deletePlan.mutateAsync(planId);
      setConfirmDeleteId(null);
    } catch {
      // errors shown inline
    }
  }

  const isSubmitting = createPlan.isPending || updatePlan.isPending;

  return (
    <AdminPermissionGuard allow={["plans"]}>
      <div className="space-y-6">
        <PageHeader
          title="Plans"
          description="Manage subscription plans available to customers."
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Plan
            </button>
          }
        />

        {isLoading ? (
          <LoadingSkeleton className="h-64 w-full" />
        ) : error ? (
          <ErrorState message="Could not load plans." />
        ) : plans.length === 0 ? (
          <EmptyState title="No plans yet" message="Create your first subscription plan." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(0,240,255,0.07)]"
                style={{
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid var(--brand-500)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-base font-bold text-white">{plan.display_name}</p>
                      {plan.is_featured && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--subtle-text)] mt-0.5 font-mono">{plan.name}</p>
                  </div>
                  <StatusBadge
                    text={plan.is_active ? "Active" : "Inactive"}
                    variant={plan.is_active ? "success" : "neutral"}
                  />
                </div>

                {plan.description && (
                  <p className="text-sm text-slate-400">{plan.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 rounded-xl p-3 border border-[var(--border)] bg-[var(--surface-2)]">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Monthly</p>
                    <p className="text-sm font-bold text-white">${plan.monthly_price}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Minutes</p>
                    <p className="text-sm font-bold text-white">{plan.total_minutes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Per Min</p>
                    <p className="text-sm font-bold text-brand-teal">${plan.price_per_minute}</p>
                  </div>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {plan.stripe_price_id && (
                  <p className="text-xs text-[var(--subtle-text)] font-mono truncate">
                    Stripe: {plan.stripe_price_id}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEdit(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-[var(--surface)] hover:text-white cursor-pointer"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted-text)" }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(plan.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-rose-500/20 cursor-pointer"
                    style={{ background: "rgba(244,63,94,0.1)", borderColor: "rgba(244,63,94,0.2)", color: "#fb7185" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-45 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl flex flex-col overflow-hidden max-h-[90vh] border"
               style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 10px 50px rgba(0,0,0,0.8)" }}>
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-base font-bold text-white">
                {editingPlan ? "Edit Plan" : "New Plan"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white text-xl leading-none cursor-pointer">×</button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Internal Name <span className="text-rose-400">*</span></label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. starter"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Display Name <span className="text-rose-400">*</span></label>
                  <input
                    required
                    value={form.display_name}
                    onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                    placeholder="e.g. Starter Plan"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              {/* Pricing fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Monthly Price ($)</label>
                  <input
                    type="number" min="0" step="0.01" required
                    value={form.monthly_price === 0 ? "" : form.monthly_price}
                    onChange={(e) => setForm((f) => ({ ...f, monthly_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Total Minutes</label>
                  <input
                    type="number" min="1" required
                    value={form.total_minutes === 0 ? "" : form.total_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, total_minutes: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Price/Minute ($)</label>
                  <input
                    type="number" min="0" step="0.000001" required
                    value={form.price_per_minute === 0 ? "" : form.price_per_minute}
                    onChange={(e) => setForm((f) => ({ ...f, price_per_minute: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional plan description..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white resize-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                />
              </div>

              {/* Stripe Price ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Stripe Price ID</label>
                <input
                  value={form.stripe_price_id ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, stripe_price_id: e.target.value || null }))}
                  placeholder="e.g. price_1ABC..."
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Features</label>
                <div className="space-y-2">
                  {(form.features ?? []).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-1.5 border"
                         style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                      <span className="flex-1 text-sm text-slate-300">{feat}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                      placeholder="Add a feature and press Enter"
                      className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 text-white"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface)] hover:text-white cursor-pointer"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted-text)" }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggles: Is Active + Is Featured */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                    className={`transition-colors cursor-pointer ${form.is_active ? "text-brand-cyan" : "text-slate-500"}`}
                  >
                    {form.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                  <span className="text-sm text-slate-400">{form.is_active ? "Active" : "Inactive"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}
                    className={`transition-colors cursor-pointer ${form.is_featured ? "text-amber-500" : "text-slate-500"}`}
                  >
                    <Star className={`h-5 w-5 ${form.is_featured ? "fill-amber-400" : ""}`} />
                  </button>
                  <span className="text-sm text-slate-400">{form.is_featured ? "Featured" : "Not Featured"}</span>
                </div>
              </div>

              {formError && <p className="text-xs text-rose-400">{formError}</p>}
            </form>
            <div className="flex gap-3 border-t px-6 py-4" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface)] hover:text-white cursor-pointer"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted-text)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit as any}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? "Saving…" : editingPlan ? "Save Changes" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-45 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 border"
               style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 10px 30px rgba(0,0,0,0.8)" }}>
            <h3 className="text-base font-bold text-white">Delete Plan?</h3>
            <p className="text-sm text-slate-400">
              This will permanently delete the plan. Any subscriptions referencing it will be restricted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface)] hover:text-white cursor-pointer"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted-text)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletePlan.isPending}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {deletePlan.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPermissionGuard>
  );
}