-- ==========================================
-- 1. FIX TRIGGERS (Prevents crashes on Update)
-- ==========================================

-- Drop ALL potentially broken triggers and functions
DROP TRIGGER IF EXISTS check_badges_on_report_change ON public.reports;
DROP TRIGGER IF EXISTS check_badges_on_update_add ON public.updates;
DROP FUNCTION IF EXISTS public.check_badges();
DROP FUNCTION IF EXISTS public.check_badges_reports();
DROP FUNCTION IF EXISTS public.check_badges_updates();

-- Function for REPORTS (Fixed Array Syntax)
CREATE OR REPLACE FUNCTION public.check_badges_reports() 
RETURNS TRIGGER AS $$
DECLARE
    report_count INT;
    user_badges JSONB[]; 
    resolved_count INT;
BEGIN
    SELECT COALESCE(badges, '{}') INTO user_badges FROM public.profiles WHERE id = NEW.creator_id;

    -- CHECK 1: "First Report" (INSERT)
    IF TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO report_count FROM public.reports WHERE creator_id = NEW.creator_id;
        IF report_count >= 1 AND NOT (user_badges @> ARRAY['"First Report"'::jsonb]) THEN
            UPDATE public.profiles 
            SET badges = array_append(COALESCE(badges, '{}'), '"First Report"'::jsonb) 
            WHERE id = NEW.creator_id;
        END IF;
    END IF;

    -- CHECK 3: "Resolver" (UPDATE status -> closed)
    IF TG_OP = 'UPDATE' AND NEW.status = 'closed' AND OLD.status != 'closed' THEN
         SELECT COUNT(*) INTO resolved_count FROM public.reports WHERE creator_id = NEW.creator_id AND status = 'closed';
         IF resolved_count >= 2 AND NOT (user_badges @> ARRAY['"Resolver"'::jsonb]) THEN
            UPDATE public.profiles 
            SET badges = array_append(COALESCE(badges, '{}'), '"Resolver"'::jsonb) 
            WHERE id = NEW.creator_id;
         END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for UPDATES (Fixed Array Syntax)
CREATE OR REPLACE FUNCTION public.check_badges_updates() 
RETURNS TRIGGER AS $$
DECLARE
    update_count INT;
    user_badges JSONB[]; 
BEGIN
    SELECT COALESCE(badges, '{}') INTO user_badges FROM public.profiles WHERE id = NEW.user_id;

    -- CHECK 2: "Helper" (INSERT)
    IF TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO update_count FROM public.updates WHERE user_id = NEW.user_id;
        IF update_count >= 5 AND NOT (user_badges @> ARRAY['"Helper"'::jsonb]) THEN
            UPDATE public.profiles 
            SET badges = array_append(COALESCE(badges, '{}'), '"Helper"'::jsonb) 
            WHERE id = NEW.user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind triggers
CREATE TRIGGER check_badges_on_report_change
    AFTER INSERT OR UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.check_badges_reports();

CREATE TRIGGER check_badges_on_update_add
    AFTER INSERT ON public.updates
    FOR EACH ROW EXECUTE FUNCTION public.check_badges_updates();


-- ==========================================
-- 2. FIX ADMIN PERMISSIONS (Allows locking/hiding)
-- ==========================================

-- Ensure columns exist
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Enable RLS (Should be already enabled, but just in case)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
DROP POLICY IF EXISTS "Reports are viewable by everyone." ON public.reports;

-- Re-create View Policy (Respect is_hidden)
CREATE POLICY "Reports are viewable by everyone." ON public.reports
    FOR SELECT USING (is_hidden = false OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Re-create Admin Update Policy (Allow Full Update)
CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

