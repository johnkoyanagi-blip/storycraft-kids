'use client';
import { useState } from 'react';

const THEMES = [
  { id: 'friendship', label: 'Friendship', emoji: '👫' },
  { id: 'bravery', label: 'Bravery', emoji: '💪' },
  { id: 'curiosity', label: 'Curiosity', emoji: '🔎' },
  { id: 'kindness', label: 'Kindness', emoji: '💚' },
];

interface ThemePickerProps {
  value: string;
  onChange: (theme: string) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const [useCustom, setUseCustom] = useState(
    value && !THEMES.some((t) => t.id === value)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => {
              onChange(theme.id);
              setUseCustom(false);
            }}
            className={`p-6 rounded-2xl transition-all ${
              value === theme.id && !useCustom
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-200'
                : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
            }`}
          >
            <div className="text-5xl mb-2">{theme.emoji}</div>
            <div className="font-bold">{theme.label}</div>
          </button>
        ))}
      </div>

      <div className="border-t border-purple-200 pt-6">
        <label className="block text-lg font-bold text-purple-700 mb-3">My own theme</label>
        <input
          type="text"
          placeholder="What should the story be about?"
          value={useCustom ? value : ''}
          onChange={(e) => {
            onChange(e.target.value);
            setUseCustom(true);
          }}
          className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-base"
        />
      </div>
    </div>
  );
}
