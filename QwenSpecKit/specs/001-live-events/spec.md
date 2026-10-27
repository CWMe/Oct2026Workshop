# Feature Specification: Live Events

**Feature Branch**: `001-live-events`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Replace the 3 representative event cards on the Code With Me site with live, real upcoming events sourced from the community's official public event platform (Meetup), via a small periodic data-refresh pipeline that publishes static event data — keeping the site fully static and build-free."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See real upcoming events (Priority: P1)

A prospective attendee lands on the Code With Me website and wants to know what's
happening next. The Events section shows the community's real upcoming in-person
events — accurate titles, dates/times (US Eastern), locations, topic tags, and a
tap-through link to RSVP on the community's official platform — instead of the
current placeholder cards that may describe events that never happened.

**Why this priority**: This is the core value of the feature. A community site
with invented events actively harms trust in a group that is free and
community-run; accurate upcoming events are what converts visitors into
attendees.

**Independent Test**: Load the site and compare every event card (title, date,
time, location, link) against the live Meetup listing for Code With Me. All
cards must match real upcoming events and their RSVP links must resolve.

**Acceptance Scenarios**:

1. **Given** the site has event data refreshed within the last 24 hours,
   **When** a visitor opens the Events section,
   **Then** they see up to 3 real upcoming events, ordered by nearest date,
   each showing title, date + time (US Eastern), location, topic tags, and an
   "RSVP" link that opens the event's official page.
2. **Given** a visitor is on a phone, **When** they tap an event's RSVP link,
   **Then** they land on that specific event's signup page on the official
   platform (never a generic or wrong event).
3. **Given** the community has cancelled its next event,
   **When** the nightly refresh has run,
   **Then** the cancelled event no longer appears and the next real event does.

---

### User Story 2 - Trust in freshness (Priority: P2)

A visitor or maintainer wants to know how current the Events section is.
The section displays a visible "Data refreshed on <date>" indicator, and when
the data source is unreachable, expired, or returns no events, the site shows
an honest fallback state (with a direct link to the official platform) rather
than silently showing stale or invented events.

**Why this priority**: Freshness and honesty protect the community's credibility
and make failures self-evident rather than quiet. It is required by the
Constitution principle "real data only".

**Independent Test**: With a stale or missing data source, load the site and
verify a clear fallback is shown (with last-refresh date if one exists) and no
unlabeled placeholder events are visible.

**Acceptance Scenarios**:

1. **Given** the data source fails or returns an error,
   **When** the site is loaded,
   **Then** the Events section shows a friendly message explaining events
   could not be loaded, a link to the official platform, and a "last
   successfully refreshed" date — no invented events.
2. **Given** the data source is reachable but has zero upcoming events,
   **When** the site is loaded,
   **Then** the Events section says "No upcoming events yet — check back soon"
   with the official platform link; it does NOT recycle past events.
3. **Given** the data file is older than the freshness threshold,
   **When** the site is loaded,
   **Then** the freshness indicator is visually downgraded (e.g., warning
   styling) and the fallback guidance is shown.

---

### User Story 3 - Maintainer sets it and forgets it (Priority: P3)

A community maintainer wants the event list to stay accurate without manual
copy-paste from the official platform. A scheduled job (e.g., nightly, or a
manual trigger) fetches the community's public upcoming events, validates them
against a known shape, and publishes them as static site data. No site
deployment, login, or API key management is required on the visitor's side,
and the site itself still requires no server or build step.

**Why this priority**: Needed to make US1 sustainable over time, but the site
still works (with manual regeneration or fallback) without it being automated
in the first release.

**Independent Test**: Delete local event data and run the refresh process once;
verify a valid static data file is produced and the site renders it. Run the
process again with the source unavailable; verify the previous good file is
retained (or a documented honest state is produced) and the job reports
failure clearly.

**Acceptance Scenarios**:

1. **Given** the refresh process runs on schedule,
   **When** the source is reachable,
   **Then** a new static events data file is generated with all fields
   validated (title, start time, timezone, location, RSVP link, tags) and the
   site picks it up on next load.
2. **Given** the refresh process runs and the source is unreachable,
   **When** it cannot produce new data,
   **Then** the run fails with a clear message and the site falls back to the
   most recent good data (with the freshness warning) — the previous good file
   is not deleted.
3. **Given** a maintainer wants an immediate update after publishing a new
   event,
   **When** they trigger a manual refresh,
   **Then** the new data appears on the live site within one refresh cycle's
   normal propagation time.
4. **Given** an event record is malformed (missing location or RSVP link),
   **When** the refresh process validates it,
   **Then** the malformed record is skipped (not partially rendered) and the
   validation failure is logged with the offending event identified.

---

### Edge Cases

- **Zero upcoming events**: show "no upcoming events yet" state + official
  platform link; never recycle past events as current.
- **More than the displayed capacity (3)**: only the 3 nearest upcoming events
  are shown; the section links through to the full calendar on the official
  platform.
- **Time zones**: all times rendered in US Eastern with an explicit time-zone
  label; never shown as raw offsets or the visitor's local time.
- **Event with no physical location** (rare, e.g., virtual/podcast): render
  without a location line rather than a blank or "unknown" placeholder.
- **Very long event titles**: card layout wraps or truncates gracefully with
  full title available (e.g., tooltip/aria-label); no horizontal overflow.
- **Source temporarily down at refresh time**: retain last good data, show
  freshness warning, never blank out the site.
- **Concurrent refresh runs**: only one publish wins; the data file is never
  written partially/corrupt.
- **Visitor has JS disabled**: the visible event list, links, and freshness
  indicator still render and work (Constitution: pages render with JS
  disabled).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Events section MUST list the community's upcoming real events
  from the official public source; no invented, sample, or unlabeled
  placeholder events may be shown.
- **FR-002**: Every event card MUST display the event title, start date and
  time in US Eastern (with day name), the location (venue/city when present),
  one-or-more topic tags consistent with the site's What-We-Do vocabulary
  (talks, workshops, networking, pair programming, etc.), and a working link
  to RSVP on the official platform.
- **FR-003**: Events MUST be ordered by nearest upcoming date first, and the
  displayed set MUST be capped at 3 cards, with a prominent "See full
  calendar" link to the official platform whenever fewer, equal, or more
  events exist.
- **FR-004**: The Events section MUST display a "Data refreshed on <date>"
  freshness indicator, and MUST visually indicate (warning state) when the
  data is older than the freshness threshold.
- **FR-005**: Event data MUST be refreshed automatically at least once every
  24 hours by a scheduled process, and MUST support manual trigger by a
  maintainer.
- **FR-006**: When no upcoming events exist, the Events section MUST display a
  clear "no upcoming events yet" state with the official platform link.
- **FR-007**: When event data is unavailable, invalid, or stale beyond the
  threshold with no good data, the Events section MUST display a friendly
  fallback with a link to the official platform and the last-good refresh
  date if one exists.
- **FR-008**: The refresh process MUST validate every event record (title,
  start time, timezone, location optional, RSVP link present and correctly
  typed, tags non-empty) and MUST skip malformed records rather than render
  them partially, logging the skip with the event identified.
- **FR-009**: The refresh process failure MUST NOT destroy the last
  successfully generated static data file.
- **FR-010**: Events section MUST be fully functional (list, links, fallback
  states, freshness indicator) with JavaScript disabled.
- **FR-011**: All event links MUST open in a new browsing context with safe
  external-link attributes (noopener) and be keyboard-operable and
  screen-reader-readable (date, time, and location announced correctly).
- **FR-012**: The site MUST remain deployable on a plain static host with no
  server and no build step (Constitution II).
- **FR-013**: The refresh process MUST require no visitor-side
  authentication and MUST use only the community's public, publicly listed
  data; no private or personal data of attendees may be included.

### Key Entities

- **Event**: one upcoming community gathering. Attributes displayed:
  title, start date/time (US Eastern), optional location, topic tags (1+),
  RSVP link on the official platform, canonical event ID/source reference.
  Relationship: 1:1 with an event on the official platform; the RSVP link
  always resolves to that canonical page.
- **Event Feed (static data file)**: the refresh process's published output —
  an ordered collection of Event records plus the refresh timestamp and
  source reference. Single source of truth for the Events section at render
  time.
- **Refresh Run**: an occurrence of the scheduled or manually triggered
  process; has a status (success/failure), timestamp, record count, and
  validation notes for skipped records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 5 consecutive days of spot checks, 100% of events shown are
  real, upcoming, and match the official platform's listing on title, date,
  time, and RSVP link (zero invented or stale events shown without warning).
- **SC-002**: For at least 95% of any 24-hour window, the freshness
  indicator reflects data less than 24 hours old.
- **SC-003**: A visitor can go from the Events section to the correct RSVP
  page for a chosen event in 2 taps/clicks or fewer, on both desktop and
  mobile widths.
- **SC-004**: With the refresh source unavailable, the site still renders the
  Events section with the last-good data and a visible freshness warning (or
  the honest no-data fallback) — the page never shows a broken/empty section
  or unannounced placeholder events.
- **SC-005**: The Events section (data-driven part) loads and renders within
  1 second on a mid-range mobile device over typical 4G, and the section and
  its fallback states work with JavaScript disabled.
- **SC-006**: A maintainer can publish a newly announced event and have it
  appear on the live site within 24 hours without editing any source code or
  touching the site's layout files.

## Assumptions

- The community's official public event source is the Meetup group
  "Code With Me" (code-with-me), and its upcoming events are publicly
  readable without login from a scheduled job.
- Upcoming events at any time are few (well under a couple dozen); 3-card
  display cap with a "see full calendar" link covers the realistic range —
  no search, filter, pagination, or archives in this feature (member/event
  archives are a separate future spec).
- Display times are shown in US Eastern Time with an explicit time-zone
  label; visitors in other time zones get the ET time, not local time.
- The site copy stays in English, matching the rest of the site.
- The refresh pipeline runs wherever the maintainer's CI/hosting allows
  (e.g., the static host's scheduled pipeline or an external trigger); the
  site itself remains static — this satisfies Constitution II without
  specifying the exact mechanism (a plan-level decision).
- Refresh frequency default: at least nightly; the freshness threshold for
  the warning state is 48 hours (i.e., "refreshed daily, warn after 2
  missed refreshes").
- The current 3 representative/fake event cards are fully replaced by this
  feature; there is no mixed-mode displaying fake and real cards together.
- Existing page design, navigation, and the rest of the site remain
  unchanged apart from the Events section and the new data pipeline.
