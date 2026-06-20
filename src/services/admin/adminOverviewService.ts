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

export type AdminTrendPoint = {
  date: string;
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  totalMinutes: number;
};

export type AdminOverviewData = {
  metrics: AdminOverviewMetrics;
  recentSignups: AdminRecentSignup[];
  callsTrend: AdminTrendPoint[];
  minutesByDay: { date: string; minutes: number }[];
  callsByStatus: { passed: number; failed: number };
  subscriptionsByStatus: { active: number; inactive: number };
};

export const adminOverviewService = {
  async getOverview(): Promise<AdminOverviewData> {
    const res = await apiClient.get<AdminOverviewData>("/admin/overview");
    return res.data;
  },
};