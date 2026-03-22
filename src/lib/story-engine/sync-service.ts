import { redis } from '@/lib/redis';
import { prisma } from '@/lib/db';

const SYNC_INTERVAL_MS = 30_000;
const LAST_SYNC_PREFIX = 'story:sync:';

export async function syncStoryContextIfDue(storyId: string): Promise<void> {
  const lastSyncKey = `${LAST_SYNC_PREFIX}${storyId}`;
  const lastSync = await redis.get(lastSyncKey);
  const now = Date.now();

  if (lastSync && now - parseInt(lastSync) < SYNC_INTERVAL_MS) {
    return;
  }

  const contextRaw = await redis.get(`story:${storyId}:context`);
  if (!contextRaw) return;

  await prisma.story.update({
    where: { id: storyId },
    data: { updatedAt: new Date() },
  });

  await redis.set(lastSyncKey, now.toString(), 'EX', 86400);
}
