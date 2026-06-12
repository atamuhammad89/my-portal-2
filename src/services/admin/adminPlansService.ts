import { apiClient } from "@/lib/api-client";

export type AdminPlan = {
  id: string;
  name: string;
  display_name: string;
  monthly_price: number;
  total_minutes: number;
  price_per_minute: number;
  description: string | null;
  is_active: boolean;
  stripe_price_id: string | null;
  features: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminPlanInput = Omit<AdminPlan, "id" | "created_at" | "updated_at">;

export const adminPlansService = {
  async getPlans(): Promise<AdminPlan[]> {
    const res = await apiClient.get<AdminPlan[]>("/admin/plans");
    return res.data;
  },

  async createPlan(input: AdminPlanInput): Promise<AdminPlan> {
    const res = await apiClient.post<AdminPlan>("/admin/plans", input);
    return res.data;
  },

  async updatePlan(planId: string, input: Partial<AdminPlanInput>): Promise<AdminPlan> {
    const res = await apiClient.patch<AdminPlan>(`/admin/plans/${planId}`, input);
    return res.data;
  },

  async deletePlan(planId: string): Promise<void> {
    await apiClient.delete(`/admin/plans/${planId}`);
  },
};