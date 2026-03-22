import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  const accountId = (session?.user as any)?.accountId;
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const flags = await prisma.contentFlag.findMany({
    where: { story: { childProfile: { accountId } } },
    include: { story: { select: { title: true, genre: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(flags);
}
