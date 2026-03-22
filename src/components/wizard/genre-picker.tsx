'use client';

const GENRES = [
  { id: 'adventure', label: 'Adventure', emoji: '🧭' },
  { id: 'mystery', label: 'Mystery', emoji: '🔍' },
  { id: 'fairytale', label: 'Fairy Tale', emoji: '🏰' },
  { id: 'scifi', label: 'Sci-Fi', emoji: '🚀' },
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'spooky', label: 'Spooky', emoji: '👻' },
];

interface GenrePickerProps {
  value: string;
  onChange: (genre: string) => void;
}

export function GenrePicker({ value, onChange }: GenrePickerProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {GENRES.map((genre) => (
        <button
          key={genre.id}
          onClick={() => onChange(genre.id)}
          className={`p-6 rounded-2xl transition-all transform hover:scale-105 ${
            value === genre.id
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-300'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          <div className="text-5xl mb-2">{genre.emoji}</div>
          <div className="font-bold text-lg">{genre.label}</div>
        </button>
      ))}
    </div>
  );
}
