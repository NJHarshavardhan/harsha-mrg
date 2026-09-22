import { ExpenseDataState, Category, ExpenseItem } from '../types';

export const HARDCODED_SERVICE_ACCOUNT = 'harsha-marriage@commanding-day-300706.iam.gserviceaccount.com';
export const DEFAULT_SPREADSHEET_TITLE = 'harsha-marriage';
export const GCP_PROJECT_ID = 'commanding-day-300706';

export type SheetConnectionType = 'service-account' | 'apps-script' | 'google-sheet' | 'custom-api';

export interface SheetConnectionConfig {
  rawInput: string;
  url: string;
  type: SheetConnectionType;
  serviceAccountEmail: string;
  sheetId?: string;
  spreadsheetTitle?: string;
  lastSynced?: string;
}

const STORAGE_CONFIG_KEY = 'wedding_sheet_connection_config_v1';

export function loadSavedConnectionConfig(): SheetConnectionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        serviceAccountEmail: HARDCODED_SERVICE_ACCOUNT,
        spreadsheetTitle: parsed.spreadsheetTitle || DEFAULT_SPREADSHEET_TITLE,
      };
    }
  } catch (e) {
    console.warn('Failed to load sheet connection config:', e);
  }

  // Default hardcoded configuration
  return {
    rawInput: '',
    url: '',
    type: 'service-account',
    serviceAccountEmail: HARDCODED_SERVICE_ACCOUNT,
    spreadsheetTitle: DEFAULT_SPREADSHEET_TITLE,
    lastSynced: new Date().toISOString(),
  };
}

export function saveConnectionConfig(config: SheetConnectionConfig | null): void {
  try {
    if (config) {
      const toSave = {
        ...config,
        serviceAccountEmail: HARDCODED_SERVICE_ACCOUNT,
      };
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(toSave));
    } else {
      localStorage.removeItem(STORAGE_CONFIG_KEY);
    }
  } catch (e) {
    console.warn('Failed to save sheet connection config:', e);
  }
}

/**
 * Extracts URL and connection type from raw user input, supporting:
 * - Direct cURL command: curl -L "https://script.google.com/..."
 * - Google Sheet document link: https://docs.google.com/spreadsheets/d/...
 * - Google Apps Script Web App link: https://script.google.com/macros/s/.../exec
 * - Custom webhook / API URL
 */
export function parseCurlOrUrl(input: string): SheetConnectionConfig {
  const trimmed = input.trim();

  // 1. Extract URL if input is a curl command
  let extractedUrl = trimmed;
  const curlUrlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/);
  if (curlUrlMatch) {
    extractedUrl = curlUrlMatch[0];
  }

  // Clean trailing punctuation or quotes
  extractedUrl = extractedUrl.replace(/["')\];]+$/, '');

  // 2. Detect Google Spreadsheet document URL
  const sheetDocMatch = extractedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetDocMatch) {
    const sheetId = sheetDocMatch[1];
    return {
      rawInput: trimmed,
      url: extractedUrl,
      type: 'google-sheet',
      serviceAccountEmail: HARDCODED_SERVICE_ACCOUNT,
      sheetId,
      spreadsheetTitle: DEFAULT_SPREADSHEET_TITLE,
    };
  }

  // 3. Detect Google Apps Script Web App URL
  if (extractedUrl.includes('script.google.com/macros/s/')) {
    return {
      rawInput: trimmed,
      url: extractedUrl,
      type: 'apps-script',
      serviceAccountEmail: HARDCODED_SERVICE_ACCOUNT,
      spreadsheetTitle: `${DEFAULT_SPREADSHEET_TITLE} (Apps Script)`,
    };
  }

  // 4. Default to custom API / Webhook endpoint
  return {
    rawInput: trimmed,
    url: extractedUrl,
    type: 'custom-api',
    serviceAccountEmail: HARDCODED_SERVICE_ACCOUNT,
    spreadsheetTitle: DEFAULT_SPREADSHEET_TITLE,
  };
}

/**
 * Loads data from the connected URL / cURL endpoint without OAuth
 */
export async function fetchFromSheetConnection(
  config: SheetConnectionConfig,
  currentCurrency: string = '₹'
): Promise<{ data: ExpenseDataState; title?: string }> {
  if (!config.url) {
    throw new Error('No sheet URL provided.');
  }

  // A. Handling direct Google Sheet URL via Google Visualization Query
  if (config.type === 'google-sheet' && config.sheetId) {
    return await fetchGoogleSheetPublicData(config.sheetId, currentCurrency);
  }

  // B. Handling Google Apps Script Web App or custom cURL Webhook
  const response = await fetch(config.url, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Endpoint returned HTTP ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Endpoint response is not valid JSON. Ensure your Apps Script or endpoint outputs JSON.');
  }

  // Normalize returned JSON data
  if (json && Array.isArray(json.categories)) {
    return {
      data: {
        categories: json.categories,
        expenses: json.expenses || {},
        currency: json.currency || currentCurrency,
        lastUpdated: json.lastUpdated || new Date().toISOString(),
      },
      title: json.title || config.spreadsheetTitle || 'harsha-marriage',
    };
  }

  // If endpoint returns flat items array, auto-categorize
  if (Array.isArray(json)) {
    return parseFlatExpenseItems(json, currentCurrency);
  }

  // If empty object
  return {
    data: {
      categories: [],
      expenses: {},
      currency: currentCurrency,
      lastUpdated: new Date().toISOString(),
    },
    title: config.spreadsheetTitle || 'harsha-marriage',
  };
}

/**
 * Saves current expense state to the URL / cURL endpoint without OAuth
 */
export async function pushToSheetConnection(
  config: SheetConnectionConfig,
  state: ExpenseDataState
): Promise<{ success: boolean; message?: string }> {
  if (!config.url) {
    return { success: false, message: 'No URL configured' };
  }

  if (config.type === 'google-sheet') {
    // Direct Google Sheet URLs without Apps Script are read-only from client browser without credentials
    return {
      success: true,
      message: 'Direct Sheet is read-only. For bidirectional auto-saving, deploy the Google Apps Script Web App provided in the cURL guide.',
    };
  }

  // Send POST payload with hardcoded service account identification
  const response = await fetch(config.url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      'X-Service-Account': HARDCODED_SERVICE_ACCOUNT,
    },
    body: JSON.stringify({
      ...state,
      serviceAccount: HARDCODED_SERVICE_ACCOUNT,
      spreadsheetTitle: DEFAULT_SPREADSHEET_TITLE,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sync failed with HTTP ${response.status}: ${response.statusText}`);
  }

  return { success: true };
}

/**
 * Fetches public Google Sheet data via Google Visualization API
 */
async function fetchGoogleSheetPublicData(
  sheetId: string, 
  currentCurrency: string
): Promise<{ data: ExpenseDataState; title?: string }> {
  // Query sheet
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
  const res = await fetch(gvizUrl);
  if (!res.ok) {
    throw new Error(
      `Unable to access Google Sheet (${res.status}). Make sure the Google Sheet sharing is set to "Anyone with the link can view".`
    );
  }

  const rawText = await res.text();
  // Strip Google's JSONP wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse(...);
  const match = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
  if (!match || !match[1]) {
    throw new Error('Unable to parse Google Sheet table data format.');
  }

  const gvizData = JSON.parse(match[1]);
  if (gvizData.status === 'error') {
    throw new Error(`Google Sheet error: ${gvizData.errors?.[0]?.message || 'Access denied'}`);
  }

  const table = gvizData.table;
  if (!table || !table.rows || table.rows.length === 0) {
    return {
      data: {
        categories: [],
        expenses: {},
        currency: currentCurrency,
        lastUpdated: new Date().toISOString(),
      },
      title: 'harsha-marriage',
    };
  }

  // Parse columns and rows
  const headers = (table.cols || []).map((c: any) => (c?.label || '').toLowerCase().trim());
  const rows = table.rows;

  const categoriesMap = new Map<string, Category>();
  const expensesMap: Record<string, ExpenseItem[]> = {};

  let currentCategory: Category | null = null;
  let catIndex = 1;

  rows.forEach((r: any, rowIdx: number) => {
    const c = r.c || [];
    const val0 = c[0]?.v != null ? String(c[0].v).trim() : '';
    const val1 = c[1]?.v != null ? String(c[1].v).trim() : '';
    const val2 = c[2]?.v != null ? String(c[2].v).trim() : '';
    const val3 = c[3]?.v != null ? Number(c[3].v) : 0;
    const val4 = c[4]?.v != null ? String(c[4].v).trim() : '';
    const val5 = c[5]?.v != null ? String(c[5].v).trim() : '';

    // Check if row marks a Category header
    if (val0.toLowerCase().startsWith('category') || (val0 && !val2 && isNaN(Number(val0)))) {
      const catName = val1 || val0.replace(/^category\s*\d*:\s*/i, '') || `Category ${catIndex}`;
      const catId = `cat_${catIndex}_${catName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      currentCategory = {
        id: catId,
        categoryNumber: catIndex++,
        name: catName,
        color: ['#0d9488', '#e11d48', '#8b5cf6', '#ea580c', '#2563eb', '#16a34a'][catIndex % 6],
      };
      categoriesMap.set(catId, currentCategory);
      if (!expensesMap[catId]) expensesMap[catId] = [];
      return;
    }

    // Skip summary or subtotal rows
    if (val0.toLowerCase().includes('total') || val1.toLowerCase().includes('total') || val1.toLowerCase().includes('subtotal')) {
      return;
    }

    // Check if this row is an expense item
    const spentAmount = !isNaN(Number(val3)) ? Number(val3) : (!isNaN(Number(val2)) ? Number(val2) : 0);
    const itemName = val1 || val0;
    const itemDate = val2 && val2.match(/^\d{4}-\d{2}-\d{2}/) ? val2 : new Date().toISOString().split('T')[0];

    if (itemName && spentAmount > 0) {
      if (!currentCategory) {
        currentCategory = {
          id: 'cat_general',
          categoryNumber: 1,
          name: 'General Expenses',
          color: '#0d9488',
        };
        categoriesMap.set('cat_general', currentCategory);
        expensesMap['cat_general'] = [];
      }

      const item: ExpenseItem = {
        id: `exp_${rowIdx}_${Date.now()}`,
        sno: (expensesMap[currentCategory.id] || []).length + 1,
        name: itemName,
        date: itemDate,
        spentAmt: spentAmount,
        paymentMethod: val4 || 'UPI / Cash',
        notes: val5 || '',
      };

      expensesMap[currentCategory.id].push(item);
    }
  });

  return {
    data: {
      categories: Array.from(categoriesMap.values()),
      expenses: expensesMap,
      currency: currentCurrency,
      lastUpdated: new Date().toISOString(),
    },
    title: 'harsha-marriage',
  };
}

function parseFlatExpenseItems(
  items: any[], 
  currentCurrency: string
): { data: ExpenseDataState; title?: string } {
  const cat: Category = {
    id: 'cat_1_imported',
    categoryNumber: 1,
    name: 'Imported Expenses',
    color: '#0d9488',
  };

  const parsedItems: ExpenseItem[] = items.map((it, idx) => ({
    id: it.id || `exp_${idx}`,
    sno: idx + 1,
    name: it.name || it.description || it.title || `Expense ${idx + 1}`,
    date: it.date || new Date().toISOString().split('T')[0],
    spentAmt: Number(it.spentAmt || it.amount || it.spent || 0),
    paymentMethod: it.paymentMethod || it.method || 'Online',
    notes: it.notes || '',
  }));

  return {
    data: {
      categories: [cat],
      expenses: { [cat.id]: parsedItems },
      currency: currentCurrency,
      lastUpdated: new Date().toISOString(),
    },
    title: 'harsha-marriage',
  };
}

/**
 * Generates test cURL commands for terminal testing
 */
export function generateTestCurlCommand(url: string, method: 'GET' | 'POST'): string {
  if (method === 'GET') {
    return `curl -L "${url}"`;
  }
  return `curl -L -X POST "${url}" \\
  -H "Content-Type: text/plain" \\
  -d '{"currency":"₹","categories":[],"expenses":{}}'`;
}

/**
 * 1-click Google Apps Script code to paste in Extensions > Apps Script of "harsha-marriage" sheet
 */
export const APPS_SCRIPT_SOURCE = `// ============================================================
// Google Apps Script for harsha-marriage (Zero OAuth Required)
// Paste in Extensions > Apps Script in your Google Sheet, then:
// Click Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone
// ============================================================

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("ExpenseData") || ss.getSheets()[0];
  var val = sheet.getRange("A1").getValue();
  
  var data = { categories: [], expenses: {}, currency: "₹" };
  if (val && typeof val === "string" && val.indexOf("{") !== -1) {
    try {
      data = JSON.parse(val);
    } catch(err) {}
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("ExpenseData");
  if (!sheet) {
    sheet = ss.insertSheet("ExpenseData");
  }
  
  var rawData = e.postData.contents;
  sheet.getRange("A1").setValue(rawData);
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", updated: new Date() }))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
