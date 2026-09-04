"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  AdminNavPermission,
  AdminRole,
  rolePermissions,
} from "@/types/admin/roles";

/**
 * Reads the authenticated user's role from the Zustand auth store and
 * returns their set of admin nav permissions.
 *
 * - Only roles defined in AdminRole (super_admin | operations | support | finance)
 *   are allowed inside /admin.  Any other role falls back to an empty permission
 *   set so the AdminPermissionGuard blocks access client-side too.
 */
export function useAdminRole() {
  const user = useAuthStore((s) => s.user);

  const role: AdminRole | null = useMemo(() => {
    const validAdminRoles: AdminRole[] = [
      "super_admin",
      "operations",
      "support",
      "finance",
    ];
    const userRole = (user?.role as string)?.toLowerCase();
    if (userRole === "super_admin" || userRole === "admin") {
      return "super_admin";
    }
    if (userRole && validAdminRoles.includes(userRole as AdminRole)) {
      return userRole as AdminRole;
    }
    return null;
  }, [user?.role]);

  return useMemo(() => {
    const permissions: AdminNavPermission[] = role ? (rolePermissions[role] ?? []) : [];
    return {
      role,
      permissions,
      hasPermission: (p: AdminNavPermission) => permissions.includes(p),
    };
  }, [role]);
}
