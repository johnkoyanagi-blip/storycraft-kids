import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

export async function POST(
  req: Request,
  { params }: { params: { storyId: string } }
) {
  const session = await getServerSession(authOptions);
  const accountId = (session?.user as any)?.accountId;

  if (!accountId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const story = await prisma.story.findFirst({
    where: {
      id: params.storyId,
      childProfile: { accountId },
    },
  });

  if (!story) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const shareToken = nanoid(12);
  await prisma.story.update({
    where: { id: params.storyId },
    data: { shareToken, shareRevokedAt: null, status: 'shared' },
  });

  const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareToken}`;
  return NextResponse.json({ shareToken, shareUrl });
}

export async function DELETE(
  req: Request,
  { params }: { params: { storyId: string } }
) {
  const session = await getServerSession(authOptions);
  const accountId = (session?.user as any)?.accountId;

  if (!accountId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await prisma.story.updateMany({
    where: {
      id: params.storyId,
      childProfile: { accountId },
    },
    data: { shareRevokedAt: new Date() },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
