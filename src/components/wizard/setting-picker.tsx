'use client';
import { useState } from 'react';

const PRESETS = [
  { id: 'enchanted_forest', label: 'Enchanted Forest', emoji: '🌲' },
  { id: 'space_station', label: 'Space Station', emoji: '🛸' },
  { id: 'underwater_kingdom', label: 'Underwater Kingdom', emoji: '🌊' },
  { id: 'big_city', label: 'Big City', emoji: '🏙️' },
  { id: 'magical_school', label: 'Magical School', emoji: '✨' },
];

interface SettingPickerProps {
  value: string;
  onChange: (setting: string) => void;
}

export function SettingPicker({ value, onChange }: SettingPickerProps) {
  const [useCustom, setUseCustom] = useState(
    value && !PRESETS.some((p) => p.id === value)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              onChange(preset.id);
              setUseCustom(false);
            }}
            className={`p-4 rounded-2xl transition-all ${
              value === preset.id && !useCustom
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
                : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
            }`}
          >
            <div className="text-4xl mb-2">{preset.emoji}</div>
            <div className="font-bold">{preset.label}</div>
          </button>
        ))}
      </div>

      <div className="border-t border-purple-200 pt-6">
        <label className="block text-lg font-bold text-purple-700 mb-3">My own idea</label>
        <input
          type="text"
          placeholder="Describe your setting..."
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
