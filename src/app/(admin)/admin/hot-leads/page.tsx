"use client";

import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { HotLeadsView } from "@/components/admin/hot-leads/hot-leads-view";

export default function AdminHotLeadsPage() {
  return (
    <AdminPermissionGuard allow={["hot_leads"]}>
      <HotLeadsView />
    </AdminPermissionGuard>
  );
}
