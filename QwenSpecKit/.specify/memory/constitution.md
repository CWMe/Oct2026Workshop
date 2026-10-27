# Code With Me Constitution
<!-- The binding principles for the Code With Me community website.
     Every spec, plan, task, and implementation MUST comply. -->

## Core Principles

### I. Free & Accessible (NON-NEGOTIABLE)
All community-facing features are and remain free. There are no paywalls,
trial limits, or gated content in the website.
Accessibility is a first-class requirement: pages target WCAG 2.1 AA
(semantic landmarks, keyboard operability, visible focus states, color
contrast ≥ 4.5:1, `prefers-reduced-motion` respected). Features that cannot
be used by a screen-reader user or on a low-end mobile connection are not
shipped.

### II. Static-First, Zero Build Requirement (NON-NEGOTIABLE)
The default deployment target is a plain static host (GitHub Pages,
Netlify, S3). Pages must render fully with JavaScript disabled:
interactive enhancement is progressive only. No client-side build step,
npm install, or server process is required to view the site. Any feature
that needs dynamic data (e.g., live events) MUST be pre-generated into
static artifacts (JSON/HTML) by a documented CI or offline script — no new
runtime backend without an explicit, approved spec.

### III. Lightweight Dependencies
The site avoids external runtime dependencies. Every added dependency
(a JS library, webfont, third-party service, email provider) must be
justified in the feature's `plan.md`, must be version-pinned, and must have
a documented reason. Google Fonts usage is acceptable with system-font
fallbacks. Anything client-side that loads third-party scripts (analytics,
widgets) requires explicit community approval in the spec.

### IV. Community Voice & Trust
Copy and design preserve the "Smarter Together" identity: warm,
kind, developer-flavored, no dark patterns. Sponsorship and partnership
branding is always visually and textually distinct from community content
and labeled as such. PII collected (e.g., email for waitlists) is stored
only where legally appropriate, with a visible privacy/unsubscribe path.
Real data only: event listings, member counts, and partner references MUST
trace to a real public source (e.g., Meetup) or be clearly labeled as
representative.

### V. Quality & Simplicity
Code must be readable by a new volunteer maintainer: no clever
abstractions, no premature optimization, no speculative features (YAGNI).
HTML/CSS/JS is hand-verifiable in a browser; CSS uses the existing
design-token system in `css/styles.css` rather than one-off values. Every
page must pass: valid HTML (no unclosed elements), no console errors,
works in current Chrome/Firefox/Safari on desktop and mobile widths.

## Additional Constraints

- **Design system**: all visual tokens (colors, radii, shadows, spacing
  scale, typography) come from the `:root` custom properties in
  `css/styles.css`. Extensions add tokens there rather than hard-coding.
- **Responsive**: layouts must work from 320px to 2560px with no
  horizontal overflow.
- **Content source of truth**: community facts (events, partners,
  organizers) live in data files (e.g., `data/*.json` or Markdown) that
  are separate from presentation, so they can be regenerated or edited
  without touching layout code.
- **Security**: no secrets in the repository; external links carry
  `rel="noopener"`; forms POST only to approved, documented providers.
- **SEO**: meaningful `<title>`, meta description, and semantic headings
  on every page; new pages are added to the site navigation.

## Development Workflow

1. **Specify** — a feature spec (`specs/NNN-slug/spec.md`) exists and is
   approved before implementation work begins.
2. **Plan** — technical plan, data model, and contracts are produced and
   checked against the Constitution.
3. **Clarify (optional)** — ambiguous requirements are resolved and
   documented in the spec *before* planning.
4. **Tasks** — work is decomposed into independently verifiable tasks.
5. **Implement** — each task's definition of done includes: manual browser
   verification at mobile and desktop widths, console-error check, and a
   checklist confirming spec coverage.
6. **Converge/Analyze** — before completion, remaining gaps are assessed
   and appended as tasks; cross-artifact consistency is verified.

## Governance

- This Constitution supersedes all other guidance, templates, and agent
  defaults in this repository.
- Any plan, task list, or implementation that conflicts with a
  NON-NEGOTIABLE principle must be rejected and reworked in place;
  exceptions require a documented amendment.
- Amendments: propose via a PR that (a) edits this file, (b) bumps the
  version, (c) records the rationale, and (d) notes any existing code or
  specs that must migrate. Amendments are approved by the community
  maintainers of this repository.
- Compliance check: reviewers of any PR must verify the change set against
  the Core Principles and the feature's `specs/NNN-slug/` artifacts.

**Version**: 1.0.0 | **Ratified**: 2026-10-27 | **Last Amended**: 2026-10-27
