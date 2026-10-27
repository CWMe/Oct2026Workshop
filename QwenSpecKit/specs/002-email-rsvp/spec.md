# Feature Specification: Event Signups (Email Capture)

**Feature Branch**: `002-email-rsvp`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Add waitlist / email-subscriber capture for event announcements (via a serverless email-capture service such as Formspree or Buttondown) plus a working unsubscribe path, replacing the site's current absence of any way to be notified when new events are announced."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Join the event announcement list (Priority: P1)

A visitor who wants to be notified when Code With Me announces new events finds
a clear "Get event announcements" signup (email, optional first name) on the
Events section and/or a prominent page location. They submit, get immediate
on-page confirmation, and receive the standard provider confirmation email in
their inbox. After confirming, they appear on the announcement list and
receive the next event-announcement email.

**Why this priority**: This is the core purpose of the feature — growing a
direct channel to the community without depending on social-network
algorithms. Without a working capture-to-list flow nothing else matters.

**Independent Test**: From a clean state, submit a valid email, watch the
on-page success state, complete the confirmation email link, and verify the
address appears as an active subscriber and receives the next announcement.

**Acceptance Scenarios**:

1. **Given** a visitor with a valid email,
   **When** they submit the signup form,
   **Then** they see an on-page success message telling them exactly what to
   expect ("Check your inbox to confirm your subscription") within 2 seconds.
2. **Given** a visitor submitted a valid signup,
   **When** they click the confirmation link in the provider email,
   **Then** they see a confirmation page and their address becomes an active
   subscriber.
3. **Given** a visitor enters an invalid email (e.g., missing the @),
   **When** they submit,
   **Then** they see a clear validation error next to the field and the
   address is not added anywhere.
4. **Given** a visitor's address is already subscribed,
   **When** they submit again,
   **Then** they see a friendly "you're already on the list" state (or the
   provider's equivalent) — no duplicate subscription, no error.

---

### User Story 2 - Leave the list (unsubscribe) (Priority: P2)

A subscriber who no longer wants announcements uses the one-click
unsubscribe link in any email (or finds the unsubscribe page on the site),
gives one instruction, and is done. Their address is immediately excluded
from future sends, and they can re-subscribe at any time if they change
their mind.

**Why this priority**: Legal requirement (CAN-SPAM/privacy law) and trust
requirement — a list that can't be left is a liability for the community and
a deal-breaker for sponsors. It's cheap to build with the provider but must
work end-to-end.

**Independent Test**: From a confirmed list email, click unsubscribe; confirm
the address is removed from the provider's active list and no longer receives
test sends; then re-subscribe and confirm it works.

**Acceptance Scenarios**:

1. **Given** a subscriber who receives an announcement,
   **When** they click the one-click unsubscribe link,
   **Then** they are removed from future sends without needing to re-auth or
   answer questions, and see a clear "you've been unsubscribed" state.
2. **Given** a subscriber who unsubscribed by mistake,
   **When** they return to the signup and submit their address again,
   **Then** the full subscribe flow works again normally.
3. **Given** any email the community sends to the list,
   **When** it is opened,
   **Then** it includes a visible one-click unsubscribe, a valid
   from-address for the community, and the community's public physical
   mailing location (per CAN-SPAM).

---

### User Story 3 - Community data stays clean, safe, and private (Priority: P3)

A community maintainer wants the list to be low-maintenance and low-risk:
spam is rejected, the same person can't accidentally create dozens of
subscriptions, personal data is stored only with the approved email provider
(never in the site repository), and every collection point has a visible,
plain-language "what we collect and why" note.

**Why this priority**: Protects the community from spam-driven
blacklisting (which would block real event announcements to everyone) and
keeps the project Constitution-compliant (PII handled appropriately, no
secrets in repo).

**Independent Test**: Submit obviously junk emails and duplicate bursts;
verify none land on the active list. Search the site repository; verify no
subscriber address, API key, or token appears anywhere; verify the signup
has a visible privacy line naming the provider and purpose.

**Acceptance Scenarios**:

1. **Given** a burst of rapid duplicate submissions from one address,
   **When** they complete the flow,
   **Then** the list contains at most one active entry for that address.
2. **Given** a maintainer adds/rotates the provider's API secret,
   **When** the site is deployed,
   **Then** the secret is not present anywhere in the site repository (no
   committed key in HTML, CSS, JS, or data files).
3. **Given** a visitor reads the signup form,
   **When** they look for the privacy note,
   **Then** it is visible without scrolling past the form and states plainly:
   what data is collected (email, optional name), with whom it is stored
   (the named provider), why (event announcements), and how to leave
   (one-click unsubscribe in every email).

---

### Edge Cases

- **Invalid / typos in email**: field-level validation; provider-side
  validation as second gate; typos surfaced by the provider when possible.
- **Provider outage at submit time**: on-page error with a friendly fallback
  ("Try again in a few minutes, or email us directly at <community address>")
  — never a silent failure that pretends success.
- **Unconfirmed after 7+ days**: subscriber is never treated as active and
  never receives announcements (double opt-in enforced).
- **Double opt-in already done, resubmit**: "already subscribed" state, no
  duplicate.
- **Address removed by provider (bounce/spam)**: excluded from all future
  sends without a re-confirmation requirement (re-subscribe flow available).
- **Visitor with JavaScript disabled**: the signup form submits as a plain
  HTML form and still works (Constitution II).
- **Small screens/mobile keyboards**: the email field gets a mobile-friendly
  (e-mail) keyboard; no horizontal scroll; button is easily tappable.
- **Multiple signups per person (different addresses)**: allowed (their
  choice); no account system.
- **Time zones / locale**: dates in confirmation emails are US Eastern with
  explicit time zone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Signup MUST collect an email address (required) and a first
  name (optional, clearly marked).
- **FR-002**: Signup MUST use a double opt-in flow — no address enters the
  active list without the person confirming via the provider's email link.
- **FR-003**: On submit, the site MUST show an on-page success state
  (including the "check your inbox" instruction) or a specific error state;
  submission MUST never be silent.
- **FR-004**: Every announcement email the community sends MUST include a
  working one-click unsubscribe, a recognizable from-name/address for the
  community, and the community's public physical mailing location.
- **FR-005**: The one-click unsubscribe MUST be a single instruction and MUST
  take effect before the next scheduled send.
- **FR-006**: Unsubscribed addresses MUST be able to re-subscribe at any
  time through the normal flow.
- **FR-007**: Duplicate submissions from an already-active address MUST
  resolve to an "already subscribed" state, not an error and not a duplicate.
- **FR-008**: Each collection point MUST display a visible, plain-language
  privacy note (data collected, provider named, purpose, how to leave).
- **FR-009**: Subscriber personal data MUST be stored only with the approved
  email provider; no subscriber addresses, provider API secrets/tokens, or
  credentials may appear anywhere in the site repository.
- **FR-010**: Signup MUST work with JavaScript disabled via a plain HTML
  form submission to the approved provider.
- **FR-011**: The signup MUST include provider-appropriate abuse
  protection (e.g., provider rate limiting / anti-spam), and rapid duplicate
  bursts MUST result in at most one active subscription per address.
- **FR-012**: The signup MUST be reachable from the Events section and from
  at least one other prominent location (e.g., footer or a CTA band) without
  requiring a search.
- **FR-013**: When the provider is unreachable, the site MUST show a
  friendly error with a fallback contact path (public community email) —
  never a silent failure or a fake success.

### Key Entities

- **Subscriber**: one person's email address (+ optional first name);
  states: pending (submitted, unconfirmed) → active (confirmed) →
  unsubscribed/removed. Relationships: belongs to exactly one list
  ("event announcements"); never shared with, or sold to, third parties
  other than the named provider.
- **List (event announcements)**: the single community mailing list;
  contains only active subscribers; sends only event-announcement and
  community-news messages.
- **Submission record**: provider-side log entry (address, timestamp,
  source); used only for anti-spam/dedup; governed by the provider's
  privacy policy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can go from landing page to confirmed
  subscription in under 2 minutes (excluding their time finding their inbox).
- **SC-002**: 100% of announcement emails contain working one-click
  unsubscribe, correct from-address, and the public mailing address (verified
  by sending a test email each time the template changes).
- **SC-003**: An unsubscribed address is excluded from the very next test
  send (verified within one send cycle).
- **SC-004**: A burst of 10 rapid duplicate submissions yields at most 1
  active subscription for that address.
- **SC-005**: Scanning the site repository finds zero subscriber addresses,
  provider API keys, or tokens (100% of checks pass; a re-scan after any
  provider secret change also passes).
- **SC-006**: With the provider out, a submitter sees a specific error and a
  working fallback contact within the same page load — zero silent failures.
- **SC-007**: At least 95% of valid, confirmed signups receive the next
  scheduled event-announcement email (measured per send, provider bounce
  complaints ≈ 0).

## Assumptions

- The community's official email-capture provider is Buttondown or Formspree
  (exact choice is a plan-level decision); the public community email
  already exists as a fallback contact.
- One list ("event announcements"): no per-topic preferences, no account
  system, no purchase/transactional emails — those are out of scope for this
  feature.
- The audience is US-based (CAN-SPAM); the provider's own terms cover
  additional privacy obligations (GDPR/CCPA) via their standard consent and
  deletion mechanisms — the site reuses them rather than inventing its own.
- Double opt-in is the default (industry standard for list builders; also
  the strongest anti-spam posture).
- Announcement cadence is low-frequency (roughly around event announcements);
  the site does not add a separate "email frequency" preference in v1.
- Provider secrets live where the hosting platform's secret store puts them,
  injected at deploy time — never committed.
- Existing site layout changes only to add the visible signups; other
  sections are untouched.
- The "already subscribed / already unsubscribed" user-facing text is kept
  friendly and non-accusatory.
