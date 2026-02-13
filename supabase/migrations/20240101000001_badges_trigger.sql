-- Function to check and award badges
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
    -- Triggered on Report Insert
    IF TG_TABLE_NAME = 'reports' AND TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO report_count FROM public.reports WHERE creator_id = target_user_id;
        IF report_count >= 1 AND NOT (user_badges @> '["First Report"]') THEN
            UPDATE public.profiles 
            SET badges = array_append(COALESCE(badges, '{}'), '"First Report"') 
            WHERE id = target_user_id;
        END IF;
    END IF;

    -- CHECK 2: "Helper" (5+ updates/comments)
    -- Triggered on Update Insert
    IF TG_TABLE_NAME = 'updates' AND TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO update_count FROM public.updates WHERE user_id = target_user_id;
        IF update_count >= 5 AND NOT (user_badges @> '["Helper"]') THEN
            UPDATE public.profiles 
            SET badges = array_append(COALESCE(badges, '{}'), '"Helper"') 
            WHERE id = target_user_id;
        END IF;
    END IF;

    -- CHECK 3: "Resolver" (2+ confirmed resolutions)
    -- Triggered on Report Update (status -> closed) - handled in handle_confirmation trigger?
    -- Actually handle_confirmation updates status to 'closed'. That trigger runs on 'confirmations' insert.
    -- But we need to award badge to the Creator of the report *when* it is resolved? Or when *they* resolve issues?
    -- Assuming "Resolver" badge is for users who have authored reports that got resolved.
    -- We can check this in a separate trigger on reports update or handle_confirmation.
    
    -- Let's add a check here if table is reports and status changed to closed.
    IF TG_TABLE_NAME = 'reports' AND TG_OP = 'UPDATE' AND NEW.status = 'closed' AND OLD.status != 'closed' THEN
         SELECT COUNT(*) INTO resolved_count FROM public.reports WHERE creator_id = target_user_id AND status = 'closed';
         IF resolved_count >= 2 AND NOT (user_badges @> '["Resolver"]') THEN
            UPDATE public.profiles 
            SET badges = array_append(COALESCE(badges, '{}'), '"Resolver"') 
            WHERE id = target_user_id;
         END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind triggers
CREATE TRIGGER check_badges_on_report_change
    AFTER INSERT OR UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.check_badges();

CREATE TRIGGER check_badges_on_update_add
    AFTER INSERT ON public.updates
    FOR EACH ROW EXECUTE FUNCTION public.check_badges();
