import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createCdrsServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

/**
 * GET /api/admin/call-logs
 *
 * Supports all customer-side filters PLUS an additional `customer_id` filter
 * that looks up the customer's assigned assistant_id and scopes CDRs to it.
 *
 * Query params:
 *   customer_id  – filter by customer (user) ID
 *   status       – "passed" | "failed" | "all"
 *   from         – YYYY-MM-DD start date (inclusive)
 *   to           – YYYY-MM-DD end date (inclusive)
 *   sort         – "newest" | "oldest"  (default: newest)
 *   search       – partial match on customer_number
 *   page         – 1-based page number
 *   limit        – rows per page (max 200)
 */
export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "support"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const customerId = searchParams.get("customer_id");
  const status     = searchParams.get("status");
  const fromDate   = searchParams.get("from");
  const toDate     = searchParams.get("to");
  const sortOrder  = searchParams.get("sort") === "oldest" ? true : false;
  const search     = searchParams.get("search") ?? "";
  const page       = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit      = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const offset     = (page - 1) * limit;

  const supabase = createServerSupabaseClient();

  // ── 1. Fetch all customers (id + name + email) for the customer selector ───
  const { data: customerRows } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("role", ["owner", "super_admin", "reseller"])
    .order("full_name", { ascending: true });

  const customers = (customerRows ?? []).map((u: any) => ({
    id:       u.id,
    fullName: u.full_name,
    email:    u.email,
  }));

  // ── 2. Resolve assistant_id if customer_id filter is provided ──────────────
  let assistantIdFilter: string | null = null;

  if (customerId) {
    const { data: assignment } = await supabase
      .from("user_assistant_assignments")
      .select("assistant_id")
      .eq("user_id", customerId)
      .maybeSingle();

    if (!assignment?.assistant_id) {
      // Customer has no assignment → return empty but include customers list so dropdown doesn't disappear
      return NextResponse.json({ data: [], total: 0, page, limit, customers });
    }
    assistantIdFilter = assignment.assistant_id;
  }

  // ── 3. Fetch all assistant assignments so we can label rows with customer ──
  const { data: allAssignments } = await supabase
    .from("user_assistant_assignments")
    .select("user_id, assistant_id");

  // Build reverse map: assistant_id → user_id
  const assistantToUser: Record<string, string> = {};
  (allAssignments ?? []).forEach((a: any) => {
    assistantToUser[a.assistant_id] = a.user_id;
  });

  // Build user map: user_id → { full_name, email }
  const userMap: Record<string, { fullName: string; email: string }> = {};
  (customerRows ?? []).forEach((u: any) => {
    userMap[u.id] = { fullName: u.full_name, email: u.email };
  });

  const cdrsSupabase = createCdrsServerSupabaseClient();

  // ── 4. Build CDR query ────────────────────────────────────────────────────
  let query = cdrsSupabase
    .from("cdrs")
    .select("*"); // No count or range in database since we filter, sort and paginate in memory

  if (assistantIdFilter) {
    query = query.eq("assistant_id", assistantIdFilter);
  }

  if (status && status !== "all") {
    query = query.eq("is_successful", status === "passed");
  }

  if (search) {
    query = query.ilike("customer_number", `%${search}%`);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("[GET /api/admin/call-logs]", error);
    return NextResponse.json({ error: "Failed to fetch call logs." }, { status: 500 });
  }

  // Filter by date in memory
  let filteredRows = rows ?? [];
  if (fromDate || toDate) {
    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime   = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    filteredRows = filteredRows.filter((row: any) => {
      const callMs = parseCdrDate(row.start_datetime);
      if (callMs === null) return false;

      if (fromTime !== null && callMs < fromTime) return false;
      if (toTime !== null && callMs > toTime) return false;
      return true;
    });
  }

  // Sort rows chronologically in memory
  filteredRows.sort((a: any, b: any) => {
    const timeA = parseCdrDate(a.start_datetime) ?? 0;
    const timeB = parseCdrDate(b.start_datetime) ?? 0;
    return sortOrder ? timeA - timeB : timeB - timeA;
  });

  // Paginate in memory
  const total = filteredRows.length;
  const paginatedRows = filteredRows.slice(offset, offset + limit);

  // ── 5. Shape response ─────────────────────────────────────────────────────
  const data = paginatedRows.map((row: any) => {
    const durationSeconds =
      row.total_seconds ?? Math.round(Number(row.total_mins ?? 0) * 60);
    const userId   = assistantToUser[row.assistant_id] ?? null;
    const userInfo = userId ? userMap[userId] : null;

    return {
      id:                  row.id,
      callId:              row.call_id ?? row.id,
      startedAt:           row.start_datetime ?? "",
      endedAt:             row.end_datetime ?? null,
      fromNumber:          row.customer_number ?? "—",
      toNumber:            row.assistant_id ?? "—",
      durationSeconds,
      status:              row.is_successful === true ? "passed" : "failed",
      hasRecording:        Boolean(row.call_recording),
      recordingUrl:        row.call_recording ?? null,
      transcript:          row.transcript ?? null,
      disconnectionReason: row.disconnection_reason ?? null,
      callInfo:            row.call_info ?? null,
      customerSentiment:   row.customer_sentiment ?? null,
      isSuccessful:        row.is_successful ?? null,
      // Customer enrichment
      customerId:          userId,
      customerName:        userInfo?.fullName ?? null,
      customerEmail:       userInfo?.email ?? null,
    };
  });

  // ── 6. Return customers list alongside logs for the filter dropdown ────────
  return NextResponse.json({ data, total, page, limit, customers });
}

function parseCdrDate(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === "") return null;

  const ts = Number(raw);
  if (!isNaN(ts) && String(raw).trim() !== "") {
    // > 1e12 → milliseconds, otherwise seconds
    const ms = ts > 1e12 ? ts : ts * 1000;
    return isNaN(ms) ? null : ms;
  }

  if (typeof raw === "string") {
    // DD/MM/YYYY [HH:mm:ss]
    const ddmm = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}:\d{2}(?::\d{2})?))?/);
    if (ddmm) {
      const [, dd, mm, yyyy, time] = ddmm;
      const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${time ?? "00:00:00"}`;
      const d = new Date(iso).getTime();
      return isNaN(d) ? null : d;
    }
    // ISO or any other Date-parseable string
    const d = new Date(raw).getTime();
    return isNaN(d) ? null : d;
  }

  return null;
}
