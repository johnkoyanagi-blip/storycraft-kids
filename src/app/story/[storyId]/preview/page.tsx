'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FlipbookViewer, PageData } from '@/components/book/flipbook-viewer';
import { ExportPanel } from '@/components/book/export-panel';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface StoryData {
  id: string;
  title?: string;
  childProfile: { displayName: string };
  pages: PageData[];
}

export default function PreviewPage({
  params,
}: {
  params: { storyId: string };
}) {
  const router = useRouter();
  const [story, setStory] = useState<StoryData | null>(null);
  const [layout, setLayout] = useState<'classic' | 'full-bleed' | 'side-by-side'>(
    'classic'
  );
  const [isLoading, setIsLoading] = useState(true);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [params.storyId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading your story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">
            {error || 'Story not found'}
          </p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            className="bg-white text-purple-600 hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Story
          </Button>
          <h1 className="text-4xl font-bold text-purple-900 mt-4">
            {story.title || 'Untitled Story'}
          </h1>
          <p className="text-gray-700 mt-1">
            by {story.childProfile.displayName}
          </p>
        </div>

        {/* Flipbook Viewer */}
        <div className="bg-white rounded-lg shadow-lg mb-8 p-4">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {story.pages.length > 0 ? (
              <FlipbookViewer
                title={story.title || 'Untitled Story'}
                authorName={story.childProfile.displayName}
                pages={story.pages}
                layout={layout}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500 text-lg">No pages yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Export Panel */}
        {story.pages.length > 0 && (
          <ExportPanel
            storyId={story.id}
            onLayoutChange={setLayout}
          />
        )}
      </div>
    </div>
  );
}
