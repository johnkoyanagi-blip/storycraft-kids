import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateBackground } from '@/lib/image-pipeline/generate-background';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const storyId: string | undefined = body.storyId;
    // Optional overrides — if the client happens to pass them we'll use them,
    // otherwise we derive from the story's latest beat.
    let sceneDescription: string | undefined = body.sceneDescription;
    let beatId: string | undefined = body.beatId;

    if (!storyId) {
      return NextResponse.json({ error: 'Missing storyId' }, { status: 400 });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        beats: { orderBy: { sequenceNumber: 'desc' } },
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // If the client didn't specify a beat, use the most recent one.
    if (!beatId) {
      const latestBeat = story.beats[0];
      if (!latestBeat) {
        return NextResponse.json(
          { error: 'Story has no beats yet; write some story first' },
          { status: 400 }
        );
      }
      beatId = latestBeat.id;
      if (!sceneDescription) {
        sceneDescription = latestBeat.generatedText;
      }
    }

    // Final safety net — never let an empty prompt reach Replicate.
    if (!sceneDescription || sceneDescription.trim().length < 10) {
      sceneDescription =
        `A ${story.genre} scene set in ${story.setting}, ` +
        `illustrating the theme of ${story.theme}`;
    }

    console.log('[StoryCraft] Generating illustration for story', storyId, {
      beatId,
      promptLength: sceneDescription.length,
    });

    const result = await generateBackground(sceneDescription, story.genre);

    if (!result.success || !result.url) {
      console.warn('[StoryCraft] Replicate failed, returning fallback', result);
      return NextResponse.json({
        success: false,
        fallbackColor: result.fallbackColor ?? '#F0F0FF',
      });
    }

    // Ensure a Page exists for this beat so we have somewhere to store the
    // background URL — the upload step will later add the child's drawing
    // to the same row.
    const existingPage = await prisma.page.findUnique({ where: { beatId } });
    if (existingPage) {
      await prisma.page.update({
        where: { id: existingPage.id },
        data: { aiBackgroundUrl: result.url },
      });
    } else {
      // Determine next sequence number within the story.
      const pageCount = await prisma.page.count({ where: { storyId } });
      await prisma.page.create({
        data: {
          storyId,
          beatId,
          sequenceNumber: pageCount + 1,
          storyText: sceneDescription,
          aiBackgroundUrl: result.url,
        },
      });
    }

    return NextResponse.json({ success: true, url: result.url, beatId });
  } catch (err) {
    console.error('[StoryCraft] Illustration generate failed:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
