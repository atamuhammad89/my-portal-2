import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!jwt || !requireRole(jwt, ["reseller"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const resellerId = jwt.sub;

  const { searchParams } = req.nextUrl;
  const filterCustomerId = searchParams.get("customer_id");
  const fromDate   = searchParams.get("from");
  const toDate     = searchParams.get("to");
  const sortOrder  = searchParams.get("sort") === "oldest" ? true : false;
  const page       = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit      = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const offset     = (page - 1) * limit;

  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch customers assigned to this reseller with active subscription details
    const { data: clients, error: clientError } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        active_subscription_id,
        subscriptions!users_active_subscription_id_fkey (
          id,
          started_at,
          ends_at
        )
      `)
      .eq("reseller_id", resellerId)
      .eq("role", "owner");

    if (clientError) throw clientError;

    const customers = (clients ?? []).map((c: any) => ({
      id: c.id,
      fullName: c.full_name,
      email: c.email,
    }));

    const clientIds = customers.map((c) => c.id);

    if (clientIds.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, limit, customers });
    }

    // Map each customer's active subscription start/end timestamps
    const userSubscriptionMap: Record<string, { start: number | null; end: number | null }> = {};
    (clients ?? []).forEach((c: any) => {
      const sub = c.subscriptions;
      if (sub) {
        const start = sub.started_at ? new Date(sub.started_at).getTime() : null;
        const end = sub.ends_at ? new Date(sub.ends_at).getTime() : null;
        userSubscriptionMap[c.id] = { start, end };
      } else {
        userSubscriptionMap[c.id] = { start: null, end: null };
      }
    });

    // 2. Validate customer_id filter if provided
    let targetClientIds = clientIds;
    if (filterCustomerId) {
      if (!clientIds.includes(filterCustomerId)) {
        return NextResponse.json({ error: "Invalid customer ID filter." }, { status: 400 });
      }
      targetClientIds = [filterCustomerId];
    }

    // 3. Fetch assistant assignments for target customers
    const { data: assignments, error: assignmentError } = await supabase
      .from("user_assistant_assignments")
      .select("user_id, assistant_id")
      .in("user_id", targetClientIds);

    if (assignmentError) throw assignmentError;

    const assistantIds = (assignments ?? []).map((a: any) => a.assistant_id).filter(Boolean);

    if (assistantIds.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, limit, customers });
    }

    const assistantToUser: Record<string, string> = {};
    (assignments ?? []).forEach((a: any) => {
      assistantToUser[a.assistant_id] = a.user_id;
    });

    const userMap: Record<string, { fullName: string; email: string }> = {};
    customers.forEach((c) => {
      userMap[c.id] = { fullName: c.fullName, email: c.email };
    });

    // 4. Query CDRs
    const { data: rows, error: cdrError } = await supabase
      .from("cdrs")
      .select("*")
      .in("assistant_id", assistantIds);

    if (cdrError) throw cdrError;

    // Filter by customer subscription boundaries
    let filteredRows = (rows ?? []).filter((row: any) => {
      const userId = assistantToUser[row.assistant_id];
      if (!userId) return false;

      const sub = userSubscriptionMap[userId];
      if (!sub || sub.start === null) return false;

      const callMs = parseCdrDate(row.start_datetime);
      if (callMs === null) return false;

      if (callMs < sub.start) return false;
      if (sub.end !== null && callMs > sub.end) return false;
      return true;
    });

    // Filter by date (from/to) query parameters if provided
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

    // Sort in memory
    filteredRows.sort((a: any, b: any) => {
      const timeA = parseCdrDate(a.start_datetime) ?? 0;
      const timeB = parseCdrDate(b.start_datetime) ?? 0;
      return sortOrder ? timeA - timeB : timeB - timeA;
    });

    // Paginate in memory
    const total = filteredRows.length;
    const paginatedRows = filteredRows.slice(offset, offset + limit);

    // Shape output
    const data = paginatedRows.map((row: any) => {
      const durationSeconds = row.total_seconds ?? Math.round(Number(row.total_mins ?? 0) * 60);
      const userId = assistantToUser[row.assistant_id] ?? null;
      const userInfo = userId ? userMap[userId] : null;

      return {
        id: row.id,
        callId: row.call_id ?? row.id,
        startedAt: row.start_datetime ?? "",
        endedAt: row.end_datetime ?? null,
        fromNumber: row.customer_number ?? "—",
        toNumber: row.assistant_id ?? "—",
        durationSeconds,
        status: row.is_successful === true ? "passed" : "failed",
        hasRecording: Boolean(row.call_recording),
        recordingUrl: row.call_recording ?? null,
        transcript: row.transcript ?? null,
        disconnectionReason: row.disconnection_reason ?? null,
        callInfo: row.call_info ?? null,
        customerSentiment: row.customer_sentiment ?? null,
        isSuccessful: row.is_successful ?? null,
        // Customer details
        customerId: userId,
        customerName: userInfo?.fullName ?? null,
        customerEmail: userInfo?.email ?? null,
      };
    });

    return NextResponse.json({ data, total, page, limit, customers });
  } catch (err: any) {
    console.error("[GET /api/reseller/call-logs]", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch reseller call logs." }, { status: 500 });
  }
}

function parseCdrDate(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === "") return null;

  const ts = Number(raw);
  if (!isNaN(ts) && String(raw).trim() !== "") {
    const ms = ts > 1e12 ? ts : ts * 1000;
    return isNaN(ms) ? null : ms;
  }

  if (typeof raw === "string") {
    const ddmm = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}:\d{2}(?::\d{2})?))?/);
    if (ddmm) {
      const [, dd, mm, yyyy, time] = ddmm;
      const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${time ?? "00:00:00"}`;
      const d = new Date(iso).getTime();
      return isNaN(d) ? null : d;
    }
    const d = new Date(raw).getTime();
    return isNaN(d) ? null : d;
  }

  return null;
}
