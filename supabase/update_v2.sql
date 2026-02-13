-- 1. Flags System (Anti-Spam)
CREATE TABLE IF NOT EXISTS public.flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, report_id)
);

ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create flags" ON public.flags;
CREATE POLICY "Authenticated users can create flags" ON public.flags 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can view flags" ON public.flags;
CREATE POLICY "Admins can view flags" ON public.flags
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- 2. Duplicate Status (Report Handling)
DO $$ BEGIN
    ALTER TYPE report_status ADD VALUE 'duplicate';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
