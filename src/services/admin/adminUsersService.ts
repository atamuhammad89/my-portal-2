import { supabase } from "@/lib/supabase";
import { apiClient } from "@/lib/api-client";

export type ManagedUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CdrTable = {
  id: string;
  tableName: string;
  displayName: string;
};

export const adminUsersService = {
  /**
   * Fetches all users from public.users via a server-side API route
   * (uses service role key server-side to bypass RLS).
   */
  async getAllUsers(): Promise<ManagedUser[]> {
    const res = await apiClient.get("/admin/users");
    const data = res.data;
    return data.map((row: any) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      tenantId: row.tenant_id ?? null,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));
  },

  async getCdrTables(): Promise<CdrTable[]> {
    const { data, error } = await supabase
      .from("cdr_tables")
      .select("id, table_name, display_name");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      tableName: row.table_name,
      displayName: row.display_name,
    }));
  },

  async getUserCdrAccess(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("user_cdr_access")
      .select("cdr_table_id")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((row) => row.cdr_table_id);
  },

  async grantAccess(userId: string, cdrTableId: string): Promise<void> {
    const { error } = await supabase.from("user_cdr_access").upsert(
      { user_id: userId, cdr_table_id: cdrTableId },
      { onConflict: "user_id,cdr_table_id" }
    );
    if (error) throw error;
  },

  async revokeAccess(userId: string, cdrTableId: string): Promise<void> {
    const { error } = await supabase
      .from("user_cdr_access")
      .delete()
      .eq("user_id", userId)
      .eq("cdr_table_id", cdrTableId);
    if (error) throw error;
  },
};