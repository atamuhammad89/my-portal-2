-- Retell AI Module Expansion Database Migration
-- Timestamp: 2026-07-28

-- 1. Retell Phone Numbers Table
CREATE TABLE IF NOT EXISTS public.retell_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  nickname TEXT,
  area_code INT,
  inbound_agent_id TEXT,
  outbound_agent_id TEXT,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retell_phone_numbers_phone ON public.retell_phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_retell_phone_numbers_inbound ON public.retell_phone_numbers(inbound_agent_id);
CREATE INDEX IF NOT EXISTS idx_retell_phone_numbers_outbound ON public.retell_phone_numbers(outbound_agent_id);

-- 2. Retell LLMs Metadata Table
CREATE TABLE IF NOT EXISTS public.retell_llms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retell_llm_id TEXT NOT NULL UNIQUE,
  model TEXT DEFAULT 'gpt-4o',
  general_prompt TEXT,
  begin_message TEXT,
  knowledge_base_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retell_llms_retell_id ON public.retell_llms(retell_llm_id);

-- 3. Retell Knowledge Bases Table
CREATE TABLE IF NOT EXISTS public.retell_knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id TEXT NOT NULL UNIQUE,
  knowledge_base_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'indexing',
  document_count INT DEFAULT 0,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retell_kb_id ON public.retell_knowledge_bases(knowledge_base_id);

-- 4. Retell Voice Cache Table
CREATE TABLE IF NOT EXISTS public.retell_voice_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_id TEXT NOT NULL UNIQUE,
  voice_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  gender TEXT,
  accent TEXT,
  preview_audio_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retell_voice_id ON public.retell_voice_cache(voice_id);

-- 5. Retell Batch Calls Table
CREATE TABLE IF NOT EXISTS public.retell_batch_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE,
  name TEXT,
  from_number TEXT NOT NULL,
  total_tasks INT NOT NULL DEFAULT 0,
  completed_tasks INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retell_batch_id ON public.retell_batch_calls(batch_id);

-- 6. Retell Test Definitions Table
CREATE TABLE IF NOT EXISTS public.retell_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  evaluators JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retell_test_id ON public.retell_tests(test_id);

-- 7. Retell Detailed Call Analysis Table
CREATE TABLE IF NOT EXISTS public.retell_call_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retell_call_id TEXT NOT NULL UNIQUE,
  user_sentiment TEXT,
  call_successful BOOLEAN,
  transcript_summary TEXT,
  in_call_cost NUMERIC(10, 4),
  custom_analysis_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retell_analysis_call_id ON public.retell_call_analysis(retell_call_id);

-- 8. Retell Audit Trail Logs Table
CREATE TABLE IF NOT EXISTS public.retell_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retell_audit_user ON public.retell_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_retell_audit_action ON public.retell_audit_logs(action);
