'use client';

interface BookPageProps {
  illustration?: string;
  text: string;
  layout: 'classic' | 'full-bleed' | 'side-by-side';
  pageNumber?: number;
  iscover?: boolean;
  isBack?: boolean;
  authorName?: string;
  title?: string;
}

export function BookPage({
  illustration,
  text,
  layout,
  pageNumber,
  iscover = false,
  isBack = false,
  authorName,
  title,
}: BookPageProps) {
  if (iscover) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-purple-200 via-purple-100 to-white p-8 flex flex-col items-center justify-center">
        {illustration && (
          <div className="w-64 h-64 mb-6 flex-shrink-0">
            <img
              src={illustration}
              alt="Cover illustration"
              className="w-full h-full object-cover rounded-lg shadow-lg"
            />
          </div>
        )}
        <h1 className="text-4xl font-bold text-center text-purple-900 mb-4">
          {title}
        </h1>
        <p className="text-lg text-purple-700 text-center">
          Written and illustrated by {authorName}
        </p>
      </div>
    );
  }

  if (isBack) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-white to-purple-100 p-8 flex flex-col items-center justify-center">
        <div className="text-6xl font-bold text-purple-900 mb-8">The End</div>
        <div className="text-center text-gray-600">
          <p className="text-lg">A story by {authorName}</p>
          <p className="text-sm mt-2">{new Date().toLocaleDateString()}</p>
        </div>
      </div>
    );
  }

  if (layout === 'full-bleed') {
    return (
      <div className="w-full h-full relative overflow-hidden">
        {illustration && (
          <div className="absolute inset-0">
            <img
              src={illustration}
              alt={`Page ${pageNumber}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 bg-purple-900/70 backdrop-blur-sm p-6 min-h-[40%] flex items-center">
          <p className="text-white text-lg leading-relaxed">{text}</p>
        </div>
        {pageNumber && (
          <div className="absolute bottom-2 right-4 text-white text-sm">
            {pageNumber}
          </div>
        )}
      </div>
    );
  }

  if (layout === 'side-by-side') {
    return (
      <div className="w-full h-full flex bg-white">
        <div className="w-1/2 flex-shrink-0">
          {illustration && (
            <img
              src={illustration}
              alt={`Page ${pageNumber}`}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="w-1/2 p-6 flex flex-col justify-center overflow-y-auto">
          <p className="text-gray-800 text-base leading-relaxed">{text}</p>
          {pageNumber && (
            <div className="mt-6 text-gray-400 text-sm">Page {pageNumber}</div>
          )}
        </div>
      </div>
    );
  }

  // classic layout (default)
  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="h-3/5 w-full flex-shrink-0">
        {illustration && (
          <img
            src={illustration}
            alt={`Page ${pageNumber}`}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="h-2/5 p-6 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-purple-50 to-white">
        <p className="text-gray-800 text-base leading-relaxed">{text}</p>
        {pageNumber && (
          <div className="text-gray-400 text-sm text-right">Page {pageNumber}</div>
        )}
      </div>
    </div>
  );
}
