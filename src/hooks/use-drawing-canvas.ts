'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

export interface DrawingState {
  currentTool: 'pen' | 'eraser';
  brushSize: number;
  color: string;
}

interface CanvasState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function useDrawingCanvas() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  // Store the canvas DOM element in state so the init effect re-runs
  // the moment the element mounts (it may not be in the DOM on first render
  // when the parent conditionally shows a different screen).
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const canvasElRef = useCallback((node: HTMLCanvasElement | null) => {
    setCanvasEl(node);
  }, []);

  const [drawingState, setDrawingState] = useState<DrawingState>({
    currentTool: 'pen',
    brushSize: 5,
    color: '#000000',
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const undoStackRef = useRef<CanvasState[]>([]);
  const redoStackRef = useRef<CanvasState[]>([]);
  // The "last known good" snapshot — represents the state BEFORE the next
  // mutation. Pushed onto the undo stack when a mutation occurs, then replaced
  // with the new post-mutation snapshot.
  const lastSnapshotRef = useRef<CanvasState | null>(null);
  // Guard so programmatic loads (undo/redo/setBackground) don't generate new
  // history entries via the object:added listener.
  const suppressHistoryRef = useRef(false);
  const MAX_UNDO_STEPS = 30;

  // Initialize canvas when the element is mounted
  useEffect(() => {
    if (!canvasEl) return;

    // Set intrinsic dimensions on the element BEFORE Fabric touches it.
    canvasEl.width = CANVAS_WIDTH;
    canvasEl.height = CANVAS_HEIGHT;

    const canvas = new fabric.Canvas(canvasEl, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
    });

    canvasRef.current = canvas;

    // Configure initial brush (v7 requires a brush instance)
    const brush = new fabric.PencilBrush(canvas);
    brush.color = '#000000';
    brush.width = 5;
    canvas.freeDrawingBrush = brush;

    undoStackRef.current = [];
    redoStackRef.current = [];
    // Initial "empty canvas" snapshot serves as the floor of the undo stack.
    lastSnapshotRef.current = { json: canvas.toJSON() };

    const captureHistory = () => {
      if (suppressHistoryRef.current) return;
      // Push the PREVIOUS snapshot onto the undo stack, then refresh.
      if (lastSnapshotRef.current) {
        undoStackRef.current.push(lastSnapshotRef.current);
        if (undoStackRef.current.length > MAX_UNDO_STEPS) {
          undoStackRef.current.shift();
        }
      }
      lastSnapshotRef.current = { json: canvas.toJSON() };
      redoStackRef.current = [];
      setCanUndo(undoStackRef.current.length > 0);
      setCanRedo(false);
    };

    canvas.on('object:added', captureHistory);
    canvas.on('object:modified', captureHistory);
    canvas.on('object:removed', captureHistory);

    setIsReady(true);

    return () => {
      canvas.dispose();
      canvasRef.current = null;
      setIsReady(false);
    };
  }, [canvasEl]);

  // Update brush whenever drawing state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;

    if (drawingState.currentTool === 'eraser') {
      // Simple eraser: draws with the current background color
      canvas.freeDrawingBrush.color = '#ffffff';
    } else {
      canvas.freeDrawingBrush.color = drawingState.color;
    }
    canvas.freeDrawingBrush.width = drawingState.brushSize;
  }, [drawingState, isReady]);

  const setTool = useCallback((tool: 'pen' | 'eraser') => {
    setDrawingState((prev) => ({ ...prev, currentTool: tool }));
  }, []);

  const setBrushSize = useCallback((size: number) => {
    setDrawingState((prev) => ({ ...prev, brushSize: size }));
  }, []);

  const setColor = useCallback((color: string) => {
    setDrawingState((prev) => ({ ...prev, color }));
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStackRef.current.length === 0) return;

    // Current state → redo stack. Previous snapshot → become current.
    const currentSnapshot = lastSnapshotRef.current ?? { json: canvas.toJSON() };
    redoStackRef.current.push(currentSnapshot);

    const previousState = undoStackRef.current.pop();
    if (!previousState) return;

    suppressHistoryRef.current = true;
    canvas.loadFromJSON(previousState.json).then(() => {
      canvas.renderAll();
      lastSnapshotRef.current = previousState;
      suppressHistoryRef.current = false;
      setCanUndo(undoStackRef.current.length > 0);
      setCanRedo(true);
    });
  }, []);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || redoStackRef.current.length === 0) return;

    const currentSnapshot = lastSnapshotRef.current ?? { json: canvas.toJSON() };
    undoStackRef.current.push(currentSnapshot);

    const nextState = redoStackRef.current.pop();
    if (!nextState) return;

    suppressHistoryRef.current = true;
    canvas.loadFromJSON(nextState.json).then(() => {
      canvas.renderAll();
      lastSnapshotRef.current = nextState;
      suppressHistoryRef.current = false;
      setCanUndo(true);
      setCanRedo(redoStackRef.current.length > 0);
    });
  }, []);

  const clearAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    suppressHistoryRef.current = true;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    suppressHistoryRef.current = false;
    undoStackRef.current = [];
    redoStackRef.current = [];
    lastSnapshotRef.current = { json: canvas.toJSON() };
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const setBackgroundImage = useCallback(async (imageUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Route any non-same-origin URL through our proxy so that:
    //   1. CORS on the upstream CDN can never block us.
    //   2. The canvas stays untainted so toDataURL() works for saving.
    let finalUrl = imageUrl;
    try {
      const parsed = new URL(imageUrl, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        finalUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      }
    } catch {
      // Relative URL — use as-is
    }

    suppressHistoryRef.current = true;
    try {
      const img = await fabric.FabricImage.fromURL(finalUrl, { crossOrigin: 'anonymous' });

      // Scale image to fit canvas
      const scale = Math.min(
        CANVAS_WIDTH / (img.width || 1),
        CANVAS_HEIGHT / (img.height || 1)
      );
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: (CANVAS_WIDTH - (img.width || 0) * scale) / 2,
        top: (CANVAS_HEIGHT - (img.height || 0) * scale) / 2,
        selectable: false,
        evented: false,
      });

      // In fabric v7, backgroundImage is a property
      canvas.backgroundImage = img;
      canvas.renderAll();
      // Refresh the snapshot floor so undo doesn't try to undo the background.
      lastSnapshotRef.current = { json: canvas.toJSON() };
    } catch (err) {
      console.error('[DrawingCanvas] Failed to load background image:', err);
    } finally {
      suppressHistoryRef.current = false;
    }
  }, []);

  const setBackgroundColor = useCallback((color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.backgroundColor = color;
    canvas.renderAll();
  }, []);

  const exportAsDataUrl = useCallback(async (): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    return canvas.toDataURL({
      format: 'png',
      multiplier: 1,
    });
  }, []);

  return {
    canvasRef,
    canvasElRef,
    isReady,
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
    setBackgroundColor,
    exportAsDataUrl,
  };
}
