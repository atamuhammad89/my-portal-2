import { apiClient } from "@/lib/api-client";

export type AdminOverviewMetrics = {
  totalUsers: number;
  activeSubscriptions: number;
  totalMinutesUsed: number;
  totalRevenue: string;
};

export type AdminRecentSignup = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  plan: string;
};

export type AdminOverviewData = {
  metrics: AdminOverviewMetrics;
  recentSignups: AdminRecentSignup[];
};

export const adminOverviewService = {
  async getOverview(): Promise<AdminOverviewData> {
    const res = await apiClient.get<AdminOverviewData>("/admin/overview");
    return res.data;
  },
};