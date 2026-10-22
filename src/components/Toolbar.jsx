import React from 'react';
import { 
  LayoutGrid, 
  TableProperties, 
  ArrowUpDown, 
  Filter, 
  Check, 
  Layers
} from 'lucide-react';

export const Toolbar = ({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  inStockOnly,
  setInStockOnly,
  viewMode,
  setViewMode,
  totalResults,
  totalOriginal,
  categoryCounts
}) => {
  return (
    <div id="catalog-section" className="bg-white border-b border-slate-200 shadow-sm sticky top-[73px] sm:top-[85px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
        
        {/* Dynamic Category Tabs (Shopee / Shopping Mall style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            id="cat-pill-all"
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-brand-900 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <span>All Products</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              selectedCategory === 'All' ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-800'
            }`}>
              {totalOriginal}
            </span>
          </button>

          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-900 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shopping Filter & View Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
          
          {/* Results Summary & Clear filter trigger */}
          <div className="text-slate-600 flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900 font-bold">{totalResults}</strong> items
              {selectedCategory !== 'All' && <span> in <span className="text-brand-700 font-bold">{selectedCategory}</span></span>}
              {searchQuery && <span> for "<span className="text-brand-700 font-bold">{searchQuery}</span>"</span>}
            </span>

            {(selectedCategory !== 'All' || searchQuery || inStockOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setInStockOnly(false);
                }}
                className="text-amber-600 hover:text-amber-700 underline font-bold text-[11px] cursor-pointer ml-2"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Right Controls: In-Stock Toggle, Sort Dropdown & Dual View Toggle */}
          <div className="flex items-center gap-3 ml-auto">
            
            {/* In-Stock Filter Toggle */}
            <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 cursor-pointer select-none transition-colors border border-slate-200">
              <input
                id="toggle-in-stock-only"
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                In Stock Only
              </span>
            </label>

            {/* Sort Dropdown */}
            <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 mr-1.5 flex-shrink-0" />
              <select
                id="sort-parts-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="code-asc">Part Code: A to Z</option>
              </select>
            </div>

            {/* Dual View Mode Switcher (Grid default like Shopee, plus Table View) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 shadow-inner">
              <button
                id="btn-view-grid"
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Product Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>

              <button
                id="btn-view-table"
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Table View (Rows & Columns)"
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
