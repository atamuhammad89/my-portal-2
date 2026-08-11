import { apiClient } from "@/lib/api-client";
import { RetellPhoneNumberResponse, CreatePhoneNumberDto, UpdatePhoneNumberDto } from "@/types/retell";

export const adminRetellPhoneNumbersService = {
  async getPhoneNumbers(): Promise<RetellPhoneNumberResponse[]> {
    const res = await apiClient.get<RetellPhoneNumberResponse[]>("/admin/phone-numbers");
    return res.data;
  },

  async getPhoneNumber(phoneNumber: string): Promise<RetellPhoneNumberResponse> {
    const res = await apiClient.get<RetellPhoneNumberResponse>(
      `/admin/phone-numbers/${encodeURIComponent(phoneNumber)}`
    );
    return res.data;
  },

  async createPhoneNumber(payload: CreatePhoneNumberDto): Promise<RetellPhoneNumberResponse> {
    const res = await apiClient.post<RetellPhoneNumberResponse>("/admin/phone-numbers", payload);
    return res.data;
  },

  async updatePhoneNumber(phoneNumber: string, payload: UpdatePhoneNumberDto): Promise<RetellPhoneNumberResponse> {
    const res = await apiClient.patch<RetellPhoneNumberResponse>(
      `/admin/phone-numbers/${encodeURIComponent(phoneNumber)}`,
      payload
    );
    return res.data;
  },

  async deletePhoneNumber(phoneNumber: string): Promise<void> {
    await apiClient.delete(`/admin/phone-numbers/${encodeURIComponent(phoneNumber)}`);
  },
};
