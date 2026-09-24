import React from 'react';
import { Delete, Space, X, Plus } from 'lucide-react';

interface EnglishVirtualKeyboardProps {
  value: string;
  onChange: (newValue: string) => void;
  onClose: () => void;
  title?: string;
  isNumeric?: boolean;
}

export function EnglishVirtualKeyboard({
  value,
  onChange,
  onClose,
  title = 'English Quick Keyboard',
  isNumeric = false,
}: EnglishVirtualKeyboardProps) {
  const handleInsert = (text: string) => {
    onChange(value ? `${value} ${text}` : text);
  };

  const handleAppendAmount = (addAmount: number) => {
    const current = parseFloat(value) || 0;
    const next = current + addAmount;
    onChange(next.toString());
  };

  const handleBackspace = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const quickTerms = [
    'Advance Payment',
    'Balance Amount',
    'Catering & Food',
    'Decoration & Flowers',
    'Photography & Video',
    'Jewelry & Gold',
    'Wedding Clothes & Silk',
    'Travel & Cab Rental',
    'Venue & Hall Rent',
    'Sound & Lighting',
    'Gifts & Favors',
    'Pooja Items',
  ];

  const quickAmounts = [
    { label: '+₹500', val: 500 },
    { label: '+₹1,000', val: 1000 },
    { label: '+₹2,000', val: 2000 },
    { label: '+₹5,000', val: 5000 },
    { label: '+₹10,000', val: 10000 },
    { label: '+₹25,000', val: 25000 },
    { label: '+₹50,000', val: 50000 },
    { label: '+₹1,00,000', val: 100000 },
  ];

  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-3 sm:p-4 max-w-xl w-full mx-auto select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Keyboard Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">
            {title}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950/80 text-blue-400 border border-blue-800 font-semibold">
            English Active
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Keyboard"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isNumeric ? (
        /* Numeric Keyboard Pad */
        <div className="space-y-3">
          <div className="text-[11px] text-slate-400">
            Quick Amount Boosters:
          </div>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amt) => (
              <button
                type="button"
                key={amt.label}
                onClick={() => handleAppendAmount(amt.val)}
                className="py-2 px-2 bg-slate-800 hover:bg-blue-600 active:scale-95 text-blue-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 hover:border-blue-500 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{amt.label}</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 pt-1">
            Number Pad:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '00'].map((digit) => (
              <button
                type="button"
                key={digit}
                onClick={() => onChange(value + digit)}
                className="h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-base font-bold flex items-center justify-center border border-slate-700 transition-all cursor-pointer"
              >
                {digit}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Text Keyboard Pad with Quick Expense Terms */
        <div className="space-y-3">
          <div className="text-[11px] text-slate-400">
            1-Click Common Expense & Payee Terms:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {quickTerms.map((term) => (
              <button
                type="button"
                key={term}
                onClick={() => handleInsert(term)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 active:scale-95 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Quick Amount Suggestions:
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {quickAmounts.slice(0, 4).map((amt) => (
              <button
                type="button"
                key={amt.label}
                onClick={() => handleInsert(amt.label)}
                className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-semibold text-center border border-slate-700 transition-colors cursor-pointer"
              >
                {amt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
          >
            <Delete className="w-3.5 h-3.5" />
            <span>Backspace</span>
          </button>
        </div>

        {!isNumeric && (
          <button
            type="button"
            onClick={() => onChange(value + ' ')}
            className="flex-1 max-w-xs py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <Space className="w-3.5 h-3.5" />
            <span>Space</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
