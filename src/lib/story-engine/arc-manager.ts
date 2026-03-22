import type { ArcPosition } from '@/types/story';

export class ArcManager {
  getPosition(beatCount: number, climaxReached = false): ArcPosition {
    if (climaxReached) return 'resolution';
    if (beatCount < 2) return 'setup';
    if (beatCount < 8) return 'rising_action';
    return 'climax';
  }

  shouldSuggestClimax(beatCount: number): boolean {
    return beatCount >= 5;
  }

  shouldSuggestEnding(beatCount: number, arcPosition: ArcPosition): boolean {
    return arcPosition === 'resolution' || (arcPosition === 'climax' && beatCount >= 8);
  }

  getPromptGuidance(arcPosition: ArcPosition, beatCount: number): string {
    switch (arcPosition) {
      case 'setup':
        return 'We are in the story setup. Introduce the characters and setting. Make the world feel vivid and inviting.';
      case 'rising_action':
        return `We are in the rising action (beat ${beatCount}). Build tension and adventure. Introduce challenges and surprises. ${
          this.shouldSuggestClimax(beatCount) ? 'Consider offering options that could lead toward the story climax.' : ''
        }`;
      case 'climax':
        return 'We are at the story climax. This is the big, exciting moment. Make it dramatic and satisfying.';
      case 'resolution':
        return 'We are in the resolution. Wrap up the story warmly. Tie up loose ends. Give a satisfying conclusion.';
    }
  }
}
