# Implementation Plan: Member Directory (Admin-Only)

**Branch**: `004-member-list` | **Date**: 2026-07-17 | **Spec**: `specs/004-member-list/spec.md`

**Input**: Feature specification from `specs/004-member-list/spec.md`

## Summary

Bring the Code With Me member roster home from Meetup: an **admin-only, MFA-protected member directory** that stores every member attribute available to Meetup organizers plus last attendance, supports field-faithful CSV re-import, an open-format export, and a removal workflow — a durable, portable member store that lets the community post events across platforms. Public site stays 100% static; the directory is a small plain-HTML admin app (no build, no framework) talking to a free Supabase Postgres project (data + auth + MFA), with all PII kept out of this repository.

## Technical Context

**Language/Version**: Static site + Postgres DDL. Client: plain HTML5, CSS3, and dependency-free JavaScript (ES2019+, no frameworks, no build step) in `member-directory/`. Server side: SQL (Postgres 15, Supabase dialect — plain `CREATE TABLE/FUNCTION/TRIGGER`, no proprietary extensions required).

**Primary Dependencies**: None in client code (plain `fetch` against Supabase REST: Auth + PostgREST). External service: **Supabase free tier** (Postgres, Auth with TOTP MFA, PostgREST). No npm packages.

**Storage**: Postgres (Supabase). Member PII lives **only** in that project — never in this repository, never in a public bucket. The repo holds schema DDL (`member-directory/schema.sql`), the admin UI, and docs.

**Testing**: No test framework (Constitution II). Manual browser verification scenarios in `quickstart.md`; Postgres assertions via `sql/` verification queries included in `data-model.md` / `quickstart.md`.

**Target Platform**: Any evergreen browser (desktop first, mobile-readable); server: Supabase cloud Postgres.

**Project Type**: Web application (static frontend + managed Postgres API), isolated from the public static site.

**Performance Goals**: Directory loads first view < 3 s on a normal connection; search/filter < 500 ms for ≤ 500 members (target scale ~200, SC-003).

**Constraints**:
- Free to operate (Constitution I).
- No build step; no JS dependencies (Constitution II).
- No secrets or PII in the repository (Constitution IV, FR-007).
- Public site (`index.html`, `css/`, `js/`) unchanged (FR-014).
- Auth: MFA (TOTP) mandatory; session ends after 30 min inactivity (FR-012 — this plan fixes the "period of inactivity").
- Reasonable rate limits on import/delete (FR-013): enforced server-side, not client-side.

**Scale/Scope**: ~200 members max, ~30 archived events, ≤ 300 members per event attendee export; single community, tiny concurrent admin usage (assume 1–5 admins).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Free and accessible | ✅ Pass | Supabase free tier + GitHub Pages are sufficient at this scale; admin UI keyboard-navigable, ≥ 4.5:1 contrast, `prefers-reduced-motion` honored (FR-018) |
| II. Progressive enhancement, zero build | ⚠️ **Violation — justified** (see Complexity Tracking) | The admin area is inherently a dynamic data app and cannot be a static brochure; Constitution II's own exception applies: "new runtime backends require an explicit approved specification" — this approved spec (FR-010…FR-016) is that explicit specification. The **client** remains zero-build, dependency-free plain HTML/CSS/JS; the **public site is untouched** (FR-014) |
| III. Version-pinned dependencies | ✅ Pass | Zero client JS dependencies introduced. Only external dependency is the Supabase REST API (stable, versioned endpoints; no package to pin) — decision and rationale recorded in `research.md` R1. Supabase project settings (region, plan) recorded in `research.md` R1 as operational evidence |
| IV. No secrets in repo | ✅ Pass | Data stored only in the private Supabase project (FR-007); client uses Supabase's **anon** key (designed public) + **row-level security** and server-side rate limits as the security boundary; any `service_role` key is provisioned-only and never committed |
| V. Quality gates | ✅ Pass | Admin UI: no console errors on load, 4xx/5xx handled as visible user-facing messages (FR-017), no blocking popups, design tokens reused in `:root`, WCAG 2.1 AA (FR-018, SC-005) |

**GATE RESULT: PASS with 1 justified violation (Principle II), recorded in Complexity Tracking below.**

## Project Structure

### Documentation (this feature)

```text
specs/004-member-list/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (manual verification guide)
├── contracts/           # Phase 1 output
│   ├── README.md        # Contract index
│   ├── admin-api.md     # Auth + PostgREST endpoint contracts
│   └── csv-formats.md   # Import (member + attendee) & export column contracts
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
member-directory/                 # Admin app (separate static deploy, e.g., its own GitHub Pages site or /directory path; NOT part of the public site build)
├── index.html                    # Admin UI: sign-in, member table, search/filter, notes/tags, import, export, deletion, roster, audit
├── css/admin.css                 # Admin styles (own token block; reuses design language)
├── js/
│   ├── admin.js                  # UI logic, state, fetch orchestration
│   ├── auth.js                   # Supabase Auth REST: sign-in, MFA challenge, session expiry (30 min)
│   ├── import.js                 # CSV parsing, field mapping, batch apply, result table (FR-002a/b)
│   └── export.js                 # Fetch → client-side CSV serialization (FR-015, FR-017)
├── schema.sql                    # Full DDL: tables, RLS, functions (import txn, retention, rate-limit), audit triggers, seed SQL for owner bootstrap (NO PII)
└── README.md                     # Deployment + ops runbook (hosting, Supabase project, owner bootstrap, backups)

# Public site — UNCHANGED (FR-014):
index.html  css/  js/
```

**Structure Decision**: New self-contained `member-directory/` folder (Option 2 "web application" shape, reduced: static frontend + managed data service, no `src/models` layers — Postgres *is* the model layer). Isolation from the public site satisfies FR-014 and the Constitution; a single folder keeps the community's single-repo, zero-tooling workflow (no monorepo tooling).

## Complexity Tracking

> **Filled because Constitution Check has one violation that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Principle II — runtime data service (Supabase Postgres) for the admin area** | The spec explicitly and mandatorily requires: admin-only PII store outside any platform (FR-010), MFA-protected sign-in with idle session expiry (FR-012), import/export over the network (FR-015), audit log, rate limiting (FR-013), 12-month retention enforcement (FR-009). A purely static page cannot authenticate, authorize, or persist PII securely | (a) *Static + localStorage*: PII on member browsers — violates FR-007/FR-010/SC-004 and would leak on any shared device; (b) *Self-hosted Node/Python backend*: needs always-paid/hosted server, violates Constitution I (free) and II's no-runtime-backend default harder than the managed free-tier API; (c) *SaaS member tools (Airtable etc.)*: data portability and MFA-for-organizers weaker; vendor lock-in — contradicts the core goal (platform independence) |
