'use client';
import { useEffect, useRef, useState } from 'react';

interface BeatDisplayProps {
  narrative: string;
  editable?: boolean;
  onNarrativeChange?: (newNarrative: string) => void;
}

export function BeatDisplay({ narrative, editable = false, onNarrativeChange }: BeatDisplayProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(narrative);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [narrative, isEditing]);

  // Keep editText in sync when narrative changes externally (new beat added)
  useEffect(() => {
    if (!isEditing) {
      setEditText(narrative);
    }
  }, [narrative, isEditing]);

  function handleEditClick() {
    setIsEditing(true);
    setEditText(narrative);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }
    }, 50);
  }

  function handleSave() {
    if (onNarrativeChange && editText.trim() !== narrative) {
      onNarrativeChange(editText.trim());
    }
    setIsEditing(false);
  }

  function handleCancel() {
    setEditText(narrative);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-3xl shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-purple-700 font-bold text-sm">Editing your story...</p>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-semibold"
            >
              Save Changes
            </button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full h-80 px-4 py-3 rounded-xl border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-lg leading-relaxed text-gray-800 font-medium resize-none"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-md p-6 h-96 overflow-y-auto mb-6 relative group">
      {editable && narrative && (
        <button
          onClick={handleEditClick}
          className="absolute top-3 right-3 px-3 py-1 text-xs rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Edit Story
        </button>
      )}
      <div className="prose prose-sm max-w-none">
        {narrative ? (
          <div className="text-lg leading-relaxed text-gray-800 font-medium">
            {narrative.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
            <div ref={endRef} />
          </div>
        ) : (
          <div className="text-center text-gray-400 py-20">
            <p className="text-xl font-semibold">Your story is about to begin...</p>
          </div>
        )}
      </div>
    </div>
  );
}
