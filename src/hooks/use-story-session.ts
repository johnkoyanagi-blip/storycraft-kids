'use client';
import { useEffect, useState, useRef } from 'react';
import type { StoryContext, BeatResponse } from '@/types/story';

interface StorySessionState {
  storyContext: StoryContext | null;
  fullNarrative: string;
  currentChoices: string[];
  isLoading: boolean;
  illustrationMoment: boolean;
  error: string | null;
}

export function useStorySession(storyId: string) {
  const [state, setState] = useState<StorySessionState>({
    storyContext: null,
    fullNarrative: '',
    currentChoices: [],
    isLoading: true,
    illustrationMoment: false,
    error: null,
  });
  const initialBeatTriggered = useRef(false);
  const beatCount = useRef(0);
  // Keep a history of narratives for undo
  const narrativeHistory = useRef<string[]>([]);

  useEffect(() => {
    fetchStoryAndStartIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  async function fetchStoryAndStartIfNeeded() {
    try {
      const res = await fetch(`/api/stories/${storyId}`);
      if (!res.ok) {
        throw new Error('Failed to load story');
      }
      const story = await res.json();

      // Build narrative from existing beats
      const existingNarrative = story.beats
        ?.map((b: { generatedText: string }) => b.generatedText)
        .join('\n\n') || '';

      setState((prev) => ({
        ...prev,
        storyContext: story,
        fullNarrative: existingNarrative,
      }));

      beatCount.current = story.beats?.length || 0;

      // If no beats exist yet, auto-generate the first one
      if ((!story.beats || story.beats.length === 0) && !initialBeatTriggered.current) {
        initialBeatTriggered.current = true;
        await generateBeat('Begin the story');
      } else {
        // Story already has beats, stop loading
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (_err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load story',
      }));
    }
  }

  async function generateBeat(childInput: string, inputType = 'guided') {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch(`/api/stories/${storyId}/beats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childInput, inputType }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate story beat');
      }

      const beat: BeatResponse = await res.json();
      console.log('[StoryCraft] Beat response:', {
        storyText: beat.storyText?.substring(0, 50),
        choices: beat.choices,
        illustrationMoment: beat.illustrationMoment,
      });
      beatCount.current += 1;

      // Don't trigger illustration on the first 2 beats
      const shouldIllustrate = beat.illustrationMoment && beatCount.current > 2;

      // Save current narrative to history before updating
      setState((prev) => {
        narrativeHistory.current.push(prev.fullNarrative);
        return {
          ...prev,
          fullNarrative: prev.fullNarrative
            ? prev.fullNarrative + '\n\n' + beat.storyText
            : beat.storyText,
          currentChoices: beat.choices || [],
          illustrationMoment: shouldIllustrate,
          isLoading: false,
        };
      });
    } catch (_err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to continue story. Please try again!',
      }));
    }
  }

  async function submitBeatChoice(choice: string) {
    if (!state.storyContext) return;
    await generateBeat(choice, 'guided');
  }

  async function continueStory() {
    if (!state.storyContext) return;
    await generateBeat('Continue the story naturally', 'auto');
  }

  function updateNarrative(newNarrative: string) {
    narrativeHistory.current.push(state.fullNarrative);
    setState((prev) => ({ ...prev, fullNarrative: newNarrative }));
  }

  function undoLastPart() {
    if (narrativeHistory.current.length > 0) {
      const previous = narrativeHistory.current.pop()!;
      setState((prev) => ({ ...prev, fullNarrative: previous }));
    }
  }

  async function rewriteLastPart() {
    if (!state.storyContext || !state.fullNarrative) return;

    // Remove the last paragraph and regenerate
    const paragraphs = state.fullNarrative.split('\n\n');
    if (paragraphs.length <= 1) {
      // Only one paragraph, rewrite the whole thing
      narrativeHistory.current.push(state.fullNarrative);
      setState((prev) => ({ ...prev, fullNarrative: '' }));
      await generateBeat('Begin the story with a different opening');
    } else {
      // Remove last paragraph, then generate a new one
      const lastParagraph = paragraphs.pop();
      const withoutLast = paragraphs.join('\n\n');
      narrativeHistory.current.push(state.fullNarrative);
      setState((prev) => ({ ...prev, fullNarrative: withoutLast }));
      await generateBeat(`Rewrite this part differently: "${lastParagraph}"`, 'rewrite');
    }
  }

  function skipIllustration() {
    setState((prev) => ({ ...prev, illustrationMoment: false }));
  }

  return {
    ...state,
    submitBeatChoice,
    continueStory,
    updateNarrative,
    undoLastPart,
    rewriteLastPart,
    skipIllustration,
  };
}
