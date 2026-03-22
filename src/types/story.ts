export interface StoryCharacter {
  name: string;
  description: string;
  avatarUrl?: string;
}

export type ArcPosition = 'setup' | 'rising_action' | 'climax' | 'resolution';

export interface StoryContext {
  storyId: string;
  genre: string;
  setting: string;
  theme: string;
  characters: StoryCharacter[];
  arcPosition: ArcPosition;
  beatCount: number;
  fullNarrative: string;
  ageLevel: number;
}

export interface BeatResponse {
  storyText: string;
  choices: string[];
  illustrationMoment: boolean;
  arcPosition: ArcPosition;
}
