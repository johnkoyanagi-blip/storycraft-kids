import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryContext } from '@/types/story';

// Mock Redis
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

import { StoryContextManager } from '@/lib/story-engine/story-context';
import { redis } from '@/lib/redis';

describe('StoryContextManager', () => {
  const manager = new StoryContextManager();
  const testContext: StoryContext = {
    storyId: 'story-1',
    genre: 'adventure',
    setting: 'enchanted forest',
    theme: 'bravery',
    characters: [{ name: 'Luna', description: 'A brave young explorer' }],
    arcPosition: 'setup',
    beatCount: 0,
    fullNarrative: '',
    ageLevel: 8,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves context to Redis', async () => {
    (redis.set as any).mockResolvedValue('OK');
    await manager.save(testContext);
    expect(redis.set).toHaveBeenCalledWith(
      'story:story-1:context',
      JSON.stringify(testContext),
      'EX',
      86400
    );
  });

  it('loads context from Redis', async () => {
    (redis.get as any).mockResolvedValue(JSON.stringify(testContext));
    const result = await manager.load('story-1');
    expect(result).toEqual(testContext);
  });

  it('returns null when context not found', async () => {
    (redis.get as any).mockResolvedValue(null);
    const result = await manager.load('nonexistent');
    expect(result).toBeNull();
  });

  it('deletes context from Redis', async () => {
    (redis.del as any).mockResolvedValue(1);
    await manager.delete('story-1');
    expect(redis.del).toHaveBeenCalledWith('story:story-1:context');
  });
});
