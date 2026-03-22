'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProfile } from '@/hooks/use-profile';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { GenrePicker } from '@/components/wizard/genre-picker';
import { SettingPicker } from '@/components/wizard/setting-picker';
import { CharacterCreator, type Character } from '@/components/wizard/character-creator';
import { ThemePicker } from '@/components/wizard/theme-picker';

interface WizardData {
  genre: string;
  setting: string;
  characters: Character[];
  theme: string;
}

export default function StoryNewPage() {
  const { status } = useSession();
  const router = useRouter();
  const { profile } = useProfile();
  const [wizardData, setWizardData] = useState<WizardData>({
    genre: '',
    setting: '',
    characters: [],
    theme: '',
  });

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (!profile) {
    router.push('/profiles');
    return null;
  }

  async function handleComplete(data: WizardData) {
    if (!profile) return;
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          genre: data.genre,
          setting: data.setting,
          theme: data.theme,
          characters: data.characters,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create story');
      }

      const story = await res.json();
      router.push(`/story/${story.id}`);
    } catch (err) {
      console.error('Failed to create story:', err);
      throw err;
    }
  }

  const steps = [
    {
      title: 'What kind of story?',
      component: (
        <div className="flex justify-center">
          <GenrePicker
            value={wizardData.genre}
            onChange={(genre) => setWizardData({ ...wizardData, genre })}
          />
        </div>
      ),
    },
    {
      title: 'Where does it happen?',
      component: (
        <SettingPicker
          value={wizardData.setting}
          onChange={(setting) => setWizardData({ ...wizardData, setting })}
        />
      ),
    },
    {
      title: 'Who are the characters?',
      component: (
        <CharacterCreator
          value={wizardData.characters}
          onChange={(characters) => setWizardData({ ...wizardData, characters })}
        />
      ),
    },
    {
      title: 'What is the story about?',
      component: (
        <div className="flex justify-center">
          <ThemePicker
            value={wizardData.theme}
            onChange={(theme) => setWizardData({ ...wizardData, theme })}
          />
        </div>
      ),
    },
  ];

  return <WizardShell steps={steps} onComplete={handleComplete} />;
}
