import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildBeatPrompt } from './prompts';
import { ArcManager } from './arc-manager';
import { ContentFilter } from './content-filter';
import type { StoryContext, BeatResponse } from '@/types/story';

const MAX_RETRIES = 3;
const client = new Anthropic();
const arcManager = new ArcManager();
const contentFilter = new ContentFilter();

const FALLBACK_RESPONSE: BeatResponse = {
  storyText: 'And then something unexpected happened...',
  choices: ['Investigate the mysterious sound', 'Ask a friend for help', 'Take a brave step forward'],
  illustrationMoment: false,
  arcPosition: 'rising_action',
};

export async function generateBeat(context: StoryContext, childInput: string): Promise<BeatResponse> {
  const systemPrompt = buildSystemPrompt(context);
  const arcGuidance = arcManager.getPromptGuidance(context.arcPosition, context.beatCount);
  const userPrompt = buildBeatPrompt(context, childInput, arcGuidance);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const text = (response.content[0] as any).text;
      const parsed = JSON.parse(text);
      const filterResult = await contentFilter.check(parsed.storyText);
      if (!filterResult.safe) continue;
      const newArcPosition = arcManager.getPosition(context.beatCount + 1, context.arcPosition === 'climax');
      return {
        storyText: parsed.storyText,
        choices: parsed.choices || FALLBACK_RESPONSE.choices,
        illustrationMoment: parsed.illustrationMoment ?? false,
        arcPosition: newArcPosition,
      };
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  return FALLBACK_RESPONSE;
}
