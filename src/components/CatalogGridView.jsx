import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  Copy, 
  Eye, 
  ShieldCheck, 
  Truck, 
  Sparkles,
  Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ProductCardImageCarousel } from './ProductCardImageCarousel';

export const CatalogGridView = ({ parts, onOpenDetails, onShowToast }) => {
  const { addToCart, formatCurrency } = useCart();
  const [quantities, setQuantities] = useState({});
  const [copiedCode, setCopiedCode] = useState(null);

  const getQty = (part) => {
    if (quantities[part.code] !== undefined) {
      return quantities[part.code];
    }
    return parseInt(part.moq) || 1;
  };

  const setQty = (partCode, val) => {
    setQuantities(prev => ({
      ...prev,
      [partCode]: Math.max(1, parseInt(val) || 1)
    }));
  };

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onShowToast?.(`Item code ${code} copied to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddToCart = (e, part) => {
    e.stopPropagation();
    const qty = getQty(part);
    addToCart(part, qty);
    onShowToast?.(`Added ${qty} ${part.unit || 'unit(s)'} of [${part.code}] to RFQ Cart`);
  };

  if (parts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm my-6">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No components match your search criteria</h3>
        <p className="text-xs text-slate-500 mt-1">Try modifying your search term or selecting another category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 my-6">
      {parts.map((part, idx) => {
        const currentQty = getQty(part);

        return (
          <div 
            key={`${part.id || part.code || 'cgrid'}-${idx}`}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:border-brand-300"
          >
            {/* Card Header & Product Image with Zoom */}
            <div className="relative aspect-[4/3] sm:aspect-square bg-white border-b border-slate-100 overflow-hidden cursor-pointer" onClick={() => onOpenDetails(part)}>
              <ProductCardImageCarousel
                images={part.images || (part.image ? [part.image] : [])}
                title={part.title}
                imageClassName="group-hover:scale-105"
                onImageClick={() => onOpenDetails(part)}
              />

              {/* Badges on top of image */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                {part.badge && part.badge.trim().toLowerCase() !== 'oem standard' && (
                  <span className="bg-brand-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm shadow">
                    {part.badge}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                  part.inStock ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'
                }`}>
                  {part.inStock ? 'In Stock' : 'On Order'}
                </span>
              </div>

              {/* Item Code Badge */}
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={(e) => handleCopyCode(e, part.code)}
                  className="inline-flex items-center gap-1 bg-white/90 hover:bg-white text-slate-900 font-mono font-bold text-[10px] px-2 py-1 rounded shadow backdrop-blur-sm border border-slate-200 transition-colors"
                  title="Click to copy part code"
                >
                  <span>{part.code}</span>
                  {copiedCode === part.code ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                {/* Category & Lead Time */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    {part.category}
                  </span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1 text-[10px]">
                    <Truck className="w-3 h-3" />
                    {part.leadTime || 'Fast Dispatch'}
                  </span>
                </div>

                {/* Title */}
                <h4 
                  onClick={() => onOpenDetails(part)}
                  className="font-bold text-slate-900 text-sm hover:text-brand-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
                >
                  {part.title}
                </h4>

                <p className="text-slate-500 text-xs line-clamp-2 mt-1.5 leading-relaxed">
                  {part.description}
                </p>

                {/* Compact Parameters Table */}
                <div className="mt-3 bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Key Specifications
                  </span>
                  {part.specs?.slice(0, 3).map((spec, sIdx) => (
                    <div key={sIdx} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 truncate mr-2">{spec.parameter}:</span>
                      <span className="font-mono font-bold text-slate-800 text-right truncate">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price, MOQ and Procurement Action */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Unit Price (Excl. GST)</span>
                    <span className="text-lg font-mono font-black text-slate-900">
                      {formatCurrency(part.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">/ {part.unit || 'Unit'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Min Order (MOQ)</span>
                    <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                      {part.moq || '1 Unit'}
                    </span>
                  </div>
                </div>

                {/* Procurement controls */}
                <div className="flex items-center gap-2">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white shadow-inner flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setQty(part.code, currentQty - 1)}
                      className="px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-l text-xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={currentQty}
                      onChange={(e) => setQty(part.code, e.target.value)}
                      className="w-10 text-center text-xs font-mono font-bold focus:outline-none border-x border-slate-200 py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(part.code, currentQty + 1)}
                      className="px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-r text-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to RFQ Button */}
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, part)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to RFQ</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};
