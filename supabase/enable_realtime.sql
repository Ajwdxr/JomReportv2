-- Enable Realtime for key tables
begin;
  -- Add tables to the publication
  alter publication supabase_realtime add table public.reports;
  alter publication supabase_realtime add table public.updates;
  alter publication supabase_realtime add table public.confirmations;
commit;
