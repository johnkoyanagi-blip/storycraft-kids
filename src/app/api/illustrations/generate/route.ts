import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateBackground } from '@/lib/image-pipeline/generate-background';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { storyId, pageId, sceneDescription } = await req.json();
  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

  const result = await generateBackground(sceneDescription, story.genre);

  if (result.success && result.url) {
    await prisma.page.update({
      where: { id: pageId },
      data: { aiBackgroundUrl: result.url },
    });
  }

  return NextResponse.json(result);
}
