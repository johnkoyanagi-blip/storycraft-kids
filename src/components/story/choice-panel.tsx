'use client';
import { Button } from '@/components/ui/button';

interface ChoicePanelProps {
  choices: string[];
  onChoose: (choice: string) => void;
  disabled?: boolean;
}

export function ChoicePanel({ choices, onChoose, disabled = false }: ChoicePanelProps) {
  if (!choices.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-purple-700 font-bold text-lg">What happens next?</p>
      <div className="flex flex-col gap-3">
        {choices.map((choice, idx) => (
          <Button
            key={idx}
            variant="secondary"
            onClick={() => onChoose(choice)}
            disabled={disabled}
            className="w-full text-left justify-start"
          >
            {choice}
          </Button>
        ))}
      </div>
    </div>
  );
}
