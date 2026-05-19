# StoryCraft Kids - Session Transfer Guide

## What This Is

StoryCraft Kids is a creative writing app for Milly (age ~8), built with Next.js 14.2.35 (App Router), TypeScript, Tailwind CSS, Prisma (SQLite), and Fabric.js v7.2.0 for drawing. It uses Claude API for story generation and Replicate (SDXL) for AI illustrations.

## How to Start the New Session

Paste this prompt into the new Cowork session:

---

**PROMPT TO PASTE:**

```
I'm continuing work on StoryCraft Kids, a creative writing app for my daughter Milly. The codebase is already in this folder. Please read SESSION_TRANSFER.md, CURRENT_BUG.md, and ARCHITECTURE.md in this folder to understand the full project state, then pick up where we left off.

The CRITICAL blocker is the AI background image not filling the drawing canvas. Read CURRENT_BUG.md for full details of what's been tried and what the root cause is. The latest approach (_renderBackground override) showed the image at full size for one instant before Fabric redraws it smaller — meaning ctx.drawImage works but Fabric's render cycle is the problem.

After fixing the image bug, the remaining features are: shapes tool (circle/square/line), stickers/stamps, fill bucket, text tool for the drawing canvas. Then remove all debug UI (yellow debug box, debugInfo state).

To start the dev server: npx next dev -p 3002
```

---

## Quick Start Commands

```bash
cd C:\Users\john\OneDrive\Claude\CreativeWriting
npx next dev -p 3002
```

Then open http://localhost:3002 in browser.

## Environment

- Node.js required
- `.env.local` has all API keys (already in the folder)
- SQLite database at `./dev.db` (already in the folder)
- Port 3002 (not 3000 — avoids conflicts)

## Important: OneDrive Locking

The `.next` build cache can get locked by OneDrive sync. If you see EBUSY errors on startup:

```bash
rmdir /s /q .next
npx next dev -p 3002
```
