# Quickstart — Member Directory (Admin-Only)

**Purpose**: runnable, manual validation that every user story works end-to-end. No build, no test framework (Constitution II) — these are browser + curl checks. Full contract detail in `contracts/`; entity detail in `data-model.md`.

## Prerequisites

1. Node-free, browser-only client: Python ≥ 3.11 (or any static file server) + one evergreen browser.
2. A **Supabase project** (free tier) — created in the dashboard, region + ref recorded in `member-directory/README.md` (ops runbook), *not* in this repo.
3. Supabase **Auth**: two accounts created (owner `owner@example.test`, admin `admin@example.test`), each with **TOTP enrolled**.
4. Sample data: two CSVs crafted per `contracts/csv-formats.md` — `members-sample.csv` (~12 rows incl. one hidden email, one ambiguous name) and `event-sample.csv` (a *past-dated* event to test last-attended monotonicity, `As Of` in the past).

## Setup (once)

```bash
# 1. Apply schema (DDL only — contains NO PII; safe to commit)
psql "$SUPABASE_DB_URL" < member-directory/schema.sql

# 2. One-time owner bootstrap (uses the dashboard service_role key — never committed)
psql "$SUPABASE_DB_URL" -c "INSERT INTO admins(email, full_name, is_owner, active) VALUES ('owner@example.test','Owner Name', true, true);"

# 3. CORS: allow the admin app origin only (Supabase dashboard → API → CORS)

# 4. Serve the admin app locally (free, no build)
cd member-directory && python -m http.server 8123
# → http://localhost:8123
```

## Walkthrough (each ≈ one user story)

**S1 Import (Story 1 / FR-001…005, SC-001/002)**
1. Sign in as owner, MFA TOTP 6-digit.
2. Import `members-sample.csv` → result table shows per-row `new/updated/flagged/failed` with reasons.
3. Re-import the *same file* → expect `new=0, updated=0, unchanged=N` (idempotent).
4. Import `event-sample.csv` (past `As Of`) → `last_attended_*` unchanged (monotonic rule) → then import a *newer* event → field advances, source = `meetup_event`, `as_of` updated.
5. Grep the UI/DB for a deliberately-included unknown column (`Membership Type`) → present in `members.extra`, visible in result table, **not dropped** (FR-003).

**S2 Access control (Story 2 / FR-010/011, SC-004)**
1. With **no** sign-in: `curl -i "https://<ref>.supabase.co/rest/v1/members?select=*"` with only the `anon` key ⇒ `403` (not a 200, not a count).
2. Sign in as `owner`, `change_roster` grant `admin@example.test` ⇒ admin can list/search.
3. Owner revokes admin ⇒ admin's **next** list call ⇒ `403`. Roster change appears in audit log.
4. Try revoking the *last* owner ⇒ `409 conflict` + hint "add another owner first" (Story 2 AS3).

**S3 Notes/tags & last-attended (Story 3)**
1. As admin, set `admin_notes` and tag `community-host` on one member ⇒ persisted, appears in list + `full` export, **not** in `minimal` export.
2. Import `members-sample.csv` again with that member's row present ⇒ `admin_notes`/`tags` unchanged (FR-008).
3. Import `event-sample.csv` from a member **profile** file (`As Of` provided) ⇒ `last_attended_source=meetup_profile`, `last_attended_as_of` = that date (SC-003).

**S4 Leave + retention (Story 4 / FR-009)**
1. Import a member CSV that **omits** one existing `in_group` member ⇒ that member becomes `left`, `left_detected_at=now()`.
2. Force-advance the clock (Supabase: run `enforce_retention(now() + interval '13 months')` by hand, or set one member's `left_detected_at` to `now() - interval '13 months'` and re-run `enforce_retention(now())`) ⇒ that member is **deleted** and an `audit_log` row `action=retention_purge, actor=system` exists (SC-004, FR-013).
3. Verify the retention job is also wired to the weekly Edge-Function cron (runbook).

**S5 Removal & notice (Story 5 / FR-015/016/019, SC-006)**
1. Export `full` (CSV, UTF-8, open in a spreadsheet) and `minimal` (only `full_name,email_or_name_hash`; **no** notes) ⇒ both downloads succeed, each writes an `export` audit row.
2. `delete_member(uuid, 'member-requested-removal')` ⇒ member gone, `audit_log` row present with the reason (FR-016).
3. Confirm the (drafted) **privacy page** on the Code With Me site links to the notice in the Meetup group description describing name+email storage and the removal path (FR-019/FR-020 — copy lives in `member-directory/README.md` for owner sign-off; the live site text is a *tasks.md* deliverable, not PII).

**S6 Audit & rate limits (FR-013, FR-017, SC-007)**
1. Open the audit view ⇒ sign-ins, MFA failures, each import, exports, roster changes, deletions, and the retention purge are all present and human-readable (SC-007).
2. Fire 5 rapid imports ⇒ the 5th ⇒ `429 rate_limited` with a clear message + `hint` (no silent failure, FR-017 framing).
3. `curl -X PATCH /rest/v1/audit_log?...` ⇒ `403` (append-only).
4. Kill the in-memory token (hard refresh) ⇒ next action re-triggers MFA (30-min idle + 401 recovery).

## Definition of done (all true ⇒ feature validated)

- [ ] All six walkthroughs pass in a clean browser (no console errors — Constitution V).
- [ ] `SC-001…SC-007` each have one ✅ above with the row/step that proves them.
- [ ] Repo `git status` shows **no** PII, no `service_role` key, no sample CSVs with real data committed (Constitution IV / FR-007). Sample CSVs in this repo are fabricated test data only.
- [ ] Public site (`index.html`, `css/`, `js/`) `git diff` empty (FR-014).
