-- Create Notification Type Enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('like', 'comment', 'status_change');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Recipient
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Who triggered it
    type notification_type NOT NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_read BOOLEAN DEFAULT false
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Functions & Triggers

-- 1. Notify on Like
CREATE OR REPLACE FUNCTION public.handle_new_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    report_owner UUID;
BEGIN
    SELECT creator_id INTO report_owner FROM public.reports WHERE id = new.report_id;
    
    -- Don't notify if liking own report
    IF report_owner IS NOT NULL AND report_owner != new.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, report_id)
        VALUES (report_owner, new.user_id, 'like', new.report_id);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_created_notify ON public.likes;
CREATE TRIGGER on_like_created_notify
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_like_notification();

-- 2. Notify on Comment (Update)
CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    report_owner UUID;
BEGIN
    SELECT creator_id INTO report_owner FROM public.reports WHERE id = new.report_id;
    
    -- Don't notify if commenting on own report
    IF report_owner IS NOT NULL AND report_owner != new.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, report_id)
        VALUES (report_owner, new.user_id, 'comment', new.report_id);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created_notify ON public.updates;
CREATE TRIGGER on_comment_created_notify
    AFTER INSERT ON public.updates
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment_notification();
