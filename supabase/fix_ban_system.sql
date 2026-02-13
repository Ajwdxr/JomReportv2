-- =========================================
-- COMPLETE BAN SYSTEM FIX
-- =========================================

-- 1. Ensure Columns Exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- 2. Allow Admins to Update Profiles (CRITICAL for Banning)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 3. Prepare Notifications for System Alerts
-- Allow report_id to be NULL (for general alerts like "You are banned")
ALTER TABLE public.notifications ALTER COLUMN report_id DROP NOT NULL;

-- Add 'ban' to enum safely
DO $$ BEGIN
    ALTER TYPE "notification_type" ADD VALUE 'ban';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create the "Ban Effect" Function
-- This hides reports automatically when a user is banned.
CREATE OR REPLACE FUNCTION public.handle_user_ban_logic()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run if is_banned changed to TRUE
    IF NEW.is_banned = true THEN
        
        -- Hide all reports by this user
        UPDATE public.reports 
        SET is_hidden = true 
        WHERE creator_id = NEW.id;

        -- Create a notification
        INSERT INTO public.notifications (user_id, actor_id, type, report_id)
        VALUES (
            NEW.id,        -- The banned user
            auth.uid(),    -- The Admin who did it
            'ban',         
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Runs with superuser privs to bypass RLS on reports if needed

-- 5. Attach the Trigger
DROP TRIGGER IF EXISTS on_user_ban ON public.profiles;

CREATE TRIGGER on_user_ban
    AFTER UPDATE OF is_banned ON public.profiles
    FOR EACH ROW
    WHEN (NEW.is_banned = true AND OLD.is_banned IS DISTINCT FROM true)
    EXECUTE FUNCTION public.handle_user_ban_logic();

-- 6. Grant Permissions (Just in case)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.reports TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
