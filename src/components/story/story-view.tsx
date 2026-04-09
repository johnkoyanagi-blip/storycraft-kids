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
  onContinue?: () => void;
  onNarrativeChange?: (newNarrative: string) => void;
  onUndo?: () => void;
  onRewrite?: () => void;
  onSkipIllustration?: () => void;
}

export function StoryView({
  storyId,
  narrative,
  choices,
  isLoading,
  illustrationMoment,
  error,
  onChoice,
  onContinue,
  onNarrativeChange,
  onUndo,
  onRewrite,
  onSkipIllustration,
}: StoryViewProps) {
  const router = useRouter();

  if (illustrationMoment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-50 to-orange-200 p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <Button variant="ghost" onClick={() => router.push('/library')}>
              ← Back to Library
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/story/${storyId}/preview`)}
            >
              📖 View My Book
            </Button>
          </div>
          <Card className="w-full text-center">
            <div className="text-6xl mb-6">🎨</div>
            <h2 className="text-3xl font-black text-purple-700 mb-4">Time to Draw!</h2>
            <p className="text-purple-600 mb-8 text-lg font-semibold">
              Your story has reached a magical moment. Let&apos;s create an illustration for this scene!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(`/story/${storyId}/illustrate`)}
              className="w-full mb-4"
            >
              Create an Illustration
            </Button>
            {onSkipIllustration && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onSkipIllustration}
                className="w-full text-purple-500"
              >
                Skip — Keep Writing
              </Button>
            )}
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading && !narrative) {
    return <LoadingSpinner message="Starting your story..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-50 to-orange-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={() => router.push('/library')}>
            ← Back to Library
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/story/${storyId}/preview`)}
          >
            📖 View My Book
          </Button>
        </div>

        <Card className="bg-white">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-purple-700">Your Story</h1>
            {choices.length > 0 && (
              <p className="text-purple-600 font-semibold mt-2">Pick a choice, write your own idea, or just continue!</p>
            )}
          </div>

          <BeatDisplay
            narrative={narrative}
            editable={!isLoading}
            onNarrativeChange={onNarrativeChange}
          />

          {/* Quick action buttons */}
          {narrative && !isLoading && (
            <div className="flex flex-wrap gap-2 mb-6">
              {onUndo && (
                <button
                  onClick={onUndo}
                  className="px-4 py-2 text-sm rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 font-semibold transition-colors"
                >
                  ↩ Undo Last Part
                </button>
              )}
              {onRewrite && (
                <button
                  onClick={onRewrite}
                  className="px-4 py-2 text-sm rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold transition-colors"
                >
                  🔄 Rewrite Last Part
                </button>
              )}
            </div>
          )}

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
            <div className="space-y-6">
              {/* Big Continue button */}
              {narrative && onContinue && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onContinue}
                  disabled={isLoading}
                  className="w-full text-lg py-4"
                >
                  ✨ Continue the Story!
                </Button>
              )}

              {/* Choice buttons */}
              <ChoicePanel choices={choices} onChoose={onChoice} disabled={isLoading} />

              {choices.length > 0 && <div className="border-t border-purple-200" />}

              {/* Free input */}
              <FreeInput onSubmit={onChoice} disabled={isLoading} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
