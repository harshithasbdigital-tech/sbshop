import React from 'react';
import { 
  ShieldCheck, 
  PhoneCall, 
  MessageCircle, 
  Lock, 
  MapPin, 
  Mail, 
  CheckCircle,
  FileText,
  Boxes
} from 'lucide-react';

export const Footer = ({ onOpenUpload, onSelectCategory }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          
          {/* Brand & Corporate Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-700 p-2 flex items-center justify-center text-white font-black text-lg">
                SB
              </div>
              <div>
                <span className="font-display font-black text-xl text-white tracking-tight">
                  SB ELEVATORS
                </span>
                <span className="block text-[10px] text-brand-300 uppercase tracking-widest font-semibold">
                  Industrial Spare Parts & OEM Store
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Dedicated OEM and replacement components provider for vertical transportation systems. 
              Engineering-certified traction drives, intelligent door operators, progressive safety systems, and architectural fixtures.
            </p>

            <div className="flex items-center gap-3 pt-2 text-slate-300">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ISO 9001:2015
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-brand-400" />
                EN 81-20 / IS 14665
              </span>
            </div>
          </div>

          {/* Quick Categories (3 cols) */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider">
              Component Sectors
            </h4>
            <ul className="space-y-1.5 text-xs">
              {[
                'Traction & Motors',
                'Door Systems',
                'Control Systems & Inverters',
                'Safety & Governors',
                'COP & LOP Displays',
                'Guide Rails & Mechanical',
                'Ropes & Cables',
                'Hydraulic Components'
              ].map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Direct Procurement (3 cols) */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider">
              Procurement Desk
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <PhoneCall className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">OEM Tech Hotline:</span>
                  <a href="tel:+918048956234" className="text-white font-mono font-bold hover:text-brand-300">
                    +91 80489 56234
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">WhatsApp BOM Quotes:</span>
                  <a 
                    href="https://wa.me/918048956234" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-400 font-mono font-bold hover:underline"
                  >
                    +91 80489 56234
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Central Warehouse:</span>
                  <span className="text-slate-300">Bangalore, Karnataka, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin & Security Portal (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider">
              Store Access
            </h4>
            <p className="text-[11px] text-slate-500">
              For warehouse inventory managers and OEM catalog administrators.
            </p>
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:text-white"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Part (PIN)</span>
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} SB Elevators. All Rights Reserved. Heavy Industrial Elevator Spares & OEM Division.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">EN 81-20:2020 Certified</span>
            <span>•</span>
            <span className="text-slate-400">IS 14665 Indian Standard</span>
            <span>•</span>
            <span className="text-slate-400">GST Input Tax Credit Compliant</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
