// src/config/endpoints.ts
// FULL REPLACEMENT — adds billing.renewSession and billing.renewConfirm
export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    me: "/api/auth/me",
    logout: "/api/auth/logout"
  },
  dashboard: {
    overview: "/dashboard/overview"
  },
  agents: {
    list: "/agents",
    detail: (agentId: string) => `/agents/${agentId}`
  },
  callLogs: {
    list: "/call-logs",
    cdrList: "/call-logs/cdr"
  },
  recordings: {
    list: "/recordings"
  },
  billing: {
    summary: "/billing/summary",
    invoices: "/billing/invoices",
    subscription: "/billing/subscription",
    renewSession: "/billing/renew",
    renewConfirm: "/billing/renew/confirm",
  },
  settings: {
    account: "/settings/account"
  },
  user: {
    profile: "/user/profile",
    changePassword: "/user/change-password",
  },
  plans: {
    list: "/plans",
  },
  admin: {
    overview: "/admin/overview",
    customers: "/admin/customers",
    customerDetail: (customerId: string) => `/admin/customers/${customerId}`,
    customerUpdate: (customerId: string) => `/admin/customers/${customerId}`,
    plans: "/admin/plans",
    planDetail: (planId: string) => `/admin/plans/${planId}`,
    subscriptions: "/admin/subscriptions",
    subscriptionAction: (subscriptionId: string) => `/admin/subscriptions/${subscriptionId}`,
    billing: "/admin/billing",
  }
} as const;
