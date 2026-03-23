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

## In Progress

- [ ] **Registration Flow Bug** — App loads at localhost:3002, registration page renders, but `@prisma/client` module resolution error on Next.js 14. Needs `npx prisma generate` to complete on user's machine.

## Remaining

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
