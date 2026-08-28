-- Migration: Create concise hot_leads_callresults table for storing call results
CREATE TABLE IF NOT EXISTS public.hot_leads_callresults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.hot_leads(id) ON DELETE CASCADE, -- Foreign Key linking to hot_leads.id
    
    -- Call Identification & Core Results
    call_id TEXT UNIQUE,
    call_summary TEXT,
    transcript TEXT,
    call_successful BOOLEAN DEFAULT FALSE,
    in_voicemail BOOLEAN DEFAULT FALSE,
    user_sentiment TEXT,       -- 'Neutral', 'Positive', 'Negative'
    outcome TEXT,              -- From custom_analysis_data: 'GENERAL_INFO', 'BOOKED_MEETING', etc.

    -- Timing & Tracking
    start_timestamp TIMESTAMPTZ,
    end_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_hot_leads_callresults_customer_id ON public.hot_leads_callresults(customer_id);
CREATE INDEX IF NOT EXISTS idx_hot_leads_callresults_call_id ON public.hot_leads_callresults(call_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hot_leads_callresults ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Allow public insert to hot_leads_callresults" ON public.hot_leads_callresults
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role full access on hot_leads_callresults" ON public.hot_leads_callresults
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated read on hot_leads_callresults" ON public.hot_leads_callresults
    FOR SELECT USING (true);
