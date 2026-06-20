// "use client";

// import { useState } from "react";
// import { PauseCircle, PlayCircle, XCircle } from "lucide-react";
// import { PageHeader } from "@/components/shared/page-header";
// import { StatusBadge } from "@/components/shared/status-badge";
// import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
// import { ErrorState } from "@/components/shared/error-state";
// import { EmptyState } from "@/components/shared/empty-state";
// import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
// import {
//   useAdminSubscriptionsQuery,
//   useSubscriptionAction,
// } from "@/hooks/admin/use-admin-subscriptions-query";
// import {
//   AdminSubscription,
//   SubscriptionAction,
// } from "@/services/admin/adminSubscriptionsService";
// import { formatDate } from "@/utils/format";

// type ConfirmAction = {
//   id: string;
//   action: SubscriptionAction;
//   userName: string;
// };

// function statusVariant(status: string) {
//   if (status === "active") return "success";
//   if (status === "cancelled") return "danger";
//   if (status === "past_due") return "warning";
//   return "neutral";
// }

// function minutesPercent(used: number, total: number) {
//   if (!total) return 0;
//   return Math.min(100, Math.round((used / total) * 100));
// }

// export function AdminSubscriptionsShell() {
//   const {
//     data: subscriptions = [],
//     isLoading,
//     error,
//   } = useAdminSubscriptionsQuery();
//   const action = useSubscriptionAction();
//   const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
//   const [filter, setFilter] = useState<"all" | "active" | "cancelled">("all");

//   const filtered = subscriptions.filter((s) =>
//     filter === "all" ? true : s.status === filter,
//   );

//   async function handleConfirm() {
//     if (!confirm) return;
//     await action.mutateAsync({ id: confirm.id, action: confirm.action });
//     setConfirm(null);
//   }

//   return (
//     <AdminPermissionGuard allow={["subscriptions"]}>
//       <div className="space-y-6">
//         <PageHeader
//           title="Subscriptions"
//           description="View and manage all customer subscriptions."
//         />

//         {/* Filter tabs */}
//         <div className="flex gap-2">
//           {(["all", "active", "cancelled"] as const).map((f) => (
//             <button
//               key={f}
//               onClick={() => setFilter(f)}
//               className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
//                 filter === f
//                   ? "bg-indigo-600 text-white shadow-sm"
//                   : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
//               }`}
//             >
//               {f}
//             </button>
//           ))}
//         </div>

//         {isLoading ? (
//           <LoadingSkeleton className="h-96 w-full" />
//         ) : error ? (
//           <ErrorState message="Could not load subscriptions." />
//         ) : filtered.length === 0 ? (
//           <EmptyState
//             title="No subscriptions"
//             message="No subscriptions match this filter."
//           />
//         ) : (
//           <div
//             className="overflow-x-auto rounded-2xl bg-white"
//             style={{
//               boxShadow: "var(--shadow-sm)",
//               border: "1px solid var(--border-light)",
//             }}
//           >
//             <table className="min-w-full text-left">
//               <thead>
//                 <tr
//                   style={{
//                     background:
//                       "linear-gradient(90deg, #f5f3ff 0%, #eef2ff 100%)",
//                     borderBottom: "1px solid var(--border)",
//                   }}
//                 >
//                   {[
//                     "Customer",
//                     "Plan",
//                     "Status",
//                     "USAGE (CDR / Plan)",
//                     // "CDR Usage",
//                     "Monthly",
//                     "Started",
//                     "Actions",
//                   ].map((h) => (
//                     <th
//                       key={h}
//                       className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
//                       style={{ color: "#6366f1" }}
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map((sub, i) => {
//                   const pct = minutesPercent(sub.minutesUsed, sub.totalMinutes);
//                   return (
//                     <tr
//                       key={sub.id}
//                       style={{
//                         borderTop: "1px solid var(--border-light)",
//                         background: i % 2 === 1 ? "#fafbff" : "white",
//                       }}
//                     >
//                       <td className="px-4 py-3">
//                         <p className="text-sm font-medium text-slate-800">
//                           {sub.userFullName}
//                         </p>
//                         <p className="text-xs text-slate-400">
//                           {sub.userEmail}
//                         </p>
//                       </td>
//                       <td className="px-4 py-3 text-sm text-slate-700">
//                         {sub.planDisplayName}
//                       </td>
//                       <td className="px-4 py-3">
//                         <StatusBadge
//                           text={sub.status}
//                           variant={statusVariant(sub.status)}
//                         />
//                       </td>
//                       {/* <td className="px-4 py-3 min-w-[140px]">
//                         <div className="flex items-center gap-2">
//                           <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
//                             <div
//                               className="h-full rounded-full bg-indigo-500 transition-all"
//                               style={{ width: `${pct}%` }}
//                             />
//                           </div>
//                           <span className="text-xs text-slate-500 whitespace-nowrap">
//                             {sub.minutesUsed}/{sub.totalMinutes}m
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 text-sm text-slate-700">
//                         {sub.usageMinutes} min
//                       </td> */}
//                       <td className="px-4 py-3 min-w-[180px]">
//                         <div className="space-y-1">
//                           {/* Top row: CDR usage + percent */}
//                           <div className="flex items-center justify-between text-xs text-slate-600">
//                             <span>{sub.usageMinutes} min (CDR)</span>
//                             <span>
//                               {sub.totalMinutes
//                                 ? `${Math.round((sub.usageMinutes / sub.totalMinutes) * 100)}%`
//                                 : "—"}
//                             </span>
//                           </div>

//                           {/* Progress bar */}
//                           <div className="flex items-center gap-2">
//                             <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
//                               <div
//                                 className="h-full rounded-full bg-indigo-500 transition-all"
//                                 style={{
//                                   width: sub.totalMinutes
//                                     ? `${Math.min(
//                                         100,
//                                         Math.round(
//                                           (sub.usageMinutes /
//                                             sub.totalMinutes) *
//                                             100,
//                                         ),
//                                       )}%`
//                                     : "0%",
//                                 }}
//                               />
//                             </div>

//                             {/* <span className="text-[11px] text-slate-500 whitespace-nowrap">
//                               {sub.minutesUsed}/{sub.totalMinutes}m
//                             </span> */}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 text-sm text-slate-700">
//                         ${sub.monthlyPrice}
//                       </td>
//                       <td className="px-4 py-3 text-sm text-slate-500">
//                         {formatDate(sub.startedAt)}
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="flex items-center gap-1">
//                           {sub.status === "active" && (
//                             <>
//                               <button
//                                 title="Pause (cancel)"
//                                 onClick={() =>
//                                   setConfirm({
//                                     id: sub.id,
//                                     action: "pause",
//                                     userName: sub.userFullName,
//                                   })
//                                 }
//                                 className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
//                               >
//                                 <PauseCircle className="h-4 w-4" />
//                               </button>
//                               <button
//                                 title="Terminate"
//                                 onClick={() =>
//                                   setConfirm({
//                                     id: sub.id,
//                                     action: "terminate",
//                                     userName: sub.userFullName,
//                                   })
//                                 }
//                                 className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
//                               >
//                                 <XCircle className="h-4 w-4" />
//                               </button>
//                             </>
//                           )}
//                           {sub.status === "cancelled" && (
//                             <button
//                               title="Resume"
//                               onClick={() =>
//                                 setConfirm({
//                                   id: sub.id,
//                                   action: "resume",
//                                   userName: sub.userFullName,
//                                 })
//                               }
//                               className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
//                             >
//                               <PlayCircle className="h-4 w-4" />
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Confirm Action Modal */}
//       {confirm && (
//         <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
//           <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
//             <h3 className="text-base font-semibold text-slate-900 capitalize">
//               {confirm.action} Subscription
//             </h3>
//             <p className="text-sm text-slate-500">
//               {confirm.action === "terminate"
//                 ? `This will permanently terminate ${confirm.userName}'s subscription. This cannot be undone.`
//                 : confirm.action === "pause"
//                   ? `This will cancel ${confirm.userName}'s subscription. You can resume it later.`
//                   : `This will reactivate ${confirm.userName}'s subscription.`}
//             </p>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setConfirm(null)}
//                 className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirm}
//                 disabled={action.isPending}
//                 className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
//                   confirm.action === "terminate"
//                     ? "bg-rose-600 hover:bg-rose-700"
//                     : confirm.action === "pause"
//                       ? "bg-amber-500 hover:bg-amber-600"
//                       : "bg-emerald-600 hover:bg-emerald-700"
//                 }`}
//               >
//                 {action.isPending ? "Processing…" : `Confirm ${confirm.action}`}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </AdminPermissionGuard>
//   );
// }
"use client";

import { useState } from "react";
import { PauseCircle, PlayCircle, XCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import {
  useAdminSubscriptionsQuery,
  useSubscriptionAction,
} from "@/hooks/admin/use-admin-subscriptions-query";
import {
  AdminSubscription,
  SubscriptionAction,
} from "@/services/admin/adminSubscriptionsService";
import { formatDate } from "@/utils/format";

type ConfirmAction = {
  id: string;
  action: SubscriptionAction;
  userName: string;
};

function statusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  if (status === "expired") return "neutral";
  return "neutral";
}

function minutesPercent(used: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

const FILTER_TABS = ["all", "active", "paused", "expired"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export function AdminSubscriptionsShell() {
  const {
    data: subscriptions = [],
    isLoading,
    error,
  } = useAdminSubscriptionsQuery();
  const action = useSubscriptionAction();
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");

  const filtered = subscriptions.filter((s) =>
    filter === "all" ? true : s.status === filter,
  );

  async function handleConfirm() {
    if (!confirm) return;
    await action.mutateAsync({ id: confirm.id, action: confirm.action });
    setConfirm(null);
  }

  function confirmLabel(action: SubscriptionAction) {
    if (action === "renew") return "bg-[var(--brand-500)] hover:opacity-90";
    if (action === "pause") return "bg-[var(--warning-fg)] hover:opacity-90";
    return "bg-[var(--success-fg)] hover:opacity-90";
  }

  function confirmDescription(a: ConfirmAction) {
    if (a.action === "pause")
      return `This will pause ${a.userName}'s subscription. You can resume it later.`;
    if (a.action === "renew")
      return `This will renew ${a.userName}'s subscription from today, resetting usage and extending the end date by the plan duration.`;
    return `This will reactivate ${a.userName}'s subscription.`;
  }

  return (
    <AdminPermissionGuard allow={["subscriptions"]}>
      <div className="space-y-6">
        <PageHeader
          title="Subscriptions"
          description="View and manage all customer subscriptions."
        />

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)] shadow-sm"
                  : "bg-[var(--surface-2)] text-[var(--muted-text)] border border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingSkeleton className="h-96 w-full" />
        ) : error ? (
          <ErrorState message="Could not load subscriptions." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No subscriptions"
            message="No subscriptions match this filter."
          />
        ) : (
          <div className="premium-table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  {[
                    "Customer",
                    "Plan",
                    "Status",
                    "USAGE (CDR / Plan)",
                    "Monthly",
                    "Started",
                    "Ends",
                    "Actions",
                  ].map((h) => (
                    <th key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => {
                  return (
                    <tr key={sub.id}>
                      <td>
                        <p className="font-semibold text-[var(--foreground)]">
                          {sub.userFullName}
                        </p>
                        <p className="text-xs text-[var(--muted-text)]">
                          {sub.userEmail}
                        </p>
                      </td>
                      <td className="text-[var(--foreground)]">
                        {sub.planDisplayName}
                      </td>
                      <td>
                        <StatusBadge
                          text={sub.status}
                          variant={statusVariant(sub.status)}
                        />
                      </td>
                      <td className="min-w-[180px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-[var(--muted-text)]">
                            <span>{sub.minutesUsed} min (CDR)</span>
                            <span>
                              {sub.totalMinutes
                                ? `${Math.round((sub.minutesUsed / sub.totalMinutes) * 100)}%`
                                : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--brand-500)] transition-all"
                                style={{
                                  width: sub.totalMinutes
                                    ? `${Math.min(
                                        100,
                                        Math.round(
                                          (sub.minutesUsed /
                                            sub.totalMinutes) *
                                            100,
                                        ),
                                      )}%`
                                    : "0%",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--foreground)]">
                        ${sub.monthlyPrice}
                      </td>
                      <td className="text-[var(--muted-text)]">
                        {formatDate(sub.startedAt)}
                      </td>
                      <td className="text-[var(--muted-text)]">
                        {sub.endsAt ? formatDate(sub.endsAt) : "—"}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {sub.status === "active" && (
                            <button
                              title="Pause Subscription"
                              onClick={() =>
                                setConfirm({
                                  id: sub.id,
                                  action: "pause",
                                  userName: sub.userFullName,
                                })
                              }
                              className="p-1.5 rounded-lg text-[var(--warning-fg)] hover:bg-[var(--warning-bg)] transition-colors cursor-pointer"
                            >
                              <PauseCircle className="h-4 w-4" />
                            </button>
                          )}
                          {sub.status === "paused" && (
                            <button
                              title="Resume Subscription"
                              onClick={() =>
                                setConfirm({
                                  id: sub.id,
                                  action: "resume",
                                  userName: sub.userFullName,
                                  })
                                }
                              className="p-1.5 rounded-lg text-[var(--success-fg)] hover:bg-[var(--success-bg)] transition-colors cursor-pointer"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </button>
                          )}
                          {sub.status === "expired" && (
                            <button
                              title="Renew Subscription"
                              onClick={() =>
                                setConfirm({
                                  id: sub.id,
                                  action: "renew",
                                  userName: sub.userFullName,
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand-100)] text-[var(--brand-500)] border border-[var(--brand-200)] hover:bg-[var(--brand-200)] transition-colors text-xs font-semibold cursor-pointer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Renew
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Action Modal */}
      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              {confirm.action === "renew" && (
                <div className="w-8 h-8 rounded-full bg-[var(--brand-100)] flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="h-4 w-4 text-[var(--brand-500)]" />
                </div>
              )}
              <h3 className="text-base font-semibold text-[var(--foreground)] capitalize">
                {confirm.action} Subscription
              </h3>
            </div>
            <p className="text-sm text-[var(--muted-text)]">{confirmDescription(confirm)}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={action.isPending}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-bold text-[var(--brand-btn-text)] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                style={{ background: confirmLabel(confirm.action).split(" ")[0].match(/var\(--[a-z0-9-]+\)/)?.[0] || "var(--brand-500)" }}
              >
                {action.isPending ? "Processing…" : `Confirm ${confirm.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPermissionGuard>
  );
}