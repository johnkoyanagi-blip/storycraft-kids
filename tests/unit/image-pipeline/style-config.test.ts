import { describe, it, expect } from 'vitest';
import { getStylePrefix, getArtStyle } from '@/lib/image-pipeline/style-config';

describe('Style Config', () => {
  it('returns correct style for fairy tale genre', () => {
    expect(getArtStyle('fairy tale')).toBe('soft_watercolor');
  });

  it('returns correct prompt prefix for adventure', () => {
    const prefix = getStylePrefix('adventure');
    expect(prefix).toContain('cartoon');
    expect(prefix).toContain("children's");
  });

  it('returns default style for unknown genre', () => {
    expect(getArtStyle('unknown')).toBe('bright_cartoon');
  });
});
