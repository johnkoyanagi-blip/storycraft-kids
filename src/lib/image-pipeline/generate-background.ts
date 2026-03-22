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
  const prompt = `${stylePrefix} ${sceneDescription}, safe for children, no text, no words`;
  const negativePrompt = getNegativePrompt();

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const output = await replicate.run(
        'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
        { input: { prompt, negative_prompt: negativePrompt, width: 1024, height: 768, num_outputs: 1 } },
      );
      const url = Array.isArray(output) ? output[0] : output;
      if (typeof url === 'string') return { success: true, url };
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const genreColors: Record<string, string> = {
    'fairy tale': '#E8D5F5', adventure: '#D4EDDA', 'sci-fi': '#D1ECF1',
    mystery: '#D6D6E8', funny: '#FFF3CD',
  };
  return { success: false, fallbackColor: genreColors[genre.toLowerCase()] || '#F0F0FF' };
}
