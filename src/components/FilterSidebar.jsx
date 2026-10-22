import React, { useState } from 'react';
import {
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  Star,
  ShieldCheck,
  Zap,
  Clock,
  Search,
  X,
  Sparkles,
  Sliders
} from 'lucide-react';

export const FilterSidebar = ({
  allCategories = [],
  selectedCategory,
  setSelectedCategory,
  categoryCounts = {},
  priceRange,
  setPriceRange,
  maxPriceLimit,
  setMaxPriceLimit,
  inStockOnly,
  setInStockOnly,
  selectedBadges = [],
  toggleBadge,
  availableBadges = [],
  badgeCounts = {},
  totalResults,
  onResetFilters,
  isMobileOpen,
  setIsMobileOpen
}) => {
  // Accordion open/collapse states (like Flipkart / Amazon)
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    availability: true,
    classification: true
  });

  const [badgeSearch, setBadgeSearch] = useState('');

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isAnyFilterActive = Boolean(
    (selectedCategory && selectedCategory !== 'All Categories') ||
    (selectedBadges && selectedBadges.length > 0)
  );

  // Filtered badges based on inline search
  const filteredBadges = availableBadges.filter((b) =>
    b.toLowerCase().includes(badgeSearch.toLowerCase().trim())
  );

  const renderFilterContent = (showInnerHeader = true) => (
    <div className="divide-y divide-slate-100 text-xs sm:text-sm">
      
      {/* ── TOP HEADER (Flipkart Style: "Filters" + "CLEAR ALL") ── */}
      {showInnerHeader && (
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[#0745A7]" />
            <span className="font-bold text-slate-900 uppercase tracking-wider text-xs">Filters</span>
          </div>

          {isAnyFilterActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-bold text-[#0745A7] hover:text-[#053787] hover:underline uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={11} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      )}

      {/* ── 1. CATEGORIES SECTION (Flipkart Category Hierarchy) ── */}
      <div className="py-3.5">
        <button
          type="button"
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between font-bold text-slate-800 uppercase tracking-wider text-[11px] hover:text-[#0745A7] transition-colors select-none"
        >
          <span>Category</span>
          {openSections.categories ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.categories && (
          <div className="mt-2.5 space-y-1">
            {allCategories.map((cat) => {
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                  }}
                  className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer text-xs group ${
                    isSelected
                      ? 'bg-[#0745A7] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100/90 font-medium'
                  }`}
                >
                  <span className="truncate group-hover:translate-x-0.5 transition-transform">
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>





      {/* ── 4. CLASSIFICATION & OEM CERTIFICATION (Checkboxes with Search) ── */}
      {availableBadges && availableBadges.length > 0 && (
        <div className="py-3.5">
          <button
            type="button"
            onClick={() => toggleSection('classification')}
            className="w-full flex items-center justify-between font-bold text-slate-800 uppercase tracking-wider text-[11px] hover:text-[#0745A7] transition-colors select-none"
          >
            <span>OEM Classification</span>
            {openSections.classification ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {openSections.classification && (
            <div className="mt-2.5 space-y-2">
              {/* Optional Search inside classification if many items (Flipkart style) */}
              {availableBadges.length > 5 && (
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={badgeSearch}
                    onChange={(e) => setBadgeSearch(e.target.value)}
                    placeholder="Search badge..."
                    className="w-full pl-7 pr-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0745A7]"
                  />
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              )}

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {filteredBadges.map((badge) => {
                  const isChecked = selectedBadges.includes(badge);
                  const count = badgeCounts[badge];

                  return (
                    <label
                      key={badge}
                      className="flex items-center justify-between gap-2 cursor-pointer text-xs text-slate-700 hover:text-slate-900 select-none py-0.5 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBadge(badge)}
                          className="w-3.5 h-3.5 text-[#0745A7] rounded border-slate-300 focus:ring-[#0745A7] cursor-pointer"
                        />
                        <span className={`truncate text-xs ${isChecked ? 'font-bold text-[#0745A7]' : 'font-medium'}`}>
                          {badge}
                        </span>
                      </div>
                      {count !== undefined && (
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          ({count})
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 7. GENUINE TRUST CALLOUT (Amazon / Flipkart Bottom Stamp) ── */}
      <div className="pt-3.5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-[#0745A7] shrink-0 mt-0.5" />
          <div className="text-[11px] space-y-0.5 leading-snug">
            <strong className="text-slate-900 block font-semibold">100% Genuine OEM</strong>
            <span className="text-slate-500">Every part includes factory test certificate & warranty.</span>
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR (Independent Scrolling, Unlinked from Main Page) ── */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 border-r border-slate-200 bg-white p-4 sm:p-5 h-full overflow-y-auto overscroll-contain no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {renderFilterContent(true)}
      </aside>

      {/* ── SLIDE-OVER FILTER DRAWER (All Screen Sizes) ── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex">
          {/* Backdrop Click */}
          <div 
            className="flex-1" 
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Container */}
          <div 
            className="w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col p-4 sm:p-5 overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-[#0745A7]" />
                <span className="font-bold text-slate-900 text-sm uppercase tracking-wide">Filters</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Filters Body */}
            <div className="flex-1 overflow-y-auto py-2 pr-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {renderFilterContent(false)}
            </div>

            {/* Mobile Fixed Footer Actions (Flipkart style) */}
            <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => {
                  onResetFilters();
                  setIsMobileOpen(false);
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors uppercase tracking-wider text-center"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-[#0745A7] text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-[#053787] transition-colors text-center"
              >
                Apply ({totalResults})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
