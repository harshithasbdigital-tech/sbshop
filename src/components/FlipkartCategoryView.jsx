import React, { useState } from 'react';
import {
  X,
  Search,
  ShoppingBag,
  ArrowRight,
  Phone,
  LayoutGrid,
  Cog,
  SlidersHorizontal,
  Cpu,
  ShieldCheck,
  Layers,
  Box,
  Package,
  ChevronRight
} from 'lucide-react';

// Category icon mapper with styled background circles
const CATEGORY_META = {
  'All Categories': {
    icon: LayoutGrid,
    bg: 'bg-blue-100 text-[#0745A7]',
    label: 'All Store'
  },
  'Traction & Motors': {
    icon: Cog,
    bg: 'bg-amber-100 text-amber-800',
    label: 'Traction'
  },
  'Door Systems': {
    icon: SlidersHorizontal,
    bg: 'bg-emerald-100 text-emerald-800',
    label: 'Doors'
  },
  'Control Systems & Inverters': {
    icon: Cpu,
    bg: 'bg-purple-100 text-purple-800',
    label: 'Controllers'
  },
  'Safety & Governors': {
    icon: ShieldCheck,
    bg: 'bg-rose-100 text-rose-800',
    label: 'Safety'
  },
  'Guide Rails & Hardware': {
    icon: Layers,
    bg: 'bg-cyan-100 text-cyan-800',
    label: 'Guide Rails'
  },
  'Cabins & Fixtures': {
    icon: Box,
    bg: 'bg-indigo-100 text-indigo-800',
    label: 'Cabins'
  }
};

export const FlipkartCategoryView = ({
  isOpen,
  onClose,
  allCategories = [],
  selectedCategory,
  onSelectCategory,
  parts = [],
  onOpenShopNow
}) => {
  const [activeTab, setActiveTab] = useState(
    selectedCategory && selectedCategory !== 'All Categories' ? selectedCategory : allCategories[1] || 'Traction & Motors'
  );
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  // Filter parts for the currently selected activeTab
  const categoryParts = parts.filter((p) => {
    if (activeTab === 'All Categories') return true;
    return p.category === activeTab;
  });

  // Filtered by internal search query
  const displayedParts = searchFilter.trim()
    ? categoryParts.filter(
      (p) =>
        p.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.itemCode || p.code)?.toLowerCase().includes(searchFilter.toLowerCase())
    )
    : categoryParts;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden animate-fadeIn select-none">

      {/* ── 1. FLIPKART STYLE TOP HEADER ── */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-5 py-3 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              All Categories
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              SB Elevators Industrial Store
            </p>
          </div>
        </div>

        {/* Right Search Input / Helpline */}
        <div className="flex items-center gap-2">
          <a
            href="tel:+918048956234"
            className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            title="Helpline"
          >
            <Phone size={16} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[#0745A7] hover:underline px-2 py-1"
          >
            Done
          </button>
        </div>
      </header>

      {/* ── INLINE SEARCH FOR CATEGORIES / SUB-PARTS ── */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={`Search within ${activeTab}...`}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:border-[#0745A7]"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. FLIPKART 2-PANE CATEGORY EXPLORER BODY ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT VERTICAL RAIL (Flipkart Category Selector) ── */}
        <aside className="w-20 sm:w-24 shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto no-scrollbar">
          <div className="divide-y divide-slate-100">
            {allCategories.map((cat) => {
              const isActive = activeTab === cat;
              const meta = CATEGORY_META[cat] || {
                icon: Package,
                bg: 'bg-slate-100 text-slate-700',
                label: cat.split(' ')[0]
              };
              const Icon = meta.icon;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveTab(cat);
                    setSearchFilter('');
                  }}
                  className={`w-full relative flex flex-col items-center justify-center py-3.5 px-1.5 text-center transition-all cursor-pointer select-none group ${isActive
                      ? 'bg-white shadow-2xs font-bold text-[#0745A7]'
                      : 'hover:bg-slate-100 text-slate-600 font-medium'
                    }`}
                >
                  {/* Active Blue Indicator Strip on Left (Flipkart signature) */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#0745A7] rounded-r-md" />
                  )}

                  {/* Icon Avatar */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${isActive
                        ? 'bg-[#0745A7] text-white shadow-xs'
                        : meta.bg
                      }`}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Label */}
                  <span className={`text-[10px] leading-tight line-clamp-2 px-1 ${isActive ? 'font-bold text-[#0745A7]' : 'text-slate-700'
                    }`}>
                    {cat.replace('& Hardware', '').replace('& Fixtures', '').replace('& Inverters', '')}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── RIGHT SCROLLABLE CONTENT PANE (Department & Items Grid) ── */}
        <main className="flex-1 bg-white overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-3 sm:p-5">

          {/* Active Category Header Banner */}
          <div className="pb-3 mb-4 border-b border-slate-100">
            <span className="text-[10px] font-mono text-[#0745A7] uppercase font-bold tracking-wider">
              DEPARTMENT
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {activeTab}
            </h2>
          </div>

          {/* Section 1: Popular Components in this Department */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Components & OEM Parts ({displayedParts.length})
              </h3>
            </div>

            {displayedParts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No components found matching "{searchFilter}".
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                {displayedParts.map((part, idx) => {
                  const displayCode = part.itemCode || part.code || '';
                  const displayUnit = part.priceUnit || part.unit || 'Piece';

                  return (
                    <div
                      key={`${part.id || part.code || 'fpart'}-${idx}`}
                      className="bg-white border border-slate-200/90 hover:border-[#0745A7] rounded-xl p-2.5 flex flex-col justify-between transition-all hover:shadow-md group shadow-2xs"
                    >
                      <div>
                        {/* Square Thumbnail */}
                        <div
                          onClick={() => onOpenShopNow(part)}
                          className="w-full h-24 sm:h-28 bg-white rounded-lg p-1.5 flex items-center justify-center overflow-hidden border border-slate-100 mb-2 relative cursor-pointer"
                        >
                          {part.image && !part.image.includes('photo-1581092160607-ee22621dd758') ? (
                            <img
                              src={part.image}
                              alt={part.title}
                              loading="lazy"
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
                              <Package size={22} strokeWidth={1.5} />
                              <span className="text-[9px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">No Image</span>
                            </div>
                          )}
                          {part.badge && part.badge.trim().toLowerCase() !== 'oem standard' && (
                            <span className="absolute top-1 left-1 bg-[#0745A7] text-white text-[8px] font-bold px-1 py-0.2 rounded shadow-2xs">
                              {part.badge}
                            </span>
                          )}
                        </div>

                        {/* Title & Code */}
                        <h4
                          onClick={() => onOpenShopNow(part)}
                          className="text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-[#0745A7] line-clamp-2 leading-snug cursor-pointer mb-1"
                          title={part.title}
                        >
                          {part.title}
                        </h4>

                        {displayCode && (
                          <span className="text-[10px] font-mono text-slate-400 block mb-1">
                            {displayCode}
                          </span>
                        )}
                      </div>

                      {/* Pricing + Quick Order Button */}
                      <div className="pt-2 border-t border-slate-200/70 mt-2 flex flex-col gap-1.5">
                        {Number(part.price) > 0 && (
                          <div className="text-xs font-black text-[#0745A7] font-mono leading-tight">
                            ₹ {Number(part.price).toLocaleString('en-IN')}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenShopNow(part)}
                          className="w-full bg-[#0745A7] hover:bg-[#053787] active:scale-95 text-white py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <ShoppingBag size={11} />
                          <span>Order Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Action: Select Department & View All */}
          <div className="pt-2 pb-6 flex justify-center">
            <button
              type="button"
              onClick={() => {
                onSelectCategory(activeTab);
                onClose();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-[#0745A7] hover:bg-[#053787] active:scale-98 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm transition-all"
            >
              <span>{activeTab.toLowerCase().startsWith('all') ? `Explore ${activeTab} in Store` : `Explore All ${activeTab} in Store`}</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </main>
      </div>

    </div>
  );
};
