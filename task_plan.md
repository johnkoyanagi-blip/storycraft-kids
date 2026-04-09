# StoryCraft Kids — Task Plan

## Completed

- [x] **Design & Planning** — Brainstormed with user, explored 3 architecture approaches, created full design spec (8 sections) and implementation plan (28 tasks, 11 chunks)
- [x] **Project Scaffold** — Next.js 14 with TypeScript, Tailwind, Prisma, NextAuth
- [x] **Database Schema** — 6 models: Account, ChildProfile, Story, StoryBeat, Page, ContentFlag
- [x] **Auth System** — NextAuth with credentials provider, JWT sessions, 7-day expiry
- [x] **Story Engine** — Claude API integration, story context management, content filter (blocklist + AI classifier), arc manager, beat generation with retries
- [x] **Image Pipeline** — Genre-based style configs (6 genres), Replicate SDXL integration, fallback backgrounds
- [x] **Drawing Canvas** — Fabric.js freehand drawing with undo/redo, background compositing
- [x] **PDF Export** — jsPDF A5 landscape format, 3 layout options (classic, full-bleed, side-by-side)
- [x] **All 11 API Routes** — Auth, profiles, stories CRUD, beats, illustrations, upload, export, share, admin flags
- [x] **All 12 Pages** — Login, register, profiles, library, story wizard, story builder, illustrate, preview, print, share, admin
- [x] **20 Components** — UI primitives, wizard steps, story views, canvas tools, book viewer
- [x] **Test Suite** — 23 tests across 7 files (unit + integration)
- [x] **SQLite Migration** — Switched from PostgreSQL to SQLite for zero-config local dev
- [x] **In-Memory Cache** — Replaced Redis with Map-based cache for local dev
- [x] **TypeScript & ESLint Fixes** — 0 type errors, 0 lint errors
- [x] **Claude API integration working** — Model `claude-sonnet-4-6`, credits purchased, API key wired
- [x] **Interactive story UX** — editable narrative, inline save, big Continue button, Undo/Rewrite quick actions, first-beat auto-generation, illustration mode suppressed for first 2 beats
- [x] **Fabric.js v7 drawing canvas** — rewrote hook for v7 API (named imports, Promise APIs, `backgroundImage` as property). Callback-ref pattern so Fabric initializes when the canvas mounts inside a conditionally-rendered screen.
- [x] **Undo/Redo fix** — tracks pre-mutation snapshots so each undo actually rolls back one step. Handles `object:added`/`modified`/`removed`, suppresses history during programmatic loads.
- [x] **AI illustration pipeline fix** — generate endpoint derives `sceneDescription` from the latest beat itself; creates/updates the Page row; fallback prompt if beat text is too short.
- [x] **Same-origin image proxy** — `/api/proxy-image` with Replicate hostname allowlist, used by `setBackgroundImage` for any cross-origin URL, so CORS never blocks Fabric and `toDataURL` stays untainted.
- [x] **Upload endpoint Draw-Everything-Myself fix** — creates a Page record if one doesn't exist so saved drawings persist in all three modes.
- [x] **View My Book link** — added to both the main story screen and the illustration-moment screen, routing to `/story/[storyId]/preview` (which already renders the FlipbookViewer composite pages).

## In Progress

_(nothing)_

## Remaining

- [ ] **Drawing tools feature pass (deferred from this session)** — user picked all four: Shapes (circle/square/line), Stickers/stamps, Fill bucket, Text tool
- [ ] **End-to-end verification in the browser** — confirm AI background actually loads, undo works, View My Book shows saved drawings
- [ ] **API key rotation** — old Anthropic key `sk-ant-api03-qK1-...` may still be exposed in transcript
- [ ] **Task 23: E2E Flow Test** — End-to-end test covering register → create profile → start story → generate beat → illustrate → export
- [ ] **Task 24: Loading States & UX Polish** — Skeleton screens, error boundaries, transition animations
- [ ] **Task 25: Deploy Config** — Vercel/Railway deployment setup, production database migration
- [ ] **Story Title Generation** — Auto-generate story title from first few beats
- [ ] **Parent Dashboard** — Content flag review, story management
- [ ] **Mobile Responsiveness** — Touch-friendly canvas, responsive layouts

## Key Decisions

- **SQLite over PostgreSQL** for local dev — no Docker dependency, simpler setup
- **In-memory cache over Redis** for local dev — data resets on server restart, but fine for development
- **Next.js 14 pinned** — next-auth v4 not compatible with Next.js 16 (which npm audit force-installed)
- **Fabric.js for drawing** — provides undo/redo, compositing, and export out of the box
- **Data URL storage for MVP** — images stored as base64 in DB, abstraction layer ready for S3/R2
