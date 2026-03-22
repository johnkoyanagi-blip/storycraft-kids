import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: (...args: any[]) => mockCreate(...args),
    };
  },
}));

vi.mock('@/lib/story-engine/content-filter', () => ({
  ContentFilter: class {
    async check() {
      return { safe: true };
    }
  },
}));

import { generateBeat } from '@/lib/story-engine/generate-beat';
import type { StoryContext } from '@/types/story';

describe('generateBeat', () => {
  const context: StoryContext = {
    storyId: 'story-1', genre: 'adventure', setting: 'enchanted forest',
    theme: 'bravery', characters: [{ name: 'Luna', description: 'A brave explorer' }],
    arcPosition: 'setup', beatCount: 0, fullNarrative: '', ageLevel: 8,
  };

  beforeEach(() => {
    mockCreate = vi.fn();
  });

  it('generates a beat from Claude and returns structured response', async () => {
    mockCreate.mockResolvedValue({
      content: [{
        type: 'text',
        text: JSON.stringify({
          storyText: 'Luna stepped into the enchanted forest.',
          choices: ['Follow the glowing path', 'Climb the ancient tree', 'Talk to the friendly owl'],
          illustrationMoment: true,
        }),
      }],
    });
    const result = await generateBeat(context, 'Start the adventure!');
    expect(result.storyText).toBe('Luna stepped into the enchanted forest.');
    expect(result.choices).toHaveLength(3);
    expect(result.illustrationMoment).toBe(true);
  });

  it('retries on timeout and returns fallback after 3 failures', async () => {
    mockCreate.mockRejectedValue(new Error('timeout'));
    const result = await generateBeat(context, 'Go explore');
    expect(result.storyText).toContain('something unexpected');
    expect(result.choices).toHaveLength(3);
  });
});
