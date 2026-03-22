import Anthropic from '@anthropic-ai/sdk';
import blocklist from '../../../content-blocklist.json';

interface FilterResult {
  safe: boolean;
  layer?: 'blocklist' | 'ai_classifier';
  reason?: string;
}

export class ContentFilter {
  private terms: Set<string>;
  private client: Anthropic;

  constructor() {
    this.terms = new Set(blocklist.terms.map((t) => t.toLowerCase()));
    this.client = new Anthropic();
  }

  async check(text: string): Promise<FilterResult> {
    // Layer 1: Keyword blocklist with substring matching
    const words = text.toLowerCase().split(/\W+/);
    for (const word of words) {
      // Check if any blocklist term is contained within this word
      for (const term of Array.from(this.terms)) {
        if (word.includes(term)) {
          return { safe: false, layer: 'blocklist', reason: `Blocked term: ${term}` };
        }
      }
    }

    // Layer 2: AI safety classifier
    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: `Is the following text appropriate for children ages 6-12? Reply with only YES or NO followed by a one-word reason.\n\nText: "${text}"`,
        }],
      });
      const answer = (response.content[0] as any).text.trim().toUpperCase();
      if (answer.startsWith('NO')) {
        return { safe: false, layer: 'ai_classifier', reason: answer };
      }
    } catch {
      // Fail open if AI check fails
    }
    return { safe: true };
  }
}
