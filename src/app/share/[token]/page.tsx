'use client';

import { useState, useEffect } from 'react';
import { FlipbookViewer, PageData } from '@/components/book/flipbook-viewer';

interface SharedStoryData {
  title?: string;
  authorName: string;
  pages: PageData[];
  genre: string;
}

export default function SharePage({
  params,
}: {
  params: { token: string };
}) {
  const [story, setStory] = useState<SharedStoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/share/${params.token}`);

        if (response.status === 410) {
          setError('This story is no longer shared');
          return;
        }

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
  }, [params.token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold text-lg mb-2">
            {error}
          </p>
          <p className="text-gray-600">
            The story you're looking for is not available or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Story not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">
            {story.title || 'Untitled Story'}
          </h1>
          <p className="text-gray-700 text-lg">
            by {story.authorName}
          </p>
        </div>

        {/* Flipbook Viewer */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {story.pages.length > 0 ? (
              <FlipbookViewer
                title={story.title || 'Untitled Story'}
                authorName={story.authorName}
                pages={story.pages}
                layout="classic"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500 text-lg">No pages available</p>
              </div>
            )}
          </div>
        </div>

        {/* Story Info */}
        <div className="mt-8 bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">
            A {story.genre} story shared with you
          </p>
        </div>
      </div>
    </div>
  );
}
