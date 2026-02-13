-- Fix the check_badges function to correctly handle JSONB[] array types
CREATE OR REPLACE FUNCTION public.check_badges() 
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    report_count INT;
    update_count INT;
    resolved_count INT;
    user_badges JSONB[]; -- Using JSONB array for flexibility
BEGIN
    -- Determine user_id based on table
    IF TG_TABLE_NAME = 'reports' THEN
        target_user_id := NEW.creator_id;
    ELSIF TG_TABLE_NAME = 'updates' THEN
        target_user_id := NEW.user_id;
    END IF;

    IF target_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current badges (handle null)
    SELECT COALESCE(badges, '{}') INTO user_badges FROM public.profiles WHERE id = target_user_id;

    -- CHECK 1: "First Report"
    IF TG_TABLE_NAME = 'reports' AND TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO report_count FROM public.reports WHERE creator_id = target_user_id;
        
        -- Check if badge exists using ANY()
        -- Note: we use to_jsonb to ensure correct format
        IF report_count >= 1 AND NOT (to_jsonb('First Report'::text) = ANY(user_badges)) THEN
            UPDATE public.profiles 
            SET badges = array_append(COALESCE(badges, '{}'), to_jsonb('First Report'::text)) 
            WHERE id = target_user_id;
        END IF;
    END IF;

    -- CHECK 2: "Helper" (5+ updates/comments)
    IF TG_TABLE_NAME = 'updates' AND TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO update_count FROM public.updates WHERE user_id = target_user_id;
        
        IF update_count >= 5 AND NOT (to_jsonb('Helper'::text) = ANY(user_badges)) THEN
            UPDATE public.profiles 
            SET badges = array_append(COALESCE(badges, '{}'), to_jsonb('Helper'::text)) 
            WHERE id = target_user_id;
        END IF;
    END IF;

    -- CHECK 3: "Resolver"
    IF TG_TABLE_NAME = 'reports' AND TG_OP = 'UPDATE' AND NEW.status = 'closed' AND OLD.status != 'closed' THEN
         SELECT COUNT(*) INTO resolved_count FROM public.reports WHERE creator_id = target_user_id AND status = 'closed';
         
         IF resolved_count >= 2 AND NOT (to_jsonb('Resolver'::text) = ANY(user_badges)) THEN
            UPDATE public.profiles 
            SET badges = array_append(COALESCE(badges, '{}'), to_jsonb('Resolver'::text)) 
            WHERE id = target_user_id;
         END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
