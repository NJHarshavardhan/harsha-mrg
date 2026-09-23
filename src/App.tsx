import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ExpenseDataState, 
  Category, 
  ExpenseItem, 
  ViewMode 
} from './types';
import { 
  createEmptyExpenseState, 
  createBlankCategory, 
  formatCurrency,
  loadLocalExpenseState,
  saveLocalExpenseState,
  clearLocalExpenseState
} from './utils/storage';
import {
  SheetConnectionConfig,
  loadSavedConnectionConfig,
  saveConnectionConfig,
  parseCurlOrUrl,
  fetchFromSheetConnection,
  pushToSheetConnection
} from './services/sheetConnection';
import { CategoryTable } from './components/CategoryTable';
import { ExpenseModal } from './components/ExpenseModal';
import { CategoryModal } from './components/CategoryModal';
import { SpreadsheetView } from './components/SpreadsheetView';
import { ExportModal } from './components/ExportModal';
import { WeeklySpendingTrendsChart } from './components/WeeklySpendingTrendsChart';
import { SheetConnectionModal } from './components/SheetConnectionModal';
import { 
  DEFAULT_SPREADSHEET_TITLE 
} from './services/sheetConnection';
import { ConfirmModal } from './components/ConfirmModal';
import { 
  Plus, 
  FileSpreadsheet, 
  Table, 
  Search, 
  Download, 
  Database, 
  CheckCircle2, 
  FolderPlus,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Main expense data state (loaded from LocalStorage or connected Sheet URL)
  const [data, setData] = useState<ExpenseDataState>(() => loadLocalExpenseState());
  const [viewMode, setViewMode] = useState<ViewMode>('tables');
  const [searchQuery, setSearchQuery] = useState('');

  // Sheet URL / cURL Endpoint connection state (Zero OAuth)
  const [sheetConfig, setSheetConfig] = useState<SheetConnectionConfig>(() => loadSavedConnectionConfig());
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string>('');
  const [isSheetConnectionModalOpen, setIsSheetConnectionModalOpen] = useState(false);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeCategoryIdForAdd, setActiveCategoryIdForAdd] = useState<string | undefined>();
  const [editingExpenseItem, setEditingExpenseItem] = useState<ExpenseItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Destructive operations confirmation dialog state
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<{ categoryId: string; item: ExpenseItem } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-fetch data if a sheet URL was previously saved
  useEffect(() => {
    if (sheetConfig && sheetConfig.url) {
      handleRefreshFromSheet(sheetConfig);
    }
  }, []);

  // Central state persistence: updates memory, localStorage, and triggers background sync if connected
  const persistAndSyncState = async (nextState: ExpenseDataState) => {
    setData(nextState);
    saveLocalExpenseState(nextState);

    if (sheetConfig && sheetConfig.url) {
      try {
        setSyncStatus('syncing');
        const res = await pushToSheetConnection(sheetConfig, nextState);
        if (res.success) {
          setSyncStatus('saved');
          setSyncErrorMessage(res.message || '');
        } else {
          setSyncStatus('error');
          setSyncErrorMessage(res.message || 'Sync warning');
        }
      } catch (err: any) {
        console.warn('Sync failed:', err);
        setSyncStatus('error');
        setSyncErrorMessage(err?.message || 'Sync error');
      }
    }
  };

  // Updates or links a Google Sheet URL
  const handleUpdateSheetUrl = async (rawInput: string) => {
    try {
      setIsConnecting(true);
      setSyncErrorMessage('');
      setSyncStatus('syncing');

      const config = parseCurlOrUrl(rawInput);
      const result = await fetchFromSheetConnection(config, data.currency);

      if (result.data && result.data.categories && result.data.categories.length > 0) {
        setData(result.data);
        saveLocalExpenseState(result.data);
      } else {
        await pushToSheetConnection(config, data);
      }

      setSheetConfig(config);
      saveConnectionConfig(config);
      setSyncStatus('saved');
    } catch (err: any) {
      console.error('Failed to update sheet URL:', err);
      setSyncStatus('error');
      setSyncErrorMessage(err?.message || 'Failed to update sheet connection');
    } finally {
      setIsConnecting(false);
    }
  };

  // Refresh from active sheet connection
  const handleRefreshFromSheet = async (cfg: SheetConnectionConfig = sheetConfig) => {
    if (!cfg || !cfg.url) return;
    try {
      setSyncStatus('syncing');
      setSyncErrorMessage('');
      const result = await fetchFromSheetConnection(cfg, data.currency);
      if (result.data && result.data.categories) {
        setData(result.data);
        saveLocalExpenseState(result.data);
      }
      setSyncStatus('saved');
    } catch (err: any) {
      console.error('Refresh error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(err?.message || 'Failed to refresh from sheet');
    }
  };

  // Clear local storage and enforce sheet-only mode
  const handleClearLocalStorage = () => {
    clearLocalExpenseState();
    if (sheetConfig && sheetConfig.url) {
      handleRefreshFromSheet(sheetConfig);
    } else {
      setData(createEmptyExpenseState(data.currency));
    }
  };

  // Currency switcher
  const handleCurrencyChange = async (newCurrency: string) => {
    const updatedState = {
      ...data,
      currency: newCurrency,
    };
    await persistAndSyncState(updatedState);
  };

  // Expense Handlers
  const handleAddExpense = async (
    categoryId: string, 
    itemData: Omit<ExpenseItem, 'id' | 'sno'>
  ) => {
    const targetCategory = data.categories.find((c) => c.id === categoryId);
    if (!targetCategory) return;

    const existing = data.expenses[categoryId] || [];
    const newItem: ExpenseItem = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sno: existing.length + 1,
      ...itemData,
    };

    const updatedItems = [...existing, newItem];
    const updatedExpenses = {
      ...data.expenses,
      [categoryId]: updatedItems,
    };

    const nextState = {
      ...data,
      expenses: updatedExpenses,
    };
    await persistAndSyncState(nextState);
  };

  const handleUpdateExpense = async (categoryId: string, updatedItem: ExpenseItem) => {
    const targetCategory = data.categories.find((c) => c.id === categoryId);
    if (!targetCategory) return;

    const existing = data.expenses[categoryId] || [];
    const updatedItems = existing.map((i) => (i.id === updatedItem.id ? updatedItem : i));

    const nextState = {
      ...data,
      expenses: {
        ...data.expenses,
        [categoryId]: updatedItems,
      },
    };
    await persistAndSyncState(nextState);
  };

  // Initiates row delete with mandatory confirmation dialog
  const requestDeleteExpense = (categoryId: string, itemId: string) => {
    const item = (data.expenses[categoryId] || []).find((i) => i.id === itemId);
    if (item) {
      setDeleteExpenseTarget({ categoryId, item });
    }
  };

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseTarget) return;
    const { categoryId, item } = deleteExpenseTarget;

    setIsDeleting(true);
    const existing = data.expenses[categoryId] || [];
    const filtered = existing
      .filter((i) => i.id !== item.id)
      .map((it, idx) => ({ ...it, sno: idx + 1 }));

    const nextState = {
      ...data,
      expenses: {
        ...data.expenses,
        [categoryId]: filtered,
      },
    };
    await persistAndSyncState(nextState);

    setIsDeleting(false);
    setDeleteExpenseTarget(null);
  };

  // Category Handlers (Supporting "Category 3 means 3 table must come")
  const handleSaveCategory = async (
    catData: Partial<Category>, 
    catId?: string
  ) => {
    let nextCategories: Category[];

    if (catId) {
      // Update existing category
      nextCategories = data.categories.map((c) =>
        c.id === catId ? { ...c, ...catData } : c
      );

      const nextState = {
        ...data,
        categories: nextCategories,
      };
      await persistAndSyncState(nextState);
    } else {
      // Add brand new category table!
      const nextNum = data.categories.length + 1;
      const newCatId = `cat_${Date.now()}`;
      const targetCat: Category = {
        id: newCatId,
        categoryNumber: nextNum,
        name: catData.name?.trim() || `Category ${nextNum}`,
        color: catData.color || '#4f46e5',
        budget: catData.budget || 0,
        description: catData.description || '',
      };

      nextCategories = [...data.categories, targetCat];
      const nextExpenses = {
        ...data.expenses,
        [newCatId]: [],
      };

      const nextState = {
        ...data,
        categories: nextCategories,
        expenses: nextExpenses,
      };
      await persistAndSyncState(nextState);
    }
  };

  // Quick Initial 3-Category Setup (Zero hardcoded expense rows)
  const handleQuickSetup3Categories = async () => {
    const cat1 = createBlankCategory(1, 'Category 1');
    const cat2 = createBlankCategory(2, 'Category 2');
    const cat3 = createBlankCategory(3, 'Category 3');

    const nextState: ExpenseDataState = {
      ...data,
      categories: [cat1, cat2, cat3],
      expenses: {
        [cat1.id]: [],
        [cat2.id]: [],
        [cat3.id]: [],
      },
    };
    await persistAndSyncState(nextState);
  };

  // Initiates category table deletion with confirmation dialog
  const requestDeleteCategory = (categoryId: string) => {
    const cat = data.categories.find((c) => c.id === categoryId);
    if (cat) {
      setDeleteCategoryTarget(cat);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    const catToDelete = deleteCategoryTarget;

    setIsDeleting(true);
    const remainingCats = data.categories
      .filter((c) => c.id !== catToDelete.id)
      .map((c, idx) => ({
        ...c,
        categoryNumber: idx + 1,
      }));

    const newExpenses = { ...data.expenses };
    delete newExpenses[catToDelete.id];

    const nextState = {
      ...data,
      categories: remainingCats,
      expenses: newExpenses,
    };
    await persistAndSyncState(nextState);

    setIsDeleting(false);
    setDeleteCategoryTarget(null);
  };

  // Grand Calculations
  const { grandTotal, totalItemsCount, categoryTotals } = useMemo(() => {
    let grand = 0;
    let itemsCount = 0;
    const catMap: Record<string, number> = {};

    data.categories.forEach((cat) => {
      const items = data.expenses[cat.id] || [];
      const sum = items.reduce(
        (acc, item) => acc + (Number(item.spentAmt) || 0), 
        0
      );
      catMap[cat.id] = sum;
      grand += sum;
      itemsCount += items.length;
    });

    return {
      grandTotal: grand,
      totalItemsCount: itemsCount,
      categoryTotals: catMap,
    };
  }, [data]);

  // Filtered expenses based on search query
  const filteredCategoriesWithItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return data.categories.map((cat) => ({
        category: cat,
        items: data.expenses[cat.id] || [],
      }));
    }

    const q = searchQuery.toLowerCase();
    return data.categories.map((cat) => {
      const allItems = data.expenses[cat.id] || [];
      const filtered = allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.date.includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q)) ||
          item.spentAmt.toString().includes(q)
      );
      return {
        category: cat,
        items: filtered,
      };
    });
  }, [data, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Spends & Expense Calculator
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                  <Database className="w-3 h-3 text-emerald-600" />
                  Google Sheets Storage
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="text-slate-400">
                  {data.categories.length} category {data.categories.length === 1 ? 'table' : 'tables'} • Separate table per category
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Currency, Views, Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Google Sheets Connection Pill Button */}
            <button
              id="btn-sheet-connection-header"
              onClick={() => setIsSheetConnectionModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                sheetConfig?.url
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
              }`}
              title="Configure Google Sheet / Apps Script storage connection"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{sheetConfig?.url ? 'Sheet Connected' : 'Connect Sheet'}</span>
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
              ) : syncStatus === 'saved' ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : null}
            </button>

            {/* Currency Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {['₹', '$', '€', '£'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => handleCurrencyChange(curr)}
                  className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    data.currency === curr
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title={`Use currency ${curr}`}
                >
                  {curr}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                id="btn-view-tables"
                onClick={() => setViewMode('tables')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === 'tables'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Separate Tables</span>
              </button>
              <button
                id="btn-view-sheet"
                onClick={() => setViewMode('sheet')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === 'sheet'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sheet Grid</span>
              </button>
            </div>

            {/* Export / Storage Modal */}
            <button
              id="btn-open-export"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Export to CSV or copy Google Sheets values"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            {/* Add Category Table (e.g. Category 3 means 3 tables) */}
            <button
              id="btn-add-category"
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
              title="Add a new category table"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Add Category Table</span>
            </button>

            {/* Add New Expense Button */}
            <button
              id="btn-add-expense-global"
              disabled={data.categories.length === 0}
              onClick={() => {
                setEditingExpenseItem(null);
                setActiveCategoryIdForAdd(data.categories[0]?.id);
                setIsExpenseModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notice Banner when running on local storage only */}
      {!sheetConfig?.url && (
        <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Storage Notice:</strong> Running in local preview mode. Connect your <strong>harsha-marriage</strong> Google Sheet or Apps Script Web App to store and fetch expenses directly from your sheet.
              </span>
            </div>
            <button
              onClick={() => setIsSheetConnectionModalOpen(true)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              Connect Google Sheet
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Grand Total Expense Calculator Card */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Total Spend Stat */}
            <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Grand Total Spends
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
                {formatCurrency(grandTotal, data.currency)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>{totalItemsCount} total expenses logged</span>
                <span>•</span>
                <span>Across {data.categories.length} category tables</span>
              </div>
            </div>

            {/* Category Breakdown Badges */}
            <div className="md:col-span-8 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Categories Spending Breakdown ({data.categories.length} Tables)
                </span>
                <span className="text-[11px] text-slate-400">
                  {data.categories.length > 0 ? `Rule: Category ${data.categories.length} = ${data.categories.length} Tables` : 'No categories yet'}
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                {data.categories.map((cat) => {
                  const catAmt = categoryTotals[cat.id] || 0;
                  const pct = grandTotal > 0 ? (catAmt / grandTotal) * 100 : 0;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={cat.id}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cat.color || '#10b981',
                      }}
                      title={`${cat.name}: ${formatCurrency(catAmt, data.currency)} (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>

              {/* Category pills list */}
              <div className="flex flex-wrap gap-2 pt-1">
                {data.categories.map((cat) => {
                  const catAmt = categoryTotals[cat.id] || 0;
                  const pct = grandTotal > 0 ? Math.round((catAmt / grandTotal) * 100) : 0;
                  return (
                    <a
                      key={cat.id}
                      href={`#category-table-${cat.id}`}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200/80 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-slate-700">
                        {cat.name}:
                      </span>
                      <span className="font-mono text-slate-900 font-bold">
                        {formatCurrency(catAmt, data.currency)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({pct}%)
                      </span>
                    </a>
                  );
                })}

                <button
                  id="btn-add-category-pill"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Category {data.categories.length + 1} Table</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Spending Trends for Current Week (Aggregated across all categories) */}
        {data.categories.length > 0 && (
          <WeeklySpendingTrendsChart data={data} currency={data.currency} />
        )}

        {/* Search & Table Actions Bar */}
        {data.categories.length > 0 && (
          <section className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search expenses by name, date, or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs text-slate-500">
              <span>
                Showing <strong>{data.categories.length}</strong> separate category tables
              </span>
              {sheetConfig?.url && (
                <>
                  <span className="text-slate-300">•</span>
                  <a
                    href={sheetConfig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-medium"
                  >
                    <span>View Connected Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </section>
        )}

        {/* Empty State when no categories exist yet in Google Sheet */}
        {data.categories.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                Ready to Organize Your Expenses
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Your Google Sheets storage is set up without any hardcoded data. Start by creating your own custom category tables (e.g. Engagement, Marriage, Travel, Bills, etc.).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="btn-empty-quick-setup"
                onClick={handleQuickSetup3Categories}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Quick Setup: 3 Category Tables</span>
              </button>

              <button
                id="btn-empty-add-category"
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Custom Category Table</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'sheet' ? (
          /* Spreadsheet View */
          <SpreadsheetView
            data={data}
            onAddItem={handleAddExpense}
            onUpdateItem={handleUpdateExpense}
            onDeleteItem={requestDeleteExpense}
            onAddCategoryClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            onSwitchToCards={() => setViewMode('tables')}
          />
        ) : (
          /* Separate Category Tables */
          <div className="space-y-6">
            {filteredCategoriesWithItems.map(({ category, items }) => (
              <CategoryTable
                key={category.id}
                category={category}
                items={items}
                currency={data.currency}
                onAddItem={handleAddExpense}
                onUpdateItem={handleUpdateExpense}
                onDeleteItem={requestDeleteExpense}
                onEditCategory={(cat) => {
                  setEditingCategory(cat);
                  setIsCategoryModalOpen(true);
                }}
                onDeleteCategory={(catId) => requestDeleteCategory(catId)}
                onOpenAddModal={(catId) => {
                  setEditingExpenseItem(null);
                  setActiveCategoryIdForAdd(catId);
                  setIsExpenseModalOpen(true);
                }}
              />
            ))}

            {/* Quick Add Another Category Table Card */}
            <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-white/50 text-center hover:bg-white hover:border-emerald-400 transition-all">
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Need another category table?
                </h4>
                <p className="text-xs text-slate-500">
                  As requested: "Category 3 means 3 table must come". Click below to add Category {data.categories.length + 1} and instantly generate another separate table header synced to your Google Sheet!
                </p>
                <div className="pt-2">
                  <button
                    id="btn-add-table-bottom"
                    onClick={() => {
                      setEditingCategory(null);
                      setIsCategoryModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Category {data.categories.length + 1} Table</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Spends & Expense Calculator</span>
            <span>•</span>
            <span className="text-slate-500 font-medium">Workbook: {DEFAULT_SPREADSHEET_TITLE}</span>
          </div>
          <div className="flex items-center gap-3">
            {sheetConfig?.url && (
              <>
                <a
                  href={sheetConfig.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span>•</span>
              </>
            )}
            <button
              onClick={() => setIsSheetConnectionModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              {sheetConfig?.url ? 'Sheet Connection & Sync Settings' : 'Connect Google Sheet'}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Export CSV / Copy
            </button>
          </div>
        </div>
      </footer>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpenseItem(null);
        }}
        categories={data.categories}
        initialCategoryId={activeCategoryIdForAdd}
        initialItem={editingExpenseItem}
        currency={data.currency}
        onSave={(catId, itemData, itemId) => {
          if (itemId) {
            handleUpdateExpense(catId, {
              id: itemId,
              sno: 1,
              ...itemData,
            });
          } else {
            handleAddExpense(catId, itemData);
          }
        }}
      />

      {/* Category Modal (Add / Edit Category Table) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
        existingCount={data.categories.length}
        currency={data.currency}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={data}
      />

      {/* Sheet Connection & Sync Modal */}
      <SheetConnectionModal
        isOpen={isSheetConnectionModalOpen}
        onClose={() => setIsSheetConnectionModalOpen(false)}
        config={sheetConfig}
        syncStatus={syncStatus}
        errorMessage={syncErrorMessage}
        onUpdateUrl={handleUpdateSheetUrl}
        onRefresh={() => handleRefreshFromSheet()}
        onClearLocalStorage={handleClearLocalStorage}
      />

      {/* Delete Category Confirmation Dialog (Mandatory Workspace Integration Rule) */}
      <ConfirmModal
        isOpen={!!deleteCategoryTarget}
        title="Delete Category Table from Google Sheets?"
        message={`Are you sure you want to delete the category table "${deleteCategoryTarget?.name}"? This action will permanently delete the "${deleteCategoryTarget?.name}" sheet tab and all logged expenses from your Google Sheets workbook.`}
        confirmLabel="Yes, Delete Table & Sheet Tab"
        confirmVariant="danger"
        affectedItemDescription={
          deleteCategoryTarget
            ? `Category: ${deleteCategoryTarget.name} (${(data.expenses[deleteCategoryTarget.id] || []).length} expense items will be deleted)`
            : undefined
        }
        isProcessing={isDeleting}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteCategoryTarget(null)}
      />

      {/* Delete Expense Row Confirmation Dialog (Mandatory Workspace Integration Rule) */}
      <ConfirmModal
        isOpen={!!deleteExpenseTarget}
        title="Delete Expense Row from Google Sheets?"
        message={`Are you sure you want to delete "${deleteExpenseTarget?.item?.name}" from your Google Sheet? This row will be permanently removed.`}
        confirmLabel="Delete Expense"
        confirmVariant="danger"
        affectedItemDescription={
          deleteExpenseTarget
            ? `${deleteExpenseTarget.item.name} • ${formatCurrency(deleteExpenseTarget.item.spentAmt, data.currency)} (${deleteExpenseTarget.item.date})`
            : undefined
        }
        isProcessing={isDeleting}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setDeleteExpenseTarget(null)}
      />
    </div>
  );
}
