-- 1. Modify Notifications Table to support System Notifications (No Report ID)
ALTER TABLE public.notifications ALTER COLUMN report_id DROP NOT NULL;

-- 2. Add 'ban' to notification types
-- Postgres ENUMs can't be updated inside a DO block easily for adding values if they exist, 
-- but we can try adding it.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ban';

-- 3. Create Trigger Function to Handle Ban Side-Effects
CREATE OR REPLACE FUNCTION public.handle_user_ban_logic()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user is being banned (is_banned changed to TRUE)
    IF NEW.is_banned = true AND (OLD.is_banned = false OR OLD.is_banned IS NULL) THEN
        
        -- A. Auto-Hide all reports by this user
        UPDATE public.reports 
        SET is_hidden = true 
        WHERE creator_id = NEW.id;

        -- B. Send "You have been banned" notification
        -- We try to capture the admin who did it via auth.uid(), or null if system
        INSERT INTO public.notifications (user_id, actor_id, type, report_id)
        VALUES (
            NEW.id,        -- Recipient (The banned user)
            auth.uid(),    -- Actor (The Admin)
            'ban',         -- Type
            NULL           -- No specific report linked
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach Trigger to Profiles Table
DROP TRIGGER IF EXISTS on_user_ban ON public.profiles;

CREATE TRIGGER on_user_ban
    AFTER UPDATE OF is_banned ON public.profiles
    FOR EACH ROW
    WHEN (NEW.is_banned = true)
    EXECUTE FUNCTION public.handle_user_ban_logic();
