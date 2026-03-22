import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const story = await prisma.story.findFirst({
    where: { shareToken: params.token },
    include: {
      pages: { orderBy: { sequenceNumber: 'asc' } },
      childProfile: { select: { displayName: true } },
    },
  });

  if (!story) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (story.shareRevokedAt) {
    return NextResponse.json({ error: 'Revoked' }, { status: 410 });
  }

  return NextResponse.json({
    title: story.title,
    authorName: story.childProfile.displayName,
    pages: story.pages,
    genre: story.genre,
  });
}
