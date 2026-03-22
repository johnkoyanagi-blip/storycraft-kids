'use client';

interface ColorPaletteProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const COLORS = [
  // Primary colors
  '#FF0000', // Red
  '#FF6B35', // Orange
  '#FFC300', // Yellow
  '#00B347', // Green
  '#0066FF', // Blue
  '#6A0572', // Purple
  '#FF1493', // Deep Pink
  '#8B4513', // Brown

  // Light variants
  '#FFB3BA', // Light Red
  '#FFCAB0', // Light Orange
  '#FFFACD', // Light Yellow
  '#90EE90', // Light Green
  '#ADD8E6', // Light Blue
  '#DDA0DD', // Plum
  '#FFB6C1', // Light Pink

  // Dark variants
  '#8B0000', // Dark Red
  '#CC5200', // Dark Orange
  '#CC8800', // Dark Yellow
  '#004D1A', // Dark Green

  // Neutrals
  '#000000', // Black
  '#FFFFFF', // White
];

export function ColorPalette({ selectedColor, onColorChange }: ColorPaletteProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onColorChange(color)}
          className={`w-12 h-12 rounded-full transition-all duration-200 flex-shrink-0 ${
            selectedColor.toUpperCase() === color.toUpperCase()
              ? 'ring-4 ring-purple-400 scale-110'
              : 'hover:scale-105 ring-1 ring-gray-300'
          }`}
          style={{ backgroundColor: color }}
          title={color}
          aria-label={`Color ${color}`}
        />
      ))}
    </div>
  );
}
