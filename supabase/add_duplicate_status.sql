-- Add 'duplicate' to report_status enum
DO $$ BEGIN
    ALTER TYPE report_status ADD VALUE 'duplicate';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
