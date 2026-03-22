'use client';

import { useEffect } from 'react';
import { useDrawingCanvas } from '@/hooks/use-drawing-canvas';

interface DrawingCanvasProps {
  backgroundUrl?: string | null;
  fallbackColor?: string;
}

export function DrawingCanvas({
  backgroundUrl,
  fallbackColor = '#ffffff',
}: DrawingCanvasProps) {
  const { containerRef, canvasRef, setBackgroundImage } = useDrawingCanvas();

  // Load background image when URL changes
  useEffect(() => {
    if (backgroundUrl && canvasRef.current) {
      setBackgroundImage(backgroundUrl);
    } else if (canvasRef.current) {
      // Set fallback color
      canvasRef.current.backgroundColor = fallbackColor;
      canvasRef.current.renderAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundUrl, fallbackColor]);

  return (
    <div ref={containerRef} className="flex justify-center">
      <canvas
        id="drawing-canvas"
        className="border-4 border-purple-300 rounded-2xl shadow-lg max-w-full h-auto"
      />
    </div>
  );
}
