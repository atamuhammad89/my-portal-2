"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUsersService, ManagedUser } from "@/services/admin/adminUsersService";

export function AdminUsersShell() {
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminUsersService.getAllUsers(),
  });

  const { data: cdrTables = [] } = useQuery({
    queryKey: ["admin", "cdr-tables"],
    queryFn: () => adminUsersService.getCdrTables(),
  });

  const { data: userAccess = [] } = useQuery({
    queryKey: ["admin", "user-access", selectedUser?.id],
    queryFn: () =>
      selectedUser
        ? adminUsersService.getUserCdrAccess(selectedUser.id)
        : Promise.resolve([]),
    enabled: !!selectedUser,
  });

  const grantMutation = useMutation({
    mutationFn: ({ tableId }: { tableId: string }) =>
      adminUsersService.grantAccess(selectedUser!.id, tableId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "user-access", selectedUser?.id] }),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ tableId }: { tableId: string }) =>
      adminUsersService.revokeAccess(selectedUser!.id, tableId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "user-access", selectedUser?.id] }),
  });

  const toggleAccess = (tableId: string, currentlyGranted: boolean) => {
    if (currentlyGranted) {
      revokeMutation.mutate({ tableId });
    } else {
      grantMutation.mutate({ tableId });
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:h-full">
      {/* User list */}
      <div className="w-full lg:w-80 lg:shrink-0">
        <h2 className="text-sm font-semibold text-[var(--subtle-text)] uppercase tracking-wide mb-3">
          Registered Users
        </h2>
        <ul className="space-y-1">
          {users.map((user) => (
            <li key={user.id}>
              <button
                onClick={() => setSelectedUser(user)}
                className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  selectedUser?.id === user.id
                    ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]"
                    : "hover:bg-[var(--surface-2)] text-[var(--muted-text)] hover:text-[var(--foreground)]"
                }`}
              >
                <p className="font-medium">{user.fullName || user.email}</p>
                <p className={`text-xs ${selectedUser?.id === user.id ? "text-[var(--brand-btn-text)] opacity-80" : "text-[var(--subtle-text)]"}`}>
                  {user.email}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Access control panel */}
      <div className="flex-1">
        {selectedUser ? (
          <>
            <h2 className="text-sm font-semibold text-[var(--subtle-text)] uppercase tracking-wide mb-3">
              CDR Table Access for {selectedUser.fullName || selectedUser.email}
            </h2>
            <div className="space-y-2">
              {cdrTables.map((table) => {
                const granted = userAccess.includes(table.id);
                return (
                  <div
                    key={table.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {table.displayName}
                      </p>
                      <p className="text-xs text-[var(--muted-text)]">{table.tableName}</p>
                    </div>
                    <button
                      onClick={() => toggleAccess(table.id, granted)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        granted
                          ? "bg-[var(--success-bg)] text-[var(--success-fg)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-fg)]"
                          : "bg-[var(--surface-2)] text-[var(--muted-text)] hover:bg-[var(--success-bg)] hover:text-[var(--success-fg)]"
                      }`}
                    >
                      {granted ? "Revoke" : "Grant"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)]">
            <p className="text-sm text-[var(--muted-text)]">
              Select a user to manage their CDR table access
            </p>
          </div>
        )}
      </div>
    </div>
  );
}