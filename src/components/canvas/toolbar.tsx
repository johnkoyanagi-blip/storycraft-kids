'use client';

interface ToolbarProps {
  currentTool: 'pen' | 'eraser';
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: 'pen' | 'eraser') => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
}

const BRUSH_SIZES = [
  { label: 'S', size: 2, desc: 'Small (2px)' },
  { label: 'M', size: 5, desc: 'Medium (5px)' },
  { label: 'L', size: 10, desc: 'Large (10px)' },
];

export function Toolbar({
  currentTool,
  brushSize,
  canUndo,
  canRedo,
  onToolChange,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClearAll,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center p-4 bg-white rounded-2xl shadow-lg">
      {/* Tool buttons */}
      <div className="flex gap-2 border-r border-gray-200 pr-4">
        <button
          onClick={() => onToolChange('pen')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 min-h-[48px] ${
            currentTool === 'pen'
              ? 'bg-purple-200 border-4 border-purple-600 text-purple-700'
              : 'bg-gray-100 border-4 border-gray-200 text-gray-600 hover:bg-gray-200'
          }`}
          title="Pen tool"
          aria-label="Pen tool"
        >
          ✏️
        </button>

        <button
          onClick={() => onToolChange('eraser')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 min-h-[48px] ${
            currentTool === 'eraser'
              ? 'bg-purple-200 border-4 border-purple-600 text-purple-700'
              : 'bg-gray-100 border-4 border-gray-200 text-gray-600 hover:bg-gray-200'
          }`}
          title="Eraser tool"
          aria-label="Eraser tool"
        >
          🧹
        </button>
      </div>

      {/* Brush size buttons */}
      <div className="flex gap-2 border-r border-gray-200 pr-4">
        {BRUSH_SIZES.map(({ label, size, desc }) => (
          <button
            key={size}
            onClick={() => onBrushSizeChange(size)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 min-h-[48px] ${
              brushSize === size
                ? 'bg-purple-200 border-4 border-purple-600 text-purple-700'
                : 'bg-gray-100 border-4 border-gray-200 text-gray-600 hover:bg-gray-200'
            }`}
            title={desc}
            aria-label={`Brush size ${label}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Undo/Redo buttons */}
      <div className="flex gap-2 border-r border-gray-200 pr-4">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 min-h-[48px] ${
            canUndo
              ? 'bg-gray-100 border-4 border-gray-200 text-gray-600 hover:bg-gray-200'
              : 'bg-gray-50 border-4 border-gray-200 text-gray-300 cursor-not-allowed'
          }`}
          title="Undo (↶)"
          aria-label="Undo"
        >
          ↶
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 min-h-[48px] ${
            canRedo
              ? 'bg-gray-100 border-4 border-gray-200 text-gray-600 hover:bg-gray-200'
              : 'bg-gray-50 border-4 border-gray-200 text-gray-300 cursor-not-allowed'
          }`}
          title="Redo (↷)"
          aria-label="Redo"
        >
          ↷
        </button>
      </div>

      {/* Clear all button */}
      <button
        onClick={() => {
          if (
            window.confirm(
              'Are you sure you want to clear everything? This cannot be undone.'
            )
          ) {
            onClearAll();
          }
        }}
        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 min-h-[48px] bg-red-100 border-4 border-red-200 text-red-600 hover:bg-red-200"
        title="Clear all (⌫)"
        aria-label="Clear all"
      >
        ⌫
      </button>
    </div>
  );
}
