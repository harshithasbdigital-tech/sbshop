import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Check, 
  Copy, 
  ShieldCheck, 
  Truck, 
  Clock, 
  FileCheck, 
  MessageCircle, 
  Share2, 
  Layers,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductDetailModal = ({ part, onClose, onShowToast }) => {
  if (!part) return null;

  const { addToCart, formatCurrency } = useCart();
  const [qty, setQty] = useState(parseInt(part.moq) || 1);
  const [copied, setCopied] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const isDefaultUnsplash = (url) => typeof url === 'string' && url.includes('photo-1581092160607-ee22621dd758');

  const validImages = Array.isArray(part.images) && part.images.length > 0
    ? part.images.filter(img => typeof img === 'string' && img.trim() && !isDefaultUnsplash(img))
    : (part.image && !isDefaultUnsplash(part.image) ? [part.image] : []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(part.code);
    setCopied(true);
    onShowToast?.(`Item code ${part.code} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCart = () => {
    addToCart(part, qty);
    onShowToast?.(`Added ${qty} ${part.unit || 'units'} of [${part.code}] to RFQ Cart`);
    onClose();
  };

  const handleDirectWhatsApp = () => {
    const text = `*Inquiry regarding [${part.code}] ${part.title}*\n` +
      `Category: ${part.category}\n` +
      `Quantity Required: ${qty} ${part.unit || 'Units'}\n` +
      `Unit Price Listed: ${formatCurrency(part.price)}\n` +
      `Please provide formal proforma invoice and immediate dispatch timeline.`;
    window.open(`https://wa.me/918048956234?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono bg-brand-900 text-white font-bold text-xs px-3 py-1 rounded-md shadow-sm">
              {part.code}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {part.category}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Top Grid: Image + Commercial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Image Preview & Carousel Gallery (5 cols) */}
            <div className="md:col-span-5 space-y-2.5">
              <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] relative group flex items-center justify-center">
                {validImages.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 select-none p-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-2 text-slate-300 border border-slate-200">
                      <Package size={28} strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No Image Available</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Direct Factory Specification</span>
                  </div>
                ) : (
                  <img 
                    src={validImages[activeImageIdx] || validImages[0]} 
                    alt={`${part.title} - view ${activeImageIdx + 1}`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {part.badge && part.badge.trim().toLowerCase() !== 'oem standard' && (
                  <div className="absolute top-3 left-3 bg-brand-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow backdrop-blur-sm z-10">
                    {part.badge}
                  </div>
                )}

                {/* Multiple Images Carousel Controls in Modal */}
                {validImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageIdx(prev => (prev - 1 + validImages.length) % validImages.length)}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center shadow transition cursor-pointer z-10"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIdx(prev => (prev + 1) % validImages.length)}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center shadow transition cursor-pointer z-10"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails row when multiple images exist */}
              {validImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {validImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-12 h-12 rounded-lg border-2 overflow-hidden shrink-0 transition-all cursor-pointer bg-white p-0.5 ${
                        activeImageIdx === idx
                          ? 'border-[#0745A7] ring-2 ring-[#0745A7]/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Commercial Info & Purchasing (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 leading-snug">
                  {part.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
                  {part.description}
                </p>
              </div>

              {/* Price & MOQ Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold block">
                    B2B Unit Price (Excl. GST)
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    {Number(part.price) > 0 ? (
                      <>
                        <span className="text-2xl font-mono font-black text-slate-900">
                          {formatCurrency(part.price)}
                        </span>
                        <span className="text-xs text-slate-500">/ {part.unit || 'Unit'}</span>
                      </>
                    ) : null}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    {Number(part.price) > 0 ? '18% GST Eligible for Tax Credit (ITC)' : 'Request Instant Quotation from SB Elevators'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold block">
                    Min Order Quantity
                  </span>
                  <span className="font-mono font-bold text-sm bg-amber-100 text-amber-950 px-2.5 py-1 rounded border border-amber-300 inline-block mt-0.5">
                    {part.moq || '1 Unit'}
                  </span>
                </div>
              </div>

              {/* Trust Logistics Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lead Time</span>
                    <span className="font-bold text-slate-800">{part.leadTime || 'Immediate'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">OEM Warranty</span>
                    <span className="font-bold text-emerald-800">{part.warranty || '24 Months'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Quantity + Add to RFQ + WhatsApp Inquiry */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {/* Quantity selector */}
                <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-inner">
                  <button
                    type="button"
                    onClick={() => setQty(prev => Math.max(1, prev - 1))}
                    className="px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-l-xl font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center text-sm font-mono font-bold focus:outline-none py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setQty(prev => prev + 1)}
                    className="px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-r-xl font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Add to RFQ */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to RFQ Quotation</span>
                </button>

                {/* Direct WhatsApp Quick Chat */}
                <button
                  type="button"
                  onClick={handleDirectWhatsApp}
                  className="bg-emerald-700/10 hover:bg-emerald-700/20 text-emerald-800 border border-emerald-300 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Ask question on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>

            </div>
          </div>

          {/* Technical Specifications & Parameters Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-400" />
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider">
                  Technical Specifications & Engineering Parameters
                </h4>
              </div>
              <span className="text-[11px] text-slate-300 font-mono">
                Code: {part.code}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4 w-12 text-center font-mono">Row #</th>
                    <th className="py-2.5 px-4 w-2/5">Engineering Parameter</th>
                    <th className="py-2.5 px-4">Certified Value</th>
                    <th className="py-2.5 px-4 w-36 text-slate-500">Standard / Norm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {part.specs && part.specs.length > 0 ? (
                    part.specs.map((spec, sIdx) => (
                      <tr key={sIdx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400 font-bold">
                          {String(sIdx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {spec.parameter}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-brand-900">
                          {spec.value}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                          {spec.standard || 'EN 81-20 Standard'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        No custom parameters registered. Please request custom CAD drawing from our tech desk.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance & Certification Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-wrap justify-between items-center gap-2">
            <div>
              <strong>Compliance Certification:</strong> {part.compliance || 'EN 81-20, IS 14665, CE Certified'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-brand-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Code Copied' : 'Copy Item Code'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
