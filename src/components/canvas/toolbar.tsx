'use client';

import type { DrawingTool } from '@/hooks/use-drawing-canvas';

interface ToolbarProps {
  currentTool: DrawingTool;
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
  onAddShape: (shape: 'circle' | 'square' | 'line') => void;
  onAddText: () => void;
  onFillBackground: () => void;
  onDeleteSelected: () => void;
}

const BRUSH_SIZES = [
  { label: 'S', size: 2, desc: 'Small (2px)' },
  { label: 'M', size: 5, desc: 'Medium (5px)' },
  { label: 'L', size: 10, desc: 'Large (10px)' },
];

const TOOL_BTN_BASE =
  'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 min-h-[48px]';

function toolClass(active: boolean) {
  return active
    ? 'bg-purple-200 border-4 border-purple-600 text-purple-700'
    : 'bg-gray-100 border-4 border-gray-200 text-gray-600 hover:bg-gray-200';
}

function neutralClass(enabled: boolean) {
  return enabled
    ? 'bg-gray-100 border-4 border-gray-200 text-gray-600 hover:bg-gray-200'
    : 'bg-gray-50 border-4 border-gray-200 text-gray-300 cursor-not-allowed';
}

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
  onAddShape,
  onAddText,
  onFillBackground,
  onDeleteSelected,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center p-4 bg-white rounded-2xl shadow-lg">
      {/* Drawing tools */}
      <div className="flex gap-2 border-r border-gray-200 pr-4">
        <button
          onClick={() => onToolChange('pen')}
          className={`${TOOL_BTN_BASE} ${toolClass(currentTool === 'pen')}`}
          title="Pen tool"
          aria-label="Pen tool"
        >
          ✏️
        </button>
        <button
          onClick={() => onToolChange('eraser')}
          className={`${TOOL_BTN_BASE} ${toolClass(currentTool === 'eraser')}`}
          title="Eraser tool"
          aria-label="Eraser tool"
        >
          🧹
        </button>
        <button
          onClick={() => onToolChange('select')}
          className={`${TOOL_BTN_BASE} ${toolClass(currentTool === 'select')}`}
          title="Move / select"
          aria-label="Select tool"
        >
          🖱️
        </button>
      </div>

      {/* Brush size buttons */}
      <div className="flex gap-2 border-r border-gray-200 pr-4">
        {BRUSH_SIZES.map(({ label, size, desc }) => (
          <button
            key={size}
            onClick={() => onBrushSizeChange(size)}
            className={`${TOOL_BTN_BASE} text-sm ${toolClass(brushSize === size)}`}
            title={desc}
            aria-label={`Brush size ${label}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Shape buttons */}
      <div className="flex gap-2 border-r border-gray-200 pr-4">
        <button
          onClick={() => onAddShape('circle')}
          className={`${TOOL_BTN_BASE} ${neutralClass(true)}`}
          title="Add circle"
          aria-label="Add circle"
        >
          ⬤
        </button>
        <button
          onClick={() => onAddShape('square')}
          className={`${TOOL_BTN_BASE} ${neutralClass(true)}`}
          title="Add square"
          aria-label="Add square"
        >
          ■
        </button>
        <button
          onClick={() => onAddShape('line')}
          className={`${TOOL_BTN_BASE} ${neutralClass(true)}`}
          title="Add line"
          aria-label="Add line"
        >
          ／
        </button>
      </div>

      {/* Text + fill */}
      <div className="flex gap-2 border-r border-gray-200 pr-4">
        <button
          onClick={onAddText}
          className={`${TOOL_BTN_BASE} ${neutralClass(true)}`}
          title="Add text"
          aria-label="Add text"
        >
          T
        </button>
        <button
          onClick={onFillBackground}
          className={`${TOOL_BTN_BASE} ${neutralClass(true)}`}
          title="Fill background with current color"
          aria-label="Fill background"
        >
          🪣
        </button>
      </div>

      {/* Undo / redo / delete */}
      <div className="flex gap-2 border-r border-gray-200 pr-4">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`${TOOL_BTN_BASE} ${neutralClass(canUndo)}`}
          title="Undo (↶)"
          aria-label="Undo"
        >
          ↶
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`${TOOL_BTN_BASE} ${neutralClass(canRedo)}`}
          title="Redo (↷)"
          aria-label="Redo"
        >
          ↷
        </button>
        <button
          onClick={onDeleteSelected}
          className={`${TOOL_BTN_BASE} bg-orange-100 border-4 border-orange-200 text-orange-600 hover:bg-orange-200`}
          title="Delete selected"
          aria-label="Delete selected"
        >
          ✂️
        </button>
      </div>

      {/* Clear all */}
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
        className={`${TOOL_BTN_BASE} bg-red-100 border-4 border-red-200 text-red-600 hover:bg-red-200`}
        title="Clear all (⌫)"
        aria-label="Clear all"
      >
        ⌫
      </button>
    </div>
  );
}
