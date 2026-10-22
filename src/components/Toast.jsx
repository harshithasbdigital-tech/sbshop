import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export const Toast = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs sm:text-sm font-medium max-w-md">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
