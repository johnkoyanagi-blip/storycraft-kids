'use client';
import { useEffect, useState } from 'react';
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
    isLoading: false,
    illustrationMoment: false,
    error: null,
  });

  useEffect(() => {
    fetchStory();
  }, [storyId]);

  async function fetchStory() {
    try {
      const res = await fetch(`/api/stories/${storyId}`);
      if (res.ok) {
        const story = await res.json();
        setState((prev) => ({
          ...prev,
          storyContext: story,
          fullNarrative: story.fullNarrative || '',
        }));
      }
    } catch (_err) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to load story',
      }));
    }
  }

  async function submitBeatChoice(choice: string) {
    if (!state.storyContext) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch(`/api/stories/${storyId}/beats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: choice }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit choice');
      }

      const beat: BeatResponse = await res.json();

      setState((prev) => ({
        ...prev,
        fullNarrative: prev.fullNarrative + '\n\n' + beat.storyText,
        currentChoices: beat.choices,
        illustrationMoment: beat.illustrationMoment,
        isLoading: false,
      }));

      await fetchStory();
    } catch (_err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to continue story',
      }));
    }
  }

  return {
    ...state,
    submitBeatChoice,
  };
}
