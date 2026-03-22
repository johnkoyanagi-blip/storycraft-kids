import { describe, it, expect, vi } from 'vitest';
import { ContentFilter } from '@/lib/story-engine/content-filter';

vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'YES' }],
  });
  return {
    default: class Anthropic {
      messages = { create: mockCreate };
    },
  };
});

describe('ContentFilter', () => {
  const filter = new ContentFilter();

  it('flags text containing blocklisted words', async () => {
    const result = await filter.check('The hero picked up a gun and fired.');
    expect(result.safe).toBe(false);
    expect(result.layer).toBe('blocklist');
  });

  it('passes clean text', async () => {
    const result = await filter.check('Luna discovered a magical garden full of flowers.');
    expect(result.safe).toBe(true);
  });

  it('handles case-insensitive matching', async () => {
    const result = await filter.check('He was KILLED by the dragon');
    expect(result.safe).toBe(false);
  });
});
