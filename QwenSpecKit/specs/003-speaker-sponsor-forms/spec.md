# Feature Specification: Speaker & Sponsor Forms

**Feature Branch**: `003-speaker-sponsor-forms`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Replace the bare mailto: links in Get-Involved with structured 'I want to speak' and 'I want to sponsor' forms — routed to the community's inbox or a form backend, with proper validation, spam protection, confirmation, and a privacy note."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit a speaker proposal (Priority: P1)

A developer who wants to share something at a Code With Me event fills out
the "I want to speak" form: a few structured fields (name, contact method,
talk topic + short description, preferred format/duration, experience level
target, optional links). They instantly see a confirmation with a realistic
expectation ("we'll review and reply within ~[N] business days"), and the
organizers receive a clean, structured proposal they can act on directly —
no more parsing free-form emails for "what is the talk even about?".

**Why this priority**: This is the most direct path to the community's core
content (real speakers at real events). Structured proposals are what let
organizers plan events quickly; today's bare `mailto:` link loses speakers
to friction and scatters unstructured data.

**Independent Test**: Fill and submit a complete proposal, verify the on-page
confirmation appears, and confirm the organizers see a structured submission
with all fields present and a working reply path; submit an empty/invalid
one and verify clear validation errors.

**Acceptance Scenarios**:

1. **Given** a person with a valid email and a few sentences about a talk
   idea,
   **When** they submit the speaker form,
   **Then** they see a confirmation state within 2 seconds — including a
   clear "what happens next + realistic reply timeframe" and the
   community's fallback contact.
2. **Given** an event organizer with a new structured proposal,
   **When** they read it,
   **Then** all key info is clearly labeled (speaker, contact, topic,
   description, format/duration, level) with no free-form parsing required
   to identify the speaker or the talk.
3. **Given** the speaker leaves a required field empty,
   **When** they submit,
   **Then** they get a clear inline validation on exactly which fields are
   missing/invalid, and nothing is sent out as a broken submission.
4. **Given** a speaker who changes their mind,
   **When** they re-submit an improved version shortly after,
   **Then** the organizer can see/tell them apart (timestamps present, or the
   earlier one is clearly an earlier draft) — no silently merged records.

---

### User Story 2 - Submit a sponsorship inquiry (Priority: P2)

A company wants to sponsor Code With Me and uses the "I want to sponsor"
form instead of guessing what to put in an email. It collects the structured
info that matters to the sponsor team: company, contact person, role,
contact method, which sponsorship level/interest they're in (with the
community's current tier/budget hints), what they hope to get, and any
specific event timing. They get a confirmation with a realistic reply
expectation; the organizer gets a clean, comparable submission.

**Why this priority**: Sponsorship is a real, recurring revenue source that
keeps the community free to attend. A structured intake lowers friction for
a company's decision flow (they need to know what to put, it should look
professional) and gives organizers a comparable basis for quoting.

**Independent Test**: Fill and submit a complete sponsorship inquiry, verify
confirmation appears, and confirm the organizer sees a structured submission
(company, contact, role/tier of interest, budget hint, what they want,
timing) with a working reply path; invalid submissions get clear inline
validation.

**Acceptance Scenarios**:

1. **Given** a company contact with a budget/level in mind,
   **When** they submit the sponsor form,
   **Then** they see a confirmation with a realistic reply timeframe and the
   community's fallback contact, and the submission records their stated
   level/interest clearly.
2. **Given** a sponsor whose interest is "not sure which tier yet",
   **When** they submit,
   **Then** the form lets them express that (an "unsure / interested in
   discussing" option is available) without forcing them into a wrong
   tier.
3. **Given** an organizer comparing two sponsor inquiries received the same
   week,
   **When** they review them,
   **Then** both have the same labeled fields (company, contact, role,
   level/interest, budget hint, ask, timing) so they can be compared
   directly.

---

### User Story 3 - Submissions stay safe, private, and low-spam (Priority: P3)

A community maintainer wants the intake forms to be low-maintenance and
low-risk: spam is filtered out or clearly marked, personal data is not
stored in the repository, every form has a visible "what we collect and
why" note, and submissions route to the community's inbox (or an approved
form backend) in a structured, readable format — never silently lost.

**Why this priority**: Protects the community from junk submissions cluttering
the inbox, keeps the project Constitution-compliant (PII / no secrets in
repo), and gives submitters confidence their data is handled appropriately.

**Independent Test**: Submit obviously junk (missing contact, spammy text)
and a burst of duplicates; verify none become actionable submissions (or are
obviously quarantined). Scan the site repository for secrets / PII. Read each
form's privacy note and confirm it names what's collected, why, and who it
goes to.

**Acceptance Scenarios**:

1. **Given** a junk submission (obviously automated, missing real contact),
   **When** it is processed,
   **Then** it is not delivered to organizers as an actionable proposal —
   or is clearly flagged/quarantined if it does arrive.
2. **Given** a maintainer audits the site repository,
   **When** they search for secrets/PII,
   **Then** no form backend API keys, inbox credentials, or real subscriber
   PII appear anywhere (all routed via an approved backend/store outside the
   repo).
3. **Given** a first-time submitters reading either form,
   **When** they look for the privacy note,
   **Then** it is visible on the form (not hidden in a footer link) and
   plainly says: which fields, why they're collected, who receives them
   (the community inbox / approved backend), and how long they're retained
   (or that they're deleted after the decision).

---

### Edge Cases

- **Required field missing / invalid email**: clear inline validation before
  anything is sent; nothing arrives as a broken submission.
- **Spam burst from one source**: dedup / rate-limit so they don't flood the
  inbox; at most one actionable-looking submission per burst.
- **Duplicate re-submission (legit, refined version)**: both arrive
  (with timestamps), clearly ordered — not merged or silently dropped.
- **Form backend outage at submit**: on-page error with a visible fallback —
  the community's public email address (so the raw `mailto:` path still
  works as last resort) — never a silent failure or fake success.
- **A sponsor picking a tier that's no longer offered**: the "unsure /
  interested in discussing" option avoids a wrong hard commitment.
- **Visitor with JavaScript disabled**: both forms submit as plain HTML
  forms to the approved backend and still work (Constitution II).
- **Small screens**: fields stack vertically, tappable inputs, no horizontal
  scroll, submit button reachable.
- **Very long talk description**: multi-line field with a generous but sane
  cap; truncation never hides the core idea.
- **Non-English / mixed-language submissions**: accepted; organizers handle
  follow-up in the sender's language or coordinate — the form does not
  reject based on language.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A dedicated "I want to speak" form MUST be available,
  collecting at minimum: speaker name, a working contact method
  (email required), talk topic/title, a short description, preferred format
  and rough duration, target experience level, and optional links (profile /
  past talks).
- **FR-002**: A dedicated "I want to sponsor" form MUST be available,
  collecting at minimum: company, contact person name, role, a working
  contact method (email required), sponsorship level/interest (with at least
  one "unsure / interested in discussing" option), rough budget or tier
  hint, what they want to get, and any timing preference.
- **FR-003**: Both forms MUST enforce required vs. optional fields with
  clear inline validation on submit — no invalid/empty submissions reach the
  organizer.
- **FR-004**: Both forms MUST provide an on-page confirmation state on
  success, including a clear "what happens next + realistic reply timeframe"
  and the community's public fallback contact.
- **FR-005**: The forms MUST include provider-appropriate spam / abuse
  protection (e.g., honeypot / rate limit / reCAPTCHA or equivalent), and
  must not forward obviously junk submissions as actionable items.
- **FR-006**: Both forms MUST display a visible privacy note on the form
  itself (not only in a footer) stating: which fields are collected, why,
  who receives them, and their retention/deletion policy.
- **FR-007**: Form backend API keys, inbox credentials, and any real PII
  MUST NOT appear anywhere in the site repository; submissions MUST be
  stored only in the approved backend / community inbox outside the repo.
- **FR-008**: When the form backend is unreachable, the site MUST show a
  friendly error with the community's public email address as an explicit
  fallback — never a silent failure or a fake success.
- **FR-009**: Both forms MUST work with JavaScript disabled as plain HTML
  form submissions to the approved backend (Constitution II).
- **FR-010**: Submissions MUST be delivered to organizers in a clearly
  labeled, structured, readable format (fields named, not a blob), with a
  timestamp and a working reply path.
- **FR-011**: The two forms MUST be visually and contextually distinct
  (different headings, framing, and default field emphasis) so a speaker
  doesn't accidentally fill the sponsor form and vice versa.

### Key Entities

- **Speaker Proposal**: one person's intent to speak; fields: name,
  contact, topic, description, format/duration, level, optional links;
  relationships: routes to the community inbox/approved backend; not shared
  with third parties except to deliver it to organizers.
- **Sponsor Inquiry**: one company's interest in sponsoring; fields:
  company, contact person, role, contact, level/interest, budget hint, ask,
  timing; relationships: routes the same way; the "level/interest" field is
  an expressed preference, not a binding commitment.
- **Form Backend (approved)**: the external service that validates (spam,
  duplicates), stores, and delivers submissions to the community inbox /
  an approved storage location outside the repository; the sole place
  form submission data is handled.
- **Privacy Note**: the visible per-form statement of what is collected,
  why, who receives it, and retention; a first-class part of each form, not
  an afterthought.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A person with a talk idea can go from the "Get Involved"
  section to a confirmed submission in under 3 minutes (excluding their
  time writing the description).
- **SC-002**: 100% of valid, complete submissions are received by the
  organizer within one business day in a structured, readable format with a
  working reply path (verified on each submission).
- **SC-003**: A burst of 10 spam/duplicate submissions produces at most 1
  actionable-looking item (or clearly quarantined items) reaching the
  organizer.
- **SC-004**: Both forms, with required fields intentionally left empty,
  produce clear inline validation and zero broken submissions reaching the
  organizer (100% of test cases).
- **SC-005**: A scan of the site repository finds zero form backend keys,
  inbox credentials, or real subscriber PII (100% of checks pass; re-checks
  after any backend config change also pass).
- **SC-006**: With the form backend out, a submitter sees a specific error
  and the community's public fallback email on the same page load — zero
  silent failures or fake successes.
- **SC-007**: Both forms, as plain HTML with JavaScript disabled, still
  submit and confirm (or error to the fallback) for the same field set —
  verified on at least one real browser.

## Assumptions

- The community already has a public email address usable as a fallback
  contact; the exact form backend (Formspree, FormSubmit, Buttondown, or
  equivalent) and whether submissions land in the inbox vs. a dashboard is a
  plan-level decision.
- The existing "Get Involved" section (Attend / Speak / Sponsor) remains the
  host for these forms; this feature replaces only the Speak and Sponsor
  `mailto:` CTAs, leaving Attend pointing to Meetup.
- The sponsor "level/interest" options reflect the community's current real
  offerings (e.g., the tiers listed publicly); an "unsure" option is always
  offered so no one feels forced into a wrong tier.
- Reply timeframe shown in the confirmation is a reasonable community
  commitment (plan-level to settle the exact number, but the form commits to
  a number in the confirmation).
- No account creation, no login, no follow-up scheduling tooling in v1 —
  those are out of scope; organizers manage follow-up in their existing
  workflow.
- PII in submissions is used only to conduct the speaker/sponsor decision
  and deleted on the community's stated schedule (plan-level to name the
  exact schedule; the form's privacy note must always state one).
- The site layout outside the Get-Involved section is unchanged.
