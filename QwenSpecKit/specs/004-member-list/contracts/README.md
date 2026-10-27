# Contracts Index — Member Directory (Admin-Only)

Feature 004-member-list. The directory's external surface (for the admin UI app and the human admins) is defined by:

| Contract | File | Covers |
|---|---|---|
| Admin API | [`admin-api.md`](admin-api.md) | Auth/MFA/session contract, and every data operation (list/search/notes/import/export/delete/roster/audit) via Supabase REST — request/response shapes, status codes, error framing (FR-017), rate limits (FR-013) |
| CSV formats | [`csv-formats.md`](csv-formats.md) | Inbound member export & event-attendee export column contracts (FR-001…FR-005), matching rules, and the canonical outbound export (FR-015, SC-006) |

There is **no public API, no CLI, no grammar** — the only consumers are the admin app (`member-directory/js/*`) and human admins using CSV.
