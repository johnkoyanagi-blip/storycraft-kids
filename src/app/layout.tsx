import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'StoryCraft Kids',
  description: 'Create your own illustrated storybooks!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-purple-50 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
