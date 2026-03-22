'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface Page {
  id: string;
  sequenceNumber: number;
  storyText: string;
  compositeUrl?: string;
}

interface StoryData {
  id: string;
  title?: string;
  childProfile: { displayName: string };
  pages: Page[];
}

export default function PrintPage({
  params,
}: {
  params: { storyId: string };
}) {
  const router = useRouter();
  const [story, setStory] = useState<StoryData | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/stories/${params.storyId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch story');
        }
        const data = await response.json();
        setStory(data);

        // Auto-trigger print dialog
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [params.storyId]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Button
            onClick={() => router.back()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading story...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen view with print button */}
      <div className="print:hidden bg-gray-100 min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-3xl font-bold text-purple-900 mb-2">
              {story.title || 'Untitled Story'}
            </h1>
            <p className="text-gray-600 mb-6">
              by {story.childProfile.displayName}
            </p>

            {story.pages.length === 0 ? (
              <p className="text-gray-500">No pages to print</p>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  {story.pages.length} page{story.pages.length !== 1 ? 's' : ''} ready to print
                </p>
                <Button
                  onClick={() => window.print()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print / Save as PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Printable content */}
      <div className="hidden print:block bg-white">
        {/* Cover page */}
        <div className="page-break w-full min-h-screen bg-gradient-to-b from-purple-200 via-purple-100 to-white p-12 flex flex-col items-center justify-center">
          <h1 className="text-5xl font-bold text-center text-purple-900 mb-8">
            {story.title || 'Untitled Story'}
          </h1>
          <p className="text-2xl text-purple-700 text-center">
            Written and illustrated by {story.childProfile.displayName}
          </p>
        </div>

        {/* Story pages */}
        {story.pages.map((page) => (
          <div
            key={page.id}
            className="page-break w-full min-h-screen bg-white p-12 flex flex-col"
          >
            {page.compositeUrl && (
              <div className="mb-6">
                <img
                  src={page.compositeUrl}
                  alt={`Page ${page.sequenceNumber}`}
                  className="w-full h-64 object-cover rounded"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="text-gray-800 text-lg leading-relaxed">
                {page.storyText}
              </p>
            </div>
            <div className="text-gray-400 text-sm text-right mt-8">
              Page {page.sequenceNumber}
            </div>
          </div>
        ))}

        {/* Back page */}
        <div className="page-break w-full min-h-screen bg-gradient-to-b from-white to-purple-100 p-12 flex flex-col items-center justify-center">
          <h2 className="text-6xl font-bold text-purple-900 mb-8">
            The End
          </h2>
          <div className="text-center text-gray-600">
            <p className="text-xl">A story by {story.childProfile.displayName}</p>
            <p className="text-sm mt-4">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          html,
          body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }

          .page-break {
            page-break-after: always;
            page-break-inside: avoid;
          }

          img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}
