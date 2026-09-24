export interface ExpenseItem {
  id: string;
  sno: number;
  name: string;
  date: string;
  spentAmt: number;
  notes?: string;
  paymentMethod?: string;
  handwrittenImage?: string; // Data URL / image of what was written by hand
}

export interface Category {
  id: string;
  categoryNumber: number;
  name: string;
  color: string;
  budget?: number;
  description?: string;
}

export interface ExpenseDataState {
  categories: Category[];
  expenses: Record<string, ExpenseItem[]>; // categoryId -> ExpenseItem[]
  currency: string;
  lastUpdated: string;
}

export type ViewMode = 'tables' | 'sheet';
