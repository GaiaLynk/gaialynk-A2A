# Agent IM Website Entry Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a multilingual Phase 1 website entry that prioritizes developer activation through a single primary CTA while preserving secondary conversion paths.

**Architecture:** Build an isolated Next.js app under `packages/website` with locale-prefixed routing, centralized content dictionaries, and typed analytics helpers. Keep content static-first and production claims constrained to current product capability.

**Tech Stack:** Next.js, React, TypeScript strict, Tailwind CSS, Vitest (for utility behavior tests)

---

## Chunk 1: Foundation and Tooling

### Task 1: Initialize website package

**Files:**
- Create: `packages/website/package.json`
- Create: `packages/website/tsconfig.json`
- Create: `packages/website/next.config.ts`
- Create: `packages/website/postcss.config.js`
- Create: `packages/website/tailwind.config.ts`
- Create: `packages/website/src/app/globals.css`
- Modify: `package.json`

- [ ] **Step 1: Add scripts and dependency scaffolding**
- [ ] **Step 2: Add root script aliases (`dev:website`, `build:website`)**
- [ ] **Step 3: Install dependencies and verify install lockfiles are consistent**

Run: `npm install`  
Expected: install completes with no unresolved dependency errors.

### Task 2: Add test target for website utilities

**Files:**
- Modify: `vitest.config.ts`
- Create: `packages/website/tests/i18n.test.ts`
- Create: `packages/website/tests/analytics.test.ts`

- [ ] **Step 1: Write failing tests for locale normalization and event payload guard**
- [ ] **Step 2: Run tests and verify expected failures**
- [ ] **Step 3: Implement minimal utility code to pass tests**
- [ ] **Step 4: Re-run tests and verify pass**

Run: `npm test`  
Expected: all server tests and new website utility tests pass.

---

## Chunk 2: i18n Routing and Core Pages

### Task 3: Implement locale router contract

**Files:**
- Create: `packages/website/src/lib/i18n/locales.ts`
- Create: `packages/website/src/lib/i18n/paths.ts`
- Create: `packages/website/src/middleware.ts`
- Create: `packages/website/src/app/[locale]/layout.tsx`
- Create: `packages/website/src/app/page.tsx`

- [ ] **Step 1: Implement locale constants and type-safe parser**
- [ ] **Step 2: Add redirect from root to `/en`**
- [ ] **Step 3: Add middleware cookie strategy for preferred locale**
- [ ] **Step 4: Verify route handling manually in dev server**

Run: `npm run dev:website`  
Expected: `/` redirects to `/en`, and locale paths render.

### Task 4: Implement content dictionaries

**Files:**
- Create: `packages/website/src/content/types.ts`
- Create: `packages/website/src/content/dictionaries.ts`

- [ ] **Step 1: Define shared page copy schema**
- [ ] **Step 2: Add EN/zh-Hant/zh-Hans core copy for MVP pages**
- [ ] **Step 3: Ensure terminology consistency in dictionary layer**

Run: `npm test`  
Expected: content access tests (if any) and utilities stay green.

---

## Chunk 3: Conversion Surfaces and Analytics Hooks

### Task 5: Build page surfaces with CTA hierarchy

**Files:**
- Create: `packages/website/src/app/[locale]/page.tsx`
- Create: `packages/website/src/app/[locale]/developers/page.tsx`
- Create: `packages/website/src/app/[locale]/trust/page.tsx`
- Create: `packages/website/src/app/[locale]/use-cases/page.tsx`
- Create: `packages/website/src/app/[locale]/use-cases/[slug]/page.tsx`
- Create: `packages/website/src/app/[locale]/waitlist/page.tsx`
- Create: `packages/website/src/app/[locale]/demo/page.tsx`
- Create: `packages/website/src/app/[locale]/docs/page.tsx`
- Create: `packages/website/src/components/cta-link.tsx`
- Create: `packages/website/src/components/lang-switcher.tsx`

- [ ] **Step 1: Render hero with single primary CTA (`Start Building`)**
- [ ] **Step 2: Render secondary CTA band below hero**
- [ ] **Step 3: Add key page shells and internal links**
- [ ] **Step 4: Verify locale switch keeps path parity where possible**

Run: `npm run dev:website`  
Expected: all core pages are reachable under each locale.

### Task 6: Add typed analytics helpers

**Files:**
- Create: `packages/website/src/lib/analytics/events.ts`
- Create: `packages/website/src/lib/analytics/track.ts`

- [ ] **Step 1: Add typed event names and required fields**
- [ ] **Step 2: Add payload normalization helper**
- [ ] **Step 3: Integrate no-op client tracker hook points on CTA interactions**
- [ ] **Step 4: Verify tests cover payload requirements**

Run: `npm test`  
Expected: analytics tests pass; required fields are enforced.

---

## Chunk 4: Quality and Handoff

### Task 7: Baseline verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add website run instructions**
- [ ] **Step 2: Run test suite**
- [ ] **Step 3: Run type checks (root and website)**
- [ ] **Step 4: Capture unresolved risks and next experiments**

Run: `npm test && npm run typecheck && npm run typecheck:website`  
Expected: all commands pass.

### Task 8: Post-launch iteration checklist

**Files:**
- Create: `docs/Website-Entry-Weekly-Review-Template.md`

- [ ] **Step 1: Add weekly funnel review template**
- [ ] **Step 2: Add language quality review checklist**
- [ ] **Step 3: Add experiment backlog fields**

Run: `npm run build:website`  
Expected: website build passes for deployment baseline.

---

Plan complete and saved to `docs/superpowers/plans/2026-03-15-agent-im-website-entry-phase1.md`.
