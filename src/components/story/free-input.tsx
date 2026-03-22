'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FreeInputProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
}

const MAX_CHARACTERS = 200;

export function FreeInput({ onSubmit, disabled = false }: FreeInputProps) {
  const [input, setInput] = useState('');

  function handleSubmit() {
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-purple-700 font-bold text-lg">Or use your own idea!</label>
      <textarea
        value={input}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARACTERS) {
            setInput(e.target.value);
          }
        }}
        placeholder="What do you think should happen?"
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-base disabled:opacity-50"
        rows={3}
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {input.length}/{MAX_CHARACTERS}
        </span>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
        >
          Use My Idea!
        </Button>
      </div>
    </div>
  );
}
