'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fabric = (typeof window !== 'undefined' ? require('fabric').fabric : null) as any;

export interface DrawingState {
  currentTool: 'pen' | 'eraser';
  brushSize: number;
  color: string;
}

interface CanvasState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
}

export function useDrawingCanvas() {
  const canvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    currentTool: 'pen',
    brushSize: 5,
    color: '#000000',
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const undoStackRef = useRef<CanvasState[]>([]);
  const redoStackRef = useRef<CanvasState[]>([]);
  const MAX_UNDO_STEPS = 20;

  // Initialize canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = new fabric.Canvas('drawing-canvas', {
      width: 1024,
      height: 768,
      backgroundColor: 'transparent',
      isDrawingMode: true,
    });

    canvasRef.current = canvas;

    // Configure initial brush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = drawingState.color;
    canvas.freeDrawingBrush.width = drawingState.brushSize;

    // Save initial state
    undoStackRef.current = [];
    redoStackRef.current = [];

    // Handle drawing events
    canvas.on('object:added', () => {
      // Save state after drawing
      setTimeout(() => {
        const state = canvas.toJSON();
        undoStackRef.current.push({ json: state });
        if (undoStackRef.current.length > MAX_UNDO_STEPS) {
          undoStackRef.current.shift();
        }
        redoStackRef.current = [];
        setCanUndo(undoStackRef.current.length > 0);
        setCanRedo(false);
      }, 50);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update brush properties when drawing state changes
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    if (drawingState.currentTool === 'eraser') {
      // For eraser, use a light color on transparent background
      if (canvas.freeDrawingBrush instanceof fabric.PencilBrush) {
        canvas.freeDrawingBrush.color = 'rgba(255, 255, 255, 0.5)';
      }
      // Eraser effect by clearing with destination-out
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush instanceof fabric.PencilBrush) {
        canvas.freeDrawingBrush.width = drawingState.brushSize;
      }
    } else {
      // Pen tool
      if (canvas.freeDrawingBrush instanceof fabric.PencilBrush) {
        canvas.freeDrawingBrush.color = drawingState.color;
        canvas.freeDrawingBrush.width = drawingState.brushSize;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingState]);

  const setTool = useCallback((tool: 'pen' | 'eraser') => {
    setDrawingState((prev) => ({
      ...prev,
      currentTool: tool,
    }));
  }, []);

  const setBrushSize = useCallback((size: number) => {
    setDrawingState((prev) => ({
      ...prev,
      brushSize: size,
    }));
  }, []);

  const setColor = useCallback((color: string) => {
    setDrawingState((prev) => ({
      ...prev,
      color,
    }));
  }, []);

  const undo = useCallback(() => {
    if (!canvasRef.current || undoStackRef.current.length === 0) return;

    const canvas = canvasRef.current;
    // Save current state to redo stack
    const currentState = canvas.toJSON();
    redoStackRef.current.push({ json: currentState });

    // Load previous state
    const previousState = undoStackRef.current.pop();
    if (previousState) {
      canvas.loadFromJSON(previousState.json, () => {
        canvas.renderAll();
        setCanUndo(undoStackRef.current.length > 0);
        setCanRedo(true);
      });
    }
  }, []);

  const redo = useCallback(() => {
    if (!canvasRef.current || redoStackRef.current.length === 0) return;

    const canvas = canvasRef.current;
    // Save current state to undo stack
    const currentState = canvas.toJSON();
    undoStackRef.current.push({ json: currentState });

    // Load next state
    const nextState = redoStackRef.current.pop();
    if (nextState) {
      canvas.loadFromJSON(nextState.json, () => {
        canvas.renderAll();
        setCanUndo(true);
        setCanRedo(redoStackRef.current.length > 0);
      });
    }
  }, []);

  const clearAll = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.clear();
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const setBackgroundImage = useCallback((imageUrl: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    fabric.Image.fromURL(
      imageUrl,
      (img: any) => {
        // Scale image to fit canvas
        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!
        );
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (canvas.width! - img.width! * scale) / 2,
          top: (canvas.height! - img.height! * scale) / 2,
        });

        canvas.setBackgroundImage(img as any, () => {
          canvas.renderAll();
        });
      },
      { crossOrigin: 'anonymous' }
    );
  }, []);

  const exportAsDataUrl = useCallback(
    async (backgroundOnly = false): Promise<string> => {
      if (!canvasRef.current) return '';

      const canvas = canvasRef.current;

      // If background only, return background as data URL
      if (backgroundOnly) {
        // Create a temporary canvas with just the background
        const tempCanvas = new fabric.Canvas(null, {
          width: 1024,
          height: 768,
        });

        const bg = canvas.backgroundImage;
        if (bg) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tempCanvas.setBackgroundImage(bg as any, () => {
            tempCanvas.renderAll();
          });
        } else {
          tempCanvas.backgroundColor = 'white';
        }

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100));

        const dataUrl = tempCanvas.toDataURL({
          format: 'png',
          multiplier: 1,
          left: 0,
          top: 0,
          width: 1024,
          height: 768,
        });

        tempCanvas.dispose();
        return dataUrl;
      }

      // Export full composite (background + drawing)
      const dataUrl = canvas.toDataURL({
        format: 'png',
        multiplier: 1,
        left: 0,
        top: 0,
        width: 1024,
        height: 768,
      });

      return dataUrl;
    },
    []
  );

  return {
    containerRef,
    canvasRef,
    drawingState,
    canUndo,
    canRedo,
    setTool,
    setBrushSize,
    setColor,
    undo,
    redo,
    clearAll,
    setBackgroundImage,
    exportAsDataUrl,
  };
}
