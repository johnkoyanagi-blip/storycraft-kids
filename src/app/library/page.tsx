'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Story {
  id: string;
  title: string;
  genre: string;
  status: 'in_progress' | 'completed';
  beatCount: number;
}

export default function LibraryPage() {
  const { status } = useSession();
  const router = useRouter();
  const { profile } = useProfile();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (!profile) {
      router.push('/profiles');
      return;
    }

    if (status === 'authenticated' && profile) {
      fetchStories();
    }
  }, [status, profile, router]);

  async function fetchStories() {
    try {
      const res = await fetch(`/api/stories?profileId=${profile!.id}`);
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNewStory() {
    router.push('/story/new');
  }

  function handleSelectStory(storyId: string) {
    router.push(`/story/${storyId}`);
  }

  if (status === 'loading' || loading) {
    return <LoadingSpinner message="Loading stories..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-purple-50 to-pink-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/profiles')}
            className="mb-4"
          >
            ← Back to Profiles
          </Button>
          <h1 className="text-5xl font-black text-purple-700">
            {profile?.displayName}'s Story Library
          </h1>
          <p className="text-purple-600 text-xl font-semibold mt-2">
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} created
          </p>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-700 text-xl mb-8 font-semibold">No stories yet!</p>
            <p className="text-gray-600 mb-8 text-lg">Let's create your first one!</p>
            <Button variant="primary" size="lg" onClick={handleCreateNewStory}>
              Create Your First Story
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {stories.map((story) => (
                <Card
                  key={story.id}
                  onClick={() => handleSelectStory(story.id)}
                  className="bg-white hover:bg-purple-50"
                >
                  <div className="mb-4">
                    <div className="w-full h-40 bg-gradient-to-br from-purple-300 to-teal-300 rounded-2xl flex items-center justify-center text-4xl font-bold text-white mb-4">
                      📖
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-purple-700 mb-2">{story.title}</h2>
                  <p className="text-teal-600 font-semibold mb-2">{story.genre}</p>
                  <p className="text-gray-600 mb-4">{story.beatCount} beats</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        story.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {story.status === 'completed' ? 'Complete' : 'In Progress'}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button variant="secondary" size="lg" onClick={handleCreateNewStory}>
                Create Another Story
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
