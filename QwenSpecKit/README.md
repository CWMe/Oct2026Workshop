# Code With Me — Community Website (Spec Kit Edition)

A modern, professional, single-page website for **Code With Me**, the technology
community serving Northern Virginia and Washington, DC — set up for **spec-driven
development** with [GitHub Spec Kit](https://github.com/github/spec-kit).

> **Smarter Together.**

## Spec Kit setup

- Initialized with `specify init --here --integration pi` (CLI v1.2.4, PowerShell scripts)
- Slash prompts live in `.pi/prompts/` → invoke as `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`, `/speckit.converge`
- Binding principles: `.specify/memory/constitution.md` (v1.0.0) — free & accessible, static-first, lightweight deps, community voice, quality gates
- Workflow: `.specify/workflows/speckit/workflow.yml`; templates in `.specify/templates/`; project scripts in `.specify/scripts/powershell/`

**Typical feature loop** (per feature):
1. `/speckit.specify 001-short-goal-description` → `specs/001-slug/spec.md`
2. `/speckit.clarify` (optional, before planning)
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.analyze` / `/speckit.checklist` (optional quality gates)
6. `/speckit.implement`, then `/speckit.converge` to close gaps

Planned features (see conversation history for details): `001-live-events` (Meetup → `events.json` via CI), `002-email-rsvp`, `003-speaker-sponsor-forms`.

## Features

- ✅ Responsive layout (mobile → widescreen) with sticky, blur navbar & mobile menu
- ✅ Dark, developer-themed design with gradient accents and an animated code window
- ✅ Sections: Hero, About, What We Do, Events, Partners, Get Involved, CTA, Footer
- ✅ Scroll-reveal animations (disabled under `prefers-reduced-motion`)
- ✅ Accessible: skip link, semantic landmarks, ARIA on nav toggle, visible focus rings
- ✅ Zero build step, zero JS dependencies — plain HTML/CSS/JS

## Run it

No build required. Either open `index.html` directly, or serve it:

```bash
python -m http.server 8000
# → http://localhost:8000
```

## Structure

```
index.html      Single-page site (all sections)
css/styles.css  Design tokens + all styles
js/main.js      Nav, scroll reveal, small interactions
```

## Customize

- **Colors**: edit the `:root` tokens at the top of `css/styles.css`.
- **Events**: the event cards in `#events` are representative — update copy/dates,
  or link them to live Meetup event URLs.
- **Sponsorship/speaker contact**: currently `mailto:` links — swap for a contact
  form or page when available.

## Sources

Content is based on the public Meetup profile: https://www.meetup.com/code-with-me/
