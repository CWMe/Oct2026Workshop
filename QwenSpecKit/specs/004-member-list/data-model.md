# Data Model: Member Directory (Admin-Only)

**Feature**: 004-member-list | **Date**: 2026-07-17
All PII lives in the Supabase Postgres project — **never in this repository** (FR-007). DDL lives in `member-directory/schema.sql`.

## Entity: `members`

| Field | Type | Null | Constraints | Source requirement |
|---|---|---|---|---|
| `id` | `uuid` (PK) | no | `gen_random_uuid()` | — |
| `full_name` | `text` | no | `NOT NULL`, trim | FR-001/FR-005 |
| `email` | `text` | **yes** | `UNIQUE` when non-null (partial unique index) — hidden emails stay NULL, never guessed | FR-001 (email if visible) / Story 1 AS4 |
| `member_status` | `text` | no | `CHECK IN ('in_group','left')`, default `in_group` | FR-009 / Story 4 |
| `left_detected_at` | `timestamptz` | yes | set only when `member_status='left'` | FR-009 (detection date) |
| `first_seen_at` | `timestamptz` | no | default `now()`; never overwritten on re-import | edge case "re-import same data twice" (no phantom updates) |
| `last_attended_at` | `timestamptz` | yes | **monotonic**: updated only if `> existing` (`GREATEST`) | FR-004, Story 1 AS4 |
| `last_attended_event` | `text` | yes | set together with `last_attended_at` | FR-004 context |
| `last_attended_source` | `text` | yes | `CHECK IN ('meetup_export','meetup_event','meetup_profile')` | FR-004 |
| `last_attended_as_of` | `timestamptz` | yes | the "as of" point in time of the imported row | FR-004 |
| `joined_meetup_at` | `timestamptz` | yes | from member export (when present) | FR-001/SC-001 |
| `extra` | `jsonb` | yes | any **unknown** source columns, verbatim | FR-003 (no silent drops) |
| `admin_notes` | `text` | yes | **write-protected from imports** (FR-008) | FR-008 |
| `tags` | `text[]` | no | default `{}`, import-invariant (FR-008) | FR-008 |
| `updated_at` | `timestamptz` | no | `DEFAULT now()`, trigger-maintained | edge case "two admins edit same member" — last-write-wins, but the audit log preserves both (see `audit_log`) |

**State transitions (`member_status`)**

```
                 import: present in list
        +--------------------+--------------------+
        |                    v                    |
   created ──────────>  in_group  ───────────> (in_group, no-op)
  (new/import)          (default)   import: missing from list
                                  ────────────────>  left  (left_detected_at = now)
                                                       |   import: present again
               in_group ◄───────────────────────────────┘
                                                       | 12 months elapsed (enforce_retention,
                                                       | invoked at import AND weekly cron)
                                                       v
                                                  DELETED  (audit_log row, actor='system')
```

- `left → in_group`: re-appearing in a later import clears `left_detected_at`.
- Deletion only via `enforce_retention()` or manual `delete_member()` — never `DELETE ... WHERE` from the app (RLS blocks direct DML on `members` deletion for anon; deletion goes through the audited SQL functions which log first, delete second).

## Entity: `import_runs`

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `at` | `timestamptz` | import start time |
| `actor` | `text` | admin id (email) or `system` |
| `source` | `text` | `member_export` \| `event_attendees` |
| `filename` | `text` | original filename (metadata, never the content — FR-007) |
| `rows_total` | `int` | parsed rows |
| `rows_new` / `rows_updated` / `rows_flagged` / `rows_unchanged` / `rows_failed` | `int` | map 1:1 to the result-table buckets (FR-002b) |
| `outcome` | `text` | `success` \| `partial` \| `failed` (= `failed` when the transaction rolled back) |
| `note` | `text` | e.g., "another import in progress" |

**Rate limit (FR-013, server-side)**: `import_members`/`import_attendees` reject with `429` if the actor already has `4` `import_runs` rows in `at > now() - interval '1 hour'`.

## Entity: `audit_log` (FR-013, SC-007 — FR-013 list is authoritative)

**One row per audited event. Append-only**: `REVOKE UPDATE, DELETE FROM public.audit_log;` (no role can mutate; the retention job and app run as `anon`/`service_role` but `service_role` is dashboard-only — all *logged actions* are triggered from `anon`-role functions where the `REVOKE` still applies via the function's own role separation).

| Field | Type | Notes |
|---|---|---|
| `id` | `bigint` (identity, PK) | |
| `at` | `timestamptz` | |
| `actor` | `text` | admin email or `system` (retention job) |
| `action` | `text` | `CHECK IN ('signin','mfa_failed','import','export','edit_member','change_roster','delete_member','retention_purge','rate_limited')` |
| `entity` | `text` | e.g., `member`, `member:uuid`, `roster`, `directory` |
| `detail` | `text` | human-readable summary (e.g., "export: 231 rows, full") — **no full PII dumps**, just identifiers |
| `ip` | `inet` | best-effort from the request (Supabase proxies; not guaranteed) |

## Entity: `admins` (FR-011 roster, Story 2 AS3)

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `email` | `text` | matches the Supabase Auth account (case-insensitive unique); **PII-minimal**: email + name only |
| `full_name` | `text` | |
| `is_owner` | `boolean` | ≥ 1 active owner invariant (see below) |
| `active` | `boolean` | removal = `active=false` (soft, auditable, reversible without losing history) |
| `granted_by` | `text` | owner who granted |
| `granted_at` / `revoked_at` | `timestamptz` | |

**Rules (RLS + SQL functions, server-side)**:
- Read (admin list) only for admins (any RLS-recognized `mfa_verified` user whose email is in `admins.active`).
- **Mutation only for owners**.
- `change_roster()` enforces: *the owner granting cannot be the last remaining active owner who would end up with zero owners*, and *an owner cannot demote themselves if they are the last owner* (Story 2 AS3). The function raises a clear 4xx otherwise (FR-017 framing).
- Every roster change → `audit_log` (`change_roster`).

## Entity: `admin_sessions` (rate/audit support — optional, see `import_runs` + `audit_log`)

*Not a separate table* — inactivity (30-min, R7) is enforced in `auth.js` client-side + via Supabase session refresh; **MFA sign-in** and **MFA failure** events are written to `audit_log` (`signin`/`mfa_failed`) — SC-007's "sign-ins visible in the log" is satisfied by `audit_log`.

## Relationships

```
members 1 ─── N audit_log          (entity = 'member:' || members.id)
admins  1 ─── N audit_log          (actor / granted_by)
import_runs 1 ─── N audit_log      (import_runs is itself the import audit detail; a
                                   single audit_log row per import references import_runs.id)
```

No FK from `members`/`admins` to each other deliberately (platform-independence: removing directory access from a Meetup org must not delete member rows — FR-011 + SC-004).

## Validation / invariants (all server-side)

1. `email` UNIQUE where non-null (partial index `members_email_uniq ON members(email) WHERE email IS NOT NULL`).
2. Exactly one owner minimum among `admins WHERE active` — enforced in `change_roster()`.
3. `last_attended_at` monotonic — enforced in `import_members/attendees` (`GREATEST`).
4. `admin_notes` and `tags` unchanged by imports — the import SQL function simply does not write those columns.
5. `audit_log` immutable — `REVOKE UPDATE, DELETE`.
6. Import ≤ 4/hour/admin — enforced in the import functions (429 otherwise).
7. Retention: `left` + 12 months ⇒ deleted by `enforce_retention()` (import path + weekly cron).
8. All data endpoints: RLS `USING (auth.jwt()->'user_metadata'->>'admin_email' = (SELECT email FROM admins WHERE active LIMIT 1))`-style policy (exact claim path confirmed against the Supabase project during implementation; the *requirement* is `mfa_verified='true'` + membership in `admins.active`).

## Reference SQL (illustrative, not PII)

```sql
-- Monotonic last-attended upsert (R4/R3)
UPDATE members m
   SET last_attended_at  = GREATEST(m.last_attended_at, r.last_attended_at),
       last_attended_event = r.last_attended_event,
       last_attended_source = r.last_attended_source,
       last_attended_as_of = r.last_attended_as_of,
       updated_at = now()
  FROM jsonb_to_recordset(p_rows) AS r(id uuid, last_attended_at timestamptz, last_attended_event text, last_attended_source text, last_attended_as_of timestamptz)
 WHERE m.id = r.id AND r.last_attended_at IS NOT NULL AND (m.last_attended_at IS NULL OR r.last_attended_at > m.last_attended_at);
```
