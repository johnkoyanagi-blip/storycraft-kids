import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    childProfile: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { accountId: 'acc-1' } }),
}));

import { GET, POST } from '@/app/api/profiles/route';
import { prisma } from '@/lib/db';

describe('Profiles API', () => {
  it('GET returns child profiles for the account', async () => {
    (prisma.childProfile.findMany as any).mockResolvedValue([
      { id: 'child-1', displayName: 'Milly', age: 8, avatarUrl: null, _count: { stories: 3 } },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].displayName).toBe('Milly');
  });

  it('POST creates a new child profile (max 5)', async () => {
    (prisma.childProfile.count as any).mockResolvedValue(1);
    (prisma.childProfile.create as any).mockResolvedValue({
      id: 'child-2', displayName: 'Sam', age: 10, avatarUrl: null,
    });
    const req = new Request('http://localhost/api/profiles', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Sam', age: 10 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('POST rejects when 5 profiles already exist', async () => {
    (prisma.childProfile.count as any).mockResolvedValue(5);
    const req = new Request('http://localhost/api/profiles', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Too Many', age: 7 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
