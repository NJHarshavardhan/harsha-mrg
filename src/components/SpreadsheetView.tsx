import { useState } from 'react';
import { ExpenseDataState, Category, ExpenseItem } from '../types';
import { formatCurrency } from '../utils/storage';
import { 
  FileSpreadsheet, 
  Plus, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink,
  Table as TableIcon
} from 'lucide-react';

interface SpreadsheetViewProps {
  data: ExpenseDataState;
  onAddItem: (categoryId: string, item: Omit<ExpenseItem, 'id' | 'sno'>) => void;
  onUpdateItem: (categoryId: string, item: ExpenseItem) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onAddCategoryClick: () => void;
  onSwitchToCards: () => void;
}

export function SpreadsheetView({
  data,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddCategoryClick,
  onSwitchToCards,
}: SpreadsheetViewProps) {
  // activeTab: 'all' or category.id
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeCell, setActiveCell] = useState<string>('D2');
  const [copied, setCopied] = useState(false);

  // Quick new row state
  const [newRowName, setNewRowName] = useState('');
  const [newRowDate, setNewRowDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newRowAmt, setNewRowAmt] = useState('');

  const currentCategory = data.categories.find((c) => c.id === activeTab);
  const displayedCategories = activeTab === 'all' 
    ? data.categories 
    : data.categories.filter((c) => c.id === activeTab);

  // Calculate totals
  let grandTotal = 0;
  let grandCount = 0;
  data.categories.forEach((cat) => {
    (data.expenses[cat.id] || []).forEach((item) => {
      grandTotal += Number(item.spentAmt) || 0;
      grandCount += 1;
    });
  });

  const handleAddRow = (catId: string) => {
    if (!newRowName.trim() || !newRowAmt) return;
    const numAmt = parseFloat(newRowAmt);
    if (isNaN(numAmt) || numAmt <= 0) return;

    onAddItem(catId, {
      name: newRowName.trim(),
      date: newRowDate || new Date().toISOString().split('T')[0],
      spentAmt: numAmt,
    });

    setNewRowName('');
    setNewRowAmt('');
  };

  const copySheetToClipboard = () => {
    let tsv = `Category\tS.No\tName\tDate\tSpent Amount (${data.currency})\n`;
    data.categories.forEach((cat) => {
      const items = data.expenses[cat.id] || [];
      items.forEach((item, idx) => {
        tsv += `${cat.name}\t${idx + 1}\t${item.name}\t${item.date}\t${item.spentAmt}\n`;
      });
    });
    tsv += `\nTotal Spent\t\t\t\t${grandTotal}`;

    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Toolbar / Formula Bar (Google Sheets Style) */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 font-semibold shadow-2xs">
            <span className="text-slate-400">Cell:</span> {activeCell}
          </div>
          <div className="flex items-center gap-1 font-mono text-slate-500 bg-white border border-slate-200 rounded px-2.5 py-1 min-w-[200px] shadow-2xs">
            <span className="font-bold text-indigo-600">fx</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700">
              =SUM(Spent_Amounts) → {formatCurrency(grandTotal, data.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copySheetToClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-2xs transition-colors"
            title="Copy sheet grid for direct pasting into Google Sheets or Excel"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy for Google Sheets</span>
              </>
            )}
          </button>

          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium transition-colors"
            title="Open Google Sheets in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Google Sheets</span>
          </a>

          <button
            onClick={onSwitchToCards}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Multi-Table View</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Main Grid Area */}
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full text-left text-xs border-collapse font-sans">
          {/* Column Alphabet Headers: A, B, C, D, E... */}
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-mono select-none">
              <th className="w-12 py-1.5 px-2 text-center border-r border-slate-200 bg-slate-200/70 font-semibold">
                #
              </th>
              <th className="w-20 py-1.5 px-3 border-r border-slate-200 text-center font-bold">
                A (S.No)
              </th>
              <th className="min-w-[200px] py-1.5 px-3 border-r border-slate-200 font-bold">
                B (Expense Name)
              </th>
              <th className="w-36 py-1.5 px-3 border-r border-slate-200 font-bold">
                C (Date)
              </th>
              <th className="w-44 py-1.5 px-3 border-r border-slate-200 text-right font-bold">
                D (Spent Amt)
              </th>
              <th className="w-40 py-1.5 px-3 border-r border-slate-200 font-bold">
                E (Category)
              </th>
              <th className="w-20 py-1.5 px-2 text-center font-bold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
            {displayedCategories.map((cat) => {
              const items = data.expenses[cat.id] || [];
              const catTotal = items.reduce(
                (sum, i) => sum + (Number(i.spentAmt) || 0),
                0
              );

              return (
                <div key={cat.id} style={{ display: 'contents' }}>
                  {/* Category Section Header in Spreadsheet */}
                  <tr className="bg-slate-100/90 font-sans font-bold text-slate-800 border-t-2 border-b border-slate-300">
                    <td className="py-2 px-2 text-center bg-slate-200/80 font-mono text-[11px] text-slate-500 border-r border-slate-300">
                      §
                    </td>
                    <td 
                      colSpan={4} 
                      className="py-2 px-3 border-r border-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="uppercase tracking-wider text-xs font-bold text-slate-700">
                          Category {cat.categoryNumber}: {cat.name}
                        </span>
                        <span className="text-slate-400 font-normal text-xs">
                          ({items.length} records)
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-300">
                      {formatCurrency(catTotal, data.currency)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="text-[10px] text-slate-400">TABLE {cat.categoryNumber}</span>
                    </td>
                  </tr>

                  {/* Rows for this category */}
                  {items.map((item, idx) => (
                    <tr 
                      key={item.id}
                      onClick={() => setActiveCell(`D${idx + 2}`)}
                      className="hover:bg-indigo-50/40 transition-colors border-b border-slate-200"
                    >
                      <td className="py-2 px-2 text-center bg-slate-50 font-mono text-slate-400 border-r border-slate-200 text-[11px] select-none">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-800 border-r border-slate-200">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            onUpdateItem(cat.id, { ...item, name: e.target.value })
                          }
                          className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-1.5 py-0.5"
                        />
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-600">
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) =>
                            onUpdateItem(cat.id, { ...item, date: e.target.value })
                          }
                          className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-right border-r border-slate-200 font-mono font-semibold text-slate-900">
                        <input
                          type="number"
                          step="any"
                          value={item.spentAmt}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              onUpdateItem(cat.id, { ...item, spentAmt: val });
                            }
                          }}
                          className="w-full text-right bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-1.5 py-0.5"
                        />
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-600">
                        <span 
                          className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                          }}
                        >
                          {cat.name}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => onDeleteItem(cat.id, item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal row */}
                  <tr className="bg-slate-50 font-mono font-bold text-slate-700 border-b-2 border-slate-200">
                    <td className="py-2 px-2 text-center bg-slate-100 text-[10px] text-slate-400 border-r border-slate-200">
                      ∑
                    </td>
                    <td colSpan={3} className="py-2 px-3 text-right font-sans text-xs uppercase tracking-wider text-slate-500 border-r border-slate-200">
                      SUBTOTAL ({cat.name.toUpperCase()})
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 border-r border-slate-200 text-sm">
                      {formatCurrency(catTotal, data.currency)}
                    </td>
                    <td colSpan={2} className="py-2 px-3 text-slate-400 font-sans text-[11px]">
                      {items.length} entries calculated
                    </td>
                  </tr>
                </div>
              );
            })}
          </tbody>

          {/* Grand Total Sheet Row */}
          <tfoot>
            <tr className="bg-indigo-900 text-white font-mono font-bold text-sm">
              <td className="py-3 px-2 text-center bg-indigo-950 font-bold border-r border-indigo-800">
                TOTAL
              </td>
              <td colSpan={3} className="py-3 px-3 font-sans uppercase tracking-wider text-xs border-r border-indigo-800">
                GRAND TOTAL (ALL CATEGORY TABLES)
              </td>
              <td className="py-3 px-3 text-right text-base text-amber-300 font-mono font-extrabold border-r border-indigo-800">
                {formatCurrency(grandTotal, data.currency)}
              </td>
              <td colSpan={2} className="py-3 px-3 font-sans text-xs text-indigo-200">
                {data.categories.length} Categories • {grandCount} Total Expenses
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Sheet Tabs Bar (Google Sheets Style) */}
      <div className="bg-slate-100 border-t border-slate-300 px-3 py-1.5 flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          {/* Tab: All Sheets */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs font-medium rounded-t border transition-all ${
              activeTab === 'all'
                ? 'bg-white border-slate-300 border-b-white text-indigo-700 font-bold shadow-2xs'
                : 'bg-slate-200/60 border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 All Categories ({data.categories.length})
          </button>

          {/* Individual Category Tabs */}
          {data.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-1 text-xs font-medium rounded-t border flex items-center gap-1.5 transition-all ${
                activeTab === cat.id
                  ? 'bg-white border-slate-300 border-b-white text-slate-800 font-bold shadow-2xs'
                  : 'bg-slate-200/60 border-transparent text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
            </button>
          ))}

          {/* Add Category Tab Button */}
          <button
            onClick={onAddCategoryClick}
            className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 rounded flex items-center gap-1 transition-colors"
            title="Add a new category sheet table"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category Table</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-sans pr-2 hidden sm:block">
          Click any cell to edit • Auto-saved to sheet storage
        </div>
      </div>
    </div>
  );
}
