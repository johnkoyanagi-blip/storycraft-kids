'use client';

import { useState, useEffect } from 'react';
import { BookPage } from './book-page';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PageData {
  id: string;
  sequenceNumber: number;
  storyText: string;
  compositeUrl?: string;
  layoutTemplate: string;
}

interface FlipbookViewerProps {
  title: string;
  authorName: string;
  pages: PageData[];
  layout: 'classic' | 'full-bleed' | 'side-by-side';
}

export function FlipbookViewer({
  title,
  authorName,
  pages,
  layout,
}: FlipbookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const totalPages = pages.length + 2; // +2 for cover and back
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  const handleNext = () => {
    if (!isLastPage) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handlePrevious = () => {
    if (!isFirstPage) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const renderCurrentPage = () => {
    // Cover page
    if (currentPage === 0) {
      return (
        <BookPage
          title={title}
          text=""
          authorName={authorName}
          iscover
          layout={layout}
        />
      );
    }

    // Story pages
    if (currentPage > 0 && currentPage < totalPages - 1) {
      const page = pages[currentPage - 1];
      return (
        <BookPage
          text={page.storyText}
          illustration={page.compositeUrl}
          layout={layout}
          pageNumber={currentPage}
          key={page.id}
        />
      );
    }

    // Back page
    return (
      <BookPage
        text="The End"
        isBack
        authorName={authorName}
        layout={layout}
      />
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      {/* Flipbook Container */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className="relative w-full h-full max-w-4xl max-h-96">
          {/* Page Transition with Fade */}
          <div
            className={`absolute inset-0 bg-white rounded-lg shadow-2xl transition-opacity duration-300 ${
              isTransitioning ? 'opacity-50' : 'opacity-100'
            }`}
          >
            {renderCurrentPage()}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between px-8 pb-8 gap-4">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={isFirstPage}
          className={`p-3 rounded-full transition-all ${
            isFirstPage
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Page Counter */}
        <div className="text-center">
          <p className="text-gray-700 font-semibold">
            Page {currentPage + 1} of {totalPages}
          </p>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={isLastPage}
          className={`p-3 rounded-full transition-all ${
            isLastPage
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
