'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

export type DrawingTool = 'pen' | 'eraser' | 'select';

export interface DrawingState {
  currentTool: DrawingTool;
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
  // The HTMLImageElement of the current AI background, kept around so we can
  // composite it into the exported PNG via an offscreen canvas.
  const bgImageRef = useRef<HTMLImageElement | null>(null);

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

  const captureHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (suppressHistoryRef.current) return;
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
  }, []);

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
      enableRetinaScaling: false,
    });

    // Fabric v7 wraps the canvas in a block-level container div.
    // Block elements expand to fill their parent — which makes our
    // fit-content wrapper create a circular sizing dependency.
    // Fix: force Fabric's wrapper to inline-block so it shrink-wraps.
    const lowerEl = canvas.getElement();
    const fabricWrapper = lowerEl.parentElement;
    if (fabricWrapper) {
      fabricWrapper.style.display = 'inline-block';
    }

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

    canvas.on('object:added', captureHistory);
    canvas.on('object:modified', captureHistory);
    canvas.on('object:removed', captureHistory);

    setIsReady(true);

    return () => {
      canvas.dispose();
      canvasRef.current = null;
      setIsReady(false);
    };
  }, [canvasEl, captureHistory]);

  // Sync tool/brush state to the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;

    const isDrawing =
      drawingState.currentTool === 'pen' || drawingState.currentTool === 'eraser';
    canvas.isDrawingMode = isDrawing;

    if (drawingState.currentTool === 'eraser') {
      // Simple eraser: draws with the current background color
      canvas.freeDrawingBrush.color = '#ffffff';
    } else {
      canvas.freeDrawingBrush.color = drawingState.color;
    }
    canvas.freeDrawingBrush.width = drawingState.brushSize;
  }, [drawingState, isReady]);

  const setTool = useCallback((tool: DrawingTool) => {
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

  // Clear the CSS background image on Fabric's wrapper div.
  const clearWrapperBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    bgImageRef.current = null;
    const fabricWrapper = canvas.getElement().parentElement;
    if (fabricWrapper) {
      fabricWrapper.style.backgroundImage = '';
    }
  }, []);

  const clearAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    suppressHistoryRef.current = true;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    clearWrapperBackground();
    canvas.renderAll();
    suppressHistoryRef.current = false;
    undoStackRef.current = [];
    redoStackRef.current = [];
    lastSnapshotRef.current = { json: canvas.toJSON() };
    setCanUndo(false);
    setCanRedo(false);
  }, [clearWrapperBackground]);

  // Render the AI background via CSS on Fabric's wrapper div instead of through
  // Fabric's backgroundImage property. Fabric v7's render pipeline applies a
  // transform that mis-scales the image (especially at sub-1.0 DPR), shrinking
  // it to ~55% of the canvas. By using a plain CSS background-image we sidestep
  // Fabric's pipeline entirely; the browser renders the image at the wrapper's
  // box size. On export we composite the image into the PNG manually.
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

    try {
      // Preload so the image is decoded by the time we apply CSS, and so we
      // can composite it into the exported PNG.
      const htmlImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Image load failed'));
        el.src = finalUrl;
      });

      bgImageRef.current = htmlImg;

      const fabricWrapper = canvas.getElement().parentElement;
      if (fabricWrapper) {
        fabricWrapper.style.backgroundImage = `url("${finalUrl}")`;
        fabricWrapper.style.backgroundSize = '100% 100%';
        fabricWrapper.style.backgroundRepeat = 'no-repeat';
        fabricWrapper.style.backgroundPosition = 'center';
      }

      // Make Fabric's canvas transparent so the CSS background shows through.
      // Empty string is falsy in Fabric's _renderBackground check, so the
      // backing-store fillRect is skipped.
      suppressHistoryRef.current = true;
      canvas.backgroundColor = '';
      canvas.renderAll();
      lastSnapshotRef.current = { json: canvas.toJSON() };
      suppressHistoryRef.current = false;
    } catch (err) {
      console.error('[DrawingCanvas] Failed to load background image:', err);
    }
  }, []);

  const setBackgroundColor = useCallback(
    (color: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      clearWrapperBackground();
      canvas.backgroundColor = color;
      canvas.renderAll();
    },
    [clearWrapperBackground]
  );

  // ──────────────────────────────────────────────────────────────────
  // Drawing tools: shapes / text / stickers / fill / delete
  // Each adds an object at canvas center, selects it, and switches the tool
  // to 'select' so the user can immediately drag/resize/rotate.
  // ──────────────────────────────────────────────────────────────────

  const addShape = useCallback(
    (shape: 'circle' | 'square' | 'line') => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const cx = CANVAS_WIDTH / 2;
      const cy = CANVAS_HEIGHT / 2;
      let obj: fabric.FabricObject;

      if (shape === 'circle') {
        obj = new fabric.Circle({
          left: cx - 60,
          top: cy - 60,
          radius: 60,
          fill: drawingState.color,
          stroke: '#000000',
          strokeWidth: 2,
        });
      } else if (shape === 'square') {
        obj = new fabric.Rect({
          left: cx - 60,
          top: cy - 60,
          width: 120,
          height: 120,
          fill: drawingState.color,
          stroke: '#000000',
          strokeWidth: 2,
        });
      } else {
        obj = new fabric.Line([cx - 100, cy, cx + 100, cy], {
          stroke: drawingState.color,
          strokeWidth: Math.max(drawingState.brushSize, 4),
        });
      }

      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
      setDrawingState((prev) => ({ ...prev, currentTool: 'select' }));
    },
    [drawingState.color, drawingState.brushSize]
  );

  const addText = useCallback(
    (initial: string = 'Tap to edit') => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const obj = new fabric.IText(initial, {
        left: CANVAS_WIDTH / 2 - 100,
        top: CANVAS_HEIGHT / 2 - 20,
        fontSize: 40,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        fill: drawingState.color,
      });

      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
      setDrawingState((prev) => ({ ...prev, currentTool: 'select' }));
    },
    [drawingState.color]
  );

  const addSticker = useCallback((emoji: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const obj = new fabric.Text(emoji, {
      left: CANVAS_WIDTH / 2 - 40,
      top: CANVAS_HEIGHT / 2 - 40,
      fontSize: 80,
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
    });

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    setDrawingState((prev) => ({ ...prev, currentTool: 'select' }));
  }, []);

  // "Fill bucket" — replaces the canvas backdrop with the current color.
  // Removes any AI background; this is an undoable action.
  const fillBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Push current state onto undo stack before mutating.
    if (lastSnapshotRef.current) {
      undoStackRef.current.push(lastSnapshotRef.current);
      if (undoStackRef.current.length > MAX_UNDO_STEPS) {
        undoStackRef.current.shift();
      }
    }

    clearWrapperBackground();
    canvas.backgroundColor = drawingState.color;
    canvas.renderAll();

    lastSnapshotRef.current = { json: canvas.toJSON() };
    redoStackRef.current = [];
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(false);
  }, [drawingState.color, clearWrapperBackground]);

  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  }, []);

  const exportAsDataUrl = useCallback(async (): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    // Drop selection so handles don't appear in the export.
    canvas.discardActiveObject();
    canvas.renderAll();

    // If a CSS background image is in play, composite it with the canvas
    // content via an offscreen canvas (the CSS background isn't part of
    // Fabric's toDataURL output).
    if (bgImageRef.current) {
      const offscreen = document.createElement('canvas');
      offscreen.width = CANVAS_WIDTH;
      offscreen.height = CANVAS_HEIGHT;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.drawImage(bgImageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(canvas.getElement(), 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        return offscreen.toDataURL('image/png');
      }
    }

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
    addShape,
    addText,
    addSticker,
    fillBackground,
    deleteSelected,
    exportAsDataUrl,
  };
}
