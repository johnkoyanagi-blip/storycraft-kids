'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useStorySession } from '@/hooks/use-story-session';
import { StoryView } from '@/components/story/story-view';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function StoryPage({ params }: { params: { storyId: string } }) {
  const { status } = useSession();
  const router = useRouter();
  const {
    storyContext,
    fullNarrative,
    currentChoices,
    isLoading,
    illustrationMoment,
    error,
    submitBeatChoice,
    continueStory,
    updateNarrative,
    undoLastPart,
    rewriteLastPart,
    skipIllustration,
  } = useStorySession(params.storyId);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (!storyContext) {
    return <LoadingSpinner message="Loading your story..." />;
  }

  return (
    <StoryView
      storyId={params.storyId}
      narrative={fullNarrative}
      choices={currentChoices}
      isLoading={isLoading}
      illustrationMoment={illustrationMoment}
      error={error}
      onChoice={submitBeatChoice}
      onContinue={continueStory}
      onNarrativeChange={updateNarrative}
      onUndo={undoLastPart}
      onRewrite={rewriteLastPart}
      onSkipIllustration={skipIllustration}
    />
  );
}
