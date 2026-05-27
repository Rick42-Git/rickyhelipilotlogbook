## Goal

Eliminate the spoofable `x-user-id` header attack on `logbook_entries`, `flight_plans`, `column_templates`, `ai_usage`, and `credit_requests` by routing every read/write through edge functions that verify the access code server-side and use the service role to talk to the DB. Also harden `user_roles`.

## Architecture change

Today: client sets `x-user-id` header → PostgREST passes it to RLS → RLS trusts it.
After: client sends `{ accessCode, ...payload }` to an edge function → function verifies the code against `access_codes`, derives the real `user_id`, then uses service role to query/mutate.

### Token caching (avoid hitting DB per request)
- On activation, mint a short-lived signed token (HMAC of `user_id|expiry` with `ACCESS_TOKEN_SECRET`).
- Store token in `localStorage` alongside the existing activated user.
- Each edge function verifies the HMAC instead of re-reading `access_codes`. Re-issue on expiry.

## New edge functions

1. `logbook-data` — actions: `list` (paged), `insert` (single + bulk), `update`, `delete`, `bulk_delete`.
2. `flight-plans-data` — actions: `list`, `upsert`, `delete`.
3. `column-templates-data` — actions: `list`, `upsert`, `delete`.
4. `ai-usage-data` — actions: `count`, `record` (called from existing `extract-logbook` server-side, no client path needed).
5. `credit-requests-data` — actions: `list_own`, `create`.

All functions:
- `verify_jwt = false` in config.
- Validate the access token first; reject otherwise.
- Use `SUPABASE_SERVICE_ROLE_KEY` for DB access.
- Zod-validate payloads.

### Issue-token function
6. `issue-access-token` — input: `accessCode`; output: signed token + user profile. Called from `verify-access-code` (or merged into it).

## Client changes

- `src/lib/activation.ts` — store + read the access token.
- `src/lib/supabaseHeaders.ts` — remove `x-user-id` injection (no longer needed).
- `src/hooks/useAuth.tsx` — drop `setSupabaseUserId`, persist token from activation.
- `src/hooks/useLogbook.ts` — replace every `supabase.from('logbook_entries')` call with `supabase.functions.invoke('logbook-data', ...)`. Keep the same return shape so UI code is unchanged. Offline queue continues to work; flush calls the edge function instead of the table.
- `src/hooks/useFlightPlans.ts` — same swap for `flight_plans`.
- `src/hooks/useColumnTemplates.ts` — same swap for `column_templates`.
- `src/components/PhotoUpload.tsx` — replace direct `ai_usage` count with `ai-usage-data` call.
- `src/components/CreditRequestDialog.tsx` + admin views — replace direct `credit_requests` access with `credit-requests-data`.
- Any other component reading from the 5 tables (will sweep with ripgrep before implementation).

## Database migration

Lock down all 5 tables — remove permissive `(true)` policies, drop `anon`/`authenticated` grants. Only `service_role` keeps access.

```text
For each of: logbook_entries, flight_plans, column_templates, ai_usage, credit_requests
  DROP POLICY (existing permissive ones)
  REVOKE ALL FROM anon, authenticated
  GRANT ALL TO service_role
  (RLS stays enabled as defense in depth — no policy = no row visible to anon/authenticated)
```

Harden `user_roles`:
```text
REVOKE ALL FROM anon, authenticated
GRANT SELECT, ALL TO service_role only
(Existing admin-only SELECT policy kept as defense in depth)
```

## Findings to ignore (not applicable)

- **Leaked Password Protection** — app has no Supabase Auth password flow; access codes are admin-issued. Ignore.
- **Extension in Public** (pg_trgm) — harmless, default Supabase placement. Ignore.

## Out of scope

- Migrating to real Supabase Auth (offered as alt; user declined).
- Rate limiting on new functions (can add later).

## Risks

- Offline mode: edge functions need network. Existing offline queue replays on reconnect — will keep that intact, mutations just call the function instead of the table when flushing.
- Performance: one extra hop per query. Mitigated by token-caching (no DB lookup per call) and keeping pagination/range params identical.
- Large blast radius: I'll do tables one at a time (logbook_entries first, verify end-to-end, then the others) to keep regressions contained.

## Implementation order

1. Add `ACCESS_TOKEN_SECRET`, update `verify-access-code` to issue tokens, update client to store/send them.
2. Build + cut over `logbook-data`, verify CRUD + offline + import flows.
3. Repeat for `flight_plans`, `column_templates`, `ai_usage`, `credit_requests`.
4. Migration: drop policies + grants on all 5 tables and harden `user_roles`.
5. Mark findings fixed / ignored, update security memory.
