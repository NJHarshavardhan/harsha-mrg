import { ExpenseDataState, Category, ExpenseItem } from '../types';

const LOCAL_STORAGE_KEY = 'wedding_expense_tracker_state_v1';

export function loadLocalExpenseState(): ExpenseDataState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.categories)) {
        return parsed;
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
 * Generates TSV text formatted for immediate copy-paste into Google Sheets.
 */
export function generateGoogleSheetsTSV(state: ExpenseDataState): string {
  const lines: string[] = [];

  state.categories.forEach((cat) => {
    lines.push(`Category ${cat.categoryNumber}: ${cat.name}\t\t\t`);
    lines.push(`S.No\tExpense Name\tDate\tSpent Amount (${state.currency})`);

    const items = state.expenses[cat.id] || [];
    let catTotal = 0;

    items.forEach((item, index) => {
      catTotal += item.spentAmt;
      lines.push(`${index + 1}\t${item.name}\t${item.date}\t${item.spentAmt}`);
    });

    lines.push(`\tSubtotal (${cat.name})\t\t${catTotal}`);
    lines.push(``);
  });

  let grandTotal = 0;
  state.categories.forEach((c) => {
    (state.expenses[c.id] || []).forEach((i) => {
      grandTotal += i.spentAmt;
    });
  });

  lines.push(`GRAND TOTAL\t\t\t${grandTotal}`);
  return lines.join('\n');
}
