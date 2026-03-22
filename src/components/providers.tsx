'use client';
import { SessionProvider } from 'next-auth/react';
import { ProfileProvider } from '@/hooks/use-profile';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProfileProvider>{children}</ProfileProvider>
    </SessionProvider>
  );
}
