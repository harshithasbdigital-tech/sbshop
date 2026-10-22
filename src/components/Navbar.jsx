import React from 'react';
import { 
  ShoppingCart, 
  PhoneCall, 
  MessageCircle, 
  Search, 
  X,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Navbar = ({ 
  searchQuery, 
  setSearchQuery, 
  onOpenCart 
}) => {
  const { itemCount, grandTotal, formatCurrency } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full shadow-md">
      {/* Top Utility Strip (Shopee / Shopping Site Style) */}
      <div className="bg-brand-950 text-slate-300 text-[11px] py-1.5 px-4 border-b border-brand-900/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hidden sm:inline flex items-center gap-1">
              <Truck className="w-3 h-3 text-amber-400" />
              Pan-India Dispatch • Same Day Delivery Available
            </span>
            <span className="hidden md:inline flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% Genuine OEM Elevator Components
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <a 
              href="tel:+918048956234" 
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-brand-300" />
              <span>Helpline: <strong className="text-white">+91 80489 56234</strong></span>
            </a>
            <a
              href="https://wa.me/918048956234"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className="w-3 h-3 fill-current" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Shopping Store Header */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
          
          {/* Store Logo */}
          <a href="#" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 p-2 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6 text-white">
                <rect x="6" y="4" width="28" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" />
                <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                <rect x="11" y="10" width="18" height="20" rx="2" fill="white" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 18L20 14L24 18" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 23L20 27L24 23" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-white leading-none">
                  SB ELEVATORS
                </span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                  SHOP
                </span>
              </div>
              <span className="text-[10px] text-brand-200 tracking-wider uppercase font-semibold">
                Spare Parts & OEM Store
              </span>
            </div>
          </a>

          {/* Prominent Center Search Bar (Like Shopee / Amazon) */}
          <div className="flex-1 max-w-2xl relative hidden sm:block">
            <div className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden border border-white/20 focus-within:ring-2 focus-within:ring-amber-400">
              <div className="pl-3.5 pr-2 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="main-nav-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search elevator parts, codes (e.g. SB-TM-450), motors, door systems..."
                className="w-full py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 text-xs transition-colors flex items-center gap-1"
              >
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Right Shopping Cart Action (No Upload Button!) */}
          <div className="flex items-center gap-3">
            <button
              id="btn-cart-drawer"
              type="button"
              onClick={onOpenCart}
              className="relative inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center shadow">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="leading-tight">RFQ Cart</span>
                <span className="text-[10px] text-emerald-100 font-normal">
                  {itemCount === 0 ? 'Empty' : formatCurrency(grandTotal)}
                </span>
              </div>
            </button>
          </div>

        </div>

        {/* Mobile Search Input */}
        <div className="sm:hidden mt-2.5">
          <div className="flex items-center bg-white rounded-lg shadow overflow-hidden">
            <div className="pl-3 pr-2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parts, codes, motors..."
              className="w-full py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
