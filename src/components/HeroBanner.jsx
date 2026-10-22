import React from 'react';
import { 
  CheckCircle2, 
  Wrench, 
  FileSpreadsheet, 
  PackageCheck, 
  Headphones, 
  ArrowRight,
  ShieldAlert,
  Zap
} from 'lucide-react';

export const HeroBanner = ({ onSelectCategory, onScrollToCatalog }) => {
  return (
    <div className="bg-gradient-to-b from-brand-900 to-slate-900 text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-brand-800/80 relative overflow-hidden">
      {/* Subtle industrial blueprint grid background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Hero Left */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 bg-brand-700/60 border border-brand-500/40 px-3 py-1 rounded-full text-xs font-semibold text-brand-200">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Certified Heavy Industrial OEM Spares Catalog</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white leading-tight">
              Genuine Elevator Spare Parts & <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-emerald-300">
                OEM Engineering Components
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Serving elevator contractors, maintenance engineers, and infrastructure facility managers nationwide. 
              Browse engineering specifications, build custom Bill of Materials (BOM) quotations, and order directly via WhatsApp or central procurement.
            </p>

            {/* Quick Feature Chips */}
            <div className="flex flex-wrap gap-3 pt-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-md text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>EN 81-20 & IS 14665 Standard</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-md text-slate-200">
                <PackageCheck className="w-4 h-4 text-brand-400" />
                <span>Ready Stock with Test Certificates</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-md text-slate-200">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>1-Click Itemized BOM WhatsApp Quotes</span>
              </div>
            </div>

            {/* Quick Category Jump Tags */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Popular Sectors:</span>
              {['Traction & Motors', 'Door Systems', 'Control Systems & Inverters', 'Safety & Governors', 'Guide Rails & Mechanical'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className="bg-brand-950/80 hover:bg-brand-700 text-brand-200 hover:text-white px-2.5 py-1 rounded border border-brand-800/60 transition-colors cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Right Metrics & Quick Procurement Card */}
          <div className="lg:col-span-4">
            <div className="bg-slate-850/90 border border-brand-700/50 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-brand-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">B2B Procurement Desk</span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  LIVE DESK ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="text-2xl font-extrabold text-white font-display block">2,500+</span>
                  <span className="text-[11px] text-slate-400">Stocked Parts</span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="text-2xl font-extrabold text-emerald-400 font-display block">Same Day</span>
                  <span className="text-[11px] text-slate-400">Order Dispatch</span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="text-2xl font-extrabold text-brand-300 font-display block">100%</span>
                  <span className="text-[11px] text-slate-400">OEM Verified</span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="text-2xl font-extrabold text-amber-300 font-display block">18 Mo+</span>
                  <span className="text-[11px] text-slate-400">Average Warranty</span>
                </div>
              </div>

              <div className="bg-brand-950/90 p-3 rounded-xl border border-brand-900 mb-4">
                <div className="flex items-center gap-2 text-xs text-brand-200 mb-1">
                  <Headphones className="w-3.5 h-3.5 text-brand-400" />
                  <span className="font-semibold">Direct Technical Support Hotline</span>
                </div>
                <a 
                  href="tel:+918048956234"
                  className="font-mono text-base font-bold text-white hover:text-brand-300 transition-colors block"
                >
                  +91 80489 56234
                </a>
                <span className="text-[10px] text-slate-400">Mon-Sat: 8:30 AM - 8:00 PM IST (Emergency 24/7)</span>
              </div>

              <button
                onClick={onScrollToCatalog}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-700/30 cursor-pointer"
              >
                <span>Browse Industrial Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
