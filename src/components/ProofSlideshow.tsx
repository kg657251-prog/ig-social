import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PROOF_IMAGES = [
  '/assets/proof/proof-1.jpg',
  '/assets/proof/proof-2.jpg',
  '/assets/proof/proof-3.jpg',
  '/assets/proof/proof-4.jpg',
  '/assets/proof/proof-5.jpg',
  '/assets/proof/proof-6.jpg',
];

export function ProofSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const total = PROOF_IMAGES.length;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      handleNext();
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleNext]);

  const minSwipeDistance = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrev();
  };

  return (
    <div className="space-y-2.5">
      {/* Slideshow Container */}
      <div
        className="relative w-full aspect-square max-w-[460px] mx-auto rounded-2xl overflow-hidden border border-[#DCE8F8] bg-white shadow-xs select-none touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {PROOF_IMAGES.map((src, index) => (
            <div
              key={src}
              className="relative w-full h-full shrink-0 flex items-center justify-center bg-white"
            >
              <img
                src={src}
                alt={`Customer order proof ${index + 1}`}
                className="w-full h-full object-contain pointer-events-none"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                // @ts-expect-error fetchpriority attribute
                fetchpriority={index === 0 ? 'high' : 'auto'}
              />
            </div>
          ))}
        </div>

        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous proof image"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#062A61] border border-[#DCE8F8] shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all z-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next proof image"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#062A61] border border-[#DCE8F8] shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5">
        {PROOF_IMAGES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 cursor-pointer rounded-full ${
              currentIndex === idx
                ? 'w-7 h-2 bg-[#0058D6] shadow-xs'
                : 'w-2 h-2 bg-[#C7DBF5] hover:bg-[#8FBAEE]'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
