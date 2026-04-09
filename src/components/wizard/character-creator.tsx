'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export interface Character {
  name: string;
  description: string;
}

interface CharacterCreatorProps {
  value: Character[];
  onChange: (characters: Character[]) => void;
}

export function CharacterCreator({ value, onChange }: CharacterCreatorProps) {
  const [currentName, setCurrentName] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');

  function handleAddCharacter() {
    if (currentName.trim() && currentDescription.trim()) {
      onChange([
        ...value,
        {
          name: currentName,
          description: currentDescription,
        },
      ]);
      setCurrentName('');
      setCurrentDescription('');
    }
  }

  function handleRemoveCharacter(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-6">
      {value.length > 0 && (
        <div className="space-y-3 mb-6">
          {value.map((char, idx) => (
            <Card key={idx} className="bg-orange-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-orange-700 text-lg">{char.name}</h3>
                  <p className="text-orange-600">{char.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCharacter(idx)}
                  className="text-orange-500 hover:text-orange-700 font-bold text-2xl"
                >
                  ×
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {value.length < 3 && (
        <div className="space-y-4 p-4 bg-orange-50 rounded-2xl border-2 border-dashed border-orange-300">
          <Input
            label="Character Name"
            placeholder="e.g., Luna the Dragon"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-semibold text-purple-900 mb-1">
              Character Description
            </label>
            <textarea
              placeholder="What does this character look like? How do they act?"
              value={currentDescription}
              onChange={(e) => setCurrentDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-base text-gray-900 placeholder-gray-400"
              rows={3}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleAddCharacter}
            disabled={!currentName.trim() || !currentDescription.trim()}
            className="w-full"
          >
            Add Character
          </Button>
        </div>
      )}

      {value.length === 0 && (
        <p className="text-center text-gray-600 text-lg font-semibold py-8">
          Add at least one character to get started!
        </p>
      )}
    </div>
  );
}
