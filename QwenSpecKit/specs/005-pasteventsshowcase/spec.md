# Feature Specification: Past Events Showcase

**Feature Branch**: `005-past-events-showcase`  
**Created**: 2026-10-27  
**Status**: Draft  
**Input**: User description: "Showcase all Code With Me past events with an animated homepage photo slideshow, a browsable archive and event detail pages, publicly accessible Meetup photographs, linked CWMe GitHub projects, speaker biographies, presentation files, and prominent venue/sponsor acknowledgments. Discover events automatically, but approve photos and biographies before publishing."

**Existing-spec compatibility**: This is a NEW feature numbered `005` because `004-member-list` already exists. It does not modify or expose the admin-only member directory. It complements `001-live-events`, `002-email-rsvp`, and `003-speaker-sponsor-forms`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover Code With Me's history (Priority: P1)

A prospective attendee, sponsor, or speaker visits Code With Me and sees a real, visually engaging history of the community. A dedicated Past Events archive contains **all discoverable historical Code With Me events**, newest first, not merely the latest 10 or a handpicked subset. Each entry clearly identifies its title, date, location where public, and canonical Meetup event page. Visitors can browse the archive and open an individual event page.

**Why this priority**: Historical evidence demonstrates community activity and makes past workshops discoverable long after their RSVP pages expire.

**Independent Test**: Compare a sample of historical Meetup event records (including old, cancelled, and photo-less events) against the archive; confirm that genuine completed events are present, metadata matches the source, and cancelled/non-occurring events are not portrayed as completed.

**Acceptance Scenarios**:

1. **Given** the archive has completed-event records, **When** a visitor opens Past Events, **Then** they see completed events newest first, with title, event date (US Eastern), optional venue/city, thumbnail when approved, and a link to event details.
2. **Given** more historical events than fit on one screen, **When** the visitor scrolls or navigates pages, **Then** all discovered completed events remain reachable without an arbitrary total cap.
3. **Given** an event has no photographs, **When** its card and detail page render, **Then** they remain usable without fabricated images.
4. **Given** a historical event is cancelled, **When** it is imported, **Then** it is excluded from the completed-events archive or explicitly distinguished as cancelled; it never counts as an event held.
5. **Given** an event's details are incomplete, **When** its page loads, **Then** only verified fields are displayed and missing information is omitted or clearly labelled unavailable.

---

### User Story 2 - Experience an engaging photo slideshow (Priority: P1)

A visitor sees a homepage slideshow featuring approved photographs of real past Code With Me events. Slides rotate automatically at a comfortable pace and provide manual next/previous controls, pause/play, accessible descriptions, and a link to the associated event. Each event page has its own photo gallery/slideshow where approved images exist.

**Why this priority**: The images are the primary evidence of community participation and the most prominent part of the requested experience.

**Independent Test**: Load the homepage with several approved event images; confirm automatic advancement, working controls, correct event links, responsive rendering, keyboard accessibility, and reduced-motion behavior.

**Acceptance Scenarios**:

1. **Given** two or more approved photographs, **When** the homepage loads with JavaScript enabled and no reduced-motion preference, **Then** slides advance automatically, with visible pause/play and previous/next controls.
2. **Given** a slide is shown, **When** a visitor selects its event link, **Then** the correct historical event page opens.
3. **Given** a visitor prefers reduced motion, **When** the page loads, **Then** automatic transitions are disabled and manual navigation remains available.
4. **Given** JavaScript is disabled, **When** the homepage loads, **Then** a meaningful static featured photograph with caption and event link remains visible; archive navigation still works.
5. **Given** an image fails to load, **When** the page renders, **Then** its alt text/fallback is available without breaking the gallery or exposing a broken layout.

---

### User Story 3 - Explore speakers, code, materials, venues, and sponsors (Priority: P1)

An attendee opens an event page to revisit what was presented and find related materials. The page presents a concise event recap, approved speaker biographies and professional links, relevant CWMe GitHub repositories, presentation slides and downloadable files, a prominent venue acknowledgement, and any verified sponsor acknowledgements. A resource category is shown only when corresponding real data exists.

**Why this priority**: The archive becomes a reusable technical learning resource and a record of the people and organizations that contributed.

**Independent Test**: For a historical event with a GitHub project, speaker, files, venue, and sponsor, verify every link targets the correct resource and no unrelated organization or person is attributed to that event.

**Acceptance Scenarios**:

1. **Given** an event description links to a GitHub project, **When** its event page loads, **Then** the project appears under Resources with its verified repository name and working external link.
2. **Given** an event has an approved speaker biography, **When** its detail page loads, **Then** the speaker's name, biography, role/affiliation as applicable, and verified public professional links appear.
3. **Given** an event has a known venue, **When** its detail page loads, **Then** the venue receives a clearly labeled, prominent acknowledgement with name and public venue link when verified.
4. **Given** an event has verified sponsors, **When** its page loads, **Then** those sponsors are acknowledged distinctly from venue hosts and speakers.
5. **Given** slides or related documents are available, **When** the visitor opens the Resources section, **Then** each file has a descriptive label, type, and working download/view link.
6. **Given** a GitHub organization repository is unrelated to an event, **When** resources are assembled, **Then** it is not automatically attached solely because it belongs to CWMe.

---

### User Story 4 - Discover automatically, publish responsibly (Priority: P1)

A maintainer wants to minimize repetitive data entry without sacrificing accuracy or consent. A scheduled or manually triggered discovery process checks publicly accessible historical Meetup events and event descriptions, identifies potential public photo sources and GitHub links, and prepares draft changes. New photos and speaker bios are **not published until a designated organizer explicitly approves them**. Public event metadata may be published automatically after validation under a documented policy. Previously approved content remains available if an external source is temporarily unavailable.

**Why this priority**: This realizes the chosen hybrid workflow and prevents unreviewed people-focused imagery or inaccurate speaker biographies from appearing publicly.

**Independent Test**: Discover a new completed Meetup event with public photos and a linked repo; verify the event record is validated, images/bios remain unpublished until approved, and the approved material appears after publishing without manual editing of the site's HTML.

**Acceptance Scenarios**:

1. **Given** a newly completed public Meetup event, **When** the scheduled discovery runs, **Then** it creates or updates a canonical event record without duplicates.
2. **Given** a public Meetup photo is discovered, **When** it has not been approved, **Then** it is stored as a review candidate only and is not visible on the public site.
3. **Given** an organizer approves a photo and its event association, **When** the approved content is published, **Then** it can appear in the event gallery and, if featured, the homepage slideshow.
4. **Given** a speaker biography is discovered or proposed, **When** it is unapproved, **Then** it is not published; the event can still display a verified speaker name where appropriate.
5. **Given** a discovery job fails, **When** it completes, **Then** the last known-good published archive remains intact and the failure is reported to maintainers.
6. **Given** the same event is discovered repeatedly, **When** refresh runs again, **Then** its canonical event ID is updated in place without duplicating records or overriding curated approvals.

---

### User Story 5 - Maintain trust, privacy, and accessibility (Priority: P2)

A visitor can use the archive comfortably on mobile, with a keyboard, and with assistive technology. A maintainer can remove an image or correct an attribution promptly. Public content is not sourced from the private member directory, and the system respects source permissions, licensing, consent, and removal requests.

**Why this priority**: A public archive containing recognizable people requires stronger review and removal controls than a text-only events feed.

**Independent Test**: Test mobile and keyboard navigation, inspect published assets for private attendee data, and simulate a removal request to ensure an image is withdrawn from the homepage, detail page, and published media manifest.

**Acceptance Scenarios**:

1. **Given** a photo removal is approved, **When** the maintainer withdraws the photo, **Then** all public references to it are removed in the next publication cycle and cache invalidation is addressed where supported.
2. **Given** a visitor uses a screen reader, **When** navigating a gallery, **Then** controls, slide position, alt text, and event destinations are understandable.
3. **Given** a visitor has JavaScript disabled, **When** browsing the archive, **Then** the event list, event pages, resource links, and static slideshow fallback remain functional.
4. **Given** the archive is built, **When** its public files are inspected, **Then** no member-directory records, attendee exports, private contact details, or access credentials are present.

## Edge Cases

- **Meetup historical access is partial**: import all records actually discoverable; document gaps and allow verified manual backfill. Never claim full coverage if the source does not expose every event.
- **Meetup rate limits, login walls, or access restrictions**: respect terms and access controls; use only permitted public access paths, organizer-authorized exports, or manual curated submissions. Do not bypass restrictions or scrape private content.
- **Photos are publicly visible but reuse rights are unclear**: do not assume public visibility grants redistribution rights; hold as candidates until rights/permission and organizer approval are established. Prefer approved hosted URLs or permitted copies with attribution.
- **Images contain attendees, minors, or sensitive contexts**: apply organizer review, relevant event photography notice/consent practices, and prompt takedown procedures; do not infer personal identities from photographs.
- **Meetup photo URLs expire or block embedding**: use a permitted durable media strategy, detect broken URLs, and fall back gracefully.
- **Missing speaker bio or files**: omit missing sections rather than inventing text or linking unrelated resources.
- **Speaker changed affiliation**: preserve historically accurate attribution with a clear as-of context where needed; do not assume current employer.
- **Multiple speakers, venues, or sponsors**: support one-to-many relationships without arbitrarily limiting counts.
- **Venue versus sponsor**: preserve distinct roles; hosting a meetup does not automatically mean sponsoring it.
- **Duplicate events across platforms**: deduplicate by canonical source IDs and verified event identity; preserve alternate platform links as references.
- **Event date or title edited after occurrence**: update source-derived fields with provenance; preserve manual corrections and approvals.
- **External GitHub repository deleted, renamed, or private**: show only verified public links; flag dead links for review without breaking event pages.
- **Hundreds of events or thousands of photos**: paginate or progressively load archive results and lazy-load noncritical images while preserving navigability without JavaScript.
- **No approved photos yet**: render text-first event pages and a tasteful static fallback, never stock imagery presented as community history.
- **Cancelled, postponed, or virtual events**: distinguish status and virtual venue appropriately; do not count unheld events as completed.
- **Source job concurrent or partially failed**: write output atomically and retain the last successful manifest.
- **Reduced motion and low bandwidth**: disable autoplay for reduced motion, avoid autoplaying video, offer responsive images and lazy loading.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The website MUST expose a dedicated Past Events archive containing every verified completed Code With Me event discoverable from supported sources, with no arbitrary historical cutoff.
- **FR-002**: Each archived event MUST have a stable identifier, canonical event URL, verified title, event date in US Eastern, status, and a stable detail-page URL. Optional fields MUST be omitted rather than invented.
- **FR-003**: Archive entries MUST be ordered newest first by default and MUST remain reachable through pagination or equivalent accessible navigation at large scale.
- **FR-004**: The homepage MUST feature an auto-advancing slideshow using only approved real Code With Me photographs, each linked to the correct event; it MUST include manual controls and pause/play.
- **FR-005**: Autoplay MUST be disabled when `prefers-reduced-motion` is active; keyboard controls, accessible labels, alt text, and visible focus MUST be provided.
- **FR-006**: A static featured image/caption and all core archive/event links MUST remain usable without JavaScript.
- **FR-007**: Each event detail page MUST support an event-specific approved photo gallery, with captions, photo attribution/credit when required, and source provenance.
- **FR-008**: Event detail pages MUST support zero or more speakers, each with approved bio, public links, and role/affiliation when verified.
- **FR-009**: Event detail pages MUST support zero or more event-specific GitHub repositories, presentation decks, workshop files, documents, and other verified learning resources, with clear link labels.
- **FR-010**: The system MUST inspect public event descriptions for resource links and may discover candidates from `https://github.com/CWMe`; it MUST NOT associate a repository with an event without verified evidence.
- **FR-011**: Each event detail page MUST prominently acknowledge its verified venue/host when available, separately from sponsors, and link to official public pages where verified.
- **FR-012**: Sponsor credits MUST be shown only when their association with that event is supported by a source or organizer confirmation; a sponsor of one event MUST NOT be assumed to sponsor other events.
- **FR-013**: A discovery process MUST support scheduled runs and manual maintainer-triggered refresh, using permitted public Meetup data and approved organizer-provided source files as available.
- **FR-014**: The discovery process MUST preserve source references, last-discovered timestamps, validation results, and the difference between source-derived fields and curated fields.
- **FR-015**: Newly discovered photos and speaker biographies MUST remain unpublished pending explicit organizer approval; approvals MUST record reviewer, timestamp, and approved content/version.
- **FR-016**: The publishing process MUST never overwrite approved editorial content or restore removed photos merely because they reappear in an external feed.
- **FR-017**: Maintainers MUST be able to approve/reject candidate media and bios, add verified missing events/resources, edit attributions, feature/unfeature slides, and withdraw published content through a documented low-maintenance workflow (for example, reviewed GitHub data changes).
- **FR-018**: Publication MUST use static generated assets/data compatible with the site's static-hosting and no-client-build-step architecture; any automation runs outside the visitor-facing website.
- **FR-019**: Failed discovery or publication MUST retain the last known-good published data and report actionable errors; output MUST be validated and written atomically.
- **FR-020**: Public output MUST contain no private member-directory information, private attendee lists, private contact information, tokens, or secrets; feature `004-member-list` MUST remain isolated and admin-only.
- **FR-021**: Publicly accessible Meetup photos MUST NOT be republished without confirming permitted use/hosting and organizer approval; restricted content MUST NOT be bypassed or downloaded through unauthorized access.
- **FR-022**: The feature MUST provide a documented photo correction/removal procedure and MUST support removing a photo from all published galleries, homepage manifests, and controlled copies.
- **FR-023**: Images MUST be optimized for mobile, use descriptive alt text, preserve aspect ratios, and lazy-load noncritical gallery content; layout MUST not shift excessively during loading.
- **FR-024**: External resource links MUST use safe link attributes, be keyboard accessible, and be checked for validity during import or periodic maintenance.
- **FR-025**: The site MUST clearly distinguish completed events, events with incomplete evidence, and any explicitly retained cancelled-event records; no fake event, bio, photo, or sponsorship credit may appear.
- **FR-026**: The system MUST expose a visible source/freshness or archival coverage note, so visitors do not mistake partial Meetup historical access for a guaranteed complete archive.
- **FR-027**: Event detail URLs and archive links MUST be stable and shareable, with descriptive page titles and basic metadata suitable for social previews where supported by the static architecture.
- **FR-028**: The implementation MUST preserve the current upcoming-events functionality from `001-live-events`, avoiding duplication of future events in the completed-event archive.

### Key Entities

- **Archived Event**: canonical event ID; source/platform ID; title; description/recap; start/end dates; US Eastern display date; event status; canonical URL; optional venue; source timestamps; verification status; last discovery time; stable detail URL. Relationships: zero-to-many photos, speakers, resources, sponsors; optional venue(s).
- **Event Photo**: media ID; event ID; source URL; permitted publication URL or approved asset; caption; alt text; credit; usage permission evidence; approval status; approver; approval timestamp; featured flag; withdrawal status. Only approved/non-withdrawn photos are public.
- **Speaker**: stable speaker ID; display name; optional historical role/affiliation; approved biography; verified public links; approval metadata. Relationship: many-to-many with events, with event-specific talk/title where available.
- **Resource**: ID; event ID; type (GitHub, slides, document, demo, recording, other); title; public URL; source/provenance; link-validation status.
- **Venue**: name; public URL; optional location; event-specific role (venue, host, partner); verification source.
- **Sponsor**: organization name; public URL; optional logo with usage rights; event-specific contribution/credit; verification source.
- **Discovery Candidate**: source reference; proposed event/media/bio/resource changes; validation outcome; pending/rejected/approved status; review notes.
- **Publication Manifest**: validated, versioned static representation of published events and approved assets, with last successful generation timestamp.

### Assumptions and Dependencies

- Official sources: `https://www.meetup.com/code-with-me/` and public individual event pages; GitHub organization: `https://github.com/CWMe`.
- Example source event supplied by organizer: `https://www.meetup.com/code-with-me/events/316665764/`. Its actual title, photos, venue, speaker, and resources must be verified during ingestion; none are presumed by this specification.
- Meetup's public data interfaces and photo reuse permissions are not guaranteed; source-access feasibility MUST be validated before choosing an ingestion method. If public automation is blocked, use organizer-authorized exports/manual import and keep the hybrid review process.
- Approval can be implemented through a reviewed repository workflow; this specification does not mandate building an authenticated admin dashboard.
- Public event metadata may be automatically published only after validation; new photos and bios always require explicit review.
- A documented photography/privacy policy and practical takedown contact are required before public launch of the media showcase.

## Success Criteria *(mandatory)*

- **SC-001**: 100% of imported published event records link to a real verified completed Code With Me event, with no invented entries.
- **SC-002**: 100% of discovered and source-accessible completed historical events are represented or logged with a specific import/review exception; inaccessible history is identified as a coverage gap.
- **SC-003**: 0 unapproved photos or speaker biographies appear in public manifests or pages during prelaunch and regression tests.
- **SC-004**: 100% of displayed event-specific GitHub, venue, sponsor, and speaker links are backed by source evidence or organizer confirmation.
- **SC-005**: A visitor can reach an event's detail page from the archive and its linked resource (when present) in no more than three interactions from the archive entry.
- **SC-006**: Slideshow supports automatic advance, pause/play, manual navigation, keyboard navigation, and reduced-motion disabling in browser tests.
- **SC-007**: The archive, event pages, and static slideshow fallback remain readable and navigable with JavaScript disabled.
- **SC-008**: A failed refresh leaves the previous valid published archive intact; repeated imports do not create duplicate events.
- **SC-009**: A test photo withdrawal removes it from the next published homepage and event manifests and all controlled public asset references.
- **SC-010**: Public artifact inspection finds zero private member-directory records, attendee exports, or credentials.

## Out of Scope

- Rebuilding or exposing the admin-only member directory (`004-member-list`).
- Facial recognition, attendee identification, or automated tagging of individuals in photographs.
- Automatic publishing of unreviewed photographs or biographies.
- A requirement to host every historical photo locally or to bypass Meetup access/usage restrictions.
- A new account/login system solely for public archive visitors.
- Fabricating event recaps, speaker affiliations, venue relationships, or sponsor credits when evidence is absent.

## Implementation Readiness / Validation Gates

1. Confirm how historical Meetup events and public photos can be accessed legally and reliably; document rate limits, authorization, reuse rights, and fallbacks.
2. Inventory the current website's static hosting, file layout, and current event feed to avoid conflicts with `001-live-events`.
3. Define canonical event identity, deduplication, static manifest schema, and approved-content override rules.
4. Establish an organizer review and takedown process for images, bios, and disputed credits.
5. Pilot ingestion using the supplied Meetup event and at least two additional historical events representing different resource completeness levels.
6. Validate mobile layout, accessibility, JS-disabled fallback, link integrity, and rollback behavior before publishing broadly.
