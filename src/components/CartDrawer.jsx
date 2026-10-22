import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  MessageCircle, 
  Copy, 
  Check, 
  Printer, 
  Building2, 
  User, 
  Phone, 
  FileSpreadsheet, 
  CreditCard, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer = ({ onShowToast }) => {
  const { 
    cartItems, 
    buyerInfo, 
    updateBuyerInfo, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    isCartOpen, 
    setIsCartOpen,
    itemCount,
    totalQuantity,
    subtotal,
    gstAmount,
    grandTotal,
    formatCurrency,
    generateBOMText,
    openWhatsAppCheckout
  } = useCart();

  const [copiedBOM, setCopiedBOM] = useState(false);
  const [showBuyerForm, setShowBuyerForm] = useState(true);

  if (!isCartOpen) return null;

  const handleCopyBOM = () => {
    const text = generateBOMText();
    navigator.clipboard.writeText(text);
    setCopiedBOM(true);
    onShowToast?.('Itemized Bill of Materials (BOM) copied to clipboard');
    setTimeout(() => setCopiedBOM(false), 2500);
  };

  const handlePrintBOM = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-brand-900 to-brand-800 text-white px-6 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                <FileSpreadsheet className="w-5 h-5 text-brand-300" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">
                  B2B RFQ Quotation Cart
                </h3>
                <span className="text-[11px] text-brand-200">
                  {itemCount} Components ({totalQuantity} Total Units)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {itemCount > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-brand-200 hover:text-white hover:underline mr-2"
                  title="Clear all items"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-brand-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Empty State */}
            {itemCount === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Your RFQ cart is empty</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Browse the spare parts catalog and add components to generate an itemized Bill of Materials quotation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all"
                >
                  Explore Parts Catalog
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Selected Spare Parts ({itemCount})
                  </span>

                  {cartItems.map((item, idx) => (
                    <div 
                      key={`${item.part?.code || item.part?.id || 'cart-item'}-${idx}`}
                      className="bg-white rounded-xl p-3 border border-slate-200/90 flex gap-3 items-center hover:shadow-xs transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.part.image && !item.part.image.includes('photo-1581092160607-ee22621dd758') ? (
                          <img 
                            src={item.part.image} 
                            alt={item.part.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={20} className="text-slate-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                            {item.part.code}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {item.part.category}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-xs truncate mt-0.5" title={item.part.title}>
                          {item.part.title}
                        </h5>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono text-xs font-bold text-brand-900">
                            {formatCurrency(item.part.price)} <span className="text-[10px] font-normal text-slate-400">/ {item.part.unit || 'Unit'}</span>
                          </span>
                          <span className="font-mono text-xs font-black text-slate-900">
                            Total: {formatCurrency(item.part.price * item.quantity)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls & Delete */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <div className="flex items-center border border-slate-300 rounded bg-white shadow-inner">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.part.code, item.quantity - 1)}
                            className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.part.code, parseInt(e.target.value) || 1)}
                            className="w-8 text-center text-xs font-mono font-bold focus:outline-none py-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.part.code, item.quantity + 1)}
                            className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.part.code)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buyer / Contractor Details Form */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-brand-600" />
                      Contractor / Procurement Details (For BOM Header)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBuyerForm(!showBuyerForm)}
                      className="text-[11px] text-brand-700 hover:underline font-semibold"
                    >
                      {showBuyerForm ? 'Minimize' : 'Edit'}
                    </button>
                  </div>

                  {showBuyerForm && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Company / Contractor Name</label>
                        <input
                          type="text"
                          value={buyerInfo.companyName}
                          onChange={(e) => updateBuyerInfo('companyName', e.target.value)}
                          placeholder="e.g. Apex Elevator Services"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Contact Person</label>
                        <input
                          type="text"
                          value={buyerInfo.contactPerson}
                          onChange={(e) => updateBuyerInfo('contactPerson', e.target.value)}
                          placeholder="e.g. Rajesh Kumar (Site Engg)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Phone / Mobile</label>
                        <input
                          type="text"
                          value={buyerInfo.phone}
                          onChange={(e) => updateBuyerInfo('phone', e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">GSTIN (Optional for ITC)</label>
                        <input
                          type="text"
                          value={buyerInfo.gstin}
                          onChange={(e) => updateBuyerInfo('gstin', e.target.value)}
                          placeholder="e.g. 29AAAAA0000A1Z5"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600 text-xs uppercase font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Delivery Destination / PIN Code</label>
                        <input
                          type="text"
                          value={buyerInfo.deliveryLocation}
                          onChange={(e) => updateBuyerInfo('deliveryLocation', e.target.value)}
                          placeholder="e.g. Bangalore Site, PIN 560001"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-600 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Commercial Quotation Calculation Summary */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5 shadow-md">
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span>Subtotal ({totalQuantity} Total Units):</span>
                    <span className="font-mono font-bold text-white text-sm">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <span>Estimated GST (18%):</span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded">ITC Input Tax Credit</span>
                    </span>
                    <span className="font-mono font-bold text-white text-sm">{formatCurrency(gstAmount)}</span>
                  </div>

                  <div className="border-t border-slate-800 pt-2.5 flex justify-between items-baseline">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold block">
                        Total Estimated RFQ Value
                      </span>
                      <span className="text-[10px] text-slate-400">Includes 18% GST estimate</span>
                    </div>
                    <span className="font-mono font-black text-2xl text-white">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Secondary Actions: Copy BOM & Print BOM */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBOM}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition-colors"
                  >
                    {copiedBOM ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBOM ? 'BOM Copied!' : 'Copy BOM Text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintBOM}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition-colors"
                    title="Print or Save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>
                </div>
              </>
            )}

          </div>

          {/* Drawer Footer with 1-Click WhatsApp RFQ Checkout */}
          {itemCount > 0 && (
            <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-2">
              <button
                id="btn-whatsapp-checkout"
                type="button"
                onClick={openWhatsAppCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30 transition-all active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>1-Click WhatsApp RFQ Order (+91 80489 56234)</span>
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sends Itemized BOM direct to SB Elevators Procurement Desk</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
