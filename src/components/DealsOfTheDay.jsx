import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Clock,
  ShoppingBag,
  Percent,
  Package
} from 'lucide-react';

export const DealsOfTheDay = ({ parts = [], onOpenShopNow }) => {
  // Live countdown timer initialized to 04:32:15 (Flipkart Style)
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          return { hours: 4, minutes: 32, seconds: 15 };
        }
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        }
        return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num) => String(num).padStart(2, '0');

  // Derive deals dynamically from the live parts loaded from the database/API
  const deals = useMemo(() => {
    if (!parts || parts.length === 0) return [];
    const seen = new Set();
    const uniqueParts = [];
    for (const p of parts) {
      const k = String(p.code || p.id || '').trim();
      if (k && !seen.has(k)) {
        seen.add(k);
        uniqueParts.push(p);
      } else if (!k) {
        uniqueParts.push(p);
      }
      if (uniqueParts.length >= 6) break;
    }

    return uniqueParts.map((part, idx) => {
      const price = Number(part.price) || 15000;
      const discountPercent = 15 + (idx % 3) * 5;
      const originalPrice = Math.round(price * (1 + discountPercent / 100));
      return {
        id: `${part.id || part.code || 'deal'}-${idx}`,
        code: part.code || part.itemCode || `PART-${idx + 1}`,
        title: part.title,
        category: part.category,
        dealPrice: price,
        originalPrice: originalPrice,
        discountTag: `Save ${discountPercent}%`,
        badge: part.badge || (idx === 0 ? 'Best Seller' : idx === 1 ? 'Hot Deal' : 'Top Rated'),
        badgeColor: idx % 3 === 0 ? 'bg-emerald-600' : idx % 3 === 1 ? 'bg-rose-600' : 'bg-amber-600',
        image: (part.image && !part.image.includes('photo-1581092160607-ee22621dd758')) ? part.image : '',
        inStock: part.inStock !== false,
        stockCount: part.stockCount || 10,
        leadTime: part.leadTime || 'Same Day Dispatch',
        unit: part.unit || part.priceUnit || 'Unit'
      };
    });
  }, [parts]);

  if (deals.length === 0) return null;

  return (
    <div className="bg-white border-y border-slate-200/90 shadow-2xs my-1 sm:my-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">

        {/* Compact Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">

          {/* Title + Live Timer */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900">
                Deals of the Day
              </h2>
            </div>

            {/* Countdown Timer Badge */}
            <div className="flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono">
              <Clock size={11} className="text-rose-600 animate-pulse" />
              <span className="hidden sm:inline">Ends in</span>
              <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded text-[10px] font-black tracking-wider">
                {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Product Cards Horizontal Strip - Continuous Infinite Marquee with Hover Pause */}
        <div className="overflow-hidden w-full py-1">
          <div className="animate-marquee-slow flex items-stretch gap-3">
            {[...deals, ...deals].map((deal, idx) => {
              return (
              <div
                key={`${deal.id || deal.code || 'deal'}-${idx}`}
                className="group w-[190px] sm:w-[210px] md:w-[225px] shrink-0 bg-white border border-slate-200/90 rounded-xl overflow-hidden hover:shadow-md hover:border-[#0745A7]/40 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Image Container with Badges */}
                <div className="relative h-24 sm:h-28 bg-white border-b border-slate-100 overflow-hidden flex items-center justify-center">
                  {deal.image ? (
                    <img
                      src={deal.image}
                      alt={deal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300 select-none">
                      <Package size={22} strokeWidth={1.5} />
                      <span className="text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">No Image</span>
                    </div>
                  )}

                  {/* Quality / Status Badge */}
                  {deal.badge && (
                    <span className="absolute top-1.5 left-1.5 bg-[#0745A7] text-white text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded shadow-2xs">
                      {deal.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[9.5px] font-mono text-slate-400 font-semibold tracking-wider">
                      {deal.code}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#0745A7] transition-colors line-clamp-1 leading-tight mt-0.5">
                      {deal.title}
                    </h3>
                  </div>

                  <div className="mt-2 pt-1 border-t border-slate-100 flex justify-center">
                    <button
                      type="button"
                      onClick={() => onOpenShopNow && onOpenShopNow({
                        id: deal.id,
                        code: deal.code,
                        title: deal.title,
                        category: deal.category,
                        price: 0,
                        unit: deal.unit,
                        image: deal.image
                      })}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#0745A7] hover:bg-[#053787] active:scale-98 text-white font-bold py-1 px-3.5 rounded-lg text-[11px] shadow-2xs transition-all cursor-pointer"
                    >
                      <ShoppingBag size={11} />
                      <span>Order Now</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

      </div>
    </div>
  );
};
