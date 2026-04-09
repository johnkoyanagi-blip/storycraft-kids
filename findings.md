# StoryCraft Kids — Findings

## Session 1 — 2026-03-22

### npm audit fix --force breaks Next.js + NextAuth compatibility
Running `npm audit fix --force` upgraded Next.js from 14 to 16 and eslint-config-next to 16. NextAuth v4 (`next-auth@4.24.13`) is not compatible with Next.js 16 — the `[...nextauth]` catch-all route returns HTML instead of JSON, causing `CLIENT_FETCH_ERROR`. **Fix**: Pin `next` to `14.2.35` in package.json.

### SQLite doesn't support Prisma enums
PostgreSQL supports `enum` types natively, but SQLite does not. The `StoryStatus` enum had to be replaced with a plain `String` field with `@default("in_progress")`. Any code checking story status should use string comparisons.

### Prisma generate requires network access
`npx prisma generate` downloads a platform-specific binary on first run. This fails in sandboxed/offline environments. The generated client must exist for the app to start — users must run `npx prisma generate` locally before `npm run dev`.

### OneDrive sync delays with many files
Writing many files at once to a OneDrive-synced folder can result in files not appearing immediately. The `package.json` was visible but other files weren't until OneDrive finished syncing. Direct file access (mounting the folder) was more reliable than relying on sync.

### Port conflicts on localhost
Port 3000 was in use (another project), port 3001 was also in use. Settled on port 3002 for this project. The `NEXTAUTH_URL` env var must match the port used.

## Session 2 — 2026-04-10

### Fabric.js v7 API is completely different from v5
v7 uses named imports (`import * as fabric from 'fabric'` — not `require('fabric').fabric`). Classes are `fabric.Canvas`, `fabric.FabricImage` (renamed from `Image`), `fabric.PencilBrush`. `fromURL` is Promise-based. `backgroundImage` is a property you assign to, not a `setBackgroundImage(img, callback)` method. `loadFromJSON` returns a Promise too. `CapsuleGeometry` is also not available — if you need similar shapes use combinations.

### React refs + conditionally-rendered Fabric canvases
Classic trap: a `useEffect([])` that checks `ref.current` only runs once on mount. If the `<canvas>` element is inside a sibling screen that hasn't been rendered yet (e.g. a multi-step wizard), the ref is null on mount and never becomes observable to the effect. The element mounts later, but the effect doesn't re-run. **Fix**: use a callback ref that stores the element in `useState`, and key the init effect off that state. React calls the callback whenever the element attaches/detaches, triggering re-init at the right moment.

### Canvas undo stack must store the pre-mutation state
The obvious (and wrong) implementation captures `canvas.toJSON()` inside an `object:added` handler. That snapshot already contains the new object — so when you pop it and load it back, nothing changes. Correct pattern: keep a `lastSnapshotRef` that represents the state *before* the next mutation. On change, push that onto the undo stack, then refresh `lastSnapshotRef`. On undo, pop the stack (the pre-mutation state), push current to redo, and load. Also need a `suppressHistory` guard so `loadFromJSON` doesn't fire a new `object:added` and pollute the stack.

### Tailwind `h-auto` + Fabric inline sizing collide
Applying `max-w-full h-auto` to a `<canvas>` element that Fabric is managing will collapse the height because Tailwind's `h-auto` overrides Fabric's inline `style="height: ..."`. The symptom is a visually shrunken canvas where mouse coordinates also get mangled (drawing "misses" where you clicked). **Fix**: don't put sizing classes on the `<canvas>` itself. Style the wrapper div; let Fabric fully own the canvas dimensions.

### Replicate CDN CORS is inconsistent
`replicate.delivery` sometimes sends `Access-Control-Allow-Origin`, sometimes doesn't. Loading an image with `crossOrigin: 'anonymous'` in Fabric will silently fail when the header is missing. **Fix**: proxy all cross-origin image URLs through a same-origin API route (`/api/proxy-image`) that streams the upstream bytes back with permissive CORS headers. Use an explicit hostname allowlist so we aren't an open proxy. Bonus: keeps the canvas untainted so `toDataURL()` still works for saving.

### API body mismatch between client and server
`/api/illustrations/generate` was destructuring `{ storyId, pageId, sceneDescription }` but the client only sent `{ storyId }`. Both missing values were `undefined`, which silently broke generation (empty prompt to Replicate, then `prisma.page.update({ where: { id: undefined } })` threw). Lesson: when an API route needs contextual data like "the current beat", derive it server-side from stable IDs rather than trusting the client to pass it. Safer and less chatty.

### Upload endpoint silent no-op
`/api/upload` had a "find the first page that already has aiBackgroundUrl" lookup. If no page had one yet (Draw-Everything-Myself path), the endpoint returned 200 without saving anything. Fixed by creating a Page row if one doesn't exist for the target beat.

