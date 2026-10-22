import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Check, 
  Copy, 
  FileText, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Info, 
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CatalogTableView = ({ parts, onOpenDetails, onShowToast }) => {
  const { addToCart, formatCurrency } = useCart();
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [copiedCode, setCopiedCode] = useState(null);

  const toggleRow = (partId) => {
    setExpandedRowId(prev => prev === partId ? null : partId);
  };

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden my-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <th scope="col" className="py-3.5 px-3 text-center w-12 font-mono">SL</th>
              <th scope="col" className="py-3.5 px-3 w-32">Item Code</th>
              <th scope="col" className="py-3.5 px-4 min-w-[260px]">Component Details</th>
              <th scope="col" className="py-3.5 px-3 min-w-[130px]">Category</th>
              <th scope="col" className="py-3.5 px-3 min-w-[200px]">Specifications</th>
              <th scope="col" className="py-3.5 px-3 min-w-[130px] text-right">Unit Price (INR)</th>
              <th scope="col" className="py-3.5 px-3 text-center w-28">MOQ</th>
              <th scope="col" className="py-3.5 px-4 text-center w-48">Procurement Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 text-xs">
            {parts.map((part, index) => {
              const isExpanded = expandedRowId === part.id;
              const currentQty = getQty(part);
              const slNo = String(index + 1).padStart(2, '0');

              return (
                <React.Fragment key={`${part.id || part.code || 'ctable'}-${index}`}>
                  <tr 
                    onClick={() => toggleRow(part.id)}
                    className={`industrial-table-row cursor-pointer transition-colors ${
                      isExpanded ? 'bg-brand-50/70 border-l-4 border-l-brand-600' : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* 1. SL NO */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">
                      {slNo}
                    </td>

                    {/* 2. Item Code with Copy Button */}
                    <td className="py-3.5 px-3">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-mono font-bold text-[11px] px-2 py-1 rounded border border-slate-300">
                        <span>{part.code}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(e, part.code)}
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                          title="Copy Part Code"
                        >
                          {copiedCode === part.code ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {part.badge && part.badge.trim().toLowerCase() !== 'oem standard' && (
                        <span className="block mt-1 text-[9px] font-bold text-brand-700 bg-brand-100/60 w-max px-1.5 py-0.2 rounded">
                          {part.badge}
                        </span>
                      )}
                    </td>

                    {/* 3. Component Details & Thumbnail */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden relative group flex items-center justify-center">
                          {part.image && !part.image.includes('photo-1581092160607-ee22621dd758') ? (
                            <img 
                              src={part.image} 
                              alt={part.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <Package size={20} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm hover:text-brand-700 transition-colors line-clamp-1">
                            {part.title}
                          </h4>
                          <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                            {part.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                              part.inStock ? 'text-emerald-700' : 'text-rose-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${part.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {part.inStock ? `Ready Stock (${part.stockCount || 10}+ available)` : 'Backorder Dispatch'}
                            </span>
                            {part.warranty && (
                              <span className="text-[10px] text-slate-400">
                                • {part.warranty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 4. Category */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        {part.category}
                      </span>
                    </td>

                    {/* 5. Specifications (Chips) */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {part.specs?.slice(0, 3).map((spec, sIdx) => (
                          <span 
                            key={sIdx}
                            className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded border border-slate-200/80 font-mono"
                            title={`${spec.parameter}: ${spec.value}`}
                          >
                            <span className="text-slate-500">{spec.parameter}:</span> <strong className="text-slate-900">{spec.value}</strong>
                          </span>
                        ))}
                        {part.specs && part.specs.length > 3 && (
                          <span className="text-[10px] text-brand-700 font-semibold cursor-pointer">
                            +{part.specs.length - 3} more specs
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. Unit Price (INR) */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-slate-900 text-sm font-mono">
                        {formatCurrency(part.price)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        per {part.unit || 'Unit'} (Excl. GST)
                      </div>
                      <div className="text-[9px] text-emerald-700 font-medium">
                        Bulk Tier Available
                      </div>
                    </td>

                    {/* 7. MOQ */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block font-mono font-bold text-slate-800 bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                        {part.moq || '1 Unit'}
                      </span>
                    </td>

                    {/* 8. Procurement Action */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Quantity spinner */}
                        <div 
                          className="flex items-center border border-slate-300 rounded bg-white shadow-inner"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setQty(part.code, currentQty - 1)}
                            className="px-1.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-l text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={currentQty}
                            onChange={(e) => setQty(part.code, e.target.value)}
                            className="w-9 text-center text-xs font-mono font-bold focus:outline-none border-x border-slate-200 py-1"
                          />
                          <button
                            type="button"
                            onClick={() => setQty(part.code, currentQty + 1)}
                            className="px-1.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-r text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Add to RFQ Button */}
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, part)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                          title="Add to RFQ Quotation Cart"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>

                        {/* Specs Expand Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(part.id);
                          }}
                          className={`p-1.5 rounded border text-xs transition-colors ${
                            isExpanded 
                              ? 'bg-brand-700 text-white border-brand-700' 
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                          title={isExpanded ? 'Hide Technical Parameters' : 'Show Technical Parameters Table'}
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDABLE INLINE TECHNICAL SPECIFICATIONS & PARAMETERS DRAWER */}
                  {isExpanded && (
                    <tr className="bg-slate-50/90 border-y-2 border-brand-200">
                      <td colSpan={8} className="p-4 sm:p-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                          
                          {/* Drawer Header */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
                            <div className="flex items-center gap-2.5">
                              <span className="bg-brand-900 text-white font-mono text-xs px-2.5 py-1 rounded font-bold">
                                {part.code}
                              </span>
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                                  {part.title}
                                </h5>
                                <span className="text-slate-500 text-xs">
                                  Official Technical Datasheet & Parameters Verification
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenDetails(part);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                              >
                                <Info className="w-3.5 h-3.5" />
                                <span>Datasheet Modal View</span>
                              </button>
                            </div>
                          </div>

                          {/* Technical Specifications & Parameters Table */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Parameters Table (8 cols) */}
                            <div className="lg:col-span-8">
                              <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-800 text-slate-200 font-semibold border-b border-slate-700">
                                      <th className="py-2 px-3 w-10 text-center font-mono">#</th>
                                      <th className="py-2 px-3 w-1/3">Engineering Parameter</th>
                                      <th className="py-2 px-3">Certified Value / Range</th>
                                      <th className="py-2 px-3 w-28 text-slate-400">Standard / Note</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 font-mono">
                                    {part.specs && part.specs.length > 0 ? (
                                      part.specs.map((spec, specIdx) => (
                                        <tr key={specIdx} className="hover:bg-slate-50 transition-colors">
                                          <td className="py-2 px-3 text-center text-slate-400 font-bold">
                                            {String(specIdx + 1).padStart(2, '0')}
                                          </td>
                                          <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                                            {spec.parameter}
                                          </td>
                                          <td className="py-2 px-3 font-bold text-brand-900">
                                            {spec.value}
                                          </td>
                                          <td className="py-2 px-3 font-sans text-slate-500 text-[11px]">
                                            {spec.standard || 'Factory QC Pass'}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={4} className="py-3 px-3 text-center text-slate-400">
                                          Standard factory engineering parameters apply. Contact tech desk for CAD drawing.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Commercial & Compliance Details (4 cols) */}
                            <div className="lg:col-span-4 space-y-3">
                              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                                <h6 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-brand-600" />
                                  Commercial & Logistics Terms
                                </h6>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                                    <span className="text-slate-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" /> Lead Time:
                                    </span>
                                    <span className="font-bold text-slate-800">{part.leadTime || 'Immediate Dispatch'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                                    <span className="text-slate-500 flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Warranty:
                                    </span>
                                    <span className="font-bold text-emerald-800">{part.warranty || '18 Months OEM'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                                    <span className="text-slate-500 flex items-center gap-1">
                                      <FileText className="w-3 h-3 text-brand-600" /> Compliance:
                                    </span>
                                    <span className="font-mono text-[11px] font-semibold text-slate-800">{part.compliance || 'EN 81-20 / IS 14665'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1">
                                    <span className="text-slate-500 flex items-center gap-1">
                                      <Truck className="w-3 h-3 text-amber-600" /> Packaging:
                                    </span>
                                    <span className="font-semibold text-slate-800">Sealed Industrial Crate</span>
                                  </div>
                                </div>
                              </div>

                              {/* Quick RFQ Add inside drawer */}
                              <div className="bg-brand-900 text-white p-3.5 rounded-lg flex items-center justify-between gap-3 shadow-md">
                                <div>
                                  <span className="text-[10px] text-brand-300 uppercase block font-semibold">Total for {currentQty} {part.unit}:</span>
                                  <span className="text-base font-extrabold font-mono text-white">
                                    {formatCurrency(part.price * currentQty)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleAddToCart(e, part)}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to RFQ</span>
                                </button>
                              </div>

                            </div>

                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
