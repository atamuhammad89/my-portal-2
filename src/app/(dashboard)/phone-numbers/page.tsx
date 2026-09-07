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
  XCircle,
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
import { ComplianceFieldInput } from "@/components/telecom/compliance-field-input";

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

  // Modal Compliance State for Ordering
  const [modalComplianceReqs, setModalComplianceReqs] = useState<ComplianceRequirement[]>([]);
  const [loadingModalCompliance, setLoadingModalCompliance] = useState<boolean>(false);
  const [modalComplianceForm, setModalComplianceForm] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (buyingNumber) {
      setModalComplianceForm({});
      setLoadingModalCompliance(true);
      fetch(`/api/telnyx/compliance/requirements?country=${buyingNumber.countryCode}&type=${buyingNumber.type || "local"}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setModalComplianceReqs(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error("Failed to fetch regulatory compliance requirements:", err);
          setModalComplianceReqs([]);
        })
        .finally(() => {
          setLoadingModalCompliance(false);
        });
    } else {
      setModalComplianceReqs([]);
      setModalComplianceForm({});
    }
  }, [buyingNumber]);

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
    fetchPurchasedNumbers();
    fetchOrders();
  }, [fetchAgents, fetchOrders, fetchPurchasedNumbers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const payment = params.get("payment");
      const sessionId = params.get("session_id");

      if (payment === "success" && sessionId) {
        fetch("/api/telnyx/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              addToast("success", "Payment Confirmed", "Stripe payment received & phone number order activated!");
              fetchPurchasedNumbers();
              fetchOrders();
            }
          })
          .catch((err) => {
            console.error("Stripe confirm error:", err);
          })
          .finally(() => {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
          });
      }
    }
  }, [fetchOrders, fetchPurchasedNumbers]);

  const isFreeEligible = purchasedNumbers.length === 0;

  const handlePurchase = async () => {
    if (!buyingNumber) return;

    if (modalComplianceReqs.length > 0) {
      for (const req of modalComplianceReqs) {
        for (const field of req.requiredFields) {
          if (field.required && (!modalComplianceForm[field.name] || !modalComplianceForm[field.name].trim())) {
            addToast("error", "Compliance Requirement Missing", `Please enter ${field.label} for regulatory approval.`);
            return;
          }
        }
      }
    }

    setPurchasing(true);
    try {
      const res = await fetch("/api/telnyx/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: buyingNumber.phoneNumber,
          customerReference: customerRef || `PORTAL_${Date.now()}`,
          cost: (buyingNumber.cost ?? 1.00) + 1.50,
          regulatoryRequirements: modalComplianceForm,
          selectedAgentId: selectedAgentForCheckout,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to initiate checkout.");
      }

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.isFree) {
        addToast("success", "Free Number Claimed!", `Order ${data.order?.id || ''} activated for free.`);
      } else {
        addToast("success", "Order Placed & Paid", `Order ${data.order?.id || ''} completed successfully.`);
      }

      if (selectedAgentForCheckout && buyingNumber.phoneNumber) {
        await handleAssociateAgent(buyingNumber.phoneNumber, selectedAgentForCheckout);
      }

      setBuyingNumber(null);
      setCustomerRef("");
      setSelectedAgentForCheckout("");

      if (data.order && !data.order.requirementsMet && data.order.subOrderIds?.length > 0) {
        handleViewCompliance(data.order.subOrderIds[0]);
      } else {
        setActiveTab("orders");
        fetchOrders();
        fetchPurchasedNumbers();
      }
    } catch (error: any) {
      addToast("error", "Purchase Failed", error.message);
    } finally {
      setPurchasing(false);
    }
  };

  const [associatingNumber, setAssociatingNumber] = useState<string | null>(null);

  const handleAssociateAgent = async (phoneNumber: string, agentId: string) => {
    setAssociatingNumber(phoneNumber);
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
      await fetchPurchasedNumbers();
    } catch (error: any) {
      addToast("error", "Association Error", error.message);
    } finally {
      setAssociatingNumber(null);
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

  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const promptCancelOrder = (orderId: string) => {
    if (!orderId) return;
    setConfirmCancelOrderId(orderId);
  };

  const executeCancelOrder = async (orderId: string) => {
    if (!orderId) return;

    setCancellingOrderId(orderId);
    try {
      const res = await fetch(`/api/telnyx/orders?id=${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to cancel order.");
      }

      addToast("info", "Order Cancelled", `Order ${orderId} has been cancelled successfully.`);

      if (pollingIntervals.current[orderId]) {
        clearInterval(pollingIntervals.current[orderId]);
        delete pollingIntervals.current[orderId];
      }

      fetchOrders();
      fetchPurchasedNumbers();

      if (activeTab === "compliance") {
        setActiveTab("orders");
        setSelectedSubOrderId("");
        setComplianceReqs([]);
        setComplianceForm({});
      }
    } catch (err: any) {
      addToast("error", "Cancel Error", err.message);
    } finally {
      setCancellingOrderId(null);
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
                        ${((num.cost ?? 1.00) + 1.50).toFixed(2)} / mo
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
                      <div className="flex items-center gap-2">
                        <select
                          value={num.agentId || ""}
                          disabled={associatingNumber === num.phoneNumber}
                          onChange={(e) => handleAssociateAgent(num.phoneNumber, e.target.value)}
                          className="form-select py-1.5 text-xs disabled:opacity-60 flex-1"
                        >
                          <option value="">-- Select Voice Agent --</option>
                          {agents.map((a) => (
                            <option key={a.agent_id} value={a.agent_id}>
                              {a.agent_name} ({a.agent_id})
                            </option>
                          ))}
                        </select>
                        {associatingNumber === num.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--brand-500)] font-semibold shrink-0 bg-[var(--surface-2)] px-2.5 py-1.5 rounded-xl border border-[var(--border)] animate-pulse">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--brand-500)]" />
                            <span>Linking...</span>
                          </div>
                        )}
                      </div>
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
                            : ord.status === "rejected" || (ord.status as string) === "requirement-info-exception"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : ord.status === "pending" || ord.status === "processing"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {ord.status === "rejected" || (ord.status as string) === "requirement-info-exception" ? "Rejected" : ord.status}
                      </span>
                    </td>
                    <td>
                      {(ord.status as string) === "cancelled" || (ord.status as string) === "failure" || (ord.status as string) === "failed" || (ord.status as string) === "deleted" ? (
                        <span className="text-xs text-[var(--muted-text)] font-medium">N/A</span>
                      ) : ord.requirementsMet ? (
                        <span className="text-xs text-emerald-400 font-medium">Verified</span>
                      ) : ord.status === "rejected" || (ord.status as string) === "requirement-info-exception" ? (
                        <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                          Fix Required
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 font-medium">Required</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {(ord.status === "rejected" || (ord.status as string) === "requirement-info-exception") && ord.subOrderIds?.length > 0 && (
                          <button
                            onClick={() => handleViewCompliance(ord.subOrderIds[0])}
                            className="px-3 py-1 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40 text-xs font-semibold hover:bg-rose-500/30 cursor-pointer flex items-center gap-1"
                          >
                            Fix & Resubmit
                          </button>
                        )}
                        {!ord.requirementsMet && ord.subOrderIds?.length > 0 && (ord.status as string) !== "rejected" && (ord.status as string) !== "requirement-info-exception" && (ord.status as string) !== "cancelled" && (ord.status as string) !== "failed" && (ord.status as string) !== "deleted" && (ord.status as string) !== "success" && (ord.status as string) !== "completed" && (
                          <button
                            onClick={() => handleViewCompliance(ord.subOrderIds[0])}
                            className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/30 cursor-pointer"
                          >
                            Submit Documents
                          </button>
                        )}
                        {(ord.status === "pending" || ord.status === "processing" || ord.status === "rejected" || (ord.status as string) === "requirement-info-exception") && (
                          <button
                            onClick={() => promptCancelOrder(ord.id)}
                            disabled={cancellingOrderId === ord.id}
                            className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium hover:bg-rose-500/30 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {cancellingOrderId === ord.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            Cancel Order
                          </button>
                        )}
                        {(ord.status === "success" || ord.status === "completed" || ord.status === "approved" || (ord.status as string) === "cancelled" || (ord.status as string) === "failed" || (ord.status as string) === "deleted") && (
                          <span className="text-xs text-[var(--muted-text)] font-medium">-</span>
                        )}
                      </div>
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
                    <ComplianceFieldInput
                      key={field.name}
                      field={field}
                      value={complianceForm[field.name] || ""}
                      onChange={(val) => setComplianceForm((prev) => ({ ...prev, [field.name]: val }))}
                    />
                  ))}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const parentOrd = orders.find(o => o.subOrderIds?.includes(selectedSubOrderId));
                    promptCancelOrder(parentOrd?.id || selectedSubOrderId);
                  }}
                  disabled={cancellingOrderId !== null}
                  className="px-4 py-3 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <XCircle className="h-4 w-4 text-rose-400" />
                  Cancel Order
                </button>
                <button
                  type="submit"
                  disabled={submittingCompliance}
                  className="flex-1 py-3 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submittingCompliance ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Submit Compliance Verification
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* PURCHASE CONFIRMATION MODAL */}
      {buyingNumber && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Confirm Number Purchase</h3>
            
            {isFreeEligible ? (
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  1st Phone Number Free!
                </span>
                <span className="text-[11px] text-emerald-200 bg-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  $0.00 Initial Offer
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-text)]">
                <span>Standard Phone Line Checkout</span>
                <span className="font-semibold text-[var(--brand-500)]">${((buyingNumber.cost ?? 1.00) + 1.50).toFixed(2)} / mo</span>
              </div>
            )}
            
            <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--subtle-text)]">Phone Number:</span>
                <span className="font-bold text-[var(--foreground)] font-mono">{buyingNumber.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--subtle-text)]">Country:</span>
                <span className="font-medium">{buyingNumber.countryCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--subtle-text)]">Monthly Price:</span>
                {isFreeEligible ? (
                  <span className="font-bold text-emerald-400">$0.00 (Free Initial Line)</span>
                ) : (
                  <span className="font-semibold text-[var(--brand-500)]">${((buyingNumber.cost ?? 1.00) + 1.50).toFixed(2)}</span>
                )}
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

            {/* REGULATORY COMPLIANCE REQUIREMENTS SECTION */}
            {loadingModalCompliance ? (
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-3 text-xs text-[var(--muted-text)]">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-500)] shrink-0" />
                <span>Checking regulatory compliance requirements for {buyingNumber.countryCode}...</span>
              </div>
            ) : modalComplianceReqs.length > 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Regulatory Compliance Required ({buyingNumber.countryCode})
                    </h4>
                    <p className="text-[11px] text-[var(--subtle-text)] mt-0.5">
                      Telnyx requires compliance documentation for activating phone numbers in {buyingNumber.countryCode}.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  {modalComplianceReqs.map((req) => (
                    <div key={req.id || req.name} className="space-y-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                      <div className="text-xs font-semibold text-[var(--foreground)]">{req.name}</div>
                      {req.description && (
                        <div className="text-[11px] text-[var(--muted-text)]">{req.description}</div>
                      )}
                      {req.requiredFields.map((field) => (
                        <ComplianceFieldInput
                          key={field.name}
                          field={field}
                          value={modalComplianceForm[field.name] || ""}
                          onChange={(val) => setModalComplianceForm((prev) => ({ ...prev, [field.name]: val }))}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>No regulatory compliance required for {buyingNumber.countryCode}. Immediate activation available.</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBuyingNumber(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing || loadingModalCompliance}
                className="flex-1 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {purchasing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFreeEligible ? (
                  "Claim Free Number"
                ) : (
                  `💳 Pay with Stripe ($${((buyingNumber.cost ?? 1.00) + 1.50).toFixed(2)})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CANCEL ORDER MODAL */}
      {confirmCancelOrderId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-rose-500/30 p-6 rounded-2xl max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Cancel Order Confirmation</h3>
                <p className="text-xs text-[var(--muted-text)] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-2">
              <p className="text-[var(--foreground)] font-medium">
                Are you sure you want to cancel order <span className="font-mono font-bold text-rose-400">{confirmCancelOrderId}</span>?
              </p>
              <p className="text-[var(--subtle-text)] text-[11px]">
                Cancelling this order will release the reserved phone number line and halt carrier compliance processing.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmCancelOrderId(null)}
                disabled={cancellingOrderId !== null}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] font-semibold text-xs hover:bg-[var(--surface)] transition cursor-pointer"
              >
                No, Keep Order
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = confirmCancelOrderId;
                  setConfirmCancelOrderId(null);
                  if (targetId) executeCancelOrder(targetId);
                }}
                disabled={cancellingOrderId !== null}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                {cancellingOrderId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
