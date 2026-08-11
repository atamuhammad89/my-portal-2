-- Create hot_leads table to store prospective client leads from the live demo playground
CREATE TABLE IF NOT EXISTS public.hot_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    industry TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hot_leads ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon and authenticated users
CREATE POLICY "Allow public insert to hot_leads" ON public.hot_leads
    FOR INSERT WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access on hot_leads" ON public.hot_leads
    FOR ALL USING (true);
