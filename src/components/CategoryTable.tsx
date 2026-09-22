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
  Layers
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
        className="px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4"
        style={{
          borderTop: `4px solid ${category.color || '#3b82f6'}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs"
            style={{ backgroundColor: category.color || '#3b82f6' }}
            title={`Category ${category.categoryNumber}`}
          >
            {category.categoryNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category {category.categoryNumber}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">
                {items.length} {items.length === 1 ? 'expense' : 'expenses'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {category.name}
              {category.description && (
                <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                  — {category.description}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Right side: Subtotal & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Category Total
            </div>
            <div 
              className="text-xl font-bold font-mono tracking-tight"
              style={{ color: category.color || '#1e293b' }}
            >
              {formatCurrency(subtotal, currency)}
            </div>
            {budget > 0 && (
              <div className="text-[11px] text-slate-400">
                Budget: {formatCurrency(budget, currency)} ({budgetPercent}%)
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <button
              id={`btn-add-item-${category.id}`}
              onClick={() => onOpenAddModal(category.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Add expense with details"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>

            <button
              id={`btn-edit-cat-${category.id}`}
              onClick={() => onEditCategory(category)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Edit category name or budget"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              id={`btn-delete-cat-${category.id}`}
              onClick={() => onDeleteCategory(category.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete category table"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
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
    </div>
  );
}
