import { apiClient } from "@/lib/api-client";
import { CallLog } from "@/types/call-log";

export type ResellerCustomer = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  commissionRate: number;
  monthlyCommission: number;
  subscription: {
    id: string;
    status: string;
    planName: string;
    minutesUsed: number;
    totalMinutes: number;
    monthlyPrice: number;
    startedAt: string;
    endsAt: string | null;
  } | null;
};

export type ResellerOverview = {
  kpis: { label: string; value: string }[];
  trends: { date: string; totalCalls: number; answeredCalls: number; missedCalls: number }[];
  recentCallLogs: CallLog[];
};

export type ResellerCallLog = CallLog & {
  customerName?: string | null;
  customerEmail?: string | null;
  customerId?: string | null;
};

export type ResellerCallLogsParams = {
  customer_id?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
};

export type ResellerCallLogsResponse = {
  data: ResellerCallLog[];
  total: number;
  page: number;
  limit: number;
  customers: { id: string; fullName: string; email: string }[];
};

export const resellerService = {
  async getOverview(): Promise<ResellerOverview> {
    const res = await apiClient.get<ResellerOverview>("/reseller/overview");
    return res.data;
  },

  async getCustomers(): Promise<ResellerCustomer[]> {
    const res = await apiClient.get<ResellerCustomer[]>("/reseller/customers");
    return res.data;
  },

  async getCallLogs(params?: ResellerCallLogsParams): Promise<ResellerCallLogsResponse> {
    const res = await apiClient.get<ResellerCallLogsResponse>("/reseller/call-logs", { params });
    return res.data;
  },
};
