import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StoryContextManager } from '@/lib/story-engine/story-context';

const contextManager = new StoryContextManager();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const accountId = (session?.user as any)?.accountId;
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 });

  const stories = await prisma.story.findMany({
    where: { childProfileId: profileId, childProfile: { accountId } },
    include: {
      pages: { take: 1, orderBy: { sequenceNumber: 'asc' }, select: { compositeUrl: true } },
      _count: { select: { pages: true, beats: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(stories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const accountId = (session?.user as any)?.accountId;
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { profileId, genre, setting, theme, characters, artStyle } = await req.json();

  const profile = await prisma.childProfile.findFirst({
    where: { id: profileId, accountId },
    include: { _count: { select: { stories: true } } },
  });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile._count.stories >= 50) {
    return NextResponse.json({ error: 'Maximum 50 stories per child' }, { status: 400 });
  }

  const story = await prisma.story.create({
    data: { childProfileId: profileId, genre, setting, theme, artStyle },
  });

  await contextManager.save({
    storyId: story.id, genre, setting, theme,
    characters: characters || [], arcPosition: 'setup',
    beatCount: 0, fullNarrative: '', ageLevel: profile.age,
  });

  return NextResponse.json(story, { status: 201 });
}
