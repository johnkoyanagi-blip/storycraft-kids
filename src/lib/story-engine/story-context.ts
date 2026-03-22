import { redis } from '@/lib/redis';
import type { StoryContext } from '@/types/story';

const CONTEXT_TTL = 86400; // 24 hours
const KEY_PREFIX = 'story';

export class StoryContextManager {
  private key(storyId: string): string {
    return `${KEY_PREFIX}:${storyId}:context`;
  }

  async save(context: StoryContext): Promise<void> {
    await redis.set(
      this.key(context.storyId),
      JSON.stringify(context),
      'EX',
      CONTEXT_TTL
    );
  }

  async load(storyId: string): Promise<StoryContext | null> {
    const data = await redis.get(this.key(storyId));
    if (!data) return null;
    return JSON.parse(data) as StoryContext;
  }

  async delete(storyId: string): Promise<void> {
    await redis.del(this.key(storyId));
  }
}
