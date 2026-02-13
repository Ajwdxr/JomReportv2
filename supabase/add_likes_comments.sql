-- Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone." ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post comments." ON public.comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own comments." ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create Likes Table
CREATE TABLE IF NOT EXISTS public.likes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, report_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone." ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like reports." ON public.likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can unlike reports." ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
