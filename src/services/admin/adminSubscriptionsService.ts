import { apiClient } from "@/lib/api-client";

export type AdminSubscription = {
  id: string;
  status: "active" | "cancelled" | "past_due" | "trialing"|"expired";
  startedAt: string;
  endsAt: string | null;
  cancelledAt: string | null;
  minutesUsed: number;
  monthlyPrice: number;
  pricePerMinute: number;
  totalMinutes: number;
  userFullName: string;
  userEmail: string;
  userId: string;
  planDisplayName: string;
  planId: string;
  usageMinutes: number;
};

export type SubscriptionAction = "pause" | "resume" | "terminate"| "renew";

export const adminSubscriptionsService = {
  async getSubscriptions(): Promise<AdminSubscription[]> {
    const res = await apiClient.get<AdminSubscription[]>("/admin/subscriptions");
    return res.data;
  },

  async performAction(subscriptionId: string, action: SubscriptionAction): Promise<void> {
    await apiClient.patch(`/admin/subscriptions/${subscriptionId}`, { action });
  },
};