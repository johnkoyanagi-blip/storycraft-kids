'use client';

import { forwardRef } from 'react';

interface DrawingCanvasProps {
  className?: string;
}

export const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  function DrawingCanvas({ className }, ref) {
    return (
      <div
        className={
          className ??
          'inline-block border-4 border-purple-300 rounded-2xl shadow-lg overflow-hidden bg-white'
        }
      >
        {/* Fabric controls width/height on this element. Do NOT apply Tailwind
            sizing classes here — they will fight Fabric's inline styles. */}
        <canvas ref={ref} />
      </div>
    );
  }
);
