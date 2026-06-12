import { apiClient } from "@/lib/api-client";

export type AdminUserBilling = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  usageMinutes: number;
  subscription: {
    id: string;
    status: string;
    planName: string;
    startedAt: string;
    endsAt: string | null;
    minutesUsed: number;
    totalMinutes: number;
    monthlyPrice: number;
    pricePerMinute: number;
  } | null;
};

export const adminBillingService = {
  async getBillingData(): Promise<AdminUserBilling[]> {
    const res = await apiClient.get<AdminUserBilling[]>("/admin/billing");
    return res.data;
  },
};