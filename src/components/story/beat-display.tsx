'use client';
import { useEffect, useRef } from 'react';

interface BeatDisplayProps {
  narrative: string;
}

export function BeatDisplay({ narrative }: BeatDisplayProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [narrative]);

  return (
    <div className="bg-white rounded-3xl shadow-md p-6 h-96 overflow-y-auto mb-6">
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
