-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define ENUMs
CREATE TYPE report_status AS ENUM ('open', 'acknowledged', 'in_progress', 'closed');
CREATE TYPE report_category AS ENUM ('Roads', 'Lighting', 'Waste', 'Safety', 'Other');

-- Create Profiles Table (Public User Data)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    avatar_url TEXT,
    points INTEGER DEFAULT 0,
    badges JSONB[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create Reports Table
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category report_category NOT NULL,
    photo_url TEXT,
    location JSONB, -- { lat: float, lng: float, address: string }
    status report_status DEFAULT 'open',
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    followers UUID[] DEFAULT '{}' -- Optional: Array of user IDs following this report
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports are viewable by everyone." ON public.reports
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports." ON public.reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creator can update their own reports." ON public.reports
    FOR UPDATE USING (auth.uid() = creator_id);

-- Create Updates/Comments Table
CREATE TABLE public.updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Updates are viewable by everyone." ON public.updates
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post updates." ON public.updates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create Follows Table
CREATE TABLE public.follows (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, report_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone." ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow reports." ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow reports." ON public.follows
    FOR DELETE USING (auth.uid() = user_id);

-- Create Confirmations Table (for closures)
CREATE TABLE public.confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(report_id, user_id)
);

ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Confirmations are viewable by everyone." ON public.confirmations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can confirm resolution." ON public.confirmations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Storage Policies (Assuming 'reports' bucket exists)
-- This block is conditional on bucket existence, usually handled via dashboard or separate setup.
-- We'll include policy assuming bucket 'reports' is created.
-- insert into storage.buckets (id, name, public) values ('reports', 'reports', true);

-- Simple policy for storage
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'reports' );
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'reports' AND auth.role() = 'authenticated' );

-- Functions for Gamification

-- Function to award points
CREATE OR REPLACE FUNCTION public.award_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET points = points + points_to_add
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: +10 points for creating a report
CREATE OR REPLACE FUNCTION public.handle_new_report_points()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.award_points(new.creator_id, 10);
    
    -- Auto-follow own report
    INSERT INTO public.follows (user_id, report_id) VALUES (new.creator_id, new.id);

    -- Check for "First Report" Badge logic (simplified implementation: check usage)
    -- This is complex to do purely in SQL trigger efficiently for badges array, 
    -- but we can check if points = 10 (first time) or count reports.
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_report_created
    AFTER INSERT ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_report_points();

-- Function: +5 points for updates/comments
CREATE OR REPLACE FUNCTION public.handle_new_update_points()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.award_points(new.user_id, 5);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_update_created
    AFTER INSERT ON public.updates
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_update_points();

-- Function: Handle Confirmations and Report Closure
CREATE OR REPLACE FUNCTION public.handle_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    confirmation_count INTEGER;
    report_creator UUID;
BEGIN
    -- Count confirmations for this report
    SELECT COUNT(*) INTO confirmation_count FROM public.confirmations WHERE report_id = new.report_id;

    -- If 3 confirmations, close report and award points
    IF confirmation_count >= 3 THEN
        UPDATE public.reports SET status = 'closed' WHERE id = new.report_id RETURNING creator_id INTO report_creator;
        
        -- Award +20 points to creator
        IF report_creator IS NOT NULL THEN
            PERFORM public.award_points(report_creator, 20);
        END IF;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_confirmation_added
    AFTER INSERT ON public.confirmations
    FOR EACH ROW EXECUTE FUNCTION public.handle_confirmation();
