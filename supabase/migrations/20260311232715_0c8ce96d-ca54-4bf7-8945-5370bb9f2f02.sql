-- Drop the foreign key constraint that references auth.users (this is the root cause)
ALTER TABLE public.logbook_entries DROP CONSTRAINT IF EXISTS logbook_entries_user_id_fkey;

-- Migrate any old data from previous user_id to current ADMIN001 user_id
UPDATE public.logbook_entries 
SET user_id = '4529d58c-7449-4f2d-9fd0-d0583af2b50b'
WHERE user_id = '6d89a5de-00ae-444d-9a7f-d4a54abf0931';