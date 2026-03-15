# Agent IM Website Entry Design (Phase 1)

## 1. Goal and Scope

Build a multilingual (EN, zh-Hant, zh-Hans) official website entry for Agent IM that prioritizes developer activation while preserving secondary business conversion paths.

In-scope:
- Home page with single primary CTA (`Start Building`)
- Developer entry page
- Trust page
- Use-cases index and detail pages
- Waitlist and Demo pages
- Locale routing and language switch behavior
- Analytics event schema integration points

Out-of-scope:
- Heavy CMS integration
- Complex marketing automation
- High-maintenance motion system
- New backend APIs coupled to core mainline

## 2. Product Narrative

Primary narrative:
- Agent IM is a trustworthy invocation network for agent collaboration.

Interaction principle:
- Users understand value in 10 seconds and take a meaningful next step within 60 seconds.

CTA hierarchy:
- Primary (hero): `Start Building`
- Secondary (below hero): `Book a Demo`, `Join Waitlist`

## 3. Information Architecture

Locale-prefixed routes:
- `/en`
- `/zh-Hant`
- `/zh-Hans`

Core pages:
- `/[locale]` Home
- `/[locale]/developers`
- `/[locale]/trust`
- `/[locale]/use-cases`
- `/[locale]/use-cases/[slug]`
- `/[locale]/waitlist`
- `/[locale]/demo`
- `/[locale]/docs` (docs entry or redirect page)

Routing rules:
- `/` redirects to `/en`
- Language switch preserves current route path
- Preferred locale persisted via cookie

## 4. Content Model

Each page locale content should provide:
- `title`
- `description`
- `primaryCta`
- `seoTitle`
- `seoDescription`

Term glossary is centralized and aligned across locales:
- Trustworthy Invocation
- Review Queue
- Receipt
- Audit Trail

## 5. UX and Visual System

Design constraints:
- Clear hierarchy and restrained visual language
- One conclusion and two actions above the fold
- Motion used only for comprehension cues
- Mobile-first key path validation

Section pattern for all major pages:
1. Problem
2. Solution
3. Evidence
4. Action

## 6. Analytics and Funnel

Required events:
- `page_view`
- `cta_click`
- `docs_click`
- `demo_click`
- `waitlist_submit`
- `demo_submit`
- `lang_switch`

Required event fields:
- `locale`
- `page`
- `referrer`
- `timestamp`

Recommended fields:
- `cta_id`
- `source`
- `device_type`

Primary developer funnel:
- `page_view(home)` -> `cta_click(start_building)` -> `docs_click` -> `activation_event`

## 7. Engineering Approach

Stack:
- Next.js App Router
- TypeScript strict
- Tailwind CSS
- Static-first content delivery

Code organization:
- `packages/website/src/app/[locale]/...` for route surfaces
- `packages/website/src/lib/i18n/...` for locale validation and routing helpers
- `packages/website/src/lib/analytics/...` for event typing and payload normalization
- `packages/website/src/content/...` for localized copy payloads

## 8. Quality Gates (Definition of Done)

- Primary CTA path is accessible and obvious on all locales
- Locale switching has no dead links
- Mandatory analytics payload fields are enforced by type/validation
- Mobile and desktop key journeys are functional
- External claims match phase-accurate product capability

## 9. Risks and Mitigations

Risk: narrative drift away from one-page strategy  
Mitigation: content source references strategy and phase acceptance docs.

Risk: multilingual inconsistency  
Mitigation: centralized locale content schema and shared glossary.

Risk: conversion dilution by too many actions  
Mitigation: strict CTA hierarchy with one primary hero action.

## 10. Deliverables

1. Running website entry app scaffold in `packages/website`
2. Locale routing and switching foundation
3. Core page set implementation
4. Analytics schema helper and integration points
5. Phase 1 execution plan document
