export type Role = "super_admin" | "owner" | "reseller" | "admin" | "manager" | "member" | "viewer";

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export type DateRangeParams = {
  fromDate?: string;
  toDate?: string;
};
