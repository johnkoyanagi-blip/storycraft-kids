# StoryCraft Kids — Complete Project Handover

> Last updated: 2026-05-19
> For use with Claude Code sessions. This is the single source of truth.

---

## 1. What Is This Project?

**StoryCraft Kids** is an interactive creative writing web app for children ages 6-12. The primary user is Milly (age ~8), the developer's daughter. Kids pick a genre, setting, characters, and theme via a wizard, then the app generates a branching interactive story using Claude AI. At key moments, kids can illustrate their story using a drawing canvas (optionally with AI-generated backgrounds from Replicate SDXL). The finished story can be viewed as a flipbook and exported to PDF.

**Owner:** John Koyanagi (john.koyanagi@googlemail.com)
**Repo:** https://github.com/johnkoyanagi-blip/storycraft-kids.git
**Branch:** `main`
**Port:** 3002

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js (App Router) | 14.2.35 | **Pinned** — NextAuth v4 is incompatible with Next.js 16 |
| Language | TypeScript | ^5 | Strict mode off |
| Styling | Tailwind CSS | ^3.4.1 | |
| Database | Prisma + SQLite | Prisma ^6.19.2 | `file:./dev.db` — zero-config, no Docker needed |
| Auth | NextAuth.js | v4.24.13 | Credentials provider, JWT sessions (7-day), bcryptjs |
| Drawing | Fabric.js | **v7.2.0** | **CRITICAL**: Complete rewrite from v5. See Section 9. |
| Story AI | Anthropic Claude API | SDK ^0.80.0 | Model: `claude-sonnet-4-6` |
| Image AI | Replicate SDXL | SDK ^1.4.0 | `stability-ai/sdxl`, 800×640 output |
| PDF | jsPDF | ^4.2.1 | A5 landscape export |
| Icons | lucide-react | ^0.577.0 | |
| IDs | nanoid + uuid | | |
| Testing | Vitest | ^4.1.0 | + @testing-library/react, @testing-library/jest-dom |
| Caching | In-memory Map | | Replaced Redis for local dev (see `src/lib/redis.ts`) |

---

## 3. Quick Start

```bash
# If cloning fresh:
git clone https://github.com/johnkoyanagi-blip/storycraft-kids.git
cd storycraft-kids
npm install
npx prisma generate
npx prisma db push

# Start dev server:
npx next dev -p 3002
```

Open http://localhost:3002

### Environment Variables

The `.env.local` file should already exist with working keys. If starting fresh, copy `.env.example`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="any-random-string"
NEXTAUTH_URL="http://localhost:3002"
ANTHROPIC_API_KEY="sk-ant-..."       # Required for story generation
REPLICATE_API_TOKEN="r8_..."         # Required for AI illustrations ($5 credit on account)
```

**⚠️ API Key Warning:** The Anthropic key was previously exposed in a chat transcript and should be rotated.

R2/Cloudflare storage keys are in `.env.example` but NOT used — images are stored as base64 data URLs in SQLite for now. The `src/lib/storage.ts` abstraction is ready for S3/R2 swap.

### Windows/OneDrive Issue

The `.next` build cache can get locked by OneDrive sync. If you see EBUSY errors:
```bash
rmdir /s /q .next
npx next dev -p 3002
```

---

## 4. Complete Project Structure

```
storycraft-kids/
├── prisma/
│   ├── schema.prisma              # 6 models: Account, ChildProfile, Story, StoryBeat, Page, ContentFlag
│   └── dev.db                     # SQLite database (gitignored, created by prisma db push)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page (hero + CTA)
│   │   ├── layout.tsx             # Root layout with <SessionProvider>
│   │   ├── globals.css            # Tailwind imports + custom styles
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx     # Login form → NextAuth credentials
│   │   │   └── register/page.tsx  # Registration form → POST /api/auth/register
│   │   ├── profiles/page.tsx      # Child profile selection/creation screen
│   │   ├── library/page.tsx       # Story library (list, favorites)
│   │   ├── story/
│   │   │   ├── new/page.tsx       # 4-step wizard: Genre → Setting → Character → Theme
│   │   │   └── [storyId]/
│   │   │       ├── page.tsx       # Main story view (read + continue + choices)
│   │   │       ├── illustrate/page.tsx   # Drawing canvas + AI illustration (3 modes)
│   │   │       ├── preview/page.tsx      # "View My Book" flipbook
│   │   │       └── print/page.tsx        # Print-friendly view
│   │   ├── share/[token]/page.tsx # Public read-only share view (no auth)
│   │   ├── admin/flags/page.tsx   # Content flag review panel
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │       │   └── register/route.ts        # POST: create Account (bcrypt hash)
│   │       ├── profiles/route.ts            # GET: list profiles, POST: create profile
│   │       ├── stories/
│   │       │   ├── route.ts                 # GET: list stories, POST: create story
│   │       │   └── [storyId]/
│   │       │       ├── route.ts             # GET: story + beats, PATCH: update story
│   │       │       ├── beats/route.ts       # POST: generate next beat via Claude
│   │       │       └── share/route.ts       # POST: create share token, DELETE: revoke
│   │       ├── illustrations/generate/route.ts  # POST: generate AI background via Replicate
│   │       ├── proxy-image/route.ts         # GET: CORS proxy for Replicate CDN images
│   │       ├── upload/route.ts              # POST: save drawing (data URL → Page record)
│   │       ├── export/[storyId]/route.ts    # GET: PDF export (jsPDF A5 landscape)
│   │       ├── share/[token]/route.ts       # GET: public share data
│   │       └── admin/flags/route.ts         # GET/POST: content flag management
│   ├── components/
│   │   ├── ui/                              # Primitives
│   │   │   ├── button.tsx                   # <Button variant="primary|ghost" loading={bool}>
│   │   │   ├── card.tsx                     # <Card> wrapper
│   │   │   ├── input.tsx                    # <Input> form field
│   │   │   └── loading-spinner.tsx          # Spinner with message
│   │   ├── providers.tsx                    # NextAuth <SessionProvider> wrapper
│   │   ├── wizard/                          # Story creation wizard
│   │   │   ├── wizard-shell.tsx             # Multi-step wizard container
│   │   │   ├── genre-picker.tsx             # Step 1: fairy tale, adventure, sci-fi, mystery, funny, spooky
│   │   │   ├── setting-picker.tsx           # Step 2: setting selection
│   │   │   ├── character-creator.tsx        # Step 3: name + description
│   │   │   └── theme-picker.tsx             # Step 4: theme selection
│   │   ├── story/                           # Story display
│   │   │   ├── story-view.tsx               # Main story display + choice/input panel
│   │   │   ├── choice-panel.tsx             # Clickable choice buttons
│   │   │   ├── beat-display.tsx             # Story text rendering
│   │   │   └── free-input.tsx               # Free text input field
│   │   ├── canvas/                          # Drawing tools
│   │   │   ├── drawing-canvas.tsx           # forwardRef wrapper around <canvas>
│   │   │   ├── toolbar.tsx                  # Pen/eraser/brush size/undo/redo/clear
│   │   │   └── color-palette.tsx            # Color picker grid
│   │   └── book/                            # Book view
│   │       ├── book-page.tsx                # Single page render
│   │       ├── flipbook-viewer.tsx          # Page-by-page flipbook
│   │       └── export-panel.tsx             # PDF export button
│   ├── hooks/
│   │   ├── use-drawing-canvas.ts            # ★ CRITICAL FILE — Fabric.js v7 canvas hook
│   │   ├── use-story-session.ts             # Story state: beats, choices, narrative, undo
│   │   └── use-profile.tsx                  # React context for active child profile
│   ├── lib/
│   │   ├── auth.ts                          # NextAuth config (credentials, JWT, 7-day sessions)
│   │   ├── db.ts                            # Prisma client singleton (global dev caching)
│   │   ├── redis.ts                         # In-memory Map cache (replaced actual Redis)
│   │   ├── storage.ts                       # Storage abstraction: DataUrlStorage (MVP), S3Storage, R2Storage stubs
│   │   ├── story-engine/
│   │   │   ├── generate-beat.ts             # Claude API call, 3 retries, JSON fence stripping
│   │   │   ├── prompts.ts                   # buildSystemPrompt() + buildBeatPrompt()
│   │   │   ├── arc-manager.ts               # Story arc: setup → rising_action → climax → resolution
│   │   │   ├── story-context.ts             # Builds StoryContext from DB data
│   │   │   ├── content-filter.ts            # 2-layer: blocklist regex + Claude Haiku AI classifier
│   │   │   └── sync-service.ts              # Sync utilities
│   │   ├── image-pipeline/
│   │   │   ├── generate-background.ts       # Replicate SDXL call (800×640, 2 retries, 10s backoff)
│   │   │   └── style-config.ts              # 6 genre art styles + negative prompt
│   │   └── pdf/
│   │       └── generate-pdf.ts              # jsPDF A5 landscape generation
│   └── types/
│       ├── story.ts                         # StoryCharacter, ArcPosition, StoryContext, BeatResponse
│       └── profile.ts                       # CreateProfileInput, ProfileResponse
├── tests/
│   ├── unit/
│   │   ├── story-engine/
│   │   │   ├── arc-manager.test.ts
│   │   │   ├── content-filter.test.ts
│   │   │   ├── generate-beat.test.ts
│   │   │   └── story-context.test.ts
│   │   └── image-pipeline/
│   │       └── style-config.test.ts
│   └── integration/
│       └── api/
│           ├── profiles.test.ts
│           └── register.test.ts
├── .env.example                             # Template with all env vars
├── .env.local                               # Actual keys (gitignored)
├── .env                                     # Should NOT be committed (gitignored)
├── .gitignore                               # node_modules, .next, .env*.local, prisma/dev.db, *.tsbuildinfo
├── content-blocklist.json                   # 16 terms (violence, drugs, profanity) — needs ~500 for prod
├── docker-compose.yml                       # PostgreSQL 16 + Redis 7 (for production, NOT used locally)
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts                         # globals: true, environment: node, @ → ./src
```

---

## 5. Database Schema (Prisma/SQLite)

Six models, all using `cuid()` IDs and `createdAt` timestamps. Column names use `snake_case` mapping (`@@map`).

**Account** — Parent login. Fields: `email` (unique), `passwordHash` (bcrypt).
**ChildProfile** → Account (cascade delete). Fields: `displayName`, `age`, `avatarUrl?`.
**Story** → ChildProfile (cascade delete). Fields: `title?`, `genre`, `setting`, `theme`, `artStyle`, `status` ("in_progress" | "completed"), `isFavorite`, `shareToken?` (unique), `shareRevokedAt?`, `updatedAt`.
**StoryBeat** → Story (cascade delete). Fields: `sequenceNumber`, `childChoice?`, `childInputType`, `generatedText`, `isIllustrationMoment`. Unique constraint: `(storyId, sequenceNumber)`.
**Page** → Story + StoryBeat (1:1 via unique `beatId`). Fields: `sequenceNumber`, `storyText`, `aiBackgroundUrl?`, `childDrawingUrl?`, `compositeUrl?`, `layoutTemplate` (default "classic"). Unique constraint: `(storyId, sequenceNumber)`.
**ContentFlag** → Story (cascade delete). Fields: `flaggedText`, `filterLayer`.

---

## 6. Application Flows

### 6.1 Registration & Login
1. `/register` → POST `/api/auth/register` → bcrypt hash → create Account
2. `/login` → NextAuth credentials provider → JWT session (7-day expiry)
3. After login → `/profiles` to select or create a child profile

### 6.2 Story Creation Wizard
1. `/story/new` → 4-step wizard: Genre → Setting → Character → Theme
2. POST `/api/stories` creates Story record with wizard data
3. Redirects to `/story/[storyId]`

### 6.3 Story Beat Generation
1. First beat auto-generates on mount (POST `/api/stories/[storyId]/beats` with "Begin the story")
2. User picks a choice button or types free input
3. Server builds `StoryContext` from all previous beats + story metadata
4. `generate-beat.ts` calls Claude with: system prompt (genre/setting/theme/characters/age guidance) + user prompt (narrative so far + arc guidance + child input)
5. Claude returns JSON: `{ storyText, choices[], illustrationMoment, arcPosition }`
6. JSON sometimes wrapped in markdown fences — stripped with regex before parsing
7. Content filter checks `storyText` — 2 layers: blocklist regex + Claude Haiku classifier
8. If flagged, retries (up to 3 attempts total)
9. If `illustrationMoment: true` AND `beatCount > 2`, UI shows illustration prompt

### 6.4 Story Arc
Managed by `ArcManager` class:
- Beats 0-1: `setup` (introduce characters/setting)
- Beats 2-7: `rising_action` (tension/adventure; suggest climax after beat 5)
- Beat 8+: `climax` (dramatic peak)
- After climax: `resolution` (wrap up warmly)

### 6.5 Illustration (3 Modes)
At `/story/[storyId]/illustrate`:
- **"Let AI Create It"** — Replicate SDXL generates the full illustration
- **"AI Background + My Drawing"** — AI background + user draws on top with Fabric.js canvas
- **"Draw Everything Myself"** — blank white canvas

AI generation flow:
1. POST `/api/illustrations/generate` with `{ storyId }`
2. API finds latest beat's `generatedText` as scene description
3. `generate-background.ts` calls Replicate SDXL (800×640, genre-specific style prefix, child-safe negative prompt)
4. Returns URL → client loads via `/api/proxy-image?url=<encoded>` (CORS proxy)
5. Image loaded into Fabric.js canvas via `_renderBackground` override

Drawing canvas specs:
- Fabric.js v7, 800×600px, `enableRetinaScaling: false`
- Tools: pen, eraser, color palette, brush sizes (3/5/8/12/20)
- Undo/redo via `lastSnapshotRef` pre-mutation pattern
- Save: POST `/api/upload` with canvas `toDataURL()` → stored on Page record

### 6.6 "View My Book" / Export
- `/story/[storyId]/preview` → FlipbookViewer renders each Page's `compositeUrl`
- Export panel → PDF download via jsPDF (A5 landscape)

### 6.7 Sharing
- POST `/api/stories/[storyId]/share` → generates random `shareToken`
- Public URL: `/share/[token]` — read-only, no auth required

### 6.8 Content Safety
1. **Blocklist** (`content-blocklist.json`) — 16 regex terms (kill, murder, blood, gore, weapon, gun, drug, alcohol, cigarette, vape, hate, racist, sexist, damn, hell, crap). Needs expansion to ~500 for production.
2. **AI classifier** (`content-filter.ts`) — Claude Haiku checks if text is appropriate for ages 6-12. Fails open if API errors.
3. **ContentFlag model** — records any flagged text for admin review at `/admin/flags`
4. **Illustration suppression** — first 2 beats never trigger illustration moments

---

## 7. TypeScript Types

```typescript
// src/types/story.ts
interface StoryCharacter { name: string; description: string; avatarUrl?: string; }
type ArcPosition = 'setup' | 'rising_action' | 'climax' | 'resolution';
interface StoryContext {
  storyId: string; genre: string; setting: string; theme: string;
  characters: StoryCharacter[]; arcPosition: ArcPosition;
  beatCount: number; fullNarrative: string; ageLevel: number;
}
interface BeatResponse {
  storyText: string; choices: string[];
  illustrationMoment: boolean; arcPosition: ArcPosition;
}

// src/types/profile.ts
interface CreateProfileInput { displayName: string; age: number; }
interface ProfileResponse { id: string; displayName: string; age: number; avatarUrl?: string; }
```

---

## 8. API Reference

| Method | Endpoint | Body/Params | Returns |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | `{ email, password }` | Account |
| GET | `/api/profiles` | — | `ChildProfile[]` |
| POST | `/api/profiles` | `{ displayName, age }` | ChildProfile |
| GET | `/api/stories` | — | `Story[]` (with beats) |
| POST | `/api/stories` | `{ childProfileId, genre, setting, theme, artStyle, character }` | Story |
| GET | `/api/stories/[storyId]` | — | Story with beats |
| PATCH | `/api/stories/[storyId]` | `{ title?, status?, isFavorite? }` | Story |
| POST | `/api/stories/[storyId]/beats` | `{ childInput, inputType }` | BeatResponse |
| POST | `/api/stories/[storyId]/share` | — | `{ shareToken, shareUrl }` |
| DELETE | `/api/stories/[storyId]/share` | — | `{ success }` |
| POST | `/api/illustrations/generate` | `{ storyId }` | `{ success, url }` or `{ success: false, fallbackColor }` |
| GET | `/api/proxy-image?url=<encoded>` | — | Proxied image bytes |
| POST | `/api/upload` | `{ storyId, compositeUrl, childDrawingUrl, aiBackgroundUrl }` | Page |
| GET | `/api/export/[storyId]` | — | PDF file |
| GET | `/api/share/[token]` | — | Story data (public) |
| GET | `/api/admin/flags` | — | `ContentFlag[]` |

---

## 9. CRITICAL: Fabric.js v7 Gotchas

This is the **#1 source of bugs** in the project. Fabric.js v7 is a **complete rewrite** from v5. Most online resources/tutorials/StackOverflow answers are for v5 and WILL NOT WORK.

| Topic | v5 (WRONG) | v7 (CORRECT) |
|-------|-----------|-------------|
| Import | `require('fabric').fabric` | `import * as fabric from 'fabric'` |
| Image class | `fabric.Image` | `fabric.FabricImage` |
| Image load | `fabric.Image.fromURL(url, callback)` | `FabricImage.fromURL(url)` returns **Promise** |
| Canvas init | Any time | Must use **callback ref** (`useState` + `useCallback`), NOT `useEffect([])` + `useRef` |
| Wrapper div | — | Fabric creates a block-level wrapper; set `display: inline-block` after init |
| backgroundImage | `canvas.setBackgroundImage()` | `canvas.backgroundImage = fabricImg` as property |

### Canvas Init Pattern (callback ref)
The canvas element is conditionally rendered (hidden during "choice" and "generating" steps). A regular `useEffect([])` runs once at mount when the element may not be in the DOM. The correct pattern:
```typescript
const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
const canvasElRef = useCallback((node: HTMLCanvasElement | null) => {
  setCanvasEl(node);
}, []);
// useEffect depends on [canvasEl], so it re-runs when the element mounts
```

### Undo/Redo System
- `lastSnapshotRef` — stores the canvas state BEFORE the next mutation
- On mutation: push `lastSnapshotRef` to undo stack, capture new snapshot
- `suppressHistoryRef` — boolean guard to prevent programmatic changes (undo/redo/setBackground) from creating history entries
- Max 30 undo steps

---

## 10. CRITICAL OPEN BUG: AI Background Not Filling Canvas

**Status: UNRESOLVED — 8+ attempts across 2 sessions**

### Problem
AI backgrounds (800×640 from Replicate, pre-scaled to 800×600) only fill ~55% of the 800×600 canvas. Image sits in top-left with white space around it.

### Verified Facts
- Canvas dimensions: 800×600 ✓
- Image dimensions: 800×600 ✓
- `scaleX`/`scaleY`: both 1.0 ✓
- `enableRetinaScaling: false` ✓
- `getRetinaScaling()` returns 1 ✓
- User's `devicePixelRatio`: 0.9 (Windows display scaling ~90%)
- Direct `ctx.drawImage()` fills canvas perfectly for ONE INSTANT → then Fabric's `renderAll()` redraws it smaller

### Root Cause
Fabric v7's `_renderBackgroundOrOverlay` calls `object.render(ctx)` which applies transforms via the context. Something in that transform chain scales down the image, likely related to how Fabric v7 handles sub-1.0 DPR.

### What Was Tried (ALL FAILED)
1. `Math.max` scaling — no change
2. `scaleToWidth`/`scaleToHeight` — no change
3. Native `Image()` + exact `scaleX`/`scaleY` — no change
4. `enableRetinaScaling: false` — already set
5. `canvas.add()` + `sendObjectToBack()` instead of `backgroundImage` — no change
6. Pre-scaled offscreen canvas — no change
7. `canvas.backgroundImage = FabricImage.fromURL(dataUrl)` — no change
8. `_renderBackground` override with `ctx.drawImage()` — showed full size for one instant before Fabric redrew smaller

### Current Code Approach (in `use-drawing-canvas.ts` lines 205-271)
The `setBackgroundImage` function currently stores the HTML image element and overrides `canvas._renderBackground` to call `ctx.drawImage()` directly, with `ctx.setTransform(1,0,0,1,0,0)` to reset transforms. This approach is the closest to working.

### Suggested Next Steps
1. **Log the ctx transform** inside the override: `console.log(ctx.getTransform())` — see what Fabric has applied
2. **Ensure `ctx.setTransform` reset is actually executing** — add logging to confirm the override is being called on every render
3. **Draw to element dimensions**: `const el = this.getElement(); ctx.drawImage(img, 0, 0, el.width, el.height)` — the backing-store size may differ from logical size
4. **Post-render layer**: hook into `after:render` event and draw background on a separate layered canvas underneath Fabric's canvas
5. **CSS scale workaround**: if all else fails, apply CSS `transform: scale(...)` to counteract the DPR shrinkage

### Files to Edit
- `src/hooks/use-drawing-canvas.ts` — `setBackgroundImage()` function (~line 205)
- `src/components/canvas/drawing-canvas.tsx` — simple forwardRef, probably doesn't need changes
- `src/app/story/[storyId]/illustrate/page.tsx` — the illustration page

### Debug UI to Remove After Fix
- `debugInfo` state in `use-drawing-canvas.ts` (line 38)
- `debugInfo` in hook return value (line 294)
- Yellow debug box in `illustrate/page.tsx` (lines 251-255)

---

## 11. Bugs Previously Fixed (Don't Re-introduce)

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| 1 | Fabric.js Canvas undefined | Used v5 `require('fabric').fabric` | v7: `import * as fabric from 'fabric'` |
| 2 | Canvas 300×150 default, can't draw | `useEffect([])` ran before DOM mount | Callback ref pattern with `useState` + `useCallback` |
| 3 | Tailwind collapsing canvas | Sizing classes fought Fabric inline styles | Removed classes from `<canvas>`, border on wrapper |
| 4 | Undo not working | Pushed `toJSON()` AFTER mutation | `lastSnapshotRef` pre-mutation + `suppressHistoryRef` guard |
| 5 | AI illustrations not appearing | Client/API body mismatch | API auto-derives `sceneDescription` from latest beat |
| 6 | CORS blocking Replicate images | Replicate CDN no CORS headers | Created `/api/proxy-image` same-origin proxy with hostname allowlist |
| 7 | Story stuck on fallback text | `ANTHROPIC_API_KEY=""` in shell env (dotenv doesn't override) | Removed quotes from `.env.local`, throw instead of silent fallback |
| 8 | Claude wrapping JSON in fences | Claude returns `` ```json {...} ``` `` | Regex strip: `text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()` |
| 9 | Replicate 402 Payment Required | No payment method on account | User added billing at replicate.com/account/billing |
| 10 | Replicate `[{}]` output | SDK v0.25+ returns FileOutput objects, not strings | `String(raw)` to extract URL |
| 11 | `url.startsWith` is not a function | `.url()` returned URL object | `String(raw)` directly, no method call |
| 12 | OneDrive EBUSY locking .next | OneDrive syncs `.next` folder | `rmdir /s /q .next` before restart; add to OneDrive exclusions |
| 13 | Fabric wrapper div too wide | Fabric creates block-level wrapper | `fabricWrapper.style.display = 'inline-block'` after init |

---

## 12. Git State

**Branch:** `main`
**Remote:** `origin` → https://github.com/johnkoyanagi-blip/storycraft-kids.git
**Latest commit:** `ce7851e` — "Update session docs for 2026-04-10 session"
**Status:** Up to date with `origin/main`

### Uncommitted Modified Files (9 files, +152/-44 lines)
- `package.json` / `package-lock.json` — dependency updates
- `src/app/api/stories/[storyId]/beats/route.ts` — beat generation improvements
- `src/app/story/[storyId]/illustrate/page.tsx` — illustration page + debug UI
- `src/hooks/use-drawing-canvas.ts` — background image fix attempts + debug info
- `src/hooks/use-story-session.ts` — minor improvements
- `src/lib/image-pipeline/generate-background.ts` — Replicate SDK fixes
- `src/lib/image-pipeline/style-config.ts` — style tweak
- `src/lib/story-engine/generate-beat.ts` — error handling improvements

### Untracked Files (not yet committed)
- `.env` — should stay gitignored
- `ARCHITECTURE.md` — should be committed
- `BUGS_FIXED.md` — should be committed
- `CURRENT_BUG.md` — should be committed
- `SESSION_TRANSFER.md` — should be committed
- `HANDOVER.md` — should be committed

**⚠️ Action needed:** Commit the modified source files + documentation files, then push to origin.

---

## 13. Testing

```bash
npm test          # Run all tests once
npx vitest        # Watch mode
```

**Config:** `vitest.config.ts` — `globals: true`, `environment: node`, `@` alias → `./src`

**7 test files, ~23 tests:**

| File | Tests |
|------|-------|
| `tests/unit/story-engine/arc-manager.test.ts` | Arc position transitions |
| `tests/unit/story-engine/content-filter.test.ts` | Blocklist + AI classifier |
| `tests/unit/story-engine/generate-beat.test.ts` | Beat generation + retry logic |
| `tests/unit/story-engine/story-context.test.ts` | Context building |
| `tests/unit/image-pipeline/style-config.test.ts` | Genre style lookups |
| `tests/integration/api/profiles.test.ts` | Profile CRUD |
| `tests/integration/api/register.test.ts` | Registration flow |

---

## 14. Remaining Work (Priority Order)

### P0 — Critical Blocker
- [ ] **Fix AI background image not filling canvas** — See Section 10. Blocks the entire illustration feature.

### P1 — Feature Completion
- [ ] **Drawing tools** — User requested all four:
  - Shapes tool (circle, square, line)
  - Stickers/stamps tool
  - Fill bucket tool
  - Text tool for canvas
- [ ] **Remove debug UI** — After fixing background bug: `debugInfo` state, yellow debug box in illustrate page

### P2 — Quality & Polish
- [ ] **E2E flow test** — Register → profile → story → beat → illustrate → view book → export PDF
- [ ] **Loading states / error boundaries** — Skeleton screens, transition animations
- [ ] **Story title auto-generation** — From first few beats
- [ ] **Browser verification** — Confirm full flow works end-to-end in a real browser

### P3 — Production Readiness
- [ ] **Parent dashboard** — Content flag review, story management
- [ ] **Mobile responsiveness** — Touch-friendly canvas, responsive layouts
- [ ] **Deploy config** — Vercel/Railway setup, production DB migration (PostgreSQL)
- [ ] **Production storage** — Migrate from base64 data URLs to Cloudflare R2 (`storage.ts` abstraction ready)
- [ ] **Content blocklist expansion** — Currently 16 terms, needs ~500 for production
- [ ] **API key rotation** — Old Anthropic key was exposed

---

## 15. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| SQLite over PostgreSQL | Zero-config local dev, no Docker needed. `docker-compose.yml` ready for prod. |
| In-memory cache over Redis | Data resets on restart is fine for dev. Redis in docker-compose for prod. |
| Next.js 14 pinned | NextAuth v4 incompatible with Next.js 16. Upgrade requires NextAuth v5 migration. |
| Fabric.js for drawing | Canvas compositing, undo/redo, `toDataURL()` export, drawing mode built-in. |
| Data URL storage for MVP | Images as base64 in SQLite. `storage.ts` has `StorageProvider` interface ready for S3/R2. |
| Port 3002 | Avoids conflicts with other local dev servers. |
| Claude `claude-sonnet-4-6` | Good quality-to-speed ratio for interactive story generation. |
| Claude Haiku for content filter | Cheap, fast safety classifier as second layer after blocklist. |
| 800×600 canvas | Matches A5 landscape aspect ratio for PDF export. |
| Replicate SDXL 800×640 | Close to canvas aspect ratio; pre-scaled to 800×600 before display. |

---

## 16. Other Technical Details

### Replicate SDK v0.25+
Returns `FileOutput` objects, NOT strings. `JSON.stringify(output)` shows `[{}]` — misleading. Always use `String(raw)` to extract the URL.

### Claude JSON Fencing
Claude sometimes wraps JSON in markdown fences. Always strip before parsing:
```typescript
text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
```

### Environment Variable Gotcha
`ANTHROPIC_API_KEY=""` in shell environment prevents dotenv from overriding (dotenv doesn't override existing env vars). If the key appears empty, unset it in your shell or remove quotes from `.env.local`.

### Image Proxy
`/api/proxy-image?url=<encoded-url>` proxies Replicate CDN images through same-origin. Has a hostname allowlist. Required because:
1. Replicate's CDN doesn't set permissive CORS headers
2. Fabric.js needs same-origin images for `toDataURL()` (canvas taint prevention)

### Art Styles (6 genres)
Defined in `style-config.ts`. Each genre maps to a prompt prefix for SDXL:
- `fairy tale` → soft watercolor, pastels
- `adventure` → bold cartoon, saturated colors
- `sci-fi` → digital illustration, neon accents
- `mystery` → moody pastel, atmospheric
- `funny` → bright exaggerated cartoon
- `spooky-but-not-too-scary` → friendly Halloween, purple/orange

Negative prompt always includes: `realistic, photographic, scary, violent, weapons, blood, nudity, adult content, dark, depressing, people, person, character, human, animal, figure, face, hands`

---

## 17. Useful Commands

```bash
# Dev server
npx next dev -p 3002

# Tests
npm test                     # Run once
npx vitest                   # Watch mode

# Prisma
npx prisma generate          # Regenerate client after schema changes
npx prisma db push           # Push schema to SQLite
npx prisma studio            # Visual DB browser (opens in browser)

# Build & lint
npm run build
npm run lint

# Reset database
rm prisma/dev.db
npx prisma db push

# Git — commit outstanding work
git add ARCHITECTURE.md BUGS_FIXED.md CURRENT_BUG.md SESSION_TRANSFER.md HANDOVER.md
git add src/ package.json package-lock.json
git commit -m "Session work: illustration fixes, debug UI, documentation"
git push origin main
```

---

## 18. How to Resume in Claude Code

Paste this into your Claude Code session:

```
I'm continuing work on StoryCraft Kids, a creative writing app for kids.
Read HANDOVER.md for the complete project context — it has everything.

The critical blocker is the AI background image not filling the Fabric.js v7
drawing canvas (Section 10). The image renders at ~55% size despite correct
dimensions. Root cause is Fabric v7's render pipeline applying an unwanted
transform, likely related to sub-1.0 DPR (user has DPR 0.9). Current code
uses a _renderBackground override with ctx.setTransform reset.

Priority order:
1. Fix the background image bug
2. Remove debug UI (debugInfo state, yellow debug box)
3. Add drawing tools: shapes (circle/square/line), stickers, fill bucket, text
4. Commit all changes and push to origin

Dev server: npx next dev -p 3002
```
