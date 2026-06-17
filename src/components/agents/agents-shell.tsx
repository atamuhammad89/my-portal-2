"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAgentsQuery } from "@/hooks/use-agents-query";
import { Agent } from "@/types/agent";
import { formatDuration } from "@/utils/format";
import { getAgentStatusVariant } from "@/utils/status";

const PAGE_SIZE = 4;

export function AgentsShell() {
  const { data, isLoading, error } = useAgentsQuery();
  const agents = (data as Agent[] | undefined) ?? [];
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Agent["status"]>("all");
  const [page, setPage] = useState(1);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const searchMatch =
        agent.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        agent.phoneNumber.includes(searchValue);
      const statusMatch = statusFilter === "all" ? true : agent.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [agents, searchValue, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / PAGE_SIZE));
  const paginatedAgents = filteredAgents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalAgents = agents.length;
  const activeAgents = agents.filter((item) => item.status === "active").length;

  if (isLoading) {
    return <LoadingSkeleton className="h-96 w-full" />;
  }

  if (error) {
    return <ErrorState message="Agents could not be loaded. Please try again." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Agents"
        description="Manage agent status, assigned numbers, and campaign-level performance."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Agents" value={String(totalAgents)} />
        <StatCard label="Active Agents" value={String(activeAgents)} />
        <StatCard label="Total Calls" value={String(agents.reduce((sum, item) => sum + item.totalCalls, 0))} />
      </section>

      <FilterBar>
        <div className="w-full md:max-w-md">
          <SearchInput
            value={searchValue}
            onChange={(value) => {
              setPage(1);
              setSearchValue(value);
            }}
            placeholder="Search by agent name or phone number"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value as "all" | Agent["status"]);
          }}
          className="rounded-lg border px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--brand-500)]/30"
          style={{ background: "var(--surface)", color: "var(--foreground)", borderColor: "var(--border)" }}
        >
          <option value="all" className="bg-[var(--surface)]">All Statuses</option>
          <option value="active" className="bg-[var(--surface)]">Active</option>
          <option value="paused" className="bg-[var(--surface)]">Paused</option>
          <option value="draft" className="bg-[var(--surface)]">Draft</option>
        </select>
      </FilterBar>

      {paginatedAgents.length === 0 ? (
        <EmptyState title="No agents found" message="Try adjusting search and status filters." />
      ) : (
        <DataTable
          rows={paginatedAgents}
          columns={[
            {
              key: "name",
              label: "Agent",
              render: (_, row) => (
                <Link href={`/agents/${row.id}`} className="font-medium text-[var(--foreground)] hover:underline">
                  {row.name}
                </Link>
              )
            },
            {
              key: "status",
              label: "Status",
              render: (value) => (
                <StatusBadge text={String(value)} variant={getAgentStatusVariant(value as Agent["status"])} />
              )
            },
            { key: "phoneNumber", label: "Phone Number" },
            {
              key: "campaignStatus",
              label: "Campaign",
              render: (value) => <StatusBadge text={String(value)} variant="neutral" />
            },
            { key: "totalCalls", label: "Total Calls" },
            {
              key: "answerRate",
              label: "Answer Rate",
              render: (value) => `${String(value)}%`
            },
            {
              key: "avgDurationSeconds",
              label: "Avg Duration",
              render: (value) => formatDuration(Number(value))
            }
          ]}
        />
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrevious={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
      />
    </div>
  );
}
