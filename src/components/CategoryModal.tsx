import { useState, useEffect } from 'react';
import { Category } from '../types';
import { X, Palette } from 'lucide-react';
import { SmartInputField } from './smart-input/SmartInputField';

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
  { en: 'Catering & Food', ta: 'கேட்டரிங் & உணவு' },
  { en: 'Hall & Venue', ta: 'திருமண மண்டபம்' },
  { en: 'Decoration & Flowers', ta: 'அலங்காரம் & பூக்கள்' },
  { en: 'Photography & Media', ta: 'புகைப்படம் & வீடியோ' },
  { en: 'Jewelry & Gold', ta: 'தங்கம் & நகைகள்' },
  { en: 'Clothes & Silk', ta: 'பட்டு புடவை & ஆடைகள்' },
  { en: 'Travel & Logistics', ta: 'பயணம் & வண்டி வாடகை' },
  { en: 'Return Gifts & Favors', ta: 'தாம்பூலம் & பரிசுகள்' },
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
                Quick Category Suggestions (English & தமிழ்)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((sug) => (
                  <button
                    type="button"
                    key={sug.en}
                    onClick={() => setName(sug.ta)}
                    className="px-2.5 py-1 text-xs rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="font-semibold">{sug.ta}</span>
                    <span className="text-[10px] text-slate-400">({sug.en})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Name with Smart Input Field */}
          <SmartInputField
            label="Category Name"
            value={name}
            onChange={setName}
            placeholder="e.g. திருமண மண்டபம், கேட்டரிங், Reception, Travel"
            required
          />

          {/* Budget with Smart Input Field */}
          <SmartInputField
            label={`Target Budget (${currency}) (Optional)`}
            value={budget}
            onChange={setBudget}
            type="number"
            step="any"
            prefix={currency}
            placeholder="e.g. 100000"
          />

          {/* Description with Smart Input Field */}
          <SmartInputField
            label="Subtitle / Description (Optional)"
            value={description}
            onChange={setDescription}
            placeholder="e.g. திருமண மாலை மற்றும் அலங்காரம், Evening arrangements"
          />

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
