import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
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
    include: {
      beats: { orderBy: { sequenceNumber: 'asc' } },
      pages: {
        orderBy: { sequenceNumber: 'asc' },
      },
      childProfile: { select: { displayName: true, age: true } },
    },
  });

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  return NextResponse.json(story);
}

export async function PATCH(
  req: Request,
  { params }: { params: { storyId: string } }
) {
  const session = await getServerSession(authOptions);
  const accountId = (session?.user as any)?.accountId;

  if (!accountId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, status, isFavorite } = await req.json();

  const story = await prisma.story.updateMany({
    where: { id: params.storyId, childProfile: { accountId } },
    data: {
      ...(title !== undefined && { title }),
      ...(status !== undefined && { status }),
      ...(isFavorite !== undefined && { isFavorite }),
    },
  });

  if (story.count === 0) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
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

  await prisma.story.deleteMany({
    where: { id: params.storyId, childProfile: { accountId } },
  });

  return NextResponse.json({ success: true });
}
