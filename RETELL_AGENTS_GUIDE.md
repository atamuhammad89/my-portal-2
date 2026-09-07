# Retell AI Agents — Implementation Guide

## What was built

This guide documents every file added or modified to implement the Retell AI Agents features.

---

## Architecture Overview

```
Browser (super_admin)
  └─► POST /api/admin/agents          (Next.js API Route)
          └─► createRetellAgent()     (src/lib/retell-api.ts  — server only)
                  └─► Retell REST API  (api.retellai.com)
          └─► INSERT agents           (Supabase public.agents)
          └─► INSERT user_agent_access

Retell AI platform
  └─► POST /api/webhooks/retell       (Next.js API Route)
          └─► Verify HMAC-SHA256 signature
          └─► UPSERT call_logs        (Supabase public.call_logs)

Browser (any authenticated user)
  └─► GET  /api/agents                → agents they are granted access to
  └─► GET  /api/call-logs             → call logs for their accessible agents
  └─► GET  /api/admin/agents/analytics → aggregated stats (admin roles only)
```

---

## New Files

### Database
| File | Purpose |
|------|---------|
| `supabase/migrations/002_retell_agents_and_call_logs.sql` | Creates `agents`, `user_agent_access`, `call_logs` tables with RLS |

### Server-side libs (never imported by client)
| File | Purpose |
|------|---------|
| `src/lib/retell-api.ts` | Typed wrappers for Retell REST API (create/get/update/delete/list agents) |
| `src/lib/jwt-auth.ts` | JWT verification helper for API routes |

### API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/agents` | GET | List all agents (admin roles) |
| `/api/admin/agents` | POST | Create agent on Retell + store locally (super_admin) |
| `/api/admin/agents/[agentId]` | GET | Single agent with call history |
| `/api/admin/agents/[agentId]` | PATCH | Update agent on Retell + DB (super_admin) |
| `/api/admin/agents/[agentId]` | DELETE | Soft-delete agent, remove from Retell (super_admin) |
| `/api/admin/agents/[agentId]/access` | GET/POST/DELETE | Manage user access grants |
| `/api/admin/agents/analytics` | GET | Aggregated call stats per agent |
| `/api/admin/call-logs` | GET | Paginated call logs with filters |
| `/api/agents` | GET | User-scoped agent list |
| `/api/call-logs` | GET | User-scoped call logs |
| `/api/webhooks/retell` | POST | Webhook receiver for Retell call events |

### Types
| File | Purpose |
|------|---------|
| `src/types/retell.ts` | `RetellAgent`, `CallLog`, `AgentAnalytics`, `CallLogsOverview` |

### Services & Hooks
| File | Purpose |
|------|---------|
| `src/services/admin/adminRetellAgentsService.ts` | Client-side API calls for admin agent management |
| `src/hooks/admin/use-admin-retell-agents-query.ts` | React Query hooks for all agent/call-log/analytics queries |
| `src/hooks/admin/use-admin-users-query.ts` | Shared hook for user list (reused across modals) |

### UI Components
| File | Purpose |
|------|---------|
| `src/components/admin/agents/admin-retell-agents-shell.tsx` | Main agents management page with Create/Delete/Access modals |
| `src/components/admin/agents/admin-agents-analytics-shell.tsx` | Analytics dashboard with per-agent stats table |
| `src/components/admin/call-logs/admin-call-logs-shell.tsx` | Paginated call logs table with transcript viewer |

### Pages (updated)
| Page | Change |
|------|--------|
| `/admin/agents` | Now renders `AdminRetellAgentsShell` |
| `/admin/call-monitoring` | Now renders `AdminCallLogsShell` |
| `/admin/agents/analytics` | New page — renders `AdminAgentsAnalyticsShell` |

---

## Setup Steps

### 1. Run the DB migration

```sql
-- In your Supabase SQL editor or via CLI:
-- supabase db push
-- Or paste the contents of:
-- supabase/migrations/002_retell_agents_and_call_logs.sql
```

### 2. Add environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
RETELL_API_KEY=key_xxxxxxxxxxxxxxxx          # From Retell dashboard
RETELL_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx  # From Retell dashboard → Webhooks
```

### 3. Register the Retell webhook

In your **Retell dashboard → Webhooks**, add:

```
https://your-app.com/api/webhooks/retell
```

Enable these events: `call_started`, `call_ended`, `call_analyzed`

### 4. (Optional) Local webhook testing with ngrok

```bash
ngrok http 3000
# Then set the Retell webhook URL to your ngrok HTTPS URL + /api/webhooks/retell
# Set RETELL_WEBHOOK_SECRET="" to skip signature verification in dev
```

---

## Role-Based Access Summary

| Role | Create Agent | View Agents | Manage Access | View Analytics | View Call Logs |
|------|:-----------:|:-----------:|:-------------:|:--------------:|:--------------:|
| `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `operations` | ❌ | ✅ | ❌ | ✅ | ✅ |
| `support` | ❌ | ✅ | ❌ | ✅ | ✅ |
| `finance` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `owner`/`admin`/`member` | ❌ | Granted only | ❌ | ❌ | Granted only |

---

## Database Schema

```sql
-- agents: Retell agent config + local metadata
agents (
  id uuid PK,
  retell_agent_id text UNIQUE,   -- Retell's agent_id
  name text,
  voice_id text,
  language text,
  response_engine text,
  llm_websocket_url text,
  begin_message text,
  general_prompt text,
  config jsonb,                   -- full Retell API response snapshot
  created_by uuid → users.id,
  tenant_id text,
  is_active boolean,
  created_at / updated_at
)

-- user_agent_access: which users can see which agents
user_agent_access (
  id uuid PK,
  user_id uuid → users.id,
  agent_id uuid → agents.id,
  granted_by uuid → users.id,
  granted_at timestamptz
  UNIQUE(user_id, agent_id)
)

-- call_logs: populated by Retell webhook
call_logs (
  id uuid PK,
  retell_call_id text UNIQUE,    -- Retell's call_id
  retell_agent_id text,
  agent_id uuid → agents.id,
  call_status text,              -- registered|ongoing|ended|error
  start_timestamp bigint,        -- ms epoch
  end_timestamp bigint,
  duration_seconds int GENERATED, -- auto-computed from timestamps
  from_number text,
  to_number text,
  transcript text,
  transcript_object jsonb,        -- structured [{role, content}]
  recording_url text,
  call_cost numeric,              -- USD
  disconnection_reason text,
  call_analysis jsonb,
  raw_payload jsonb,              -- full webhook body for auditing
  created_at
)
```

---

## Webhook Event Handling

| Retell Event | Action |
|-------------|--------|
| `call_started` | Upsert call_logs with `status=ongoing`, timestamps, phone numbers |
| `call_ended` | Upsert with final status, duration, transcript, recording URL, cost |
| `call_analyzed` | Upsert `call_analysis` JSON from Retell's post-call analysis |
| Unknown events | Store raw payload for auditing, set `status=unknown` |

The webhook uses HMAC-SHA256 signature verification via the `x-retell-signature` header.
If `RETELL_WEBHOOK_SECRET` is not set, verification is skipped (dev mode).
