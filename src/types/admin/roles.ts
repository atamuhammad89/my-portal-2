export type AdminRole = "super_admin" | "operations" | "support" | "finance";

export const adminRoleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  operations: "Operations",
  support: "Support",
  finance: "Finance"
};

export type AdminNavPermission =
  | "overview"
  | "customers"
  | "plans"
  | "subscriptions"
  | "agents"
  | "billing"
  | "call_logs"
  | "resellers"
  | "hot_leads";

export const rolePermissions: Record<AdminRole, AdminNavPermission[]> = {
  super_admin: ["overview", "customers", "plans", "subscriptions", "billing", "agents", "call_logs", "resellers", "hot_leads"],
  operations:  ["overview", "customers", "subscriptions", "agents", "call_logs", "resellers", "hot_leads"],
  support:     ["overview", "customers", "call_logs", "hot_leads"],
  finance:     ["overview", "customers", "billing", "plans", "subscriptions", "resellers", "hot_leads"],
};