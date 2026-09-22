import { useState, useEffect } from 'react';
import { Category } from '../types';
import { X, Palette, Hash } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<Category>, categoryId?: string) => void;
  initialCategory?: Category | null;
  existingCount: number;
  currency: string;
}

const COLOR_OPTIONS = [
  '#0d9488', // Teal
  '#e11d48', // Rose
  '#8b5cf6', // Violet
  '#2563eb', // Blue
  '#d97706', // Amber
  '#059669', // Emerald
  '#db2777', // Pink
  '#475569', // Slate
];

const QUICK_SUGGESTIONS = [
  'Reception',
  'Sangeet & Mehendi',
  'Haldi Ceremony',
  'Jewelry & Clothes',
  'Catering & Sweets',
  'Photography & Media',
  'Travel & Logistics',
  'Return Gifts & Favors',
];

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  existingCount,
  currency,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  const nextCatNumber = initialCategory 
    ? initialCategory.categoryNumber 
    : existingCount + 1;

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setColor(initialCategory.color || COLOR_OPTIONS[0]);
      setBudget(initialCategory.budget ? initialCategory.budget.toString() : '');
      setDescription(initialCategory.description || '');
    } else {
      setName('');
      // Cycle colors based on count
      setColor(COLOR_OPTIONS[existingCount % COLOR_OPTIONS.length]);
      setBudget('');
      setDescription('');
    }
  }, [initialCategory, existingCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name: name.trim(),
        categoryNumber: nextCatNumber,
        color,
        budget: budget ? parseFloat(budget) : undefined,
        description: description.trim() || undefined,
      },
      initialCategory?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span 
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {nextCatNumber}
            </span>
            <h3 className="font-bold text-slate-800 text-base">
              {initialCategory 
                ? `Edit Category ${initialCategory.categoryNumber}` 
                : `Add Category ${nextCatNumber} Table`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Suggestions if adding new */}
          {!initialCategory && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Quick Category Suggestions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((sug) => (
                  <button
                    type="button"
                    key={sug}
                    onClick={() => setName(sug)}
                    className="px-2.5 py-1 text-xs rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Reception, Sangeet, Catering, Travel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1">
              This will create a distinct separate table with its own header & total calculator.
            </p>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Budget ({currency}) (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                placeholder="e.g. 100000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Subtitle / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Evening dinner and music arrangements"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Table Color Accent
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              {initialCategory ? 'Update Table' : `Create Table for Category ${nextCatNumber}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
