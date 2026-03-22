import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
  }
  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const account = await prisma.account.create({
    data: { email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  });
  return NextResponse.json(account, { status: 201 });
}
