import { ExpenseDataState, Category, ExpenseItem } from '../types';

const LOCAL_STORAGE_KEY = 'spends_expense_fun_v2';
const LEGACY_STORAGE_KEYS = ['wedding_expense_tracker_state_v1', 'wedding_expense_tracker_state'];

export function loadLocalExpenseState(): ExpenseDataState {
  try {
    // Purge legacy storage keys to eliminate any unwanted sample/dummy categories
    LEGACY_STORAGE_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch (_) {}
    });

    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.categories)) {
        // Filter out any dummy sample categories containing "Mandapam"
        const filteredCategories = parsed.categories.filter((c: Category) => 
          c.name.toLowerCase() !== 'mandapam'
        );
        return {
          ...parsed,
          categories: filteredCategories,
          currency: '₹',
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse local storage:', e);
  }
  return createEmptyExpenseState('₹');
}

export function saveLocalExpenseState(state: ExpenseDataState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save to local storage:', e);
  }
}

export function clearLocalExpenseState(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch (_) {}
    });
  } catch (e) {
    console.warn('Failed to clear local storage:', e);
  }
}

/**
 * Creates an empty initial state with zero hardcoded values.
 */
export function createEmptyExpenseState(currency: string = '₹'): ExpenseDataState {
  return {
    categories: [],
    expenses: {},
    currency,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generates a clean empty category template without hardcoded values.
 */
export function createBlankCategory(categoryNumber: number, name: string = `Category ${categoryNumber}`): Category {
  const defaultColors = ['#0d9488', '#e11d48', '#8b5cf6', '#ea580c', '#2563eb', '#16a34a', '#db2777'];
  const color = defaultColors[(categoryNumber - 1) % defaultColors.length];

  return {
    id: `cat_${Date.now()}_${categoryNumber}`,
    categoryNumber,
    name,
    color,
    budget: 0,
    description: '',
  };
}

/**
 * Currency formatter with Indian and International number support
 */
export function formatCurrency(amount: number, currency: string = '₹'): string {
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount || 0);

  return `${currency} ${formattedNumber}`;
}

/**
 * Generates a formatted CSV string from the expense state.
 */
export function generateCSV(state: ExpenseDataState): string {
  const lines: string[] = [];
  lines.push(`SPENDS & EXPENSE CALCULATOR - SPREADSHEET EXPORT`);
  lines.push(`Export Date: ${new Date().toLocaleDateString()}`);
  lines.push(`Currency: ${state.currency}`);
  lines.push(``);

  let grandTotal = 0;
  let totalCount = 0;

  state.categories.forEach((cat) => {
    lines.push(`================================================================`);
    lines.push(`CATEGORY ${cat.categoryNumber}: ${cat.name.toUpperCase()}`);
    if (cat.budget) lines.push(`Category Budget: ${state.currency} ${cat.budget}`);
    lines.push(`================================================================`);
    lines.push(`S.No,Expense Name,Date,Spent Amount (${state.currency}),Payment Method,Notes`);

    const items = state.expenses[cat.id] || [];
    let catTotal = 0;

    items.forEach((item, index) => {
      catTotal += item.spentAmt;
      const cleanName = `"${(item.name || '').replace(/"/g, '""')}"`;
      const cleanNotes = `"${(item.notes || '').replace(/"/g, '""')}"`;
      const cleanMethod = `"${(item.paymentMethod || '').replace(/"/g, '""')}"`;
      lines.push(`${index + 1},${cleanName},${item.date},${item.spentAmt},${cleanMethod},${cleanNotes}`);
    });

    lines.push(`,Subtotal for ${cat.name},,${catTotal},,`);
    lines.push(``);
    grandTotal += catTotal;
    totalCount += items.length;
  });

  lines.push(`================================================================`);
  lines.push(`GRAND TOTAL SUMMARY`);
  lines.push(`Total Categories: ${state.categories.length}`);
  lines.push(`Total Items Count: ${totalCount}`);
  lines.push(`GRAND TOTAL SPENT: ${state.currency} ${grandTotal}`);
  lines.push(`================================================================`);

  return lines.join('\n');
}

/**
 * Generates TSV text formatted for immediate copy-paste into Google Sheets (Single tab "Fun" format).
 * Header: S.No | Category | Expense Name / Payee | Date | Spent Amount | Payment Method | Notes
 */
export function generateGoogleSheetsTSV(state: ExpenseDataState): string {
  const lines: string[] = [];

  // Common Header for tab "Fun"
  lines.push(`S.No\tCategory\tExpense Name / Payee\tDate\tSpent Amount (${state.currency})\tPayment Method\tNotes`);

  let globalSNo = 1;
  let grandTotal = 0;

  state.categories.forEach((cat) => {
    const items = state.expenses[cat.id] || [];

    if (items.length === 0) {
      lines.push(`${globalSNo++}\t${cat.name}\t(Category created - no spends yet)\t${new Date().toISOString().split('T')[0]}\t0\t-\t${cat.description || ''}`);
    } else {
      items.forEach((item) => {
        grandTotal += Number(item.spentAmt) || 0;
        lines.push(
          `${globalSNo++}\t${cat.name}\t${item.name}\t${item.date}\t${item.spentAmt}\t${item.paymentMethod || 'UPI'}\t${item.notes || ''}`
        );
      });
    }
  });

  lines.push(`\tGrand Total\t${state.categories.length} Categories\t\t${grandTotal}\t\t`);
  return lines.join('\n');
}
