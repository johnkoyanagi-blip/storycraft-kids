import type { StoryContext } from '@/types/story';

export function buildSystemPrompt(context: StoryContext): string {
  const ageGuidance = context.ageLevel <= 8
    ? 'Use simple vocabulary, short sentences (max 10 words), and concrete/visual descriptions. Offer 3 clear, simple choices.'
    : 'Use richer vocabulary and more complex sentence structures. You can explore subtler themes. Offer 2-3 nuanced choices.';

  return `You are a creative writing partner for a ${context.ageLevel}-year-old child. You are helping them write a ${context.genre} story.

SETTING: ${context.setting}
THEME: ${context.theme}
CHARACTERS: ${context.characters.map((c) => `${c.name}: ${c.description}`).join('; ')}

RULES:
- Always maintain character consistency
- Keep the tone appropriate for the ${context.genre} genre
- ${ageGuidance}
- NEVER include scary, violent, sexual, or inappropriate content
- Support and celebrate the child's ideas — weave them into the story naturally
- If the child suggests something off-topic, gently redirect while incorporating their energy

RESPONSE FORMAT (JSON):
{
  "storyText": "The next paragraph of the story (2-4 sentences)",
  "choices": ["Choice 1", "Choice 2", "Choice 3"],
  "illustrationMoment": true/false
}

Only return valid JSON. No markdown, no explanation.`;
}

export function buildBeatPrompt(context: StoryContext, childInput: string, arcGuidance: string): string {
  const narrativeSoFar = context.fullNarrative || '(Story has not started yet)';
  return `STORY SO FAR:\n${narrativeSoFar}\n\nARC GUIDANCE: ${arcGuidance}\n\nTHE CHILD'S INPUT: "${childInput}"\n\nWrite the next story beat, incorporating the child's input naturally. Provide 2-3 options for what happens next. If this is a visually interesting moment (new setting, exciting action, important character moment), set illustrationMoment to true.`;
}
