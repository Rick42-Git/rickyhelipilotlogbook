
ALTER TABLE public.logbook_entries
  ADD COLUMN latitude double precision DEFAULT NULL,
  ADD COLUMN longitude double precision DEFAULT NULL;
