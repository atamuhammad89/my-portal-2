import { apiClient } from "@/lib/api-client";
import { AdminCustomer } from "@/types/admin/customer";

export type AdminCustomersParams = {
  search?: string;
  status?: "all" | "active" | "inactive";
};

export type UpdateCustomerPayload = {
  fullName?: string;
  email?: string;
  isActive?: boolean;
  newPassword?: string;
};

export const adminCustomersService = {
  async getCustomers(params?: AdminCustomersParams): Promise<AdminCustomer[]> {
    const res = await apiClient.get<AdminCustomer[]>("/admin/customers", { params });
    return res.data;
  },

  async updateCustomer(customerId: string, payload: UpdateCustomerPayload): Promise<void> {
    const res = await apiClient.patch(`/admin/customers/${customerId}`, payload);
    return res.data;
  },
};