import { Role } from "@/types/common";

export type User = {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  createdAt?: string;
  isEmailVerified?: boolean;
};

