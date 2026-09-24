import { useState, useEffect } from 'react';
import { Category, ExpenseItem } from '../types';
import { X, PenTool, Maximize2, Trash2 } from 'lucide-react';
import { SmartInputField } from './smart-input/SmartInputField';
import { HandwritingCanvasModal } from './smart-input/HandwritingCanvasModal';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialCategoryId?: string;
  initialItem?: ExpenseItem | null;
  currency: string;
  onSave: (
    categoryId: string, 
    item: Omit<ExpenseItem, 'id' | 'sno'>, 
    itemId?: string
  ) => void;
}

export function ExpenseModal({
  isOpen,
  onClose,
  categories,
  initialCategoryId,
  initialItem,
  currency,
  onSave,
}: ExpenseModalProps) {
  const [categoryId, setCategoryId] = useState<string>(
    initialCategoryId || (categories[0]?.id ?? '')
  );
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [spentAmt, setSpentAmt] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [handwrittenImage, setHandwrittenImage] = useState<string | undefined>(undefined);
  const [showDedicatedPad, setShowDedicatedPad] = useState(false);
  const [showEnlargedHandwriting, setShowEnlargedHandwriting] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setDate(initialItem.date);
      setSpentAmt(initialItem.spentAmt.toString());
      setNotes(initialItem.notes || '');
      setPaymentMethod(initialItem.paymentMethod || 'UPI');
      setHandwrittenImage(initialItem.handwrittenImage);
      if (initialCategoryId) setCategoryId(initialCategoryId);
    } else {
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      setSpentAmt('');
      setNotes('');
      setPaymentMethod('UPI');
      setHandwrittenImage(undefined);
      if (initialCategoryId) setCategoryId(initialCategoryId);
      else if (categories[0]) setCategoryId(categories[0].id);
    }
  }, [initialItem, initialCategoryId, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const numAmt = parseFloat(spentAmt);
    if (isNaN(numAmt) || numAmt <= 0) return;

    onSave(
      categoryId,
      {
        name: name.trim(),
        date,
        spentAmt: numAmt,
        notes: notes.trim() || undefined,
        paymentMethod: paymentMethod || undefined,
        handwrittenImage: handwrittenImage || undefined,
      },
      initialItem?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {initialItem ? 'Edit Expense Record' : 'Add New Expense Item'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Supports English & தமிழ் typing, virtual keyboards, handwriting storage, and voice notes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoryNumber}. {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name / Payee with Smart Multi-Input */}
          <SmartInputField
            label="Expense Name / Payee"
            value={name}
            onChange={setName}
            handwrittenImage={handwrittenImage}
            onHandwrittenChange={setHandwrittenImage}
            placeholder="e.g. திருமண மண்டபம், கேட்டரிங், Ring purchase, Advance"
            required
          />

          {/* Date & Spent Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <SmartInputField
              label={`Spent Amount (${currency})`}
              value={spentAmt}
              onChange={setSpentAmt}
              type="number"
              step="any"
              min="0.01"
              prefix={currency}
              placeholder="0.00"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['UPI', 'Cash', 'Bank Transfer', 'Card'].map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Remarks with Smart Multi-Input */}
          <SmartInputField
            label="Notes / Remarks (Optional)"
            value={notes}
            onChange={setNotes}
            isTextarea
            rows={2}
            placeholder="e.g. ரசீது எண், முன்பணம் விவரம், Vendor contact, Receipt #123"
          />

          {/* Dedicated Stored Handwriting Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                <span>Handwritten Note / Bill Sketch</span>
              </span>

              {!handwrittenImage && (
                <button
                  type="button"
                  onClick={() => setShowDedicatedPad(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Handwrite Note</span>
                </button>
              )}
            </div>

            {handwrittenImage ? (
              <div className="p-2.5 bg-white border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    onClick={() => setShowEnlargedHandwriting(true)}
                    className="w-16 h-11 bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors shrink-0 group relative"
                    title="Click to view full size"
                  >
                    <img 
                      src={handwrittenImage} 
                      alt="Handwritten note" 
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-indigo-950/10 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-3 h-3 text-indigo-700" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Stored Handwritten Note</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Attached
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Will be saved and viewable directly in the expense table
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowDedicatedPad(true)}
                    className="px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Redraw
                  </button>
                  <button
                    type="button"
                    onClick={() => setHandwrittenImage(undefined)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove stored note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                You can handwrite or draw a bill note, signature, or Tamil note with your finger or stylus. What you write will be stored directly with this expense.
              </p>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {initialItem ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>

        {/* Dedicated Handwriting Modal */}
        {showDedicatedPad && (
          <HandwritingCanvasModal
            isOpen={showDedicatedPad}
            onClose={() => setShowDedicatedPad(false)}
            onApply={(text, drawingDataUrl) => {
              if (drawingDataUrl) {
                setHandwrittenImage(drawingDataUrl);
              }
              if (!name.trim() && text && text !== '✍️ Handwritten Note') {
                setName(text);
              } else if (!notes.trim() && text) {
                setNotes(text);
              }
            }}
            initialText={name || notes}
            initialDrawing={handwrittenImage}
            fieldLabel="Expense Note / Bill"
          />
        )}

        {/* Enlarged Handwriting Lightbox */}
        {showEnlargedHandwriting && handwrittenImage && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
            onClick={() => setShowEnlargedHandwriting(false)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 max-w-lg w-full space-y-3 animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Stored Handwritten Note</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEnlargedHandwriting(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center shadow-inner">
                <img 
                  src={handwrittenImage} 
                  alt="Enlarged handwritten note" 
                  className="max-h-64 max-w-full object-contain drop-shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowEnlargedHandwriting(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
