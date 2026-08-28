"use client";

import { useState, useEffect } from "react";
import {
  Flame,
  PhoneCall,
  Search,
  RefreshCw,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  Voicemail,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  X,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";

interface HotLead {
  id: string;
  name: string;
  number: string;
  industry: string;
  created_at: string;
}

interface CallResult {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_number: string;
  customer_industry: string;
  call_id: string;
  call_summary: string;
  transcript: string | null;
  call_successful: boolean;
  in_voicemail: boolean;
  user_sentiment: string;
  outcome: string;
  start_timestamp: string;
  end_timestamp: string | null;
  created_at: string;
}

export function HotLeadsView() {
  const [activeTab, setActiveTab] = useState<"leads" | "call_results">("leads");
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [callResults, setCallResults] = useState<CallResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [selectedTranscript, setSelectedTranscript] = useState<{
    leadName: string;
    transcript: string;
    summary: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hot-leads");
      const data = await res.json();
      if (data.success) {
        setHotLeads(data.hotLeads || []);
        setCallResults(data.callResults || []);
      }
    } catch (err) {
      console.error("Failed to fetch hot leads data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, startDate, endDate, sentimentFilter, activeTab, itemsPerPage]);

  // Date Range Evaluation Helper
  const isDateInRange = (dateStr: string) => {
    if (!dateStr || dateFilter === "all") return true;
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return true;

    const now = new Date();

    if (dateFilter === "today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return itemDate >= startOfToday;
    }

    if (dateFilter === "yesterday") {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return itemDate >= startOfYesterday && itemDate <= endOfYesterday;
    }

    if (dateFilter === "last7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= sevenDaysAgo;
    }

    if (dateFilter === "last30days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= thirtyDaysAgo;
    }

    if (dateFilter === "custom") {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered Hot Leads
  const filteredLeads = hotLeads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      lead.name.toLowerCase().includes(searchLower) ||
      lead.number.toLowerCase().includes(searchLower) ||
      lead.industry.toLowerCase().includes(searchLower);

    const matchesDate = isDateInRange(lead.created_at);

    return matchesSearch && matchesDate;
  });

  // Filtered Call Results
  const filteredCallResults = callResults.filter((result) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      result.customer_name.toLowerCase().includes(searchLower) ||
      result.customer_number.toLowerCase().includes(searchLower) ||
      result.call_summary.toLowerCase().includes(searchLower) ||
      result.outcome.toLowerCase().includes(searchLower);

    const matchesSentiment =
      sentimentFilter === "all" ||
      result.user_sentiment.toLowerCase() === sentimentFilter.toLowerCase();

    const matchesDate = isDateInRange(result.created_at || result.start_timestamp);

    return matchesSearch && matchesSentiment && matchesDate;
  });

  // Pagination Math
  const totalLeadPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCallPages = Math.ceil(filteredCallResults.length / itemsPerPage) || 1;
  const paginatedCallResults = filteredCallResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalLeads = hotLeads.length;
  const totalCalls = callResults.length;
  const successfulCalls = callResults.filter((c) => c.call_successful).length;
  const positiveSentimentCount = callResults.filter(
    (c) => c.user_sentiment.toLowerCase() === "positive"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner using portal theme design */}
      <PageHeader
        title="Hot Leads & Call Results"
        description="Track captured prospective leads from your interactive demo and analyze Retell AI post-call conversation metrics in real time."
        action={
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-4 py-2.5 text-sm font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh Data
          </button>
        }
      />

      {/* Theme-blended Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-2xl p-5 border shadow-sm transition-all"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--subtle-text)]">Total Hot Leads</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ background: "var(--warning-bg)", borderColor: "var(--warning-fg)", color: "var(--warning-fg)" }}>
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[var(--foreground)] mt-3">{totalLeads}</p>
          <p className="text-xs text-[var(--muted-text)] mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--success-fg)]" /> Captured from Live Demo
          </p>
        </div>

        <div
          className="rounded-2xl p-5 border shadow-sm transition-all"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--subtle-text)]">Call Results Logged</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ background: "var(--brand-100)", borderColor: "var(--brand-200)", color: "var(--brand-500)" }}>
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[var(--foreground)] mt-3">{totalCalls}</p>
          <p className="text-xs text-[var(--muted-text)] mt-1">Post-call webhooks received</p>
        </div>

        <div
          className="rounded-2xl p-5 border shadow-sm transition-all"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--subtle-text)]">Successful Calls</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ background: "var(--success-bg)", borderColor: "var(--success-fg)", color: "var(--success-fg)" }}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[var(--foreground)] mt-3">{successfulCalls}</p>
          <p className="text-xs text-[var(--muted-text)] mt-1">
            {totalCalls > 0 ? `${Math.round((successfulCalls / totalCalls) * 100)}% completion rate` : "0% completion rate"}
          </p>
        </div>

        <div
          className="rounded-2xl p-5 border shadow-sm transition-all"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--subtle-text)]">Positive Sentiment</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ background: "var(--brand-100)", borderColor: "var(--brand-200)", color: "var(--brand-500)" }}>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[var(--foreground)] mt-3">{positiveSentimentCount}</p>
          <p className="text-xs text-[var(--muted-text)] mt-1">Favorable caller engagements</p>
        </div>
      </div>

      {/* Tabs & Controls Section */}
      <div
        className="rounded-2xl p-4 border space-y-4 shadow-sm"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
          {/* Theme-aligned Tabs */}
          <div className="flex items-center p-1 rounded-xl border self-start" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <button
              onClick={() => setActiveTab("leads")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer",
                activeTab === "leads"
                  ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)] shadow-sm"
                  : "text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              )}
            >
              <Flame className="w-4 h-4" />
              Hot Leads
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]">
                {filteredLeads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("call_results")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer",
                activeTab === "call_results"
                  ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)] shadow-sm"
                  : "text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              )}
            >
              <PhoneCall className="w-4 h-4" />
              Call Results
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]">
                {filteredCallResults.length}
              </span>
            </button>
          </div>

          {/* Search Box & Date/Sentiment Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--subtle-text)]" />
              <input
                type="text"
                placeholder={activeTab === "leads" ? "Search leads..." : "Search call results..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>

            {/* Date Range Preset Selector */}
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <Calendar className="w-4 h-4 text-[var(--subtle-text)] shrink-0" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-sm bg-transparent focus:outline-none cursor-pointer text-[var(--foreground)] font-medium"
              >
                <option value="all" className="bg-[var(--surface)] text-[var(--foreground)]">All Time</option>
                <option value="today" className="bg-[var(--surface)] text-[var(--foreground)]">Today</option>
                <option value="yesterday" className="bg-[var(--surface)] text-[var(--foreground)]">Yesterday</option>
                <option value="last7days" className="bg-[var(--surface)] text-[var(--foreground)]">Last 7 Days</option>
                <option value="last30days" className="bg-[var(--surface)] text-[var(--foreground)]">Last 30 Days</option>
                <option value="custom" className="bg-[var(--surface)] text-[var(--foreground)]">Custom Range</option>
              </select>
            </div>

            {/* Custom Range Inputs */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border px-3 py-1.5 text-xs focus:outline-none cursor-pointer font-medium"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
                <span className="text-xs font-semibold text-[var(--subtle-text)]">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border px-3 py-1.5 text-xs focus:outline-none cursor-pointer font-medium"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
            )}

            {/* Sentiment Filter for Call Results */}
            {activeTab === "call_results" && (
              <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <Filter className="w-4 h-4 text-[var(--subtle-text)] shrink-0" />
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value)}
                  className="text-sm bg-transparent focus:outline-none cursor-pointer text-[var(--foreground)] font-medium"
                >
                  <option value="all" className="bg-[var(--surface)] text-[var(--foreground)]">All Sentiments</option>
                  <option value="positive" className="bg-[var(--surface)] text-[var(--foreground)]">Positive</option>
                  <option value="neutral" className="bg-[var(--surface)] text-[var(--foreground)]">Neutral</option>
                  <option value="negative" className="bg-[var(--surface)] text-[var(--foreground)]">Negative</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tab 1: Hot Leads Table */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            <div className="premium-table-container">
              {loading ? (
                <div className="py-16 text-center text-[var(--muted-text)] flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-[var(--brand-500)]" />
                  <p className="text-sm font-medium">Loading hot leads from database...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="py-16 text-center text-[var(--muted-text)]">
                  <Flame className="w-10 h-10 mx-auto mb-3 text-[var(--subtle-text)] opacity-40" />
                  <p className="text-sm font-bold text-[var(--foreground)]">No hot leads found</p>
                  <p className="text-xs text-[var(--subtle-text)] mt-1">
                    {searchTerm || dateFilter !== "all"
                      ? "Try adjusting your search terms or date filter"
                      : "Prospective leads submitted via the Live Demo will appear here."}
                  </p>
                </div>
              ) : (
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Lead Name</th>
                      <th>Phone Number</th>
                      <th>Industry</th>
                      <th>Captured Date</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.map((lead) => {
                      const leadCalls = callResults.filter((c) => c.customer_id === lead.id);
                      return (
                        <tr key={lead.id}>
                          <td className="font-semibold text-[var(--foreground)]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border" style={{ background: "var(--brand-100)", color: "var(--brand-500)", borderColor: "var(--brand-200)" }}>
                                {lead.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[var(--foreground)]">{lead.name}</p>
                                <p className="text-[11px] text-[var(--subtle-text)] font-mono">{lead.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="font-mono text-[var(--muted-text)]">
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[var(--subtle-text)]" />
                              {lead.number}
                            </span>
                          </td>
                          <td>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ background: "var(--surface-2)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                              <Briefcase className="w-3 h-3 text-[var(--subtle-text)]" />
                              {lead.industry}
                            </span>
                          </td>
                          <td className="text-xs text-[var(--subtle-text)]">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[var(--subtle-text)]" />
                              {new Date(lead.created_at).toLocaleString()}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => {
                                setActiveTab("call_results");
                                setSearchTerm(lead.name);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer"
                              style={{ background: "var(--brand-100)", color: "var(--brand-500)", borderColor: "var(--brand-200)" }}
                            >
                              View Call Results ({leadCalls.length})
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls for Hot Leads */}
            {!loading && filteredLeads.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-xs text-[var(--muted-text)] font-medium">
                    Showing <span className="font-bold text-[var(--foreground)]">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredLeads.length)}</span> to{" "}
                    <span className="font-bold text-[var(--foreground)]">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of{" "}
                    <span className="font-bold text-[var(--foreground)]">{filteredLeads.length}</span> leads
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--subtle-text)]">
                    <span>Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="rounded-lg border px-2 py-1 text-xs bg-transparent text-[var(--foreground)] cursor-pointer outline-none"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                    >
                      <option value={5} className="bg-[var(--surface)]">5</option>
                      <option value={10} className="bg-[var(--surface)]">10</option>
                      <option value={25} className="bg-[var(--surface)]">25</option>
                      <option value={50} className="bg-[var(--surface)]">50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition border disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    style={{ background: "var(--surface-2)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold border font-mono" style={{ background: "var(--surface-2)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                    Page {currentPage} of {totalLeadPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalLeadPages, p + 1))}
                    disabled={currentPage >= totalLeadPages}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition border disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    style={{ background: "var(--surface-2)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Call Results Table */}
        {activeTab === "call_results" && (
          <div className="space-y-4">
            <div className="premium-table-container">
              {loading ? (
                <div className="py-16 text-center text-[var(--muted-text)] flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-[var(--brand-500)]" />
                  <p className="text-sm font-medium">Loading call results from database...</p>
                </div>
              ) : filteredCallResults.length === 0 ? (
                <div className="py-16 text-center text-[var(--muted-text)]">
                  <PhoneCall className="w-10 h-10 mx-auto mb-3 text-[var(--subtle-text)] opacity-40" />
                  <p className="text-sm font-bold text-[var(--foreground)]">No call results recorded</p>
                  <p className="text-xs text-[var(--subtle-text)] mt-1">
                    {searchTerm || dateFilter !== "all" || sentimentFilter !== "all"
                      ? "Try adjusting your search terms or filters"
                      : "Retell AI post-call webhook results will appear here."}
                  </p>
                </div>
              ) : (
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Customer / Lead</th>
                      <th>Call Status</th>
                      <th>Outcome</th>
                      <th>Sentiment</th>
                      <th>Call Summary</th>
                      <th>Timestamps</th>
                      <th className="text-right">Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCallResults.map((result) => (
                      <tr key={result.id}>
                        <td className="font-semibold text-[var(--foreground)]">
                          <p className="font-bold text-[var(--foreground)]">{result.customer_name}</p>
                          <p className="text-xs font-mono text-[var(--subtle-text)] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[var(--subtle-text)]" />
                            {result.customer_number}
                          </p>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1 items-start">
                            {result.call_successful ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border" style={{ background: "var(--success-bg)", color: "var(--success-fg)", borderColor: "var(--success-fg)" }}>
                                <CheckCircle2 className="w-3 h-3" /> Successful
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border" style={{ background: "var(--danger-bg)", color: "var(--danger-fg)", borderColor: "var(--danger-border)" }}>
                                <XCircle className="w-3 h-3" /> Failed / Cut Off
                              </span>
                            )}

                            {result.in_voicemail && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ background: "var(--warning-bg)", color: "var(--warning-fg)", borderColor: "var(--warning-fg)" }}>
                                <Voicemail className="w-3 h-3" /> Voicemail
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold border" style={{ background: "var(--surface-2)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                            {result.outcome}
                          </span>
                        </td>
                        <td>
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-bold capitalize border inline-block",
                              result.user_sentiment.toLowerCase() === "positive" && "sentiment-chip sentiment-positive",
                              result.user_sentiment.toLowerCase() === "neutral" && "sentiment-chip sentiment-neutral",
                              result.user_sentiment.toLowerCase() === "negative" && "sentiment-chip sentiment-negative"
                            )}
                          >
                            {result.user_sentiment}
                          </span>
                        </td>
                        <td className="max-w-xs">
                          <p className="text-xs text-[var(--muted-text)] line-clamp-2 leading-relaxed">
                            {result.call_summary}
                          </p>
                        </td>
                        <td className="text-xs text-[var(--subtle-text)]">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 font-medium text-[var(--muted-text)]">
                              <Clock className="w-3 h-3 text-[var(--subtle-text)]" />
                              {new Date(result.start_timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-[11px] text-[var(--subtle-text)]">
                              {new Date(result.start_timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() =>
                              setSelectedTranscript({
                                leadName: result.customer_name,
                                summary: result.call_summary,
                                transcript: result.transcript || "No transcript recorded for this call.",
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer"
                            style={{ background: "var(--brand-100)", color: "var(--brand-500)", borderColor: "var(--brand-200)" }}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Transcript
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls for Call Results */}
            {!loading && filteredCallResults.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-xs text-[var(--muted-text)] font-medium">
                    Showing <span className="font-bold text-[var(--foreground)]">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredCallResults.length)}</span> to{" "}
                    <span className="font-bold text-[var(--foreground)]">{Math.min(currentPage * itemsPerPage, filteredCallResults.length)}</span> of{" "}
                    <span className="font-bold text-[var(--foreground)]">{filteredCallResults.length}</span> call results
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--subtle-text)]">
                    <span>Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="rounded-lg border px-2 py-1 text-xs bg-transparent text-[var(--foreground)] cursor-pointer outline-none"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                    >
                      <option value={5} className="bg-[var(--surface)]">5</option>
                      <option value={10} className="bg-[var(--surface)]">10</option>
                      <option value={25} className="bg-[var(--surface)]">25</option>
                      <option value={50} className="bg-[var(--surface)]">50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition border disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    style={{ background: "var(--surface-2)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold border font-mono" style={{ background: "var(--surface-2)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                    Page {currentPage} of {totalCallPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalCallPages, p + 1))}
                    disabled={currentPage >= totalCallPages}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition border disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    style={{ background: "var(--surface-2)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transcript Modal integrated with theme design */}
      {selectedTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--brand-500)]" />
                <h3 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Call Transcript: {selectedTranscript.leadName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTranscript(null)}
                className="p-1 rounded-lg text-[var(--muted-text)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] cursor-pointer text-xl leading-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="rounded-xl p-4 border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <h4 className="text-xs font-bold uppercase text-[var(--brand-500)] tracking-wider mb-1 font-sans">
                  AI Call Summary
                </h4>
                <p className="text-sm text-[var(--foreground)] leading-relaxed">{selectedTranscript.summary}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-[var(--subtle-text)] tracking-wider mb-2 font-sans">
                  Full Transcript
                </h4>
                <div
                  className="rounded-xl p-4 font-mono text-xs text-[var(--foreground)] whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto border"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                >
                  {selectedTranscript.transcript}
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 border-t" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <button
                onClick={() => setSelectedTranscript(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer"
                style={{ background: "var(--surface)", color: "var(--foreground)", borderColor: "var(--border)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
