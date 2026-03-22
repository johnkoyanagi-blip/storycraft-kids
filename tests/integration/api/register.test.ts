import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    account: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/db';

describe('POST /api/auth/register', () => {
  it('creates a new account with valid email and password', async () => {
    (prisma.account.findUnique as any).mockResolvedValue(null);
    (prisma.account.create as any).mockResolvedValue({
      id: 'acc-1', email: 'parent@example.com', createdAt: new Date(),
    });
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'parent@example.com', password: 'SecurePass123!' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('acc-1');
  });

  it('rejects duplicate email', async () => {
    (prisma.account.findUnique as any).mockResolvedValue({ id: 'existing' });
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'taken@example.com', password: 'SecurePass123!' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
