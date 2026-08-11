import { z } from "zod";

// ─── Agent Schemas ────────────────────────────────────────────────────────────

export const createAgentSchema = z.object({
  voice_id: z.string().min(1, "Voice ID is required"),
  agent_name: z.string().optional(),
  language: z.string().optional(),
  response_engine: z.object({
    type: z.string().default("retell-llm"),
    llm_id: z.string().optional(),
    llm_websocket_url: z.string().optional(),
  }),
  begin_message: z.string().optional(),
  general_prompt: z.string().optional(),
  ambient_sound: z.string().optional(),
  responsiveness: z.number().min(0).max(1).optional(),
  interruption_sensitivity: z.number().min(0).max(1).optional(),
  enable_backchannel: z.boolean().optional(),
  max_call_duration_ms: z.number().positive().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export const publishAgentSchema = z.object({
  agent_id: z.string().min(1, "Agent ID is required"),
});

// ─── Phone Number Schemas ─────────────────────────────────────────────────────

export const phoneAgentAssignmentSchema = z.object({
  agent_id: z.string().min(1, "Agent ID is required"),
});

export const createPhoneNumberSchema = z.object({
  area_code: z.number().optional(),
  nickname: z.string().optional(),
  inbound_agents: z.array(phoneAgentAssignmentSchema).optional(),
  outbound_agents: z.array(phoneAgentAssignmentSchema).optional(),
});

export const updatePhoneNumberSchema = z.object({
  nickname: z.string().optional(),
  inbound_agents: z.array(phoneAgentAssignmentSchema).optional(),
  outbound_agents: z.array(phoneAgentAssignmentSchema).optional(),
});

// ─── Outbound & Call Schemas ──────────────────────────────────────────────────

export const createPhoneCallSchema = z.object({
  from_number: z.string().min(1, "From phone number is required"),
  to_number: z.string().min(1, "To phone number is required"),
  agent_id: z.string().optional(),
  override_agent_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  retell_llm_dynamic_variables: z.record(z.unknown()).optional(),
});

export const createBatchCallSchema = z.object({
  from_number: z.string().min(1, "From phone number is required"),
  name: z.string().optional(),
  trigger_timestamp: z.number().optional(),
  tasks: z
    .array(
      z.object({
        to_number: z.string().min(1, "To number is required"),
        agent_id: z.string().optional(),
        override_agent_id: z.string().optional(),
        retell_llm_dynamic_variables: z.record(z.unknown()).optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .min(1, "At least one call task is required"),
});

export const updateLiveCallSchema = z.object({
  action: z.enum(["transfer", "say", "hangup"]),
  transfer_number: z.string().optional(),
  message: z.string().optional(),
});

// ─── Voice Schemas ────────────────────────────────────────────────────────────

export const cloneVoiceSchema = z.object({
  voice_name: z.string().min(1, "Voice name is required"),
  files: z.array(z.string()).min(1, "At least one audio file is required"),
  gender: z.enum(["male", "female"]).optional(),
});

export const searchVoiceSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  gender: z.enum(["male", "female"]).optional(),
  accent: z.string().optional(),
});

// ─── Retell LLM Schemas ───────────────────────────────────────────────────────

export const createLlmSchema = z.object({
  model: z.string().optional(),
  general_prompt: z.string().optional(),
  begin_message: z.string().optional(),
  knowledge_base_ids: z.array(z.string()).optional(),
});

export const updateLlmSchema = createLlmSchema.partial();

// ─── Knowledge Base Schemas ───────────────────────────────────────────────────

export const createKbSchema = z.object({
  knowledge_base_name: z.string().min(1, "Knowledge Base name is required"),
  texts: z
    .array(
      z.object({
        title: z.string(),
        text: z.string(),
      })
    )
    .optional(),
  urls: z.array(z.string()).optional(),
  files: z
    .array(
      z.object({
        name: z.string(),
        content_type: z.string().optional(),
        data: z.string().optional(),
      })
    )
    .optional(),
  knowledge_base_texts: z
    .array(
      z.object({
        title: z.string(),
        text: z.string(),
      })
    )
    .optional(),
  knowledge_base_urls: z.array(z.string()).optional(),
  knowledge_base_files: z
    .array(
      z.object({
        name: z.string(),
        content_type: z.string().optional(),
        data: z.string().optional(),
      })
    )
    .optional(),
});

export const updateKbSchema = createKbSchema.partial();

export const attachKbSchema = z.object({
  llm_id: z.string().min(1, "LLM ID is required"),
  knowledge_base_id: z.string().min(1, "Knowledge Base ID is required"),
});

export const searchKbSchema = z.object({
  query: z.string().min(1, "Query string is required"),
});

// ─── Testing Schemas ──────────────────────────────────────────────────────────

export const createTestDefSchema = z.object({
  name: z.string().min(1, "Test name is required"),
  agent_id: z.string().min(1, "Agent ID is required"),
  evaluators: z
    .array(
      z.object({
        type: z.string(),
        prompt: z.string(),
      })
    )
    .optional(),
});

export const runBatchTestSchema = z.object({
  test_ids: z.array(z.string()).min(1, "At least one test ID is required"),
  name: z.string().optional(),
});
