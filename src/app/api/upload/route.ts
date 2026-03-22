import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { storyId, compositeUrl, childDrawingUrl, aiBackgroundUrl } = await req.json();

    if (!storyId || !compositeUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the story to find the associated page
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { pages: true },
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // For now, update the first page with illustration moment
    // In a full implementation, you'd track which beat/page the illustration is for
    const pageToUpdate = story.pages.find((p: { aiBackgroundUrl: string | null }) => p.aiBackgroundUrl);

    if (pageToUpdate) {
      await prisma.page.update({
        where: { id: pageToUpdate.id },
        data: {
          childDrawingUrl: childDrawingUrl || null,
          compositeUrl,
          aiBackgroundUrl: aiBackgroundUrl || pageToUpdate.aiBackgroundUrl,
        },
      });
    }

    return NextResponse.json({
      success: true,
      storyId,
      message: 'Illustration saved successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to save illustration' },
      { status: 500 }
    );
  }
}
