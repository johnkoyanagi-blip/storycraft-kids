import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generatePDF } from '@/lib/pdf/generate-pdf';

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
      childProfile: { select: { displayName: true } },
      pages: {
        orderBy: { sequenceNumber: 'asc' },
      },
    },
  });

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  if (!story.pages || story.pages.length === 0) {
    return NextResponse.json(
      { error: 'Story has no pages to export' },
      { status: 400 }
    );
  }

  try {
    const pdfBlob = await generatePDF({
      title: story.title || 'Untitled Story',
      authorName: story.childProfile.displayName,
      pages: story.pages.map((page: { storyText: string; compositeUrl: string | null; sequenceNumber: number }) => ({
        storyText: page.storyText,
        compositeUrl: page.compositeUrl || undefined,
        sequenceNumber: page.sequenceNumber,
      })),
      layout: 'classic',
    });

    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="story-${story.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
