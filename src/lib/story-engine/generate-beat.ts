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

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[StoryCraft] ANTHROPIC_API_KEY is not set! Using fallback response.');
    return FALLBACK_RESPONSE;
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[StoryCraft] Generating beat (attempt ${attempt + 1}/${MAX_RETRIES})...`);
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const text = (response.content[0] as any).text;
      const parsed = JSON.parse(text);
      const filterResult = await contentFilter.check(parsed.storyText);
      if (!filterResult.safe) {
        console.warn('[StoryCraft] Content filter flagged beat, retrying...');
        continue;
      }
      const newArcPosition = arcManager.getPosition(context.beatCount + 1, context.arcPosition === 'climax');
      const choices = Array.isArray(parsed.choices) && parsed.choices.length > 0
        ? parsed.choices
        : FALLBACK_RESPONSE.choices;
      console.log('[StoryCraft] Beat generated successfully! Choices:', choices);
      return {
        storyText: parsed.storyText,
        choices,
        illustrationMoment: parsed.illustrationMoment ?? false,
        arcPosition: newArcPosition,
      };
    } catch (err: any) {
      const msg = err?.message || err?.status || String(err);
      console.error(`[StoryCraft] Beat generation error (attempt ${attempt + 1}): ${msg}`);
      if (err?.status === 401) {
        console.error('[StoryCraft] API KEY IS INVALID. Please check your ANTHROPIC_API_KEY in .env.local');
        break; // No point retrying with a bad key
      }
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  console.error('[StoryCraft] All retries failed, using fallback response.');
  return FALLBACK_RESPONSE;
}
