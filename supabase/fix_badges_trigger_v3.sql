-- Drop old triggers first
DROP TRIGGER IF EXISTS check_badges_on_report_change ON public.reports;
DROP TRIGGER IF EXISTS check_badges_on_update_add ON public.updates;
DROP FUNCTION IF EXISTS public.check_badges();
DROP FUNCTION IF EXISTS public.check_badges_reports();
DROP FUNCTION IF EXISTS public.check_badges_updates();

-- 1. Function for REPORTS
CREATE OR REPLACE FUNCTION public.check_badges_reports() 
RETURNS TRIGGER AS $$
DECLARE
    report_count INT;
    user_badges JSONB[]; 
    resolved_count INT;
BEGIN
    -- Get current badges
    SELECT COALESCE(badges, '{}') INTO user_badges FROM public.profiles WHERE id = NEW.creator_id;

    -- CHECK 1: "First Report" (INSERT)
    IF TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO report_count FROM public.reports WHERE creator_id = NEW.creator_id;
        -- Use Postgres Array containment check with explicit casting
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

-- 2. Function for UPDATES
CREATE OR REPLACE FUNCTION public.check_badges_updates() 
RETURNS TRIGGER AS $$
DECLARE
    update_count INT;
    user_badges JSONB[]; 
BEGIN
    -- Get current badges
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
