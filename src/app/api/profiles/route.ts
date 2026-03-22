import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function getAccountId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.accountId ?? null;
}

export async function GET() {
  const accountId = await getAccountId();
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profiles = await prisma.childProfile.findMany({
    where: { accountId },
    include: { _count: { select: { stories: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const result = profiles.map((p: { id: string; displayName: string; age: number; avatarUrl: string | null; _count: { stories: number } }) => ({
    id: p.id, displayName: p.displayName, age: p.age,
    avatarUrl: p.avatarUrl, storyCount: p._count.stories,
  }));
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const accountId = await getAccountId();
  if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { displayName, age, avatarUrl } = await req.json();
  if (!displayName || !age || age < 1 || age > 18) {
    return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
  }
  const count = await prisma.childProfile.count({ where: { accountId } });
  if (count >= 5) {
    return NextResponse.json({ error: 'Maximum 5 profiles per account' }, { status: 400 });
  }
  const profile = await prisma.childProfile.create({
    data: { accountId, displayName, age, avatarUrl },
  });
  return NextResponse.json(profile, { status: 201 });
}
