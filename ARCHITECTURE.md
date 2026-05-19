# StoryCraft Kids — Architecture & Technical Reference

## Tech Stack

- **Framework**: Next.js 14.2.35 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4
- **Database**: Prisma + SQLite (`./dev.db`)
- **Auth**: NextAuth.js v4 (credentials provider, bcryptjs)
- **Drawing**: Fabric.js v7.2.0 (COMPLETELY different API from v5)
- **Story AI**: Anthropic Claude API (`claude-sonnet-4-6`)
- **Image AI**: Replicate SDXL (`stability-ai/sdxl`)
- **Port**: 3002

## Fabric.js v7 Gotchas (CRITICAL)

Fabric v7 is a major rewrite from v5. Key differences:

1. **Import**: `import * as fabric from 'fabric'` (NOT `require('fabric').fabric`)
2. **Classes**: `fabric.Canvas`, `fabric.FabricImage`, `fabric.PencilBrush` (named exports)
3. **Image loading**: `FabricImage.fromURL()` returns a Promise
4. **Canvas creation**: `new fabric.Canvas(canvasEl, options)` — wraps element in container div
5. **backgroundImage**: Can be set as property `canvas.backgroundImage = fabricImg` but rendering may apply unexpected transforms
6. **Replicate SDK v0.25+**: Returns `FileOutput` objects, not strings. Use `String(raw)` to extract URL.

## Project Structure

```
src/
  app/
    page.tsx                          — Landing page
    layout.tsx                        — Root layout with providers
    (auth)/login/page.tsx             — Login
    (auth)/register/page.tsx          — Register
    profiles/page.tsx                 — Child profile selection
    library/page.tsx                  — Story library
    story/new/page.tsx                — New story wizard
    story/[storyId]/page.tsx          — Main story view (read + continue)
    story/[storyId]/illustrate/page.tsx — Drawing canvas + AI illustration
    story/[storyId]/preview/page.tsx  — "View My Book" page
    story/[storyId]/print/page.tsx    — Print view
    share/[token]/page.tsx            — Public share view
    admin/flags/page.tsx              — Content flag admin
    api/
      auth/[...nextauth]/route.ts     — NextAuth
      auth/register/route.ts          — Registration
      profiles/route.ts               — CRUD profiles
      stories/route.ts                — List/create stories
      stories/[storyId]/route.ts      — Get/update story
      stories/[storyId]/beats/route.ts — Generate next beat
      stories/[storyId]/share/route.ts — Share management
      illustrations/generate/route.ts  — Generate AI background
      proxy-image/route.ts            — CORS proxy for Replicate images
      upload/route.ts                 — Save drawing
      export/[storyId]/route.ts       — PDF export
      share/[token]/route.ts          — Public share data
      admin/flags/route.ts            — Content flags
  components/
    ui/button.tsx, card.tsx, input.tsx, loading-spinner.tsx
    providers.tsx                      — SessionProvider wrapper
    canvas/drawing-canvas.tsx          — Canvas wrapper (forwardRef)
    canvas/toolbar.tsx                 — Drawing tools bar
    canvas/color-palette.tsx           — Color picker
    wizard/wizard-shell.tsx            — Story creation wizard
    wizard/genre-picker.tsx, setting-picker.tsx, character-creator.tsx, theme-picker.tsx
    story/story-view.tsx               — Main story display + choices
    story/choice-panel.tsx             — Choice buttons
    story/beat-display.tsx             — Story text display
    story/free-input.tsx               — Free text input
    book/book-page.tsx, flipbook-viewer.tsx, export-panel.tsx
  hooks/
    use-drawing-canvas.ts              — Fabric canvas hook (CRITICAL FILE)
    use-story-session.ts               — Story state management
    use-profile.tsx                    — Profile context
  lib/
    auth.ts                            — NextAuth config
    db.ts                              — Prisma client
    redis.ts                           — Redis/in-memory cache
    storage.ts                         — File storage abstraction
    story-engine/
      generate-beat.ts                 — Claude API call for story beats
      prompts.ts                       — System/user prompt builders
      arc-manager.ts                   — Story arc position tracking
      story-context.ts                 — Context type builder
      content-filter.ts                — Safety filter
      sync-service.ts                  — Sync utilities
    image-pipeline/
      generate-background.ts           — Replicate SDXL call
      style-config.ts                  — Art style prompts + negative prompts
    pdf/
      generate-pdf.ts                  — PDF generation
  types/
    story.ts                           — Story/Beat/BeatResponse types
    profile.ts                         — Profile types
prisma/
  schema.prisma                        — Database schema
```

## Database Schema (Prisma/SQLite)

- **Account** — email, passwordHash
- **ChildProfile** — displayName, age, linked to Account
- **Story** — genre, setting, theme, artStyle, status, shareToken
- **StoryBeat** — sequenceNumber, childChoice, generatedText, isIllustrationMoment
- **Page** — beatId (unique), storyText, aiBackgroundUrl, childDrawingUrl, compositeUrl
- **ContentFlag** — flaggedText, filterLayer

## API Keys (in .env.local)

- `ANTHROPIC_API_KEY` — Claude API (story generation)
- `REPLICATE_API_TOKEN` — Replicate (SDXL image generation, user has $5 credit)
- `NEXTAUTH_SECRET` — Auth secret
- `DATABASE_URL` — `file:./dev.db`

## Key Technical Details

### Story Generation Flow
1. User picks a choice or types free input
2. POST `/api/stories/[storyId]/beats` 
3. `generate-beat.ts` calls Claude with story context
4. Claude returns JSON (sometimes wrapped in markdown fences — stripped with regex)
5. Response includes: storyText, choices[], illustrationMoment boolean, arcPosition

### Illustration Flow
1. User clicks "AI Background + My Drawing" on illustrate page
2. POST `/api/illustrations/generate` with `{ storyId }`
3. API finds latest beat, uses its `generatedText` as scene description
4. `generate-background.ts` calls Replicate SDXL (800x640 output)
5. Returns URL → client loads via `/api/proxy-image` (CORS proxy)
6. Image displayed on Fabric.js canvas for drawing on top

### Drawing Canvas Architecture
- `use-drawing-canvas.ts` hook manages Fabric.js canvas
- Uses callback ref pattern (`useState` + `useCallback`) because canvas mounts conditionally
- Undo system: `lastSnapshotRef` captures pre-mutation state, `suppressHistoryRef` prevents programmatic changes from creating history
- Background image: currently using `_renderBackground` override approach
- Canvas: 800x600, `enableRetinaScaling: false`

### Image Proxy
`/api/proxy-image?url=<encoded-url>` proxies Replicate CDN images through same-origin to avoid CORS. Allowlisted hostnames only.

### Replicate SDK v0.25+
Returns `FileOutput` objects instead of plain URL strings. Must use `String(raw)` to extract the URL string. `JSON.stringify(output)` shows `[{}]` which is misleading.

### Claude API JSON Fencing
Claude sometimes wraps JSON in markdown code fences. Fixed with:
```ts
text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
```

## Features Working

- User registration and login
- Child profile creation (name, age)
- Story creation wizard (genre, setting, character, theme)
- Interactive story with AI-generated beats and choices
- Free text input option
- Story library with favorites
- "View My Book" preview
- Illustration page with 3 modes (AI only, AI+draw, draw everything)
- AI illustration generation (Replicate SDXL)
- Drawing canvas with pen, eraser, color palette, brush sizes
- Undo/redo on canvas
- Sharing via token
- Content safety filter

## Features NOT YET Built

- Drawing shapes (circle, square, line)
- Stickers/stamps tool
- Fill bucket tool
- Text tool for canvas
- (These were requested but deferred until the image fill bug is fixed)
