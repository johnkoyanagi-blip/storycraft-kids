import Replicate from 'replicate';
import { getStylePrefix, getNegativePrompt } from './style-config';

const replicate = new Replicate();

interface GenerationResult {
  success: boolean;
  url?: string;
  fallbackColor?: string;
}

export async function generateBackground(sceneDescription: string, genre: string): Promise<GenerationResult> {
  const stylePrefix = getStylePrefix(genre);
  const prompt = `${stylePrefix} ${sceneDescription}, background scene only, no characters, no people, no animals, no figures, safe for children, no text, no words`;
  const negativePrompt = getNegativePrompt();

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('[StoryCraft] REPLICATE_API_TOKEN is not set!');
    // Fall through to fallback color below
  } else {
    console.log('[StoryCraft] Generating illustration with Replicate...', {
      promptLength: prompt.length,
      genre,
    });

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const output = await replicate.run(
          'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
          { input: { prompt, negative_prompt: negativePrompt, width: 800, height: 640, num_outputs: 1 } },
        );
        console.log('[StoryCraft] Replicate returned:', typeof output, Array.isArray(output) ? `[${output.length} items]` : '(not array)');
        // Replicate SDK v0.25+ returns FileOutput objects instead of plain URL
        // strings. FileOutput stringifies to the URL, so String() always works.
        const raw = Array.isArray(output) ? output[0] : output;
        const url = String(raw);
        if (url.startsWith('http')) {
          console.log('[StoryCraft] Illustration URL:', url.substring(0, 80) + '...');
          return { success: true, url };
        }
        console.warn('[StoryCraft] Replicate returned unexpected output. String():', url.substring(0, 200));
      } catch (err) {
        console.error(`[StoryCraft] Replicate attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : String(err));
        if (attempt === 0) await new Promise((r) => setTimeout(r, 10000)); // 10s wait to clear rate limit
      }
    }
  }

  const genreColors: Record<string, string> = {
    'fairy tale': '#E8D5F5', adventure: '#D4EDDA', 'sci-fi': '#D1ECF1',
    mystery: '#D6D6E8', funny: '#FFF3CD',
  };
  return { success: false, fallbackColor: genreColors[genre.toLowerCase()] || '#F0F0FF' };
}
