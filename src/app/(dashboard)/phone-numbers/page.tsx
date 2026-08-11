"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Phone,
  ShieldCheck,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Globe,
  Hash,
  RefreshCw,
  Info,
  Mic,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  AvailableNumber,
  NumberOrder,
  TelecomNumber,
  ComplianceRequirement,
  PhoneNumberCapability,
  TELNYX_COUNTRIES,
} from "@/types/telecom";
import { PageHeader } from "@/components/shared/page-header";

type TabType = "search" | "numbers" | "orders" | "compliance";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

export default function PhoneNumbersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("search");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Search Filters
  const [country, setCountry] = useState<string>("US");
  const [areaCode, setAreaCode] = useState<string>("");
  const [numberType, setNumberType] = useState<string>("all");
  const [features, setFeatures] = useState<Record<PhoneNumberCapability, boolean>>({
    voice: false,
    sms: false,
    mms: false,
    fax: false,
    emergency: false,
  });

  // Data & States
  const [searchResults, setSearchResults] = useState<AvailableNumber[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchPage, setSearchPage] = useState<number>(1);

  const [purchasedNumbers, setPurchasedNumbers] = useState<TelecomNumber[]>([]);
  const [loadingNumbers, setLoadingNumbers] = useState<boolean>(false);

  const [orders, setOrders] = useState<NumberOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);

  // Purchase Modal State
  const [buyingNumber, setBuyingNumber] = useState<AvailableNumber | null>(null);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [customerRef, setCustomerRef] = useState<string>("");
  const [selectedAgentForCheckout, setSelectedAgentForCheckout] = useState<string>("");

  // Retell Agents List for association
  const [agents, setAgents] = useState<{ agent_id: string; agent_name: string }[]>([]);

  // Compliance Form State
  const [selectedSubOrderId, setSelectedSubOrderId] = useState<string>("");
  const [complianceReqs, setComplianceReqs] = useState<ComplianceRequirement[]>([]);
  const [loadingCompliance, setLoadingCompliance] = useState<boolean>(false);
  const [complianceForm, setComplianceForm] = useState<Record<string, string>>({});
  const [submittingCompliance, setSubmittingCompliance] = useState<boolean>(false);

  // Polling for orders
  const pollingIntervals = useRef<Record<string, NodeJS.Timeout>>({});

  const addToast = (type: "success" | "error" | "info", title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleSearch = async (targetPage?: number) => {
    const pageToFetch = targetPage || 1;
    if (!country) {
      addToast("error", "Validation Error", "Please select a country.");
      return;
    }

    setSearching(true);
    setSearchPage(pageToFetch);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append("country", country);
      if (areaCode) queryParams.append("areaCode", areaCode);
      if (numberType !== "all") queryParams.append("type", numberType);
      queryParams.append("page", pageToFetch.toString());
      queryParams.append("limit", "20");

      Object.entries(features).forEach(([feat, enabled]) => {
        if (enabled) queryParams.append("features", feat);
      });

      const res = await fetch(`/api/telnyx/search?${queryParams.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to search available numbers.");
      }
      const data = await res.json();
      setSearchResults(data);
      if (data.length === 0) {
        addToast("info", "No Numbers Found", "Try modifying filters or selecting another country.");
      }
    } catch (error: any) {
      addToast("error", "Search Failed", error.message);
    } finally {
      setSearching(false);
    }
  };

  const fetchPurchasedNumbers = useCallback(async () => {
    setLoadingNumbers(true);
    try {
      const res = await fetch("/api/telnyx/numbers");
      if (!res.ok) throw new Error("Could not retrieve active phone numbers.");
      const data = await res.json();
      setPurchasedNumbers(data);
    } catch (error: any) {
      addToast("error", "Error", error.message);
    } finally {
      setLoadingNumbers(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/telnyx/orders");
      if (!res.ok) throw new Error("Could not retrieve order history.");
      const data = await res.json();
      setOrders(data);

      data.forEach((order: NumberOrder) => {
        if ((order.status === "pending" || order.status === "processing") && !pollingIntervals.current[order.id]) {
          startPolling(order.id);
        }
      });
    } catch (error: any) {
      addToast("error", "Error", error.message);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/retell/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
  }, []);

  const startPolling = (orderId: string) => {
    if (pollingIntervals.current[orderId]) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/telnyx/order-status/${orderId}`);
        if (!res.ok) {
          clearInterval(interval);
          delete pollingIntervals.current[orderId];
          return;
        }

        const data = await res.json();

        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: data.status, requirementsMet: data.requirementsMet } : o))
        );

        if (data.status === "success" || data.status === "failure" || data.status === "cancelled") {
          clearInterval(interval);
          delete pollingIntervals.current[orderId];
          addToast(
            data.status === "success" ? "success" : "error",
            "Order Status Update",
            `Order ${orderId} status changed to ${data.status.toUpperCase()}.`
          );
          fetchPurchasedNumbers();
        }
      } catch (e) {}
    }, 4000);

    pollingIntervals.current[orderId] = interval;
  };

  useEffect(() => {
    return () => {
      Object.values(pollingIntervals.current).forEach((interval) => clearInterval(interval));
    };
  }, []);

  useEffect(() => {
    handleSearch(1);
    fetchAgents();
  }, []);

  useEffect(() => {
    if (activeTab === "numbers") fetchPurchasedNumbers();
    if (activeTab === "orders") fetchOrders();
  }, [activeTab, fetchPurchasedNumbers, fetchOrders]);

  const handlePurchase = async () => {
    if (!buyingNumber) return;

    setPurchasing(true);
    try {
      const res = await fetch("/api/telnyx/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: buyingNumber.phoneNumber,
          customerReference: customerRef || `PORTAL_${Date.now()}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to place order.");
      }

      const order: NumberOrder = await res.json();
      addToast("success", "Order Placed", `Order ${order.id} placed successfully.`);

      if (selectedAgentForCheckout && order.phoneNumbers?.[0]) {
        await handleAssociateAgent(buyingNumber.phoneNumber, selectedAgentForCheckout);
      }

      setBuyingNumber(null);
      setCustomerRef("");
      setSelectedAgentForCheckout("");

      if (!order.requirementsMet && order.subOrderIds?.length > 0) {
        handleViewCompliance(order.subOrderIds[0]);
      } else {
        setActiveTab("orders");
        fetchOrders();
      }
    } catch (error: any) {
      addToast("error", "Purchase Failed", error.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleAssociateAgent = async (phoneNumber: string, agentId: string) => {
    try {
      const res = await fetch("/api/retell/numbers/associate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, agentId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to associate phone number with agent.");
      }

      addToast("success", "Agent Associated", `Number ${phoneNumber} mapped to voice agent.`);
      fetchPurchasedNumbers();
    } catch (error: any) {
      addToast("error", "Association Error", error.message);
    }
  };

  const handleViewCompliance = async (subOrderId: string) => {
    setSelectedSubOrderId(subOrderId);
    setComplianceForm({});
    setActiveTab("compliance");
    setLoadingCompliance(true);
    try {
      const res = await fetch(`/api/telnyx/compliance?id=${subOrderId}`);
      if (!res.ok) throw new Error("Could not fetch compliance requirements.");
      const data = await res.json();
      setComplianceReqs(data);
    } catch (e: any) {
      addToast("error", "Compliance Error", e.message);
    } finally {
      setLoadingCompliance(false);
    }
  };

  const handleComplianceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubOrderId) return;

    setSubmittingCompliance(true);
    try {
      const res = await fetch("/api/telnyx/compliance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subOrderId: selectedSubOrderId,
          requirements: complianceForm,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit compliance documents.");
      }

      addToast("success", "Compliance Submitted", "Documents submitted for verification.");
      setComplianceForm({});
      setComplianceReqs([]);
      setSelectedSubOrderId("");
      setActiveTab("orders");
      fetchOrders();
    } catch (e: any) {
      addToast("error", "Submission Failed", e.message);
    } finally {
      setSubmittingCompliance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl shadow-xl border flex gap-3 items-start transition-all ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
                : "bg-sky-950/90 border-sky-500/40 text-sky-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === "error" && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === "info" && <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />}
            <div>
              <div className="font-semibold text-sm">{toast.title}</div>
              <div className="text-xs opacity-90 mt-0.5">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>

      <PageHeader
        title="Phone Numbers"
        description="Search, purchase, and assign phone numbers to your CallAutomate voice agents."
      />

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "search"
              ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold shadow-md"
              : "text-[var(--muted-text)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <Search className="h-4 w-4" />
          Search & Buy Numbers
        </button>
        <button
          onClick={() => setActiveTab("numbers")}
          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "numbers"
              ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold shadow-md"
              : "text-[var(--muted-text)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <Phone className="h-4 w-4" />
          Active Numbers ({purchasedNumbers.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "orders"
              ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold shadow-md"
              : "text-[var(--muted-text)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <Clock className="h-4 w-4" />
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("compliance")}
          className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "compliance"
              ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold shadow-md"
              : "text-[var(--muted-text)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Compliance Center
        </button>
      </div>

      {/* SEARCH & BUY TAB */}
      {activeTab === "search" && (
        <div className="space-y-6">
          {/* Filters Card */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
            <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--brand-500)]" />
              Filter Phone Numbers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="form-select"
                >
                  {TELNYX_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code}) {c.complianceRequired ? "🔒 Doc Required" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Area Code / Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. 415, 212, 202"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Number Type</label>
                <select
                  value={numberType}
                  onChange={(e) => setNumberType(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Types</option>
                  <option value="local">Local</option>
                  <option value="toll_free">Toll-Free</option>
                  <option value="national">National</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleSearch(1)}
                disabled={searching}
                className="px-5 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search Phone Numbers
              </button>

              <span className="text-xs text-[var(--subtle-text)]">
                Showing results for {country}
              </span>
            </div>
          </div>

          {/* Results Table */}
          <div className="premium-table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Phone Number</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Capabilities</th>
                  <th>Monthly Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {searching ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)] mx-auto" />
                      <span className="text-xs text-[var(--muted-text)] mt-2 block">Searching available numbers...</span>
                    </td>
                  </tr>
                ) : searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[var(--muted-text)] text-sm">
                      No available numbers found matching criteria.
                    </td>
                  </tr>
                ) : (
                  searchResults.map((num) => (
                    <tr key={num.phoneNumber}>
                      <td className="font-semibold text-[var(--foreground)]">{num.phoneNumber}</td>
                      <td>
                        {num.locality ? `${num.locality}, ` : ""}
                        {num.state ? `${num.state}, ` : ""}
                        {num.countryCode}
                      </td>
                      <td>
                        <span className="px-2.5 py-1 text-xs rounded-full bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] capitalize">
                          {(num.type || "").replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {num.capabilities.map((cap) => (
                            <span key={cap} className="px-2 py-0.5 text-[11px] rounded bg-[var(--brand-50)] text-[var(--brand-500)] border border-[var(--brand-200)] uppercase font-semibold">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="font-medium text-[var(--foreground)]">
                        ${num.cost ? num.cost.toFixed(2) : "1.50"} / mo
                      </td>
                      <td>
                        <button
                          onClick={() => setBuyingNumber(num)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--brand-500)] text-[var(--brand-btn-text)] text-xs font-semibold hover:opacity-90 cursor-pointer"
                        >
                          Buy Number
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIVE NUMBERS TAB */}
      {activeTab === "numbers" && (
        <div className="premium-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Country</th>
                <th>Type</th>
                <th>Status</th>
                <th>Assigned CallAutomate Voice Agent</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingNumbers ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)] mx-auto" />
                  </td>
                </tr>
              ) : purchasedNumbers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[var(--muted-text)] text-sm">
                    No active phone numbers purchased yet.
                  </td>
                </tr>
              ) : (
                purchasedNumbers.map((num) => (
                  <tr key={num.id}>
                    <td className="font-semibold text-[var(--foreground)]">{num.phoneNumber}</td>
                    <td>{num.countryCode}</td>
                    <td className="capitalize">{num.type}</td>
                    <td>
                      <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {num.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={num.agentId || ""}
                        onChange={(e) => handleAssociateAgent(num.phoneNumber, e.target.value)}
                        className="form-select py-1 text-xs"
                      >
                        <option value="">-- Select Voice Agent --</option>
                        {agents.map((a) => (
                          <option key={a.agent_id} value={a.agent_id}>
                            {a.agent_name} ({a.agent_id})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className="text-xs text-[var(--muted-text)]">Active</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="premium-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Phone Number</th>
                <th>Date</th>
                <th>Status</th>
                <th>Compliance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)] mx-auto" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[var(--muted-text)] text-sm">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="font-mono text-xs text-[var(--foreground)]">{ord.id}</td>
                    <td>{ord.phoneNumbers?.join(", ") || "-"}</td>
                    <td>{new Date(ord.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full border capitalize ${
                          ord.status === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : ord.status === "pending" || ord.status === "processing"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      {ord.requirementsMet ? (
                        <span className="text-xs text-emerald-400 font-medium">Verified</span>
                      ) : (
                        <span className="text-xs text-amber-400 font-medium">Required</span>
                      )}
                    </td>
                    <td>
                      {!ord.requirementsMet && ord.subOrderIds?.length > 0 && (
                        <button
                          onClick={() => handleViewCompliance(ord.subOrderIds[0])}
                          className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/30 cursor-pointer"
                        >
                          Submit Documents
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* COMPLIANCE TAB */}
      {activeTab === "compliance" && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
            <ShieldCheck className="h-6 w-6 text-[var(--brand-500)]" />
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">Regulatory Compliance Center</h3>
              <p className="text-xs text-[var(--muted-text)]">
                International numbers require identity and address proof for carrier authorization.
              </p>
            </div>
          </div>

          {!selectedSubOrderId ? (
            <p className="text-sm text-[var(--muted-text)] text-center py-6">
              Please select an order needing compliance from the Orders tab.
            </p>
          ) : loadingCompliance ? (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)] mx-auto" />
            </div>
          ) : (
            <form onSubmit={handleComplianceSubmit} className="space-y-6">
              {complianceReqs.map((req) => (
                <div key={req.id} className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                  <h4 className="font-semibold text-sm text-[var(--foreground)]">{req.name}</h4>
                  <p className="text-xs text-[var(--subtle-text)]">{req.description}</p>
                  {req.requiredFields.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <label className="form-label">{field.label}</label>
                      <input
                        type="text"
                        placeholder={`Enter ${field.label}`}
                        value={complianceForm[field.name] || ""}
                        onChange={(e) => setComplianceForm({ ...complianceForm, [field.name]: e.target.value })}
                        className="form-input"
                        required={field.required}
                      />
                    </div>
                  ))}
                </div>
              ))}

              <button
                type="submit"
                disabled={submittingCompliance}
                className="w-full py-3 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingCompliance ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit Compliance Verification
              </button>
            </form>
          )}
        </div>
      )}

      {/* PURCHASE CONFIRMATION MODAL */}
      {buyingNumber && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl max-w-md w-full space-y-5">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Confirm Number Purchase</h3>
            <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--subtle-text)]">Phone Number:</span>
                <span className="font-bold text-[var(--foreground)]">{buyingNumber.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--subtle-text)]">Country:</span>
                <span>{buyingNumber.countryCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--subtle-text)]">Monthly Price:</span>
                <span className="font-semibold text-[var(--brand-500)]">${buyingNumber.cost || "1.50"}</span>
              </div>
            </div>

            <div>
              <label className="form-label">Assign to CallAutomate Voice Agent (Optional)</label>
              <select
                value={selectedAgentForCheckout}
                onChange={(e) => setSelectedAgentForCheckout(e.target.value)}
                className="form-select"
              >
                <option value="">-- No Agent (Assign Later) --</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.agent_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBuyingNumber(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-1 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
