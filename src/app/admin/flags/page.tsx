'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface ContentFlag {
  id: string;
  storyId: string;
  flaggedText: string;
  filterLayer: string;
  createdAt: string;
  story: {
    title: string | null;
    genre: string;
  };
}

export default function FlagsPage() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const res = await fetch('/api/admin/flags');
        if (!res.ok) {
          throw new Error('Failed to fetch content flags');
        }
        const data = await res.json();
        setFlags(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFlags();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, length: number = 100) => {
    if (text.length > length) {
      return text.substring(0, length) + '...';
    }
    return text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Content Safety Log</h1>
        <p className="text-gray-600 mb-8">
          Review flagged content from your stories
        </p>

        {error && (
          <Card className="p-4 bg-red-50 border border-red-200 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </Card>
        )}

        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Loading content flags...</p>
          </Card>
        ) : flags.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No flagged content found</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Story
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Flagged Text
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Filter Layer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((flag) => (
                    <tr
                      key={flag.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(flag.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">
                            {flag.story.title || 'Untitled'}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {flag.story.genre}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                        <p
                          className="truncate"
                          title={flag.flaggedText}
                        >
                          {truncateText(flag.flaggedText)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                          {flag.filterLayer}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
