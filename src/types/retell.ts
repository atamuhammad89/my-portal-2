// ─── Retell Agent Types & DTOs ───────────────────────────────────────────────

export type RetellAgentStatus = "active" | "inactive";

export type RetellAgentConfig = {
  voice_id?: string;
  language?: string;
  response_engine?: string;
  llm_websocket_url?: string;
  begin_message?: string;
  general_prompt?: string;
  ambient_sound?: string;
  responsiveness?: number;
  interruption_sensitivity?: number;
  enable_backchannel?: boolean;
  max_call_duration_ms?: number;
  [key: string]: unknown;
};

/** Row in public.agents */
export type RetellAgent = {
  id: string;
  retell_agent_id: string;
  name: string;
  voice_id: string | null;
  language: string;
  response_engine: string;
  llm_websocket_url: string | null;
  begin_message: string | null;
  general_prompt: string | null;
  config: RetellAgentConfig;
  created_by: string;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Payload for creating a new agent */
export type CreateRetellAgentPayload = {
  name: string;
  voice_id?: string;
  language?: string;
  response_engine?: string;
  llm_websocket_url?: string;
  begin_message?: string;
  general_prompt?: string;
  config?: RetellAgentConfig;
  assign_user_ids?: string[];
};

export type RetellAgentResponse = {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
  response_engine: { type: string; llm_id?: string; llm_websocket_url?: string };
  begin_message?: string;
  general_prompt?: string;
  begin_after_user_silence_ms?: number;
  created_at?: number;
  last_modification_timestamp?: number;
  version?: number;
  userId?: string;
  [key: string]: unknown;
};

export type CreateAgentDto = {
  response_engine: { type: string; llm_id?: string; llm_websocket_url?: string };
  voice_id: string;
  agent_name?: string;
  language?: string;
  begin_message?: string;
  general_prompt?: string;
  begin_after_user_silence_ms?: number;
  ambient_sound?: string;
  responsiveness?: number;
  interruption_sensitivity?: number;
  enable_backchannel?: boolean;
  max_call_duration_ms?: number;
  [key: string]: unknown;
};

export type UpdateAgentDto = Partial<CreateAgentDto>;

export type PublishAgentResponse = {
  agent_id: string;
  version: number;
  published_at: number;
};

// ─── Phone Number Types & DTOs ────────────────────────────────────────────────

export type PhoneAgentAssignmentDto = {
  agent_id: string;
  weight?: number;
};

export type RetellPhoneNumberResponse = {
  phone_number: string;
  phone_number_pretty?: string;
  nickname?: string;
  inbound_agent_id?: string;
  outbound_agent_id?: string;
  inbound_agents?: PhoneAgentAssignmentDto[];
  outbound_agents?: PhoneAgentAssignmentDto[];
  area_code?: number;
  created_at?: number;
  last_modification_timestamp?: number;
};

export type CreatePhoneNumberDto = {
  area_code?: number;
  nickname?: string;
  inbound_agents?: PhoneAgentAssignmentDto[];
  outbound_agents?: PhoneAgentAssignmentDto[];
};

export type UpdatePhoneNumberDto = {
  nickname?: string;
  inbound_agents?: PhoneAgentAssignmentDto[];
  outbound_agents?: PhoneAgentAssignmentDto[];
};

// ─── Call Management Types & DTOs ─────────────────────────────────────────────

export type CallStatus = "registered" | "ongoing" | "ended" | "error" | "unknown";

export type TranscriptTurn = {
  role: "agent" | "user";
  content: string;
};

/** Row in public.call_logs */
export type CallLog = {
  id: string;
  retell_call_id: string;
  retell_agent_id: string;
  agent_id: string | null;
  call_status: CallStatus;
  start_timestamp: number | null;
  end_timestamp: number | null;
  duration_seconds: number | null;
  from_number: string | null;
  to_number: string | null;
  transcript: string | null;
  transcript_object: TranscriptTurn[] | null;
  recording_url: string | null;
  call_cost: number | null;
  disconnection_reason: string | null;
  call_analysis: Record<string, unknown> | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
  agent?: Pick<RetellAgent, "id" | "name" | "retell_agent_id">;
};

export type RetellCallResponse = {
  call_id: string;
  call_type?: "web_call" | "phone_call" | "inbound_phone_call" | "outbound_phone_call";
  call_status: CallStatus;
  agent_id: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  from_number?: string;
  to_number?: string;
  transcript?: string;
  transcript_object?: TranscriptTurn[];
  recording_url?: string;
  disconnection_reason?: string;
  call_cost?: number;
  call_analysis?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  retell_llm_dynamic_variables?: Record<string, unknown>;
  [key: string]: unknown;
};

export type CreatePhoneCallDto = {
  from_number: string;
  to_number: string;
  agent_id?: string;
  override_agent_id?: string;
  metadata?: Record<string, unknown>;
  retell_llm_dynamic_variables?: Record<string, unknown>;
};

export type CreateBatchCallDto = {
  from_number: string;
  name?: string;
  trigger_timestamp?: number;
  tasks: Array<{
    to_number: string;
    agent_id?: string;
    override_agent_id?: string;
    retell_llm_dynamic_variables?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }>;
};

export type UpdateLiveCallDto = {
  action: "transfer" | "say" | "hangup";
  transfer_number?: string;
  message?: string;
};

export type StopCallResponse = {
  success: boolean;
  call_id: string;
};

// ─── Voice Management Types & DTOs ────────────────────────────────────────────

export type RetellVoice = {
  voice_id: string;
  voice_name: string;
  provider: string;
  accent?: string;
  gender?: string;
  age?: string;
  avatar_url?: string;
  preview_audio_url?: string;
  trait?: string;
};

export type RetellVoiceResponse = RetellVoice;

export type CloneVoiceDto = {
  voice_name: string;
  files: string[]; // Base64 or URLs
  gender?: "male" | "female";
};

export type SearchVoiceDto = {
  query: string;
  gender?: "male" | "female";
  accent?: string;
};

export type SearchCommunityVoiceDto = {
  query?: string;
  voice_name?: string;
  gender?: "male" | "female";
  accent?: string;
  provider?: string;
};

// ─── Retell LLM Types & DTOs ──────────────────────────────────────────────────

export type RetellLlmResponse = {
  llm_id: string;
  general_prompt?: string;
  begin_message?: string;
  model?: string;
  model_temperature?: number;
  begin_after_user_silence_ms?: number;
  knowledge_base_ids?: string[];
  default_dynamic_variables?: Record<string, string>;
  kb_config?: { top_k?: number; filter_score?: number };
  states?: Array<{ name: string; state_prompt?: string; edges?: unknown[] }>;
  last_modification_timestamp?: number;
  [key: string]: unknown;
};

export type CreateLlmDto = {
  model?: string;
  model_temperature?: number;
  general_prompt?: string;
  begin_message?: string;
  begin_after_user_silence_ms?: number;
  knowledge_base_ids?: string[];
  default_dynamic_variables?: Record<string, string>;
  kb_config?: { top_k?: number; filter_score?: number };
  states?: Array<{ name: string; state_prompt?: string; edges?: unknown[] }>;
};

export type UpdateLlmDto = Partial<CreateLlmDto>;

// ─── Knowledge Base Types & DTOs ──────────────────────────────────────────────

export type RetellKnowledgeBaseResponse = {
  knowledge_base_id: string;
  knowledge_base_name: string;
  status: "indexing" | "complete" | "failed";
  documents?: Array<{ document_id: string; file_name: string; status: string }>;
  created_at?: number;
};

export type CreateKnowledgeBaseDto = {
  knowledge_base_name: string;
  texts?: Array<{ title: string; text: string }>;
  urls?: string[];
  files?: Array<{ name: string; content_type?: string; data?: string }>;
  knowledge_base_texts?: Array<{ title: string; text: string }>;
  knowledge_base_urls?: string[];
  knowledge_base_files?: Array<{ name: string; content_type?: string; data?: string }>;
};

export type AddKnowledgeBaseSourcesDto = {
  texts?: Array<{ title: string; text: string }>;
  urls?: string[];
  files?: Array<{ name: string; content_type?: string; data?: string }>;
  knowledge_base_texts?: Array<{ title: string; text: string }>;
  knowledge_base_urls?: string[];
  knowledge_base_files?: Array<{ name: string; content_type?: string; data?: string }>;
};

export type UpdateKnowledgeBaseDto = {
  knowledge_base_name?: string;
  texts?: Array<{ title: string; text: string }>;
  urls?: string[];
  files?: Array<{ name: string; content_type?: string; data?: string }>;
};

export type AttachKbDto = {
  llm_id: string;
  knowledge_base_id: string;
};

export type SearchKbDto = {
  query: string;
};

// ─── Testing APIs Types & DTOs ────────────────────────────────────────────────

export type RetellTestDefinitionResponse = {
  test_id: string;
  name: string;
  agent_id: string;
  evaluators: Array<{ type: string; prompt: string }>;
  created_at?: number;
};

export type CreateTestDefinitionDto = {
  name: string;
  agent_id: string;
  evaluators?: Array<{ type: string; prompt: string }>;
};

export type RunBatchTestDto = {
  test_ids: string[];
  name?: string;
};

export type BatchTestResultResponse = {
  batch_id: string;
  status: "running" | "completed" | "failed";
  passed_count: number;
  failed_count: number;
  results: Array<{ test_id: string; passed: boolean; details?: string }>;
};

// ─── Analytics & Concurrency Types & DTOs ──────────────────────────────────────

export type AgentAnalytics = {
  agent_id: string;
  agent_name: string;
  retell_agent_id: string;
  total_calls: number;
  completed_calls: number;
  total_duration_seconds: number;
  avg_duration_seconds: number;
  total_cost: number;
  success_rate: number;
};

export type CallLogsOverview = {
  total_calls: number;
  ongoing_calls: number;
  completed_calls: number;
  total_duration_seconds: number;
  total_cost: number;
  per_agent: AgentAnalytics[];
};

export type RetellCallAnalysisResponse = {
  call_id: string;
  user_sentiment?: "Positive" | "Neutral" | "Negative" | "Unknown";
  call_successful?: boolean;
  custom_analysis_data?: Record<string, unknown>;
  transcript_summary?: string;
  in_call_cost?: number;
};

export type RetellConcurrencyStatusResponse = {
  current_concurrency: number;
  concurrency_limit: number;
};

// ─── Audit Trail ──────────────────────────────────────────────────────────────

export type RetellAuditLogEntry = {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  timestamp: string;
};
