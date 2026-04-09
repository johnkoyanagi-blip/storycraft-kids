# StoryCraft Kids — Progress Log

## Session 1 — 2026-03-22

### What happened
John and Milly wanted to build a kids' creative writing app. We went through the full development lifecycle in a single session:

1. **Brainstorming** — Explored the concept, asked clarifying questions about target age (6-12), input style (guided + free), illustration approach (AI + child drawings), and platform (web first). Proposed 3 architecture approaches, user chose Modular Full-Stack.

2. **Design Spec** — Created an 8-section design spec covering user flow, architecture, story engine, image pipeline, PDF generation, privacy/safety, and future considerations. Ran 2 review cycles, fixed all critical and major issues.

3. **Implementation Plan** — Wrote a 28-task plan across 11 execution chunks with full code specifications for backend tasks.

4. **Implementation** — Built the entire app via subagent-driven development. 67 source files, 23 commits, 23 passing tests.

5. **Verification** — Ran verification-before-completion skill. Found and fixed 13 TypeScript errors, all ESLint errors. TypeScript clean, tests green, build compiles.

6. **Local Setup** — Switched from PostgreSQL/Redis to SQLite/in-memory cache so John can run locally without Docker. Fixed Next.js version compatibility with NextAuth. Got the app running at localhost:3002.

### Files created/modified
- 67 TypeScript/TSX source files in `src/`
- 7 test files in `tests/`
- Prisma schema, docker-compose, config files
- Design spec and implementation plan docs

### Test results
- 23/23 tests passing, 7 test files
- TypeScript: 0 errors
- ESLint: 0 errors (warnings only)

### Git state
- Branch: `main`
- Latest commit: `bb69c8b` — Switch to SQLite and in-memory cache for local development
- Remote: `https://github.com/johnkoyanagi-blip/storycraft-kids.git`
- **Needs push** — couldn't push from sandbox, user needs to run `git push origin main`

### What's next
1. Run `npx prisma generate` and `npx prisma db push` locally to fix the module resolution error
2. Test the full registration → story creation flow
3. Implement Tasks 23-25 (E2E test, UX polish, deploy config)
4. Rotate API keys (they were accidentally exposed in chat)

## Session 2 — 2026-04-10

### What happened
Focused session on fixing the story-and-illustration loop that John was testing with Milly's "space monkey" story. Started mid-debug-session after context compaction.

1. **Story page interactivity rebuild** — user wanted everything editable: narrative text, a big Continue button, Undo/Rewrite quick actions, free-text input alongside preset choices. Reworked `use-story-session.ts` hook to support all of that, plus auto-generation of the first beat and illustration-mode suppression for the first 2 beats (Claude was jumping straight to "Time to Draw" before any story text existed).

2. **Claude API plumbing** — fixed `claude-sonnet-4-6` model name, added credit balance check handling, pulled `storyText` through to the client response (was only inside nested `beat.generatedText`), and fixed an empty-array truthiness bug in `generate-beat.ts` that was masking valid fallbacks (`parsed.choices || FALLBACK` returns `[]` when choices is empty — needed `Array.isArray && length > 0`).

3. **Fabric.js v7 drawing canvas — long debug chain**:
   - First symptom: `TypeError: Cannot read properties of undefined (reading 'Canvas')`. Root cause: using v5-style `require('fabric').fabric` against the v7 package. Rewrote hook with `import * as fabric from 'fabric'` and v7 APIs (`FabricImage.fromURL`, Promise-based `loadFromJSON`, `backgroundImage` as property).
   - Second symptom: canvas rendered tiny (~300×150) and drawing didn't work. Debugged systematically: the 300×150 default-canvas size was the giveaway that Fabric wasn't running at all. Traced to a `useEffect([])` with `ref.current === null` at mount time because the canvas was in a conditionally-rendered screen. Switched to callback-ref pattern (store element in state, key init effect off that state).
   - Third symptom: undo button did nothing. Found that the handler pushed `toJSON()` *after* each change, so popping it loaded the identical state back. Rewrote to track a `lastSnapshotRef` of the *pre*-mutation state and push that onto the undo stack. Added `suppressHistoryRef` guard so programmatic loads don't pollute history.

4. **AI illustration fix** — this bug had two layers: (a) `setBackgroundImage` used `crossOrigin: 'anonymous'` against Replicate's CDN which sometimes omits CORS headers, and (b) the client was only sending `{ storyId }` to the generate endpoint while the server expected `{ storyId, pageId, sceneDescription }`. Both undefined meant the prompt was garbage and the Page update threw. Fixed by:
   - Creating `/api/proxy-image` (hostname allowlist, streams upstream image bytes with permissive CORS headers).
   - Rewriting `/api/illustrations/generate` to find the latest beat itself and use `beat.generatedText` as the scene description. Creates/updates the Page row server-side.
   - Fixing `/api/upload` to create a Page if none exists (Draw-Everything-Myself path was silently dropping drawings).

5. **View My Book** — John asked how to see what they'd drawn. Turns out `/story/[storyId]/preview` with `FlipbookViewer` already existed and renders each page's `compositeUrl` — just no link to it. Added a 📖 View My Book button to both the main story screen and the illustration-moment screen.

### Files created/modified
- **Created:** `src/app/api/proxy-image/route.ts` (new Replicate image proxy)
- **Modified:** `src/hooks/use-drawing-canvas.ts` (Fabric v7 rewrite, callback ref, undo fix)
- **Modified:** `src/hooks/use-story-session.ts` (first-beat auto-gen, undo/rewrite/continue)
- **Modified:** `src/components/canvas/drawing-canvas.tsx` (dumb forwardRef component)
- **Modified:** `src/components/story/story-view.tsx` (interactive buttons, View My Book link)
- **Modified:** `src/components/story/beat-display.tsx` (editable narrative with inline save)
- **Modified:** `src/app/story/[storyId]/illustrate/page.tsx` (canvas lifecycle, bg useEffect)
- **Modified:** `src/app/api/illustrations/generate/route.ts` (self-derive sceneDescription)
- **Modified:** `src/app/api/upload/route.ts` (create Page if missing)
- **Modified:** `src/app/api/stories/[storyId]/beats/route.ts` (expose storyText in response)
- **Modified:** `src/lib/story-engine/generate-beat.ts` (model name, fallback array check)
- Plus small form-input contrast and wizard tweaks from the first compacted part of the session

### Test results
- TypeScript: 0 errors on final state
- Manual browser testing: Fabric canvas mounts at correct 800×600 size and accepts mouse input (confirmed by user). AI background + undo still need end-to-end verification in browser.

### Git state
- Branch: `main`
- Latest commit: `3e8a6ac` — "Interactive story UX + fixed drawing canvas + AI illustration pipeline"
- Remote: `https://github.com/johnkoyanagi-blip/storycraft-kids.git`
- **Needs push** — sandbox has no git credentials or `gh` CLI. Run from your terminal:
  ```
  cd /path/to/storycraft-kids
  git push origin main
  ```
- `.env` is still untracked on purpose (contains Anthropic + Replicate API keys).

### What's next
1. Browser-verify the AI background actually loads (watch Network tab for the `/api/proxy-image?url=...` request on the drawing screen). If Replicate fails, the server log will say `[StoryCraft] Replicate failed, returning fallback`.
2. Verify undo works: draw 3 strokes, click Undo three times, canvas should empty.
3. Verify View My Book shows the saved composite drawing from the preview page.
4. Drawing tools feature pass (deferred): shapes, stickers, fill bucket, text tool — user wants all four.
5. Rotate Anthropic API key (old one exposed in transcript).
