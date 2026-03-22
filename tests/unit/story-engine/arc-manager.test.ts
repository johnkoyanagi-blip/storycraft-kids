import { describe, it, expect } from 'vitest';
import { ArcManager } from '@/lib/story-engine/arc-manager';

describe('ArcManager', () => {
  const manager = new ArcManager();

  it('starts in setup phase', () => {
    expect(manager.getPosition(0)).toBe('setup');
  });

  it('transitions to rising_action after 2 beats', () => {
    expect(manager.getPosition(2)).toBe('rising_action');
  });

  it('suggests climax transition after 6 beats', () => {
    expect(manager.shouldSuggestClimax(6)).toBe(true);
  });

  it('does not suggest climax before 5 beats', () => {
    expect(manager.shouldSuggestClimax(3)).toBe(false);
  });

  it('suggests resolution after climax', () => {
    expect(manager.getPosition(8, true)).toBe('resolution');
  });

  it('generates arc guidance for Claude prompt', () => {
    const guidance = manager.getPromptGuidance('rising_action', 4);
    expect(guidance).toContain('rising action');
    expect(typeof guidance).toBe('string');
  });
});
