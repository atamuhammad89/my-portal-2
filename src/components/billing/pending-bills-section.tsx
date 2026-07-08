// src/components/billing/pending-bills-section.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AlertTriangle, CreditCard, Download, Receipt, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/format";
import { downloadInvoicePdf } from "@/utils/download-invoice-pdf";

type PendingBill = {
  invoiceId: string;
  subscriptionId: string;
  subscriptionStatus: "active" | "expired" | "past_due";
  planName: string;
  invoiceStatus: "pending" | "paid" | "dismissed";
  periodStart: string;
  periodEnd: string | null;
  allocatedMinutes: number;
  usedMinutes: number;
  overageMinutes: number;
  pricePerMinute: number;
  overageAmount: number;
  monthlyPrice: number;
  generatedAt: string;
};

type PendingBillsResponse = {
  pendingBills: PendingBill[];
};

function OverageInvoiceRow({ bill }: { bill: PendingBill }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayNow = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/overage-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId: bill.invoiceId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate payment.");
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to redirect to checkout.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-4 rounded-xl px-5 py-3.5"
        style={{
          background: "var(--danger-bg)",
          border: "1px solid var(--danger-border)",
        }}
      >
        {/* Red icon */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--danger-bg)]">
          <Receipt className="h-4 w-4 text-[var(--danger-fg)]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Overage Invoice
            </span>
            <span className="rounded-full bg-[var(--danger-bg)] border border-[var(--danger-border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--danger-fg)]">
              PENDING
            </span>
            <span className="text-xs text-slate-400 font-mono">
              #{bill.invoiceId.slice(-8).toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {bill.planName} · {bill.overageMinutes} min overage ·{" "}
            {formatDate(bill.periodStart)}{" "}
            {bill.periodEnd ? `→ ${formatDate(bill.periodEnd)}` : "→ present"}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-[var(--danger-fg)]">
            ${bill.overageAmount.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-500">Due now</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Download */}
          <button
            onClick={() => {
              downloadInvoicePdf({
                invoiceId: bill.invoiceId,
                planName: bill.planName,
                periodStart: bill.periodStart,
                periodEnd: bill.periodEnd,
                allocatedMinutes: bill.allocatedMinutes,
                usedMinutes: bill.usedMinutes,
                overageMinutes: bill.overageMinutes,
                pricePerMinute: bill.pricePerMinute,
                amount: bill.overageAmount,
                type: "overage",
                invoiceNumber: `OV-${bill.invoiceId.slice(-8).toUpperCase()}`,
                generatedAt: bill.generatedAt,
              });
            }}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>

          {/* Pay Now */}
          <button
            onClick={handlePayNow}
            disabled={isProcessing}
            title="Pay Now"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--danger-fg)] transition-all hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CreditCard className="h-3.5 w-3.5" />
            )}
            {isProcessing ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-rose-500 px-5">{error}</p>
      )}
    </div>
  );
}

export function PendingBillsSection() {
  const { data, isLoading, error } = useQuery<PendingBillsResponse>({
    queryKey: ["billing", "pending-bills"],
    queryFn: async () => {
      const res = await apiClient.get<PendingBillsResponse>("/billing/pending-bills");
      return res.data;
    },
    refetchInterval: 300_000, // auto-refresh every 5 minutes
  });


  const bills = data?.pendingBills ?? [];

  if (isLoading || error || bills.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {bills.map((bill) => (
        <OverageInvoiceRow key={bill.invoiceId} bill={bill} />
      ))}
    </div>
  );
}