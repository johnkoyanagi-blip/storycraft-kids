import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      storyId,
      beatId,
      compositeUrl,
      childDrawingUrl,
      aiBackgroundUrl,
    }: {
      storyId?: string;
      beatId?: string;
      compositeUrl?: string;
      childDrawingUrl?: string;
      aiBackgroundUrl?: string;
    } = await req.json();

    if (!storyId || !compositeUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        beats: { orderBy: { sequenceNumber: 'desc' } },
        pages: { orderBy: { sequenceNumber: 'desc' } },
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Resolve which beat/page this illustration belongs to.
    // Preference order:
    //   1. beatId explicitly passed by the client
    //   2. A page that already has an aiBackgroundUrl but no compositeUrl
    //   3. The most recent beat
    let targetBeatId = beatId;
    if (!targetBeatId) {
      const pendingPage = story.pages.find(
        (p) => p.aiBackgroundUrl && !p.compositeUrl
      );
      if (pendingPage) {
        targetBeatId = pendingPage.beatId;
      } else if (story.beats[0]) {
        targetBeatId = story.beats[0].id;
      }
    }

    if (!targetBeatId) {
      return NextResponse.json(
        { error: 'Could not determine which beat to illustrate' },
        { status: 400 }
      );
    }

    const existing = await prisma.page.findUnique({
      where: { beatId: targetBeatId },
    });

    if (existing) {
      await prisma.page.update({
        where: { id: existing.id },
        data: {
          compositeUrl,
          childDrawingUrl: childDrawingUrl || existing.childDrawingUrl,
          aiBackgroundUrl: aiBackgroundUrl || existing.aiBackgroundUrl,
        },
      });
    } else {
      // No pre-existing page (e.g. "Draw Everything Myself" path skipped
      // background generation). Create one now.
      const beat = story.beats.find((b) => b.id === targetBeatId);
      const pageCount = story.pages.length;
      await prisma.page.create({
        data: {
          storyId,
          beatId: targetBeatId,
          sequenceNumber: pageCount + 1,
          storyText: beat?.generatedText ?? '',
          compositeUrl,
          childDrawingUrl: childDrawingUrl || null,
          aiBackgroundUrl: aiBackgroundUrl || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      storyId,
      beatId: targetBeatId,
      message: 'Illustration saved successfully',
    });
  } catch (error) {
    console.error('[StoryCraft] Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to save illustration' },
      { status: 500 }
    );
  }
}
