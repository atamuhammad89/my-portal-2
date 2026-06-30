// src/app/(dashboard)/billing/page.tsx
import { Suspense } from "react";
import { BillingShell } from "@/components/billing/billing-shell";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function BillingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton className="h-64 w-full" />}>
      <BillingShell />
    </Suspense>
  );
}