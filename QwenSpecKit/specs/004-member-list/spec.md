# Feature Specification: Member Directory (Admin-Only)

**Feature Branch**: `002-member-directory`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Create a member list for Code With Me that lives outside Meetup. It must be available only to admins. It must hold all the member information available to Meetup organizers, plus when each member last attended a meetup. This is the first step toward Code With Me existing independently of any single event platform (Meetup, Luma, Eventbrite, etc.) while still being able to post events across several of them."

## Clarifications

### Session 2026-07-17

- Q: What happens to a member's directory record after they leave the Meetup group? → A: Keep the record for a fixed 12-month retention period (from the "left" detection date) then automatically delete it, with the deletion audit-logged.
- Q: Who is eligible to be an admin of the member directory? → A: A named roster maintained by owners, regardless of Meetup role (Meetup roles are neither required nor sufficient).
- Q: How should members be notified about the directory and how to ask for removal? → A: A notice in the Meetup group description plus a permanent privacy page on the Code With Me site (no individual member messages).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bring the member list home (Priority: P1)

An admin downloads the member list from Meetup's organizer tools and imports it
into the Code With Me member directory. Afterwards the directory holds every
member of the Meetup group, with every field Meetup provided to organizers,
in a place the community controls.

**Why this priority**: This is the core value of the feature and the first
concrete step toward platform independence. Today the community's member
relationships exist only inside Meetup; if the group lost access to Meetup
tomorrow, it would lose its members with it.

**Independent Test**: Download a current member export from Meetup, import
it, and confirm the directory's member count equals the Meetup group's member
count at export time. Spot-check 10 members field by field against their
Meetup records.

**Acceptance Scenarios**:

1. **Given** an admin is signed in and has a current Meetup organizer member
   export, **When** they import it, **Then** the directory shows one record per
   member with every field from the export, and an import summary shows rows
   read, members added, members updated, and rows skipped (with reasons).
2. **Given** the export contains columns the directory does not specifically
   recognize, **When** it is imported, **Then** those values are kept on each
   member record and are viewable by admins — never silently dropped.
3. **Given** the file is malformed or is not a Meetup member export,
   **When** the admin imports it, **Then** no member data is changed and the
   admin sees a clear explanation of what was wrong.
4. **Given** a row has no Meetup member identifier, **When** the file is
   imported, **Then** that row is skipped and reported by row number and
   member name; all valid rows still import.

---

### User Story 2 - Only admins can see it (Priority: P1)

Member data is personal information that members shared with organizers on
Meetup, not with the public. Only people the community has designated as
admins can see, import, edit, or export it, and every such action is
recorded.

**Why this priority**: Explicitly required. A leak of member data would do
more damage to a free, community-run group's trust than having no directory
at all, so this ships together with Story 1, not after it.

**Independent Test**: Attempt to reach the directory as an anonymous visitor,
as a signed-in non-admin, and as a removed admin; confirm none sees any member
data (including member counts). Search the public site, its published data
files, and its public source repository for three known member names; confirm
zero matches.

**Acceptance Scenarios**:

1. **Given** a visitor who is not signed in, **When** they open any directory
   address, **Then** they see a sign-in prompt and no member data, counts, or
   names.
2. **Given** a signed-in person who is not an admin, **When** they open the
   directory, **Then** access is denied and no member data is shown.
3. **Given** an owner removes someone's admin role, **When** that person next
   tries to use the directory, **Then** they are denied immediately — not at
   the end of a session or after a delay.
4. **Given** an admin views the list, imports, edits, exports, or deletes,
   **When** the action completes, **Then** an audit entry records who did it,
   what they did, and when.
5. **Given** an admin is inactive for an extended period, **When** they return,
   **Then** they must sign in again before seeing member data.

---

### User Story 3 - See who's been showing up (Priority: P1)

An admin wants to know which members actually come to events. For every
member the directory shows when they last attended a Code With Me event and
how many they have attended, and admins can sort and filter by it — for
example "attended in the last 90 days", "joined but never attended", or
"hasn't attended in 6+ months".

**Why this priority**: Explicitly required, and it is what turns a list of
names into something organizers can act on (welcoming newcomers, re-engaging
lapsed members, understanding the real active community vs. lurkers).

**Independent Test**: Pick 5 members whose attendance is known (including one
who never attended); confirm each one's last-attended date and attended count
match Meetup's records, and that each filter returns exactly the expected
members.

**Acceptance Scenarios**:

1. **Given** an import has completed, **When** an admin views the list,
   **Then** every member shows a last-attended date, or "Never attended" when
   Meetup records no attendance, or "No attendance data" when the source did
   not include attendance at all — these three states are never conflated.
2. **Given** the member list, **When** an admin sorts by last attended or
   filters by an activity window (including "never attended"), **Then** the
   results are correct and the count of matching members is shown.
3. **Given** two sources disagree on a member's last attendance (e.g., the
   member export and a later event attendee export), **When** both are
   imported, **Then** the most recent date is used and its source and as-of
   date are shown.
4. **Given** a member's last-attended date is shown, **When** an admin reads
   it, **Then** it is labelled as Meetup's record, with a visible note that
   Meetup counts a "yes" RSVP as attended unless an organizer marked the
   member as a no-show.

---

### User Story 4 - Keep it current without duplicates (Priority: P2)

An admin re-imports a fresh Meetup export every so often. New members are
added, existing members are updated, members who have left the Meetup group
are flagged, and nothing the admins wrote themselves is lost.

**Why this priority**: Needed so the directory stays trustworthy over time,
but a single successful import (Story 1) already delivers value.

**Independent Test**: Import the same export three times; confirm zero
duplicates and zero changes after the first. Then import a newer export and
confirm additions, updates, and departures match the difference between the
two files.

**Acceptance Scenarios**:

1. **Given** a member already in the directory, **When** a newer export with
   changed values is imported, **Then** that member's record is updated, not
   duplicated.
2. **Given** an admin has added notes or tags to a member, **When** any
   re-import runs, **Then** those admin-authored fields are unchanged.
3. **Given** a member is in the directory but absent from the latest export,
   **When** the import completes, **Then** the member is marked "No longer in
   Meetup group" with the date it was detected, is retained for the 12-month
   retention period (from the detection date), and is then automatically
   deleted, with the automatic deletion audit-logged.
4. **Given** an export older than the one last imported, **When** it is
   imported, **Then** no member's last-attended date moves backward.

---

### User Story 5 - Portability and member requests (Priority: P3)

The directory exists to avoid lock-in, so it must not become a new lock-in
itself. Admins can export the whole directory in an open, widely readable
format, and can permanently remove a member who asks to be removed.

**Why this priority**: Important for the independence goal and for treating
members fairly, but the directory is usable before it exists.

**Independent Test**: Export the directory and confirm the file contains
every member and every field, including admin notes and source references.
Delete a test member, re-import an export that still contains them, and
confirm they do not reappear.

**Acceptance Scenarios**:

1. **Given** an admin chooses to export, **When** the export completes,
   **Then** they receive a file with all members and all fields, are warned
   that it contains personal information, and the export is audit-logged.
2. **Given** a member asks to be removed, **When** an admin deletes them,
   **Then** their record is removed and later imports do not re-add them;
   only the minimum identifier needed to prevent re-adding is retained.

---

### Edge Cases

- **Same name, different people**: members are matched only by their Meetup
  member identifier, never merged by name.
- **Hidden or blank profile fields**: shown as empty, not as "unknown" or a
  placeholder, so admins can tell "not shared" from "not imported".
- **Roles**: organizers, co-organizers, event organizers/hosts, and regular
  members are all imported and their role is visible.
- **Email addresses**: kept when present in the export (Meetup provides them
  only to Meetup Pro organizers, for members who consented); when absent, the
  directory never tries to obtain them another way.
- **Meetup changes its export columns**: unrecognized columns are kept (see
  Story 1); a file missing the member identifier column is rejected whole.
- **Date and time formats**: dates in the export are interpreted correctly and
  shown in US Eastern, matching the rest of the site.
- **Import fails halfway**: an import either completes fully or changes
  nothing; the directory is never left half-updated.
- **Two admins import at once**: only one import runs at a time; the second
  is told to wait or retry.
- **Large group**: the list stays searchable and usable at a few thousand
  members.
- **Admin on a shared computer**: sessions end after inactivity (Story 2).
- **Exported files leave the system**: the export warning (Story 5) makes
  clear the admin is now responsible for that copy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Admins MUST be able to import Meetup's organizer member export
  (and, when available, Meetup's event attendee export) without technical
  help or editing any files by hand.
- **FR-002**: For each member, the directory MUST retain every field present
  in the Meetup organizer export, including fields not individually listed
  here. Fields expected today include: Meetup member identifier, name,
  profile link, location, date joined the group, date last visited the group,
  last-attended date, events attended, RSVP counts, no-show count, role in
  the group, intro/bio, answers to the group's join questions, photo link,
  and email address (Meetup Pro groups only, consenting members only).
- **FR-003**: Each member MUST have a Code With Me member identifier that
  does not depend on any event platform. The Meetup member identifier MUST be
  stored as a linked platform identity, so identities from other platforms
  (e.g., Luma, Eventbrite) can later attach to the same member.
- **FR-004**: Each member MUST show last-attended date, its source, and its
  as-of date, distinguishing "never attended" from "no attendance data". A
  member's last-attended date MUST NOT move backward on any import.
- **FR-005**: Admins MUST be able to search members by name and to sort and
  filter by name, join date, last-attended date, events attended, role, and
  status, with the count of matching members shown.
- **FR-006**: Re-importing MUST update existing members matched by Meetup
  member identifier and MUST NOT create duplicates. Importing the same file
  repeatedly MUST produce no changes after the first time.
- **FR-007**: Each import MUST be all-or-nothing at the file level (an
  invalid file changes nothing) and MUST report skipped rows individually,
  identifying the row and the reason.
- **FR-008**: Admin-authored fields (notes, tags) MUST never be overwritten
  or cleared by an import.
- **FR-009**: Members absent from the latest export MUST be marked "No longer
  in Meetup group" with the detection date; their record MUST be retained for
  a fixed 12-month retention period measured from the detection date, after
  which it MUST be deleted automatically and the deletion audit-logged. Manual
  deletion on request (FR-016) MUST remain available at any time.
- **FR-010**: Only signed-in admins MUST be able to view, import, edit,
  export, or delete member data. Everyone else MUST receive no member data,
  including names and counts.
- **FR-011**: The admin roster MUST be a named list maintained by people with an
  owner role (Meetup organizer/role is neither required nor sufficient for
  admin access); the roster MUST be changeable only by owners, there MUST
  always be at least one owner, and removal MUST take effect immediately —
  the person's next directory request MUST be denied (Story 2 AS3).
- **FR-012**: Admin sign-in MUST require multi-factor authentication, and
  sessions MUST end after a period of inactivity.
- **FR-013**: The system MUST keep an audit log of sign-ins, list views,
  imports, edits, exports, deletions, and admin roster changes, showing who,
  what, and when. Owners MUST be able to read it; no admin may edit or delete
  entries.
- **FR-014**: Member data MUST NEVER be published to the public website, its
  static data files, or its public source repository. The public site MUST
  remain a plain static, build-free site (Constitution II); the directory is a
  separate, access-controlled admin area.
- **FR-015**: Admins MUST be able to export the full directory, including
  admin-authored fields and source references, in an open, widely readable
  format. Every export MUST show a personal-information warning and be
  audit-logged.
- **FR-016**: Admins MUST be able to permanently delete a member on request.
  Deleted members MUST NOT be re-added by later imports, and only the minimum
  identifier required to prevent re-adding may be kept.
- **FR-017**: Member data MUST be obtained only through tools Meetup provides
  to organizers (its member and attendee downloads, or its API under a valid
  license). Scraping Meetup pages or automating a browser against Meetup MUST
  NOT be used.
- **FR-018**: Member data MUST be used only to run Code With Me and MUST NOT
  be shared with third parties (e.g., sponsors, venues) through the
  directory. Export (FR-015) is the only way data leaves the system.
- **FR-019**: Members MUST be informed that organizers keep their Meetup
  member information in a Code With Me directory outside Meetup, and how to
  ask to be removed, via (a) a notice in the Meetup group description and
  (b) a permanent privacy page on the Code With Me site that names the
  directory, states what is stored, the 12-month retention rule for members
  who leave the group (FR-009), and the exact way to ask for removal
  (FR-016). No individual member messages are required.
- **FR-020**: All dates and times MUST be shown in US Eastern with an explicit
  time-zone label, consistent with the rest of the site.

### Key Entities

- **Member**: one person in the Code With Me community. Holds the
  Code-With-Me-owned identifier, the fields imported from each platform,
  admin-authored notes and tags, status (active, no longer in Meetup group),
  and derived attendance summary (last attended, events attended).
- **Platform Identity**: a member's account on one event platform (Meetup
  today; Luma, Eventbrite later). Holds the platform's member identifier,
  profile link, the raw fields that platform provided, and when they were
  last refreshed. A Member has one or more Platform Identities.
- **Attendance Record**: a member's recorded attendance (or no-show) at one
  event, with its source platform and as-of date. Used to derive
  last-attended.
- **Import Run**: one import by an admin. Holds who ran it, when, the source
  file's type and export date, rows read, members added/updated/marked left,
  rows skipped with reasons, and success or failure.
- **Admin**: a person allowed into the directory, with a role (owner or
  admin).
- **Audit Entry**: one recorded action — who, what, when, and which members
  or import it touched.
- **Removal Record**: the minimal identifier of a deleted member, kept only
  to stop later imports re-adding them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the first import, the directory's member count equals the
  Meetup group's member count at export time, and a 20-member spot check
  matches Meetup on every imported field.
- **SC-002**: An admin can go from "download export on Meetup" to "directory
  updated" in under 10 minutes, without technical help.
- **SC-003**: An admin can answer "who attended in the last 90 days?" and "who
  joined but never attended?" in under 1 minute each.
- **SC-004**: Access tests as anonymous visitor, non-admin, and removed admin
  return zero member records; a search of the public site, its data files,
  and its public repository finds zero member names.
- **SC-005**: Importing the same export three times yields zero duplicates
  and zero changes after the first run.
- **SC-006**: 100% of imports, exports, edits, deletions, and roster changes
  appear in the audit log.
- **SC-007**: A full export contains 100% of members and fields, and a deleted
  member reappears in zero subsequent imports.

## Assumptions

- The source is the Meetup group "Code With Me" (code-with-me), and at least
  one admin holds an organizer or co-organizer role that can use Meetup's
  member and attendee downloads.
- Meetup now offers organizers a single consolidated download combining
  attendee details and the members list (registration responses are Pro-only).
  Its exact columns vary by plan and change over time, so the directory is
  built to accept whatever columns are present rather than a fixed list.
- Meetup does not give standard organizers member email addresses; Meetup Pro
  organizers get them only for members who RSVP'd and consented. This feature
  does not try to collect emails. A member opt-in on the Code With Me site
  (the real path to being able to reach members off Meetup) is a separate
  future spec.
- Meetup's API requires an active Meetup Pro subscription and Meetup's
  approval. The first release relies on file import; automated syncing
  through the API is a plan-level or future decision.
- "Last attended" means attended according to Meetup's record, which treats a
  "yes" RSVP as attended unless an organizer marks a no-show.
- Group size is in the hundreds to low thousands of members.
- Use of the exported data is consistent with Meetup's Terms of Service and
  organizer guidelines; organizers confirm this before the first import.
- The public site, its design, and the Live Events feature (001) are
  unchanged. Constitution II (static, no server, no build step) continues to
  govern the public site; how the access-controlled admin area fits the
  Constitution is decided before planning (see checklist notes).
- The admin area is in English; times are US Eastern.
- Out of scope for this feature: messaging or emailing members, member
  self-service profiles or sign-up on the Code With Me site, cross-posting
  events to Luma/Eventbrite, event check-in, and matching the same person
  across platforms (the data model allows it; the matching is future work).
