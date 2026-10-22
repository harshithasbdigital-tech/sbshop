import React, { useState, useRef } from 'react';
import { Package } from 'lucide-react';

export const ProductCardImageCarousel = ({
  images = [],
  title = 'Elevator Part',
  className = '',
  imageClassName = '',
  onImageClick
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const touchStartXRef = useRef(null);

  // Normalize image list and filter out any stale default unsplash image
  const isDefaultUnsplash = (url) => {
    return typeof url === 'string' && url.includes('photo-1581092160607-ee22621dd758');
  };

  const validImages = Array.isArray(images) && images.length > 0
    ? images.filter(img => typeof img === 'string' && img.trim() && !isDefaultUnsplash(img))
    : [];

  const total = validImages.length;
  const currentImage = validImages[Math.min(activeIdx, Math.max(0, total - 1))];
  const isCurrentFailed = !currentImage || Boolean(imageErrorMap[currentImage]);

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (total <= 1) return;
    setActiveIdx((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (total <= 1) return;
    setActiveIdx((prev) => (prev + 1) % total);
  };

  const handleDotClick = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx(idx);
  };

  const handleTouchStart = (e) => {
    if (total <= 1) return;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (total <= 1 || touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next
        setActiveIdx((prev) => (prev + 1) % total);
      } else {
        // Swiped right -> prev
        setActiveIdx((prev) => (prev - 1 + total) % total);
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden group/carousel ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onImageClick}
    >
      {/* Product Image or Clean Placeholder */}
      {total === 0 || isCurrentFailed ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 select-none p-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-1 text-slate-300 border border-slate-200/70">
            <Package size={24} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">No Image</span>
        </div>
      ) : (
        <img
          src={currentImage}
          alt={`${title} - view ${activeIdx + 1}`}
          loading="lazy"
          className={`w-full h-full object-contain p-0.5 transition-all duration-300 ${imageClassName}`}
          onError={() => {
            if (currentImage) {
              setImageErrorMap(prev => ({ ...prev, [currentImage]: true }));
            }
          }}
        />
      )}

      {/* Multiple Images Navigation - Dots Only */}
      {total > 1 && !isCurrentFailed && (
        <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
          {validImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(e, idx)}
              aria-label={`Jump to image ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer shadow-xs ${
                activeIdx === idx
                  ? 'w-3.5 h-1.5 bg-[#0745A7]'
                  : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-500 ring-1 ring-black/10'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCardImageCarousel;
