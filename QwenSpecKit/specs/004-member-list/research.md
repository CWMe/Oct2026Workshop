# Research: Member Directory (Admin-Only)

**Feature**: 004-member-list | **Date**: 2026-07-17

All `NEEDS CLARIFICATION` items were resolved during `/speckit.clarify` (Session 2026-07-17): retention (12 months then automatic audit-logged deletion), admin roster (owner-maintained named list, Meetup role irrelevant), member notice (group description + site privacy page). Remaining unknowns are the deferred planning decisions listed in `requirements.md` Notes; each is resolved below.

---

### R1 — Hosting & overall stack

**Decision**: Static admin app (plain HTML/CSS/JS, **zero JS dependencies, zero build step**) at `member-directory/` + **Supabase free-tier Postgres project** as the data/auth service (PostgREST + Supabase Auth). Deploy the admin app to GitHub Pages (its own site or sub-path) — free.

**Rationale**: Satisfies simultaneously: free (Constitution I), no build/framework/client dependencies (Constitution II/III), PII never in repo (FR-007), MFA without building auth (FR-012), durable cross-session storage (FR-015 "across sessions"), open CSV I/O (FR-015). Client talks to stable, versioned REST endpoints using plain `fetch`.

**Alternatives considered**:
- *Pure static + localStorage/sidecar files*: fails FR-007/FR-010 (PII on browsers, no auth) — rejected.
- *Self-hosted Node/Python + SQLite on a VPS/Render free tier*: paid-or-ephemeral hosting, manual auth/MFA work, violates Constitution I/II more than Supabase — rejected.
- *SaaS member tools (Airtable/Monday)*: no MFA-for-admins guarantee, export friction, vendor lock-in against the platform-independence goal — rejected.
- *Firebase*: weaker admin-data privacy model and RLS for PII — rejected.

**Notes to remember**: Supabase free-tier limits (500 MB DB, 2 GB bandwidth, 1 GB file storage) are far above the ~200-member scale; free-tier projects pause after extended inactivity — the ops runbook (`member-directory/README.md`) records a monthly open-the-page habit/ping to keep the project live. Operational evidence (region, plan tier, project ref) lives in the runbook, never with PII.

---

### R2 — Auth model & MFA

**Decision**: Supabase Auth (email + password or email magic link), with **TOTP MFA mandatory and enforced**: the app only calls data endpoints when the session's JWT carries `mfa_verified = 'true'`; **Row-Level Security (RLS)** policies on every table require that claim. Sign-ins (incl. MFA challenges) are audit-logged (SC-007, FR-013).

**Rationale**: Native, free, no code to maintain; RLS makes "no admin → no data, *not even counts*" (FR-010) enforceable at the database, not the UI; TOTP is the de-facto MFA standard (FR-012).

**Alternatives considered**:
- *Client-gate only ("hide UI unless signed in")*: insecure — any user can call the API; rejected (fails SC-004).
- *OAuth via Google/Keycloak*: requires external IdP account management and (Keycloak) paid hosting; overkill for 3–10 admins; rejected.
- *API keys per admin*: no MFA, no audit identity, key sprawl; rejected.

**Roster mapping**: `admins` table seeded by the community owner; `is_owner` flag; **owner changes only** allowed when the caller is an owner; an owner may not demote/delete the last remaining active owner (Story 2 AS3, FR-011). RLS: admin rows visible only to admins; roster mutation only to owners.

---

### R3 — Storage, audit, and server-side rate limits

**Decision**: Postgres with tables `members`, `member_tags`, `import_runs`, `audit_log`, `admins` (see `data-model.md`).
- **Audit log**: `audit_log` — `UPDATE`/`DELETE` privileges revoked from every non-privileged role (read-only append via trigger). Rows: sign-ins, MFA failures, imports, roster changes, edits, exports, deletions, retention purges (actor `system`) — FR-013, SC-007.
- **Rate limits (server-side, FR-013/FR-016)**: Postgres functions track per-admin `import_runs` count in a rolling window (max 4/hour) and deletion requests in the trailing 24 h (max 10/day); exceeding → HTTP 429 with a clear message (framed per FR-017). Implemented as a check inside the import/delete SQL functions, not client-side.
- **Last-attended monotonicity (FR-004, Story 1 AS4)**: `last_attended_at = GREATEST(existing, incoming)` in the merge SQL function; an older export can never move it backward.
- **Concurrent imports (edge case)**: `pg_advisory_xact_lock(hashtext('member-import'))` inside the import transaction serializes concurrent imports; a loser fast-fails with a clear "another import is running" message.
- **Admin field protection (FR-008)**: the import merge function never touches `admin_notes`/tags; separate `admins` table keeps roles independent.

**Rationale**: Postgres transactions + RLS + revoked privileges give every non-negotiable (auditability, rate limits, monotonicity, concurrency) a *server-side* guarantee at a scale where a single managed DB is the simplest correct tool.

**Alternatives considered**:
- *Application-layer rate limits / in-UI timeouts*: trivially bypassed; rejected.
- *Separate audit log SaaS*: adds cost and a third system; rejected.

---

### R4 — Import parsing & identity matching

**Decision**: Client parses the two CSV shapes (member export, event attendee export — columns defined in `contracts/csv-formats.md`) with a small vendored-free parser (~200 lines of plain JS handling quotes, CRLF, UTF-8 BOM — Meetup CSVs are UTF-8). Batches are sent to one Postgres SQL function `import_members(rows jsonb)` / `import_attendees(rows jsonb)` which performs identity matching:

1. **Email-first**: if the row's email is non-empty and matches an existing member's `email`, that member is the target.
2. **Name fallback**: normalized full name (lowercase, trim, collapse whitespace, strip leading/f trailing honorifics like "Mr./Ms.") compared to existing members' `full_name`.
3. **Ambiguity flag**: a name-only row that matches ≥ 2 existing different emails, or an email that matches none but the name matches another member, is **not merged** — returned in the "flagged" bucket for admin review (Story 1 AS4, FR-005). The result table (FR-002b) always shows: per-row status `new|updated|unchanged|flagged|failed`, mapped fields, and the matched identity.
4. **Unknown columns**: parsed and carried in the row payload, **stored in `members.extra jsonb`**, and surfaced in the result table (FR-003) — the import must never drop a source column.

**Rationale**: Deterministic, reversible (imports upsert on natural keys — no destructive deletes from imports), and the "flag, don't guess" rule is the cheapest way to hit SC-001 (100% field fidelity, zero silent drops).

**Alternatives considered**:
- *Server-side CSV parsing (Postgres `COPY`/`pg_read_csv`)*: requires file upload into a bucket (adds a storage boundary and attack surface) — client parsing is simpler at this scale; rejected.
- *Fuzzy matching (Levenshtein)*: non-deterministic merges are worse than flagged rows; rejected.

---

### R5 — 12-month retention & automatic deletion

**Decision**: `members.status` (`in_group` | `left`) + `left_detected_at`. A Postgres function `enforce_retention(now)`:
- flags members present in DB but **absent from the import's provided list** as `left` with `left_detected_at` (Story 4 AS1);
- **automatically deletes** members where `status='left' AND left_detected_at < now() - interval '12 months'` (clarified FR-009), inserting an `audit_log` row with `actor='system'` before each deletion (Story 4, FR-013).

Invocation: (a) inside every `import_members` transaction, and (b) via a small **weekly Supabase Edge Function cron** (free, no infra) so deletion still happens if admins go quiet for weeks. Manual deletion (FR-016) uses the same audited path but with the admin's identity as actor.

**Rationale**: "Automatic" must mean "automatic even when nobody is online" — the cron job is the minimal machine that guarantees that while the in-import check keeps the common path transactional.

**Alternatives considered**:
- *Delete only at next import*: violates "retained for a fixed 12-month period… deleted automatically" if no imports happen; rejected.
- *External cron (GitHub Actions)*: puts a privileged secret in the repo (Constitution IV) and adds infra; Supabase Edge Functions keep it inside the data platform; rejected.

---

### R6 — Export format & PII minimization in export

**Decision**: CSV (open, widely readable — FR-015) generated **client-side** from a `members_view` query (fetch → serialize). Canonical columns fixed in `contracts/csv-formats.md`: `member_id, full_name, email (if visible), member_status, left_detected_at, first_seen_at, last_attended_at, last_attended_event?, last_attended_source, last_attended_as_of, admin_notes, tags`. `email` is included in **full** exports only; the "minimal" re-add-prevention export variant (Story 5 AS3) ships `full_name + email-or-normalized-name-hash` only — never notes. Every export writes an `audit_log` row (FR-013).

**Rationale**: CSV is the only format guaranteed "open" for a non-technical stakeholder (SC-006); server-side serialization isn't needed at ≤ 500 rows.

**Alternatives considered**:
- *JSON export only*: less usable by non-technical stakeholders; rejected (CSV kept as the canonical format).
- *Server-side CSV via Edge Function*: more moving parts for ~200 rows; rejected.

---

### R7 — Session handling & inactivity

**Decision**: Session expiry = **30 minutes of inactivity** (fixes FR-012's "period of inactivity" at planning level). Implemented as: `auth.js` stores the access token in memory (never `localStorage` — PII-adjacent tokens out of browser storage), a sliding idle timer calls the Supabase refresh endpoint on user action and **signs out** at 30 min idle, and any 401 from the API forces re-auth including the MFA challenge.

**Rationale**: 30 min is the standard admin-console idle bound; in-memory tokens match FR-007's "no PII in repo/browser-storage" spirit (tokens are session secrets, not PII, but keeping them out of storage is free security).

**Alternatives considered**:
- *Persistent login (7+ days)*: explicitly against FR-012 ("sessions MUST end after a period of inactivity"); rejected.
- *5 min*: too aggressive for copy-paste workflows; rejected.

---

### R8 — Deployment, secrets, and the Constitution II exception

**Decision**:
- **Public site**: unchanged — same static files, same host. **Admin app**: `member-directory/` deployed to a separate private site (GitHub Pages with a private repo or a protected subdomain) so the admin UI itself is not public.
- **Keys**: Supabase **anon** key (public by design) embedded in `admin.js`; the *security boundary is RLS + the `mfa_verified` claim + server-side rate limits* (R2/R3). The `service_role` key is created in the Supabase dashboard, used only for the one-time owner bootstrap and the weekly retention cron Edge Function, and is **never committed** (Constitution IV).
- **Governance**: The Constitution's own exception clause ("new runtime backends require an explicit approved specification") is what this feature is; the `specs/004-member-list/requirements.md` Notes flag the formal amendment. Plan records this under Complexity Tracking; the spec's sign-off (owner-approved spec) is the evidence chain.
- **Backup**: Supabase free tier includes nightly PITR for 7 days (documented in the runbook); **plus** the spec's own backstop — a scheduled admin export (SC-006) must be kept by the community outside any platform.

**Rationale**: Keeps public site, admin area, and data in separate blast radii; free hosting; and no secrets in the repo.

**Alternatives considered**:
- *Admin app in the public repo root*: public admin UI + leaked anon key = data exposure if RLS regresses; rejected.
- *Service-role key in the admin UI*: defeats RLS and violates FR-010/SC-004; rejected.
