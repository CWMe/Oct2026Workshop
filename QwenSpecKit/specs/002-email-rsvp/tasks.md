# Tasks: Event Signups (Email Capture)

**Input**: Design documents from `/specs/002-email-rsvp/`
- spec.md (user stories US1-P1, US2-P2, US3-P3, FR-001…FR-013, SC-001…SC-007)
- plan.md — **currently the unfilled template**; T001/T002 close this gap
- checklists/requirements.md (spec passed)
- research.md / data-model.md / contracts/ — not present for this feature
- `.specify/memory/constitution.md` v1.0.0 (binding: static-first, no build step, design tokens in `css/styles.css`, no secrets in repo, WCAG 2.1 AA, new pages in nav)

**Tests**: This Constitution uses manual browser verification (no build, no JS/test framework). "Independent Test" criteria below are executable as the manual scripts in `specs/002-email-rsvp/quickstart.md`.

**Provider decision (drives several tasks)**: **Buttondown** — chosen from the spec's approved pair (Buttondown/Formspree) because it natively provides double opt-in, one-click unsubscribe, provider-side rate limiting/dedup, and a plain-HTML form endpoint, all of which satisfy FR-002/FR-005/FR-010/FR-011 without a backend.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1/US2/US3 from spec.md (setup, foundational, and polish tasks carry no story label)

## Path Conventions

Single static project at repository root (existing layout):

```text
index.html      Single-page site (all sections)
css/styles.css  Design tokens (:root custom properties) + all styles
js/main.js      Nav, scroll reveal, small interactions
js/subscribe.js NEW — progressive enhancement for the signup form
specs/002-email-rsvp/   This feature's artifacts (incl. quickstart.md, checklists/)
```

---

## Phase 1: Setup (Provider & Plan)

**Purpose**: Approve and configure the email provider; fill the empty plan.md so Constitution III (documented, version-pinned dependency) and the "justified in plan.md" gate are satisfied before any UI work.

- [ ] T001 Create the `event announcements` list on Buttondown with double opt-in ON, one-click unsubscribe enabled, and provider rate limiting / anti-spam enabled; capture the public subscribe endpoint URL and the version-pinned embed snippet URL into `specs/002-email-rsvp/plan.md`. Verify the provider's confirmation email and unsubscribe link render correctly by subscribing a test address and unsubscribing it.
- [ ] T002 [P] Fill in `specs/002-email-rsvp/plan.md`: replace all template placeholders — Summary, Technical Context (static HTML/CSS/JS site, no build step, provider = Buttondown with justification + version-pinned URL per Constitution III, storage = provider-side only, testing = manual browser verification), Project Structure (tree above), and Constitution Check (pass against I–V)
- [ ] T003 [P] Confirm the public community fallback email (used by FR-013 error states) exists and record it in `specs/002-email-rsvp/plan.md` under Technical Context; if none exists, create it with the community mailbox provider before any error-state UI is built

**Checkpoint**: Provider list live, plan.md complete and Constitution-compliant — UI work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared form styles and shared JS behavior that BOTH signup locations (Events section + second prominent location per FR-012) will reuse. No user story work should start before this.

**⚠️ CRITICAL**: All user story phases depend on Phase 2.

- [ ] T004 Add the shared signup-form block to `css/styles.css` using only the existing `:root` design tokens (add new custom properties to `:root` if needed, never one-off values per Constitution V): classes for `.subscribe-form`, `.subscribe-form .field`, `.subscribe-form .btn`, and the three state banners `.subscribe-success`, `.subscribe-error`, `.subscribe-dup`; must work at 320px with no horizontal scroll and pass 4.5:1 contrast on the existing dark theme
- [ ] T005 [P] Create `js/subscribe.js`: progressive enhancement ONLY (Constitution II) — intercepts form submit, POSTs to the Buttondown public endpoint fetched as JSON, and renders one of the Phase 2 banners: success ("Check your inbox to confirm your subscription" — FR-003, within 2s), specific error with the public community email fallback (FR-013, edge case "Provider outage"), or friendly "you're already on the list" state (FR-007); on any JS failure it must fall back gracefully to the plain `<form action>` POST. No localStorage, sessionStorage, or cookies (FR-009, US3)

**Checkpoint**: Foundation ready — opening `index.html` with JS disabled still yields plain, styled, working forms after Phase 3.

---

## Phase 3: User Story 1 - Join the event announcement list (Priority: P1) 🎯 MVP

**Goal**: A visitor can sign up (email required, first name optional) from the Events section and one other prominent location, get immediate on-page feedback, double-opt-in via the provider email, and become an active subscriber (FR-001, FR-002, FR-003, FR-007, FR-010, FR-012, SC-001).

**Independent Test**: `python -m http.server 8000` → submit a valid email from the Events-section form → see the success banner in <2s → no console errors and no data stored (DevTools → Application tab empty) → complete the Buttondown confirmation link in the test inbox → address shows as active in the Buttondown dashboard → submit the same address again → "already on the list" banner. Repeat with JS disabled (devtools settings) and confirm the plain POST still reaches Buttondown.

### Implementation for User Story 1

- [ ] T006 [US1] Add the "Get event announcements" form in the `#events` section of `index.html`: `<form method="POST" action="<Buttondown public endpoint>" accept-charset="UTF-8">` (plain HTML, FR-010) with (a) required email field — `type="email"`, `inputmode="email"`, `autocomplete="email"`, visible `<label>`; (b) optional first-name field — clearly marked "(optional)" (FR-001); (c) visible privacy note stating what is collected (email, optional first name), that it is stored with **Buttondown**, why (event announcements only), and how to leave (one-click unsubscribe in every email) (FR-008); (d) hidden button-down form fields per the version-pinned snippet from T001. Use the `.subscribe-form` classes from T004 and reference `js/subscribe.js`; the form must submit as a plain form with JS off
- [ ] T007 [US1] Add a second signup in a prominent location in `index.html` (the CTA band above the footer): same form markup and fields as T006 so both points share one CSS/JS path (FR-012); reuse the identical `action` and classes — do not duplicate styles
- [ ] T008 [US1] Wire `js/subscribe.js` (T005) to BOTH forms: bind to all `.subscribe-form` elements, render the T005 banners next to the submitting form (`aria-live="polite"` for screen readers, Constitution I), and on HTTP/network failure show the specific error + `mailto:` fallback link to the community email from T003 (FR-013, SC-006 — never a silent failure or fake success)
- [ ] T009 [US1] Create `specs/002-email-rsvp/quickstart.md` with the executable US1 verification script: clean-state subscribe → 2s success banner → confirm via provider email → active subscriber receives a test announcement → invalid email (missing @) shows field-level error and nothing is recorded → resubmit → "already on the list" → JS-disabled path works → mobile check (e-mail keyboard on the email field, no horizontal scroll at 320px, tappable button)

**Checkpoint**: MVP — the capture-to-active-subscriber flow works end-to-end with zero console errors, JS-off included.

---

## Phase 4: User Story 2 - Leave the list (unsubscribe) (Priority: P2)

**Goal**: One-click unsubscribe in every email (provider-side) plus a visible on-site "leave the list" path; unsubscribed addresses are excluded from the next send and can re-subscribe (FR-004, FR-005, FR-006, SC-002, SC-003).

**Independent Test**: From a confirmed test address, open an announcement → click one-click unsubscribe in the email → Buttondown dashboard shows the address unsubscribed/removed → the very next test send does not include it (SC-003) → the same address re-subscribes through the index.html form → confirmation → back on the active list (FR-006).

### Implementation for User Story 2

- [ ] T010 [US2] Configure the Buttondown campaign/announcement template (provider dashboard — no repo files): from-name "Code With Me" with a valid community from-address, the Buttondown one-click unsubscribe link in the footer, and the community's public physical mailing location (CAN-SPAM, FR-004); send a test email to the confirmed test address and verify all three elements render and the unsubscribe link resolves (SC-002); record the template name in `specs/002-email-rsvp/quickstart.md`
- [ ] T011 [US2] Add an on-site unsubscribe path in `index.html`: a one-line "Prefer not to receive emails? You can leave the list any time via the one-click unsubscribe link in any email — or write to <community email>." inside the `.subscribe-dup`-adjacent area of BOTH forms (T006, T007), plus a "Leave the list" link in the footer; use existing tokens in `css/styles.css` — no new one-off values
- [ ] T012 [US2] Execute and record the US2 script in `specs/002-email-rsvp/quickstart.md`: unsubscribe-from-email → excluded from immediately following test send (SC-003) → re-subscribe → full confirm flow works again (FR-006, SC-003); assert no re-auth or questions anywhere in the flow (Acceptance Scenario 2.1)

**Checkpoint**: US1 AND US2 independently functional — the legal unsubscribe path is live.

---

## Phase 5: User Story 3 - Community data stays clean, safe, and private (Priority: P3)

**Goal**: Spam rejected, dedup holds under bursts, zero PII/secrets in the repository, and the privacy note is visible at every collection point (FR-008, FR-009, FR-011, SC-004, SC-005).

**Independent Test**: Rapid-fire 10 duplicate submissions from one address → Buttondown dashboard shows at most 1 active entry (SC-004) → `grep`-style repo scan shows zero subscriber addresses, API keys, or tokens (SC-005) → each signup block shows the privacy line (provider named, purpose, how to leave) without scrolling past the form.

### Implementation for User Story 3

- [ ] T013 [P] [US3] Abuse/dedup verification (provider dashboard + browser): submit 10 rapid duplicate entries for one test address (SC-004, FR-011) and two obviously junk addresses; confirm at most 1 active entry and no active junk; enable/confirm Buttondown rate limiting if not already on (T001) and record the burst result in `specs/002-email-rsvp/quickstart.md`
- [ ] T014 [P] [US3] Repository hygiene scan: search `index.html`, `css/styles.css`, `js/main.js`, `js/subscribe.js` for API keys, tokens, and any real subscriber emails (the scan must find only the public community fallback email and the Buttondown *public* endpoint); create `specs/002-email-rsvp/checklists/secrets-scan.md` recording the scan command, date, and pass status; verify `.gitignore` (or equivalent) keeps any local provider config out of VCS (FR-009, SC-005)
- [ ] T015 [US3] Privacy-note audit on `index.html` for BOTH collection points: the note is visible without scrolling past the form and states plainly (a) data collected — email + optional first name, (b) stored with **Buttondown** by name, (c) purpose — event announcements only, (d) how to leave — one-click unsubscribe in every email (FR-008, US3 Acceptance Scenario 3); fix wording in `index.html` where short
- [ ] T016 [P] [US3] Confirm `js/subscribe.js` performs no client-side storage or third-party calls beyond the Buttondown endpoint: no `localStorage`, `sessionStorage`, `document.cookie`, analytics, or extra fetch targets; write the finding into `specs/002-email-rsvp/checklists/secrets-scan.md` (Constitution IV/V, FR-009)

**Checkpoint**: All three user stories independently functional and verifiable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, docs, and full spec-coverage sign-off.

- [ ] T017 [P] Accessibility + mobile pass in `css/styles.css` and `index.html`: both forms labeled, keyboard-operable with visible focus (≥4.5:1, `prefers-reduced-motion` respected), no horizontal overflow 320px→2560px, `e-mail` keyboard on the email field, all new external links carry `rel="noopener"` (Constitution security note), no console errors (Constitution V)
- [ ] T018 [P] Update `README.md`: add the email-capture feature to the Features list, name the provider (Buttondown) and the list, and document how a maintainer manages the list / rotates provider settings **without committing secrets** (Constitution IV + security constraint)
- [ ] T019 Final coverage audit: verify every FR (FR-001…FR-013) and every success criterion (SC-001…SC-007) maps to a completed task or a completed quickstart.md check; fill any gap as a new task before closing; run the complete `specs/002-email-rsvp/quickstart.md` start-to-finish one last time and record pass/fail per line

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 first (endpoint + provider behavior needed by T008); T002/T003 independent of T001
- **Foundational (Phase 2)**: Depends on T001 (endpoint URL baked into T005/T008) — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Phase 2 (T004+T005)
  - US1 has no dependency on US2/US3; US2's on-site text (T011) slots next to US1 forms but is independently verifiable via the provider flow; US3 is pure verification — needs US1 forms present (T006) for the audit (T015)
- **Polish (Phase 6)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: starts after Phase 2 — no dependency on other stories
- **US2 (P2)**: mostly provider-side config (T010, T012) independent of US1 UI; T011 requires T006/T007 to exist
- **US3 (P3)**: T013/T014/T016 parallelizable once T005–T008 exist; T015 requires both forms (T006, T007)

### Within Each User Story

- Provider/infra configuration → UI markup → JS wiring → manual verification script
- Core implementation before final audit

### Parallel Opportunities

- T002 ∥ T003 (Phase 1, different concerns)
- **T004 ∥ T005** (Phase 2 — CSS vs JS, different files)
- **T013 ∥ T014 ∥ T016** (all of US3's first wave — dashboard, repo scan, code review)
- T017 ∥ T018 (Polish — one touches index.html/css/styles.css, the other README.md only)
- Once Phase 2 lands and US1 forms exist: a second maintainer can run US2 (T010/T012) in parallel with US1's quickstart (T009)

---

## Parallel Example: Phase 2

```bash
# Two maintainers, two files, zero shared state:
Maintainer A: "Add shared signup-form styles in css/styles.css"       (T004)
Maintainer B: "Create js/subscribe.js state banners + fallback POST"  (T005)
# Merge T004's class names before starting T006 (single point of contract)
```

## Parallel Example: US3 first wave

```bash
# All three independent — different surfaces (dashboard / repo / code):
Task: "10x duplicate burst + junk-address test in Buttondown" (T013)
Task: "secret/PII scan + checklists/secrets-scan.md"         (T014)
Task: "confirm js/subscribe.js stores/leaks nothing"         (T016)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (provider + plan.md) → 2. Phase 2 (styles + JS) → 3. Phase 3 (US1)
4. **STOP and VALIDATE**: run `quickstart.md` US1 script end-to-end (double opt-in, dedup state, JS-off)
5. Ship — the community can now grow a direct channel

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → verify → **MVP live**
3. US2 → verify unsubscribe + re-subscribe → legal requirement satisfied
4. US3 → verify hygiene/scans → Constitution IV/V evidence collected
5. Polish → full FR/SC coverage audit → close

### Parallel Team Strategy

1. One maintainer: T001–T005 (sequential-ish, T002/T003/T005 parallelizable)
2. US1 forms (T006–T008) → then:
   - Maintainer A: US2 (T010 → T011 → T012)
   - Maintainer B: US3 wave (T013 ∥ T014 ∥ T016 → T015)
3. Polish (T017 ∥ T018 → T019)

---

## Notes

- [P] = different files, no dependency on incomplete tasks
- [US1]/[US2]/[US3] map tasks to spec.md user stories for traceability
- Every task's "definition of done" includes manual browser verification per Constitution Development Workflow step 5
- Provider dashboard actions (T001, T010, T013) produce evidence in `quickstart.md` — the repo never stores the evidence's subject data (FR-009)
- Commit after each task or logical group; stop at any checkpoint to validate independently
