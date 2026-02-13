-- Create Flags Table
CREATE TABLE IF NOT EXISTS public.flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, report_id) -- Prevent duplicate flags from same user
);

-- Enable RLS
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view flags" ON public.flags
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Authenticated users can create flags" ON public.flags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to Auto-Hide report if flagged 5+ times
CREATE OR REPLACE FUNCTION public.check_flag_threshold()
RETURNS TRIGGER AS $$
DECLARE
    flag_count INT;
BEGIN
    SELECT COUNT(*) INTO flag_count FROM public.flags WHERE report_id = NEW.report_id;
    
    -- Threshold: 5 flags
    IF flag_count >= 5 THEN
        UPDATE public.reports SET is_hidden = true WHERE id = NEW.report_id;
        
        -- Optional: Notify Admins? (Out of scope for now)
    END IF;
    return NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_flag_created
    AFTER INSERT ON public.flags
    FOR EACH ROW EXECUTE FUNCTION public.check_flag_threshold();

-- Grant permissions
GRANT ALL ON public.flags TO authenticated;
