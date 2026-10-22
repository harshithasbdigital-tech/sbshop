import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Clock, 
  Truck, 
  Layers, 
  PhoneCall, 
  ChevronLeft, 
  ChevronRight, 
  Award,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export const HeroSlider = ({ onScrollToCatalog, onOpenEnquiry, onSelectCategory }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 1,
      badge: "OEM Certified & Tested",
      badgeIcon: ShieldCheck,
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      title: "Genuine OEM Spare Parts & Drives",
      highlight: "100% Tested with Warranty",
      description: "Certified heavy-duty traction machines, controllers, and door operators compliant with EN 81-20 & IS 14665 standards.",
      primaryBtn: "Explore Spares Catalog",
      primaryAction: () => onScrollToCatalog && onScrollToCatalog(),
      secondaryBtn: "View Traction Motors",
      secondaryAction: () => onSelectCategory && onSelectCategory("Traction & Motors"),
      stats: [
        { label: "Warranty Guarantee", val: "Up to 36 Mos" },
        { label: "Inspected Parts", val: "100% Tested" },
        { label: "Stock Ready", val: "2,500+ Spares" },
      ]
    },
    {
      id: 2,
      badge: "Emergency Breakdown Hotline",
      badgeIcon: Zap,
      badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
      title: "Emergency Breakdown Dispatch",
      highlight: "Dispatched within 24 Hours Pan-India",
      description: "Lift down or passenger breakdown? Priority air cargo and road express shipping for emergency repair kits, safety gears, and ARD units.",
      primaryBtn: "Priority Dispatch Request",
      primaryAction: () => onOpenEnquiry && onOpenEnquiry({
        id: "BREAKDOWN-EMERGENCY",
        title: "Emergency Breakdown Parts Dispatch",
        category: "Emergency Breakdown",
        price: 0,
        unit: "Service Unit"
      }),
      secondaryBtn: "Call Hotline: +91 80489 56234",
      secondaryAction: () => { window.location.href = "tel:+918048956234" },
      stats: [
        { label: "Turnaround Time", val: "< 24 Hours" },
        { label: "Pan-India Shipping", val: "Air & Road" },
        { label: "Technical Desk", val: "24/7 Active" },
      ]
    },
    {
      id: 3,
      badge: "B2B Contractor Pricing",
      badgeIcon: Layers,
      badgeColor: "bg-blue-50 text-blue-900 border-blue-200",
      title: "Modernization Kits & Inverters",
      highlight: "Special B2B Bulk Pricing",
      description: "Monarch NICE 3000+, Yaskawa vector drives, and complete door modernization packages with GST input credit and volume contractor discounts.",
      primaryBtn: "Request Bulk B2B Quotation",
      primaryAction: () => onOpenEnquiry && onOpenEnquiry({
        id: "MODERNIZATION-BULK",
        title: "Modernization Kits & Inverters (Bulk Package)",
        category: "Control Systems & Inverters",
        price: 0,
        unit: "Package"
      }),
      secondaryBtn: "Browse Inverter Drives",
      secondaryAction: () => onSelectCategory && onSelectCategory("Control Systems & Inverters"),
      stats: [
        { label: "Bulk Savings", val: "Up to 25% OFF" },
        { label: "Tax Invoicing", val: "GST Input Credit" },
        { label: "Field Compatibility", val: "Universal Fit" },
      ]
    }
  ];

  // Auto-slide effect every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const slide = slides[currentSlide];

  return (
    <div 
      className="relative w-full overflow-hidden bg-white text-slate-900 select-none border-b border-slate-200"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Plain Clean White Slide Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 md:py-5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6">
          
          {/* Left Content Column */}
          <div className="flex-1 max-w-2xl space-y-2 sm:space-y-2.5 text-center lg:text-left">

            {/* Headline */}
            <h1 className="font-extrabold tracking-tight text-lg sm:text-2xl md:text-[26px] text-slate-900 leading-snug">
              {slide.title}
              <span className="block text-base sm:text-xl md:text-[22px] font-bold text-[#0745A7] mt-0.5">
                {slide.highlight}
              </span>
            </h1>

            {/* Plain Clean Subtext */}
            <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed max-w-xl mx-auto lg:mx-0 line-clamp-2">
              {slide.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
              <button
                type="button"
                onClick={slide.primaryAction}
                className="flex items-center gap-1.5 bg-[#0745A7] hover:bg-[#053787] active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>{slide.primaryBtn}</span>
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={slide.secondaryAction}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs border border-slate-200 transition-all cursor-pointer"
              >
                <span>{slide.secondaryBtn}</span>
              </button>
            </div>
          </div>

          {/* Right Metrics Grid - Clean Plain Cards */}
          <div className="w-full lg:w-auto shrink-0 flex flex-row lg:flex-col gap-2 justify-center">
            {slide.stats.map((st, idx) => (
              <div 
                key={idx}
                className="flex-1 lg:flex-initial bg-slate-50 border border-slate-200/90 rounded-lg p-2 sm:p-2.5 text-center lg:text-left min-w-[95px] sm:min-w-[145px] hover:border-[#0745A7]/40 transition-colors"
              >
                <span className="block text-sm sm:text-base font-black text-[#0745A7] font-mono tracking-tight leading-none">
                  {st.val}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">
                  {st.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Slide Navigation Controls & Indicator Dots - Center Aligned, No Overlap */}
      <div className="flex items-center justify-center gap-2 pb-2.5 pt-0.5">
        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          aria-label="Previous Slide"
          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center border border-slate-200 transition-all cursor-pointer"
        >
          <ChevronLeft size={13} />
        </button>

        <div className="flex items-center gap-1.5 px-1">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentSlide === idx 
                  ? 'w-6 h-1.5 bg-[#0745A7]' 
                  : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          aria-label="Next Slide"
          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center border border-slate-200 transition-all cursor-pointer"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};
