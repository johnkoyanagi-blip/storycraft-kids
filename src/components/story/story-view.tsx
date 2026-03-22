'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BeatDisplay } from './beat-display';
import { ChoicePanel } from './choice-panel';
import { FreeInput } from './free-input';

interface StoryViewProps {
  storyId: string;
  narrative: string;
  choices: string[];
  isLoading: boolean;
  illustrationMoment: boolean;
  error: string | null;
  onChoice: (choice: string) => void;
}

export function StoryView({
  storyId,
  narrative,
  choices,
  isLoading,
  illustrationMoment,
  error,
  onChoice,
}: StoryViewProps) {
  const router = useRouter();

  if (illustrationMoment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-50 to-orange-200 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">🎨</div>
          <h2 className="text-3xl font-black text-purple-700 mb-4">Time to Draw!</h2>
          <p className="text-purple-600 mb-8 text-lg font-semibold">
            Your story has reached a magical moment. Let's create an illustration for this scene!
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push(`/story/${storyId}/illustrate`)}
            className="w-full"
          >
            Create an Illustration
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading && !narrative) {
    return <LoadingSpinner message="Starting your story..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-50 to-orange-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/library')} className="mb-4">
            ← Back to Library
          </Button>
        </div>

        <Card className="bg-white">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-purple-700">Your Story</h1>
            <p className="text-purple-600 font-semibold mt-2">{choices.length} choices left</p>
          </div>

          <BeatDisplay narrative={narrative} />

          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 mb-6">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="py-8">
              <LoadingSpinner message="Writing your story..." />
            </div>
          ) : (
            <>
              <div className="space-y-8">
                <ChoicePanel choices={choices} onChoose={onChoice} disabled={isLoading} />

                {choices.length > 0 && <div className="border-t border-purple-200" />}

                <FreeInput onSubmit={onChoice} disabled={isLoading} />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
