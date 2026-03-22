'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DrawingCanvas } from '@/components/canvas/drawing-canvas';
import { Toolbar } from '@/components/canvas/toolbar';
import { ColorPalette } from '@/components/canvas/color-palette';
import { useDrawingCanvas } from '@/hooks/use-drawing-canvas';

type Step = 'choice' | 'generating' | 'drawing';

export default function IllustratePage({ params }: { params: { storyId: string } }) {
  const { status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>('choice');
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<'ai-only' | 'draw-together' | 'draw-everything'>(
    'draw-together'
  );
  const [saving, setSaving] = useState(false);

  const {
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
    exportAsDataUrl,
  } = useDrawingCanvas();

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  async function handleGenerateBackground() {
    setStep('generating');
    try {
      const res = await fetch('/api/illustrations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: params.storyId }),
      });

      if (res.ok) {
        const data = await res.json();
        setBackgroundUrl(data.url);
        setStep('drawing');
      } else {
        setStep('choice');
      }
    } catch (err) {
      console.error('Failed to generate background:', err);
      setStep('choice');
    }
  }

  async function handleSaveDrawing() {
    if (!canvasRef.current) return;

    setSaving(true);
    try {
      let compositeUrl = '';
      let childDrawingUrl = '';

      if (drawMode === 'ai-only') {
        // Just use AI background
        compositeUrl = await exportAsDataUrl(true);
      } else if (drawMode === 'draw-everything') {
        // Just child drawing (no background)
        compositeUrl = await exportAsDataUrl(false);
      } else {
        // AI background + child drawing composite
        compositeUrl = await exportAsDataUrl(false);
        childDrawingUrl = await exportAsDataUrl(false);
      }

      // Upload to API
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: params.storyId,
          compositeUrl,
          childDrawingUrl,
          aiBackgroundUrl: backgroundUrl,
        }),
      });

      if (res.ok) {
        router.push(`/story/${params.storyId}`);
      } else {
        alert('Failed to save drawing');
        setSaving(false);
      }
    } catch (err) {
      console.error('Failed to save drawing:', err);
      alert('Error saving drawing');
      setSaving(false);
    }
  }

  // Show choice screen
  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-50 to-orange-200 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <div className="text-center">
            <div className="text-6xl mb-6">🎨</div>
            <h1 className="text-4xl font-black text-purple-700 mb-4">Create an Illustration</h1>
            <p className="text-purple-600 mb-8 text-lg font-semibold">
              How would you like to illustrate this moment?
            </p>

            <div className="space-y-3 mb-8">
              <button
                onClick={() => {
                  setDrawMode('ai-only');
                  handleGenerateBackground();
                }}
                className="w-full p-4 rounded-xl border-4 border-purple-300 bg-purple-50 hover:bg-purple-100 transition-all text-left font-semibold text-purple-700"
              >
                <div className="text-2xl mb-2">🤖</div>
                <div>Let AI Create It</div>
                <div className="text-sm text-purple-600">The AI artist will draw the whole picture</div>
              </button>

              <button
                onClick={() => {
                  setDrawMode('draw-together');
                  handleGenerateBackground();
                }}
                className="w-full p-4 rounded-xl border-4 border-purple-300 bg-purple-50 hover:bg-purple-100 transition-all text-left font-semibold text-purple-700"
              >
                <div className="text-2xl mb-2">🎨👨‍🎨</div>
                <div>AI Background + My Drawing</div>
                <div className="text-sm text-purple-600">AI creates the background, you add your own touches</div>
              </button>

              <button
                onClick={() => {
                  setDrawMode('draw-everything');
                  setStep('drawing');
                }}
                className="w-full p-4 rounded-xl border-4 border-purple-300 bg-purple-50 hover:bg-purple-100 transition-all text-left font-semibold text-purple-700"
              >
                <div className="text-2xl mb-2">✏️</div>
                <div>Draw Everything Myself</div>
                <div className="text-sm text-purple-600">Blank canvas - you're the artist!</div>
              </button>
            </div>

            <Button
              variant="ghost"
              onClick={() => router.push(`/story/${params.storyId}`)}
            >
              Skip Illustration
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show generating screen
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-50 to-orange-200 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <div className="text-center">
            <div className="text-6xl mb-6">🤖</div>
            <h1 className="text-3xl font-black text-purple-700 mb-4">AI Artist is Creating...</h1>
            <LoadingSpinner message="Generating your illustration background..." />
          </div>
        </Card>
      </div>
    );
  }

  // Show drawing screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-50 to-orange-200 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-purple-700 mb-2">
            {drawMode === 'ai-only' && 'AI-Generated Illustration'}
            {drawMode === 'draw-together' && 'Draw on AI Background'}
            {drawMode === 'draw-everything' && 'Blank Canvas - Your Art!'}
          </h1>
          <p className="text-purple-600 font-semibold">
            {drawMode === 'ai-only' && 'Your illustration is ready!'}
            {drawMode === 'draw-together' && 'Add your own creative touches'}
            {drawMode === 'draw-everything' && 'Create your masterpiece'}
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="mb-4">
            <Toolbar
              currentTool={drawingState.currentTool}
              brushSize={drawingState.brushSize}
              canUndo={canUndo}
              canRedo={canRedo}
              onToolChange={setTool}
              onBrushSizeChange={setBrushSize}
              onUndo={undo}
              onRedo={redo}
              onClearAll={clearAll}
            />
          </div>

          <div className="mb-4">
            <div className="text-sm font-semibold text-purple-700 mb-2">Colors</div>
            <ColorPalette
              selectedColor={drawingState.color}
              onColorChange={setColor}
            />
          </div>
        </Card>

        <Card className="p-6 mb-6 flex justify-center bg-white">
          <DrawingCanvas
            backgroundUrl={drawMode === 'ai-only' ? backgroundUrl : drawMode === 'draw-together' ? backgroundUrl : null}
            fallbackColor={drawMode === 'draw-everything' ? '#ffffff' : '#f5f5f5'}
          />
        </Card>

        <div className="flex gap-4 justify-center">
          <Button
            variant="ghost"
            onClick={() => setStep('choice')}
            disabled={saving}
          >
            ← Back to Choices
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSaveDrawing}
            loading={saving}
            disabled={drawMode === 'ai-only'}
          >
            {saving ? 'Saving...' : '✓ Done!'}
          </Button>
        </div>
      </div>
    </div>
  );
}
