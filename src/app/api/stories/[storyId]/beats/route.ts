import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StoryContextManager } from '@/lib/story-engine/story-context';
import { generateBeat } from '@/lib/story-engine/generate-beat';
import { syncStoryContextIfDue } from '@/lib/story-engine/sync-service';

const contextManager = new StoryContextManager();

export async function POST(req: Request, { params }: { params: { storyId: string } }) {
  const session = await getServerSession(authOptions);
  const accountId = (session?.user as any)?.accountId;
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { storyId } = params;
  const { childInput, inputType } = await req.json();

  const story = await prisma.story.findFirst({
    where: { id: storyId, childProfile: { accountId } },
  });
  if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

  await syncStoryContextIfDue(storyId);

  let context = await contextManager.load(storyId);
  if (!context) {
    const beats = await prisma.storyBeat.findMany({
      where: { storyId }, orderBy: { sequenceNumber: 'asc' },
    });
    context = {
      storyId, genre: story.genre, setting: story.setting, theme: story.theme,
      characters: [], arcPosition: 'setup', beatCount: beats.length,
      fullNarrative: beats.map((b: { generatedText: string }) => b.generatedText).join('\n\n'), ageLevel: 8,
    };
  }

  const beatResponse = await generateBeat(context, childInput);

  const beat = await prisma.storyBeat.create({
    data: {
      storyId, sequenceNumber: context.beatCount + 1,
      childChoice: childInput, childInputType: inputType || 'guided',
      generatedText: beatResponse.storyText,
      isIllustrationMoment: beatResponse.illustrationMoment,
    },
  });

  context.beatCount += 1;
  context.fullNarrative += `\n\n${beatResponse.storyText}`;
  context.arcPosition = beatResponse.arcPosition;
  await contextManager.save(context);

  let page = null;
  if (beatResponse.illustrationMoment) {
    const pageCount = await prisma.page.count({ where: { storyId } });
    page = await prisma.page.create({
      data: {
        storyId, beatId: beat.id, sequenceNumber: pageCount + 1,
        storyText: beatResponse.storyText,
      },
    });
  }

  return NextResponse.json({
    beat, choices: beatResponse.choices,
    illustrationMoment: beatResponse.illustrationMoment,
    page, arcPosition: beatResponse.arcPosition,
    suggestEnding: beatResponse.arcPosition === 'resolution',
  });
}
