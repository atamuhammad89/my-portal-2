import { apiClient } from "@/lib/api-client";

export type AdminResellerClient = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  planName: string;
  subscriptionStatus: string;
  monthlyPrice: number;
  commissionRate: number;
  monthlyCommission: number;
};

export type AdminReseller = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  defaultCommissionRate: number;
  clientsCount: number;
  totalRevenue: number;
  totalCommission: number;
  clients: AdminResellerClient[];
};

export const adminResellersService = {
  async getResellers(): Promise<AdminReseller[]> {
    const res = await apiClient.get<AdminReseller[]>("/admin/resellers");
    return res.data;
  },
};
