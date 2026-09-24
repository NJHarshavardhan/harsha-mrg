import { useState } from 'react';
import { Category, ExpenseItem } from '../types';
import { formatCurrency } from '../utils/storage';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Calendar, 
  IndianRupee, 
  DollarSign, 
  Tag, 
  MoreVertical,
  ChevronDown,
  Layers,
  PenTool,
  Maximize2,
  Download
} from 'lucide-react';

interface CategoryTableProps {
  category: Category;
  items: ExpenseItem[];
  currency: string;
  onAddItem: (categoryId: string, item: Omit<ExpenseItem, 'id' | 'sno'>) => void;
  onUpdateItem: (categoryId: string, item: ExpenseItem) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onOpenAddModal: (categoryId: string) => void;
}

export function CategoryTable({
  category,
  items,
  currency,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onEditCategory,
  onDeleteCategory,
  onOpenAddModal,
}: CategoryTableProps) {
  // Inline row input state
  const [inlineName, setInlineName] = useState('');
  const [inlineDate, setInlineDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [inlineAmt, setInlineAmt] = useState('');
  const [isAddingInline, setIsAddingInline] = useState(false);

  // Stored handwritten note viewer lightbox state
  const [viewingHandwritten, setViewingHandwritten] = useState<{
    name: string;
    image: string;
    date: string;
    amount: number;
  } | null>(null);

  // Inline editing state for a row
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAmt, setEditAmt] = useState('');

  // Subtotal calculation for this category
  const subtotal = items.reduce((acc, curr) => acc + (Number(curr.spentAmt) || 0), 0);
  const budget = category.budget || 0;
  const budgetPercent = budget > 0 ? Math.min(Math.round((subtotal / budget) * 100), 100) : 0;

  const handleInlineSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineName.trim()) return;
    const numAmt = parseFloat(inlineAmt) || 0;
    if (numAmt <= 0) return;

    onAddItem(category.id, {
      name: inlineName.trim(),
      date: inlineDate || new Date().toISOString().split('T')[0],
      spentAmt: numAmt,
    });

    setInlineName('');
    setInlineAmt('');
    setIsAddingInline(false);
  };

  const startEdit = (item: ExpenseItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDate(item.date);
    setEditAmt(item.spentAmt.toString());
  };

  const saveEdit = (item: ExpenseItem) => {
    const numAmt = parseFloat(editAmt);
    if (!editName.trim() || isNaN(numAmt) || numAmt < 0) return;

    onUpdateItem(category.id, {
      ...item,
      name: editName.trim(),
      date: editDate,
      spentAmt: numAmt,
    });

    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div 
      id={`category-table-${category.id}`}
      className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md"
    >
      {/* Category Section Header */}
      <div 
        className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
        style={{
          borderTop: `4px solid ${category.color || '#3b82f6'}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0"
            style={{ backgroundColor: category.color || '#3b82f6' }}
            title={`Category ${category.categoryNumber}`}
          >
            {category.categoryNumber}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Category {category.categoryNumber}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-medium text-slate-500">
                {items.length} {items.length === 1 ? 'expense' : 'expenses'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 truncate">
              <span className="truncate">{category.name}</span>
              {category.description && (
                <span className="text-xs font-normal text-slate-400 hidden md:inline truncate">
                  — {category.description}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Right side: Subtotal & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <div className="text-left sm:text-right">
            <div className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">
              Category Total
            </div>
            <div 
              className="text-lg sm:text-xl font-bold font-mono tracking-tight"
              style={{ color: category.color || '#1e293b' }}
            >
              {formatCurrency(subtotal, currency)}
            </div>
            {budget > 0 && (
              <div className="text-[10px] sm:text-[11px] text-slate-400">
                Budget: {formatCurrency(budget, currency)} ({budgetPercent}%)
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 border-l border-slate-200 pl-2 sm:pl-3">
            <button
              id={`btn-add-item-${category.id}`}
              onClick={() => onOpenAddModal(category.id)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
              title="Add expense with details"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>

            <button
              id={`btn-edit-cat-${category.id}`}
              onClick={() => onEditCategory(category)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Edit category name or budget"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              id={`btn-delete-cat-${category.id}`}
              onClick={() => onDeleteCategory(category.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete category table"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW (< 640px): Clean, touch-friendly card list */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {items.length === 0 && !isAddingInline ? (
          <div className="py-8 text-center text-slate-400 text-sm px-4">
            <p className="font-medium text-slate-600">No spends logged for {category.name} yet</p>
            <p className="text-xs text-slate-400 mt-1">Tap below to add the first expense</p>
            <button
              onClick={() => setIsAddingInline(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Quick Add Row
            </button>
          </div>
        ) : null}

        {items.map((item, index) => {
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <div key={item.id} className="p-3.5 bg-amber-50/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                  <span>Editing Row #{index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => saveEdit(item)}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Expense name"
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded outline-none"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1 text-slate-400 text-xs">{currency}</span>
                    <input
                      type="number"
                      step="any"
                      value={editAmt}
                      onChange={(e) => setEditAmt(e.target.value)}
                      className="w-full pl-6 pr-2 py-1 text-xs text-right font-mono bg-white border border-slate-300 rounded outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-slate-900 text-sm truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                  {formatCurrency(item.spentAmt, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">{item.date}</span>
                  {item.paymentMethod && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                      {item.paymentMethod}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(category.id, item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {item.notes && (
                <p className="text-[11px] text-slate-500 italic pl-7 line-clamp-2">
                  {item.notes}
                </p>
              )}

              {item.handwrittenImage && (
                <div className="pl-7 pt-1">
                  <button
                    type="button"
                    onClick={() => setViewingHandwritten({
                      name: item.name,
                      image: item.handwrittenImage!,
                      date: item.date,
                      amount: item.spentAmt,
                    })}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <PenTool className="w-3 h-3 text-indigo-600" />
                    <span>Handwritten Note</span>
                    <img 
                      src={item.handwrittenImage} 
                      alt="Handwritten note preview" 
                      className="h-4 max-w-[60px] object-contain rounded bg-white px-1 border border-indigo-200" 
                    />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Mobile Inline Add Row */}
        {isAddingInline ? (
          <div className="p-3.5 bg-emerald-50/70 border-t border-emerald-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span>Quick Add Expense</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleInlineSubmit()}
                  disabled={!inlineName.trim() || !inlineAmt}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Add
                </button>
                <button
                  onClick={() => setIsAddingInline(false)}
                  className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>

            <input
              type="text"
              value={inlineName}
              onChange={(e) => setInlineName(e.target.value)}
              placeholder="Expense name (e.g. Mandap Advance)"
              className="w-full px-2.5 py-1.5 text-sm bg-white border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSubmit();
                if (e.key === 'Escape') setIsAddingInline(false);
              }}
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={inlineDate}
                onChange={(e) => setInlineDate(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded outline-none"
              />
              <div className="relative">
                <span className="absolute left-2 top-1 text-slate-400 text-xs">{currency}</span>
                <input
                  type="number"
                  step="any"
                  value={inlineAmt}
                  onChange={(e) => setInlineAmt(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-6 pr-2 py-1 text-xs text-right font-mono bg-white border border-slate-300 rounded outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInlineSubmit();
                    if (e.key === 'Escape') setIsAddingInline(false);
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Mobile Subtotal Footer */}
        <div className="p-3.5 bg-slate-50 flex items-center justify-between border-t border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-700">Subtotal</div>
            <div className="text-[11px] text-slate-400">{items.length} items</div>
          </div>
          <div className="flex items-center gap-3">
            <span 
              className="text-base font-bold font-mono"
              style={{ color: category.color || '#1e293b' }}
            >
              {formatCurrency(subtotal, currency)}
            </span>
            {!isAddingInline && (
              <button
                onClick={() => setIsAddingInline(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>Row</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW (>= 640px sm:): Full Spreadsheet Category Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          {/* Distinct Table Header */}
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4 w-16 text-center">
                S.No
              </th>
              <th scope="col" className="py-3 px-4 min-w-[220px]">
                Name / Description
              </th>
              <th scope="col" className="py-3 px-4 w-36">
                Date
              </th>
              <th scope="col" className="py-3 px-4 w-44 text-right">
                Spent Amt ({currency})
              </th>
              <th scope="col" className="py-3 px-4 w-28 text-center">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && !isAddingInline ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <p className="font-medium text-slate-500">No spends logged for {category.name} yet</p>
                    <p className="text-xs text-slate-400">Click below to add the first expense to this table</p>
                    <button
                      id={`btn-first-add-${category.id}`}
                      onClick={() => setIsAddingInline(true)}
                      className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add First Row
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}

            {items.map((item, index) => {
              const isEditing = editingId === item.id;

              if (isEditing) {
                return (
                  <tr key={item.id} className="bg-amber-50/60 transition-colors">
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500 text-xs font-semibold">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1 text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Expense name"
                        autoFocus
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="relative inline-flex items-center w-full">
                        <span className="absolute left-2 text-slate-400 text-xs">{currency}</span>
                        <input
                          type="number"
                          step="any"
                          value={editAmt}
                          onChange={(e) => setEditAmt(e.target.value)}
                          className="w-full pl-6 pr-2 py-1 text-sm text-right font-mono bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => saveEdit(item)}
                          className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-400 font-semibold">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{item.name}</div>
                    {item.notes && (
                      <div className="text-xs text-slate-400 truncate max-w-sm">
                        {item.notes}
                      </div>
                    )}
                    {item.handwrittenImage && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingHandwritten({
                            name: item.name,
                            image: item.handwrittenImage!,
                            date: item.date,
                            amount: item.spentAmt,
                          })}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer group"
                          title="Click to view full handwritten drawing"
                        >
                          <PenTool className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>Handwritten Note</span>
                          <img 
                            src={item.handwrittenImage} 
                            alt="Handwritten note preview" 
                            className="h-3.5 max-w-[50px] object-contain rounded bg-white px-0.5 border border-indigo-200 group-hover:border-indigo-400" 
                          />
                        </button>
                      </div>
                    )}
                    {item.paymentMethod && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-medium bg-slate-100 text-slate-500 rounded">
                        {item.paymentMethod}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.spentAmt, currency)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit Row"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(category.id, item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Quick Inline Row Addition */}
            {isAddingInline ? (
              <tr className="bg-indigo-50/40 border-t border-indigo-200">
                <td className="py-2.5 px-4 text-center font-mono text-xs font-bold text-indigo-600">
                  {items.length + 1}
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="text"
                    value={inlineName}
                    onChange={(e) => setInlineName(e.target.value)}
                    placeholder="Enter expense name (e.g. Catering, Venue advance)"
                    className="w-full px-2.5 py-1.5 text-sm bg-white border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInlineSubmit();
                      if (e.key === 'Escape') setIsAddingInline(false);
                    }}
                  />
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="date"
                    value={inlineDate}
                    onChange={(e) => setInlineDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="relative inline-flex items-center w-full">
                    <span className="absolute left-2.5 text-slate-400 text-xs">{currency}</span>
                    <input
                      type="number"
                      step="any"
                      value={inlineAmt}
                      onChange={(e) => setInlineAmt(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2.5 py-1.5 text-sm text-right font-mono bg-white border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-400 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineSubmit();
                        if (e.key === 'Escape') setIsAddingInline(false);
                      }}
                    />
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleInlineSubmit()}
                      disabled={!inlineName.trim() || !inlineAmt}
                      className="p-1.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 rounded shadow-xs"
                      title="Add to table"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsAddingInline(false)}
                      className="p-1.5 text-slate-400 hover:bg-slate-200 rounded"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>

          {/* Table Footer with Subtotal & Calculator details */}
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-200/90 font-semibold text-slate-800">
              <td className="py-3 px-4 text-center text-xs text-slate-400">
                TOTAL
              </td>
              <td className="py-3 px-4">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                  Subtotal: Category {category.categoryNumber} ({category.name})
                </div>
                <div className="text-[11px] font-normal text-slate-400">
                  {items.length} {items.length === 1 ? 'item' : 'items'} logged in this sheet
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-slate-400">
                —
              </td>
              <td 
                className="py-3 px-4 text-right font-mono text-base font-bold whitespace-nowrap"
                style={{ color: category.color || '#1e293b' }}
              >
                {formatCurrency(subtotal, currency)}
              </td>
              <td className="py-3 px-4 text-center">
                {!isAddingInline && (
                  <button
                    id={`btn-inline-add-${category.id}`}
                    onClick={() => setIsAddingInline(true)}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 rounded hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Quick Row</span>
                  </button>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Enlarged Stored Handwritten Note Lightbox Modal */}
      {viewingHandwritten && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setViewingHandwritten(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 max-w-lg w-full space-y-3.5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {viewingHandwritten.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {category.name} • {viewingHandwritten.date} • {formatCurrency(viewingHandwritten.amount, currency)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingHandwritten(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center shadow-inner min-h-[140px]">
              <img 
                src={viewingHandwritten.image} 
                alt="Stored handwritten note" 
                className="max-h-72 max-w-full object-contain drop-shadow-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={viewingHandwritten.image}
                download={`handwritten_${viewingHandwritten.name.replace(/\s+/g, '_')}.png`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>

              <button
                type="button"
                onClick={() => setViewingHandwritten(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
