'use client';

interface StickerPickerProps {
  onPick: (emoji: string) => void;
}

const STICKERS = [
  '⭐', '🌟', '✨', '🌈', '☀️', '🌙', '☁️', '⚡',
  '❤️', '💖', '💜', '💙', '💚', '💛', '🧡',
  '🐶', '🐱', '🐰', '🦄', '🐢', '🦋', '🐝', '🐠',
  '🌸', '🌺', '🌻', '🌷', '🍀', '🌳', '🌲', '🍄',
  '🎈', '🎉', '🎁', '🎂', '🍩', '🍦', '🍕', '🍓',
  '🚀', '🚂', '🚗', '✈️', '⛵', '🏰', '🗺️', '👑',
  '😊', '😎', '🥳', '🤩', '😍', '🤗', '😺', '👻',
];

export function StickerPicker({ onPick }: StickerPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {STICKERS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onPick(emoji)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl bg-gray-50 border-2 border-gray-200 hover:bg-purple-100 hover:border-purple-300 hover:scale-110 transition-all duration-150"
          title={`Add ${emoji}`}
          aria-label={`Add ${emoji} sticker`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
