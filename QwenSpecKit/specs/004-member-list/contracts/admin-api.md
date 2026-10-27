# Admin API Contract — Member Directory

**Base**: `https://<project-ref>.supabase.co` (Supabase project, recorded in `member-directory/README.md`, never in this repo with PII). All data endpoints require a valid, **MFA-verified** Supabase session (JWT `mfa_verified=true` + row-level `admins.active` membership). The `anon` API key (public by design) is the only credential in client code; the `service_role` key is **never** used by the browser (Constitution IV).

## Error framing (FR-017 — global)

Every failed request returns the **same shape**, rendered by `admin.js` as a visible, human-readable message (no silent 4xx/5xx, no blocking popups):

```json
{ "error": { "code": "<machine_code>", "message": "<what happened>", "hint": "<what to do next>" } }
```

Codes: `unauthorized` (401, not signed in / session expired), `mfa_required` (401, signed in but no MFA), `forbidden` (403, not an admin / not an owner), `rate_limited` (429), `conflict` (409, e.g., last-owner rule, import already in progress — "another import is running, wait and retry"), `validation` (400, field-level problems), `internal` (500, "something went wrong — try again in a moment; if it persists contact an owner").

## Auth contract (R7)

| Step | Endpoint (method) | Notes |
|---|---|---|
| 1. Start | `POST /auth/v1/token?grant_type=password` (or magic-link: `GET /auth/v1/verify?token=...`) | Returns `access_token`, `refresh_token`, `expires_in`. **Not enough for data access yet.** |
| 2. Enroll/verify MFA | `POST /auth/v1/factors` (enroll, if not done) then `POST /auth/v1/factors/{id}/challenge` + `POST /auth/v1/factors/{id}/verify` with the TOTP code | After `verify`, the refreshed `access_token` carries `mfa_verified=true`. |
| 3. Session | Access token kept **in memory only** (JS variable) — never `localStorage`/`sessionStorage`. A 30-min sliding idle timer clears it; any `401` from a data call re-runs steps 1–2. |
| 4. Sign-out | `POST /auth/v1/logout` + clear in-memory token + clear transient UI state. |

**Audit**: `admin.js` POSTs a row to `audit_log` (`action=signin` on success, `mfa_failed` on wrong TOTP) immediately after each attempt (SC-007).

## Data operations

All via PostgREST (`/rest/v1/<table_or_function>`) and the SQL function layer in `schema.sql` (which is where RLS, rate limiting, monotonicity, and audit all actually live).

### 1. List / search / filter members — `GET /rest/v1/members`

- Query params: `?select=*`, `?search=` (ILike on `full_name`, `email`), `?status=in_group|left`, `?tag=community-host`, `?order=full_name.asc`
- Response: `[ {id, full_name, email, member_status, left_detected_at, first_seen_at, last_attended_at, last_attended_event, last_attended_source, last_attended_as_of, joined_meetup_at, admin_notes, tags, extra, updated_at}, ... ]`
- 200 on success (possibly empty array), 401/403 on auth failure (empty array would be the "even counts" leak — RLS returns `403` at the table level for non-admins; the app maps 403 → "not authorized"). The `select=*` response is the row shape — no server-side count endpoint is exposed (SC-004).
- Performance: ≤ 500 rows paginated via `Range`/`limit/offset` as needed (P1 target: 300ms first render).

### 2. Edit member (notes/tags only — FR-008) — `PATCH /rest/v1/members?id=eq.<uuid>`

- Body: `{ "admin_notes": "...", "tags": ["community-host"] }` only (RLS + SQL function whitelist; the raw PostgREST `PATCH` against `members` is blocked for those columns by the security-definer function layer — the app must call `edit_member(id, notes, tags)` instead)
- Response 200: `{ "id": ..., "admin_notes": "...", "tags": [...] }`
- Audit row: `action=edit_member, entity=member:<uuid>`.
- 400 if an attempt is made to set a *protected* column (`full_name`, `email`, `last_attended_at`, …) via this path (they must come from imports — FR-008).

### 3. Import members / attendees (FR-002a/b, FR-013) — `POST /rest/v1/rpc/import_members` / `import_attendees`

- Body: `{ "p_rows": [ {…row object per csv-formats.md…}, ... ], "p_source": "meetup_export"|"meetup_event", "p_filename": "members-2026-07.csv" }`
- The SQL function does: `pg_advisory_xact_lock` → rate-limit check (429 `rate_limited`) → per-row match/merge (email-first, name-fallback, flag-ambiguous, `GREATEST` last-attended) → writes one `import_runs` row + one `audit_log(action=import)` row → **returns the result table** as `jsonb`:

```json
{
  "run_id": "uuid",
  "counts": { "total": 214, "new": 3, "updated": 41, "flagged": 2, "unchanged": 166, "failed": 2 },
  "rows": [
    { "input_line": 12, "status": "updated", "matched_member_id": "uuid", "detail": "email matched; last_attended advanced" },
    { "input_line": 40, "status": "flagged", "reason": "name 'Alex Rivera' matches 2 existing members with different emails", "candidates": ["uuidA", "uuidB"] },
    { "input_line": 77, "status": "failed", "reason": "missing required field: full_name" }
  ]
}
```

- 200 on success (even if some rows flagged/failed — those are *data* outcomes, not API failures). 429 on rate limit. 409 `conflict` if another import holds the advisory lock.
- Idempotency: re-importing the *same* CSV twice yields `new=0, updated=0, unchanged=N, flagged/failed` unchanged (SC-002 — verified by the quickstart).

### 4. Export (FR-015, SC-006) — `GET /rest/v1/export_members?variant=full|minimal`

- `variant=full`: all columns from `data-model.md` `members` + `extra` keys flattened (open format, human-readable).
- `variant=minimal`: **only** `full_name`, `email` (or a stable `name_hash` when the email is hidden). No `admin_notes`, no `extra` (Story 5 AS3).
- Response: `text/csv` (the SQL function serializes server-side to keep column order and escaping canonical — see `csv-formats.md`). Client downloads it, **does not** persist a copy (FR-007).
- Audit row: `action=export, detail="variant=full, rows=231"`.
- 403 for non-admins (RLS).

### 5. Delete member (FR-016, FR-013 rate limit) — `POST /rest/v1/rpc/delete_member`

- Body: `{ "p_member_id": "uuid", "p_reason": "member-requested-removal" }`
- The SQL function: rate-limit check (10/day/admin, 429) → writes `audit_log(action=delete_member)` (with `p_reason`) **before** the `DELETE` → returns `{ "deleted": true, "audit_id": 1234 }`.
- This is the *only* path that can hard-delete a `members` row (besides `enforce_retention()` — R5).

### 6. Roster (FR-011, Story 2 AS3) — `POST /rest/v1/rpc/change_roster`

- Body (owner-only, 403 otherwise): `{ "p_op": "grant"|"revoke"|"set_owner"|"unset_owner", "p_target_email": "owner@example.com", "p_target_name": "…" }`
- Server invariants: ≥ 1 active owner always; an owner cannot be the last active owner if the op would revoke their owner status or deactivate them → 409 `conflict` with `hint="add another owner first"`.
- Audit row: `action=change_roster`.
- **Effect**: `admins.active=false` is enforced at the **next request** — the RLS policy is evaluated per-request against the live `admins` table, so the removed admin's *next* list/search/import call returns 403 (Story 2 AS3 "immediate removal on next request"). No client-side cache of roster state beyond the token's lifetime.

### 7. Audit log (FR-013/SC-007) — `GET /rest/v1/audit_log?order=at.desc&limit=200`

- Read-only for admins. Response rows per `data-model.md`. `REVOKE UPDATE, DELETE` makes any `PATCH/DELETE` on this table a 403 (verified in quickstart).
- The app renders a simple table (SC-007 "a human can read").

## Global headers & CORS

- `Authorization: Bearer <mfa_verified_access_token>` on every data call.
- CORS is configured in the Supabase project to allow **only** the admin app's origin (the public public-site origin is *not* allowed to call these endpoints — an extra layer above RLS).
- `apikey: <ANON_KEY>` (public by design).

## Non-goals (out of contract)

- No pagination beyond `limit`/`offset` (≤ 500 rows).
- No webhooks, no real-time (Supabase `realtime` disabled on these tables).
- No public read path of any kind — the only "public" surface is the (unchanged) public site.
