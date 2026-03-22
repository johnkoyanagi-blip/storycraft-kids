'use client';

import { useState } from 'react';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ExportPanelProps {
  storyId: string;
  onLayoutChange?: (layout: 'classic' | 'full-bleed' | 'side-by-side') => void;
}

export function ExportPanel({ storyId, onLayoutChange }: ExportPanelProps) {
  const [selectedLayout, setSelectedLayout] = useState<'classic' | 'full-bleed' | 'side-by-side'>('classic');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleLayoutChange = (layout: 'classic' | 'full-bleed' | 'side-by-side') => {
    setSelectedLayout(layout);
    onLayoutChange?.(layout);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/export/${storyId}`);
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-${storyId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareLink = async () => {
    setIsSharing(true);
    try {
      const response = await fetch(`/api/stories/${storyId}/share`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to generate share link');

      const data = await response.json();
      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to generate share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const LayoutThumbnail = ({
    layout,
    label,
    isSelected
  }: {
    layout: 'classic' | 'full-bleed' | 'side-by-side';
    label: string;
    isSelected: boolean;
  }) => (
    <button
      onClick={() => handleLayoutChange(layout)}
      className={`p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-purple-600 bg-purple-50'
          : 'border-gray-300 bg-white hover:border-purple-400'
      }`}
      title={label}
    >
      <div className="w-16 h-20 flex items-center justify-center text-xs font-medium">
        {layout === 'classic' && (
          <div className="w-full h-full border border-gray-300 rounded flex flex-col">
            <div className="flex-1 bg-gray-200" />
            <div className="flex-1 bg-gray-50 flex items-center justify-center text-xs">Text</div>
          </div>
        )}
        {layout === 'full-bleed' && (
          <div className="w-full h-full border border-gray-300 rounded bg-gray-200 relative flex items-end">
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gray-400 flex items-center justify-center text-xs text-white">Text</div>
          </div>
        )}
        {layout === 'side-by-side' && (
          <div className="w-full h-full border border-gray-300 rounded flex">
            <div className="flex-1 bg-gray-200" />
            <div className="flex-1 bg-gray-50 flex items-center justify-center text-xs">Text</div>
          </div>
        )}
      </div>
      <p className="text-xs mt-2 text-center text-gray-700">{label}</p>
    </button>
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Layout Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Layout Template</h3>
        <div className="flex gap-4 justify-center">
          <LayoutThumbnail
            layout="classic"
            label="Classic"
            isSelected={selectedLayout === 'classic'}
          />
          <LayoutThumbnail
            layout="full-bleed"
            label="Full Bleed"
            isSelected={selectedLayout === 'full-bleed'}
          />
          <LayoutThumbnail
            layout="side-by-side"
            label="Side by Side"
            isSelected={selectedLayout === 'side-by-side'}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t">
        {/* Download Button */}
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          {isDownloading ? 'Generating...' : 'Download as PDF'}
        </Button>

        {/* Share Button */}
        <Button
          onClick={handleShareLink}
          disabled={isSharing}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          {isSharing ? 'Generating...' : 'Share Link'}
        </Button>
      </div>

      {/* Share URL Display */}
      {shareUrl && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Share this link:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700"
            />
            <Button
              onClick={handleCopyToClipboard}
              className={`px-4 py-2 rounded font-semibold transition-all ${
                copySuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {copySuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
