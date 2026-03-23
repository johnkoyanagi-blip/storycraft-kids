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
