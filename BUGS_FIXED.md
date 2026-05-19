# StoryCraft Kids — Bugs Fixed (Reference)

These bugs were encountered and fixed across 2 sessions. Documented here so the next session doesn't re-encounter them.

## 1. Fabric.js v7 Canvas undefined
**Error**: `TypeError: Cannot read properties of undefined (reading 'Canvas')`
**Cause**: Used `require('fabric').fabric` (v5 pattern)
**Fix**: `import * as fabric from 'fabric'` (v7 uses named exports)

## 2. Canvas not initializing (300x150 default, can't draw)
**Cause**: `useEffect([])` ran once when canvas wasn't in DOM (conditional rendering)
**Fix**: Callback ref pattern — `useState` + `useCallback` for canvas element, useEffect depends on `[canvasEl]`

## 3. Tailwind h-auto collapsing canvas
**Cause**: Sizing classes on `<canvas>` element fought with Fabric's inline styles
**Fix**: Removed sizing classes from canvas, moved border to wrapper div

## 4. Undo button not working
**Cause**: Old code pushed `toJSON()` AFTER each mutation — popping loaded the same state
**Fix**: `lastSnapshotRef` (pre-mutation snapshot) + `suppressHistoryRef` guard during programmatic loads

## 5. AI illustrations not appearing (API body mismatch)
**Cause**: Client sent `{storyId}` only, API expected `{storyId, pageId, sceneDescription}` — fields were undefined
**Fix**: Rewrote API to derive sceneDescription from the story's latest beat automatically

## 6. CORS blocking Replicate images
**Cause**: Replicate CDN doesn't set permissive CORS headers
**Fix**: Created `/api/proxy-image` same-origin proxy with hostname allowlist

## 7. Story stuck on fallback text
**Cause**: `ANTHROPIC_API_KEY=""` in shell environment prevented dotenv override (dotenv doesn't override existing env vars)
**Fix**: Removed quotes from `.env.local` values. Made `generate-beat.ts` throw instead of silently returning fallback.

## 8. Claude wrapping JSON in markdown fences
**Cause**: Claude sometimes returns `\`\`\`json\n{...}\n\`\`\`` instead of raw JSON
**Fix**: Strip fences before parsing: `text.replace(/^\`\`\`(?:json)?\s*\n?/i, '').replace(/\n?\`\`\`\s*$/i, '').trim()`

## 9. Replicate 402 Payment Required
**Cause**: No payment method on Replicate account
**Fix**: User added payment at replicate.com/account/billing

## 10. Replicate FileOutput objects
**Cause**: SDK v0.25+ returns FileOutput objects, not strings. `JSON.stringify(output)` showed `[{}]`
**Fix**: `const url = String(raw)` which calls toString() getting the URL

## 11. url.startsWith is not a function
**Cause**: `.url()` method returned URL object not string
**Fix**: Use `String(raw)` directly instead of calling methods

## 12. OneDrive EBUSY locking .next cache
**Cause**: OneDrive syncs `.next` folder, locks files
**Fix**: `rmdir /s /q .next` before restart. Consider adding `.next` to OneDrive exclusions.

## 13. Fabric wrapper div too wide
**Cause**: Fabric creates a `display: block` wrapper div that expands to fill parent
**Fix**: Set `fabricWrapper.style.display = 'inline-block'` in the hook after canvas init. Changed page layout from `flex` to `text-center`.

## 14. AI background filled only ~55% of canvas (Fabric v7 + sub-1.0 DPR)
**Symptom**: Replicate SDXL image rendered at ~55% of the 800×600 canvas, anchored top-left. Confirmed unrelated to image dimensions, scaleX/Y, or `enableRetinaScaling`. Direct `ctx.drawImage()` filled the canvas correctly for one frame before Fabric's `renderAll()` redrew it smaller — proving Fabric's render pipeline was applying an unwanted transform (likely related to the user's DPR of 0.9 from 90% Windows display scaling).
**Cause**: Fabric v7's `_renderBackgroundOrOverlay` routes `backgroundImage` through `FabricObject.render()`, which applies the viewport/object transform chain. On sub-1.0 DPR systems, this produces the wrong scale. 8+ attempts to fight the pipeline (Math.max, scaleToWidth, native Image, `add()` + `sendObjectToBack()`, pre-scaled offscreen canvas, `_renderBackground` override with `setTransform` reset) all failed.
**Fix**: Bypass Fabric's render pipeline entirely. Apply the AI background as a CSS `background-image` on Fabric's wrapper `<div>` and set `canvas.backgroundColor = ''` so Fabric's `fillRect` is skipped and the wrapper's background shows through. On export, composite manually via an offscreen 800×600 canvas: draw the cached `HTMLImageElement` first, then `canvas.getElement()` on top. See `setBackgroundImage` and `exportAsDataUrl` in `src/hooks/use-drawing-canvas.ts`.
