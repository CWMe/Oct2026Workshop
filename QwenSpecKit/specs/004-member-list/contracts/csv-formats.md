# CSV Formats Contract — Member Directory

**Inbound** = files admins choose from disk (Meetup organizer exports). **Outbound** = what the directory produces (FR-015 "open, widely readable" ⇒ CSV/UTF-8).

Common encoding rules (all files): `UTF-8`, `CRLF` or `LF` both accepted on input, `CRLF` written on output; fields containing `,` `"` or newline are quoted with `""`-escaping (RFC 4180). A UTF-8 BOM at row 1, col 1 is stripped on input.

## 1. Inbound A — Member export (Story 1, FR-001…FR-003)

| Header (accepted aliases, case-insensitive on trim) | Required | Maps to | Notes |
|---|---|---|---|
| `Full Name` (`Full name`, `Member Name`, `Name`) | **yes** — row is `failed` if empty | `members.full_name` | Trimmed, whitespace-collapsed for matching (`Alex\nRivera` ≡ `Alex Rivera`) |
| `Email` (`Member Email`) | no | `members.email` | **Empty/hidden ⇒ NULL, never guessed** (Story 1 AS4). Never a basis for creating a *different* identity for the same person — ambiguity flag instead |
| `Member Since` (`Joined`, `Join Date`) | no | `members.joined_meetup_at` | Parsed as date or datetime; unparseable ⇒ row `flagged` with reason |
| `Membership Type` (`Plan`, `Subscription`) | no | `members.extra["membership_type"]` | example of the **no-silent-drop rule (FR-003)** — unknown/undocumented columns land verbatim in `extra` and appear in the result table |
| *(any other column Meetup includes)* | no | `members.extra[<Header>]` | FR-003: the import MUST surface + store, never drop |

Row outcome vocabulary (result table, FR-002b): `new | updated | unchanged | flagged | failed` (see `admin-api.md` §3 for the response envelope).

## 2. Inbound B — Event attendee export (Story 3, FR-004)

| Header (aliases) | Required | Maps to |
|---|---|---|
| `Member Name` (`Full Name`, `Guest Name`) | **yes** | match key (see §4) |
| `Member Email` (`Email`) | no | match key (primary) |
| `Event Name` (or taken from the file's metadata field) | **yes** | `members.last_attended_event` |
| `Event Date` (or file metadata) | **yes** | `members.last_attended_at` **subject to the monotonic `GREATEST` rule** (Story 1 AS4) + `last_attended_as_of` |
| `Checked In` (`Attendance`, `RSVP`) | no | `members.last_attended_source` = `meetup_event` when present in an attendee export; a *profile* file (SC-003) uses `meetup_profile` and supplies a single `As Of` date |
| `As Of` (`Data Exported`) | no | `members.last_attended_as_of` (explicit point-in-time) — when absent, use the import run's `at` |
| *(other columns)* | no | `members.extra` (no silent drops) |

A "latest attendance from member profile" import (SC-003) is the same shape with one row per member and the `As Of` date required.

## 3. Outbound — Canonical directory export (FR-015, SC-006)

Two variants (see `admin-api.md` §4 for the endpoints). Header row exactly:

**`full`**
```
member_id,full_name,email,member_status,left_detected_at,first_seen_at,joined_meetup_at,last_attended_at,last_attended_event,last_attended_source,last_attended_as_of,admin_notes,tags,extra_keys
```
- `tags` joined with `|`. `extra_keys` = the `extra` JSON keys joined with `|` (values flattened row-by-row as additional columns `extra:<key>` when present, so the file stays pure tabular CSV with no embedded JSON).
- `email` empty for hidden (never filled with guesses).

**`minimal`** (Story 5 AS3 — smallest re-usable PII set; *no* notes, *no* `extra`):
```
full_name,email_or_name_hash
```
- `email_or_name_hash` = the real email when visible, otherwise `SHA-256(normalized_full_name)` truncated to 16 hex chars (stable identity for cross-referencing without revealing name collisions to an outsider).

All output dates are ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`); booleans as `true`/`false`; NULLs as empty cells (never `null`/`NULL` strings).

## 4. Matching & identity rules (applied by `import_members`/`import_attendees`, R4)

1. **Email visible & present in DB** ⇒ that row targets that member (even if the name differs — flag the name difference in the result table `detail`).
2. **Email visible & not in DB, but normalized name matches exactly one member with a hidden email** ⇒ `flagged` ("possible same person — confirm") — never auto-merge on a name↔hidden-email guess.
3. **Email visible & not in DB, no name match** ⇒ `new` member.
4. **Email hidden, normalized name matches exactly one member** ⇒ that member (this is the expected path for the majority of Meetup rows, per the spec's edge-case allowance).
5. **Email hidden, normalized name matches ≥ 2 members (different emails)** ⇒ `flagged`, no mutation (Story 1 AS4).
6. **Name normalization** = UTF-8 → lowercase → trim → collapse internal whitespace → strip surrounding punctuation. *No* transliteration, *no* fuzzy/Levenshtein (rejected in R4 — non-determinism is worse than a flagged row).
7. **Import is upsert-only**: an import must **never delete** a member. Deletion happens only via `enforce_retention()` (12-month `left` expiry) or manual `delete_member` (FR-009/FR-016). Detecting "left" (Story 4 AS1) = a member **absent from the member-list import's provided rows** gets `member_status='left'` + `left_detected_at=now()` in the *member* (Inbound A) import only — attendee (Inbound B) files never set `left` (a single event's roster is not a membership statement).

## 5. Concurrency & limits recap (server-side, FR-013)

- ≤ **4 successful-or-attempted imports / hour / admin** (any `import_*` 429 is audit-logged as `rate_limited`).
- ≤ **10 `delete_member` / day / admin**.
- One concurrent import at a time per database (`pg_advisory_xact_lock`) — the second caller gets `409 conflict: another import is running, wait and retry`, *not* a silent double-apply.
- All limits live in SQL, not the UI (a bypassed UI must still be refused — verified in quickstart).
