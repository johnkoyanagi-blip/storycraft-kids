export const GENRE_STYLES: Record<string, { id: string; promptPrefix: string }> = {
  'fairy tale': {
    id: 'soft_watercolor',
    promptPrefix: "Soft watercolor illustration, children's picture book style, gentle pastel colors, whimsical, warm and dreamy,",
  },
  adventure: {
    id: 'bold_cartoon',
    promptPrefix: "Bold cartoon illustration, children's adventure book style, vibrant saturated colors, dynamic composition, exciting,",
  },
  'sci-fi': {
    id: 'digital_illustration',
    promptPrefix: "Digital illustration, children's sci-fi book style, futuristic but friendly, bright neon accents, clean lines,",
  },
  mystery: {
    id: 'moody_pastel',
    promptPrefix: "Moody pastel illustration, children's mystery book style, muted colors with pops of interest, atmospheric, intriguing,",
  },
  funny: {
    id: 'bright_cartoon',
    promptPrefix: "Bright exaggerated cartoon illustration, children's comedy book style, bold outlines, silly expressions, playful colors,",
  },
  'spooky-but-not-too-scary': {
    id: 'friendly_spooky',
    promptPrefix: "Friendly Halloween-style illustration, children's book style, purple and orange palette, cute-spooky, not frightening,",
  },
};

const DEFAULT_STYLE = GENRE_STYLES['funny'];
const NEGATIVE_PROMPT = 'realistic, photographic, scary, violent, weapons, blood, nudity, adult content, dark, depressing';

export function getArtStyle(genre: string): string {
  return (GENRE_STYLES[genre.toLowerCase()] || DEFAULT_STYLE).id;
}

export function getStylePrefix(genre: string): string {
  return (GENRE_STYLES[genre.toLowerCase()] || DEFAULT_STYLE).promptPrefix;
}

export function getNegativePrompt(): string {
  return NEGATIVE_PROMPT;
}
