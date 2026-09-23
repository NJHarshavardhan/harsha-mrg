import { ExpenseDataState, Category, ExpenseItem } from '../types';

export const HARDCODED_SERVICE_ACCOUNT = 'harsha-marriage@commanding-day-300706.iam.gserviceaccount.com';
export const DEFAULT_SPREADSHEET_TITLE = 'harsha-marriage';
export const GCP_PROJECT_ID = 'commanding-day-300706';
export const DEFAULT_SHEET_ID = '1EAoW4OfIB4Jvjm-XyFFRxhpkTupbQ6c-2sIgpg2tc7E';
export const DEFAULT_SHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/edit`;
export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXKG2sLRv1fj_ll7Xn4O1lWfLcq0MOzLwgoAGmNg9KOL1yebOYV255QHG2TzK0d4m_/exec';

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
      if (parsed && (parsed.url || parsed.sheetId)) {
        return {
          ...parsed,
          sheetId: parsed.sheetId || DEFAULT_SHEET_ID,
          url: parsed.url || DEFAULT_APPS_SCRIPT_URL,
          type: parsed.url?.includes('script.google.com') ? 'apps-script' : (parsed.type || 'apps-script'),
          serviceAccountEmail: HARDCODED_SERVICE_ACCOUNT,
          spreadsheetTitle: parsed.spreadsheetTitle || DEFAULT_SPREADSHEET_TITLE,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load sheet connection config:', e);
  }

  // Default configured with the user-provided Google Apps Script Web App:
  return {
    rawInput: DEFAULT_APPS_SCRIPT_URL,
    url: DEFAULT_APPS_SCRIPT_URL,
    type: 'apps-script',
    sheetId: DEFAULT_SHEET_ID,
    serviceAccountEmail: HARDCODED_SERVICE_ACCOUNT,
    spreadsheetTitle: `${DEFAULT_SPREADSHEET_TITLE} (Apps Script)`,
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
  if (text.includes('You need access') || text.includes('accounts.google.com') || text.includes('drive-logo')) {
    throw new Error('Google Apps Script permission required: In Apps Script, click "Deploy" > "Manage deployments", edit the active deployment, change "Who has access" to "Anyone", and click Save.');
  }

  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Endpoint response is not valid JSON. Ensure your Apps Script deployment is configured with "Who has access: Anyone".');
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
 * Saves current expense state to Google Apps Script / Sheet connection
 */
export async function pushToSheetConnection(
  config: SheetConnectionConfig,
  state: ExpenseDataState
): Promise<{ success: boolean; message?: string }> {
  if (!config.url) {
    return { success: false, message: 'No URL configured' };
  }

  if (config.type === 'google-sheet') {
    return {
      success: true,
      message: 'Direct Sheet link is read-only. Use the Apps Script Web App for auto-saving.',
    };
  }

  const payload = JSON.stringify(state);

  // Strategy 1: Plain text POST with mode 'no-cors' (avoids preflight issues with Google Apps Script)
  try {
    await fetch(config.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
    });
    return { success: true, message: 'Successfully saved to Google Sheet' };
  } catch (err: any) {
    console.warn('POST save failed, attempting GET sync channel...', err);
  }

  // Strategy 2: GET fallback for small/medium payloads
  try {
    const encoded = encodeURIComponent(payload);
    if (encoded.length < 2000) {
      await fetch(`${config.url}?action=save&data=${encoded}`, {
        mode: 'no-cors',
      });
      return { success: true, message: 'Saved to Google Sheet via GET channel' };
    }
  } catch (err2: any) {
    console.error('All save channels failed:', err2);
    throw new Error('Unable to save to Google Sheet. Check Apps Script permissions.');
  }

  return { success: true, message: 'Saved to Google Sheet' };
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

  // Check if first cell contains raw JSON payload (from Apps Script or direct sync)
  if (rows.length > 0 && rows[0]?.c?.[0]?.v != null) {
    const rawFirstCell = String(rows[0].c[0].v).trim();
    if (rawFirstCell.startsWith('{') && rawFirstCell.includes('categories')) {
      try {
        const parsed = JSON.parse(rawFirstCell);
        if (parsed && Array.isArray(parsed.categories)) {
          return {
            data: {
              categories: parsed.categories,
              expenses: parsed.expenses || {},
              currency: parsed.currency || currentCurrency,
              lastUpdated: parsed.lastUpdated || new Date().toISOString(),
            },
            title: DEFAULT_SPREADSHEET_TITLE,
          };
        }
      } catch (err) {
        // Continue to table row parser
      }
    }
  }

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
// Google Apps Script for harsha-marriage (Store & Fetch)
// Target Sheet ID: 1EAoW4OfIB4Jvjm-XyFFRxhpkTupbQ6c-2sIgpg2tc7E
// ============================================================

var TARGET_SPREADSHEET_ID = "1EAoW4OfIB4Jvjm-XyFFRxhpkTupbQ6c-2sIgpg2tc7E";

function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch(e) {}
  try {
    return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  } catch(err) {
    throw new Error("Unable to open spreadsheet. Please authorize spreadsheet access in Apps Script.");
  }
}

function doGet(e) {
  try {
    var ss = getSpreadsheet();
    
    // Check if saving via GET parameter (?action=save&data=...)
    if (e && e.parameter && (e.parameter.data || e.parameter.action === 'save')) {
      var raw = e.parameter.data;
      if (raw) {
        return saveExpenseData(ss, raw);
      }
    }
    
    var sheet = ss.getSheetByName("ExpenseData");
    var data = { categories: [], expenses: {}, currency: "₹" };
    if (sheet) {
      var val = sheet.getRange("A1").getValue();
      if (val && typeof val === "string" && val.indexOf("{") !== -1) {
        try {
          data = JSON.parse(val);
        } catch(err) {}
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: err.toString(), 
      categories: [], 
      expenses: {}, 
      currency: "₹" 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = getSpreadsheet();
    var rawData = e && e.postData ? e.postData.contents : "";
    return saveExpenseData(ss, rawData);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveExpenseData(ss, rawData) {
  if (!rawData) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Empty payload" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = ss.getSheetByName("ExpenseData") || ss.insertSheet("ExpenseData");
  sheet.getRange("A1").setValue(rawData);
  
  var data = JSON.parse(rawData);
  var categories = data.categories || [];
  var expenses = data.expenses || {};
  var currency = data.currency || "₹";

  // Auto-generate a clean, styled spreadsheet tab for each Category
  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i];
    var tabName = "Cat " + cat.categoryNumber + " - " + cat.name.substring(0, 20);
    var catSheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
    catSheet.clear();
    
    // Header Row with theme colors
    var headers = [["S.No", "Expense Name", "Date", "Spent Amount (" + currency + ")", "Payment Method", "Notes"]];
    catSheet.getRange(1, 1, 1, 6).setValues(headers)
      .setFontWeight("bold")
      .setBackground("#0f766e")
      .setFontColor("#ffffff");
    
    var items = expenses[cat.id] || [];
    var rows = [];
    var subtotal = 0;
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      subtotal += Number(it.spentAmt) || 0;
      rows.push([
        j + 1,
        it.name || "",
        it.date || "",
        Number(it.spentAmt) || 0,
        it.paymentMethod || "",
        it.notes || ""
      ]);
    }
    
    if (rows.length > 0) {
      catSheet.getRange(2, 1, rows.length, 6).setValues(rows);
      var subtotalRow = rows.length + 2;
      catSheet.getRange(subtotalRow, 1, 1, 6).setValues([["", "Subtotal (" + cat.name + ")", "", subtotal, "", ""]])
        .setFontWeight("bold")
        .setBackground("#f0fdf4");
    }
    catSheet.autoResizeColumns(1, 6);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "success", 
    categoriesCount: categories.length,
    updatedAt: new Date().toISOString() 
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
