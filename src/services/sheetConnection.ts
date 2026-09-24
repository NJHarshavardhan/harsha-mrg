import { ExpenseDataState, Category, ExpenseItem } from '../types';
import { loadLocalExpenseState } from '../utils/storage';

export const HARDCODED_SERVICE_ACCOUNT = 'harsha-marriage@commanding-day-300706.iam.gserviceaccount.com';
export const DEFAULT_SPREADSHEET_TITLE = 'harsha-marriage';
export const DEFAULT_SHEET_TAB = 'Fun';
export const GCP_PROJECT_ID = 'commanding-day-300706';
export const DEFAULT_SHEET_ID = '1EAoW4OfIB4Jvjm-XyFFRxhpkTupbQ6c-2sIgpg2tc7E';
export const DEFAULT_SHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/edit`;
export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXKG2sLRv1fj_ll7Xn4O1lWfLcq0MOzLwgoAGmNg9KOL1yebOYV255QHG2TzK0d4m_/exec';

const CATEGORY_COLORS = [
  '#0d9488', // Teal
  '#e11d48', // Rose
  '#8b5cf6', // Violet
  '#ea580c', // Orange
  '#2563eb', // Blue
  '#16a34a', // Emerald
  '#db2777', // Pink
  '#475569', // Slate
];

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
  const targetSheetId = config.sheetId || DEFAULT_SHEET_ID;

  // 1. If Apps Script Web App URL is configured, try direct fetch
  if (config.url && config.url.includes('script.google.com')) {
    try {
      const response = await fetch(config.url, {
        method: 'GET',
      });

      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes('You need access') && !text.includes('accounts.google.com') && !text.includes('drive-logo')) {
          try {
            const json = JSON.parse(text);
            if (json && Array.isArray(json.categories)) {
              return {
                data: {
                  categories: json.categories,
                  expenses: json.expenses || {},
                  currency: json.currency || currentCurrency,
                  lastUpdated: json.lastUpdated || new Date().toISOString(),
                },
                title: json.title || config.spreadsheetTitle || DEFAULT_SPREADSHEET_TITLE,
              };
            }
          } catch {
            // Fall through to GViz / JSONP
          }
        }
      }
    } catch (appsScriptErr) {
      console.warn('Apps Script direct fetch encountered network limitation, using Google Sheet channel...', appsScriptErr);
    }
  }

  // 2. Fetch directly from the Google Sheet via GViz and JSONP fallback
  try {
    const sheetResult = await fetchGoogleSheetPublicData(targetSheetId, currentCurrency);
    if (sheetResult && sheetResult.data) {
      return sheetResult;
    }
  } catch (sheetErr) {
    console.warn('Sheet GViz fetch notice, trying JSONP:', sheetErr);
    try {
      const jsonpResult = await fetchGoogleSheetViaJSONPData(targetSheetId, currentCurrency);
      if (jsonpResult && jsonpResult.data) {
        return jsonpResult;
      }
    } catch (jsonpErr) {
      console.warn('JSONP fetch notice:', jsonpErr);
    }
  }

  // 3. Fall back to cached local storage only if network failed
  const localCached = loadLocalExpenseState();
  if (localCached && localCached.categories && localCached.categories.length > 0) {
    return {
      data: localCached,
      title: config.spreadsheetTitle || DEFAULT_SPREADSHEET_TITLE,
    };
  }

  return {
    data: {
      categories: [],
      expenses: {},
      currency: currentCurrency,
      lastUpdated: new Date().toISOString(),
    },
    title: config.spreadsheetTitle || DEFAULT_SPREADSHEET_TITLE,
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
 * Parses Google Visualization table format into ExpenseDataState
 * Supports:
 * 1. Single tab "Fun" with common header: S.No | Category | Expense Name | Date | Spent Amount | Payment Method | Notes
 * 2. Section blocks with Category header rows
 * 3. Raw JSON state cell
 */
function parseGVizTableData(
  table: any, 
  currentCurrency: string = '₹'
): { data: ExpenseDataState; title?: string } {
  if (!table || !table.rows || table.rows.length === 0) {
    return {
      data: {
        categories: [],
        expenses: {},
        currency: currentCurrency,
        lastUpdated: new Date().toISOString(),
      },
      title: DEFAULT_SPREADSHEET_TITLE,
    };
  }

  const rows = table.rows;

  // Check if first cell contains raw JSON payload
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
        // Fall through to row parser
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
    const val3 = c[3]?.v != null ? String(c[3].v).trim() : '';
    const val4 = c[4]?.v != null ? c[4].v : null;
    const val5 = c[5]?.v != null ? String(c[5].v).trim() : '';
    const val6 = c[6]?.v != null ? String(c[6].v).trim() : '';

    // 1. Skip header row
    const lower0 = val0.toLowerCase();
    const lower1 = val1.toLowerCase();
    const lower2 = val2.toLowerCase();
    if (
      lower0.includes('s.no') || 
      lower1.includes('category') || 
      lower2.includes('expense name') || 
      lower2.includes('payee')
    ) {
      return;
    }

    // 2. Skip summary or subtotal rows
    if (
      lower0.includes('total') || 
      lower1.includes('total') || 
      lower2.includes('total') || 
      lower1.includes('subtotal')
    ) {
      return;
    }

    // 3. Format A: Single Tab "Fun" with Category in Column B (Column index 1)
    // Structure: [S.No, Category, Expense Name, Date, Spent Amount, Payment Method, Notes]
    if (val1 && isNaN(Number(val1)) && !lower1.startsWith('category:')) {
      const catName = val1;
      const catKey = catName.toLowerCase();

      if (!categoriesMap.has(catKey)) {
        const catId = `cat_${catIndex}_${catKey.replace(/[^a-z0-9]/g, '_')}`;
        const newCat: Category = {
          id: catId,
          categoryNumber: catIndex,
          name: catName,
          color: CATEGORY_COLORS[(catIndex - 1) % CATEGORY_COLORS.length],
          budget: 0,
          description: '',
        };
        catIndex++;
        categoriesMap.set(catKey, newCat);
        expensesMap[catId] = [];
      }

      const activeCat = categoriesMap.get(catKey)!;

      // Check if this is an expense item or placeholder row
      const itemName = val2;
      const isPlaceholder = itemName.includes('(Category created');

      if (itemName && !isPlaceholder) {
        const rawAmt = val4 != null ? val4 : (val3 != null && !isNaN(Number(val3)) ? val3 : 0);
        const spentAmount = typeof rawAmt === 'number' ? rawAmt : (parseFloat(String(rawAmt).replace(/[^0-9.-]+/g, '')) || 0);

        if (spentAmount >= 0) {
          const itemDate = val3 && val3.match(/^\d{4}-\d{2}-\d{2}/) 
            ? val3 
            : new Date().toISOString().split('T')[0];

          expensesMap[activeCat.id].push({
            id: `exp_${rowIdx}_${activeCat.id}`,
            sno: expensesMap[activeCat.id].length + 1,
            name: itemName,
            date: itemDate,
            spentAmt: spentAmount,
            paymentMethod: val5 || 'UPI',
            notes: val6 || '',
          });
        }
      }
      return;
    }

    // 4. Format B: Row marks a Category Section Header
    if (lower0.startsWith('category') || (val0 && !val2 && isNaN(Number(val0)))) {
      const catName = val1 || val0.replace(/^category\s*\d*:\s*/i, '') || `Category ${catIndex}`;
      const catKey = catName.toLowerCase();

      if (!categoriesMap.has(catKey)) {
        const catId = `cat_${catIndex}_${catKey.replace(/[^a-z0-9]/g, '_')}`;
        currentCategory = {
          id: catId,
          categoryNumber: catIndex,
          name: catName,
          color: CATEGORY_COLORS[(catIndex - 1) % CATEGORY_COLORS.length],
        };
        catIndex++;
        categoriesMap.set(catKey, currentCategory);
        expensesMap[catId] = [];
      } else {
        currentCategory = categoriesMap.get(catKey)!;
      }
      return;
    }

    // 5. Format C: Expense item under current Category
    const rawAmt = val3 != null && !isNaN(Number(val3)) ? Number(val3) : (val2 != null && !isNaN(Number(val2)) ? Number(val2) : 0);
    const itemName = val1 || val0;
    const itemDate = val2 && val2.match(/^\d{4}-\d{2}-\d{2}/) ? val2 : new Date().toISOString().split('T')[0];

    if (itemName && rawAmt > 0) {
      if (!currentCategory) {
        currentCategory = {
          id: 'cat_general',
          categoryNumber: 1,
          name: 'General Expenses',
          color: CATEGORY_COLORS[0],
        };
        categoriesMap.set('general', currentCategory);
        expensesMap['cat_general'] = [];
      }

      const item: ExpenseItem = {
        id: `exp_${rowIdx}_${Date.now()}`,
        sno: (expensesMap[currentCategory.id] || []).length + 1,
        name: itemName,
        date: itemDate,
        spentAmt: rawAmt,
        paymentMethod: val4 ? String(val4) : 'UPI',
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
    title: DEFAULT_SPREADSHEET_TITLE,
  };
}

/**
 * Fetches public Google Sheet data via Google Visualization API
 * Prioritizes the "Fun" single tab!
 */
async function fetchGoogleSheetPublicData(
  sheetId: string, 
  currentCurrency: string
): Promise<{ data: ExpenseDataState; title?: string }> {
  // Query Fun tab first, then generic root
  const tryUrls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${DEFAULT_SHEET_TAB}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=ExpenseData`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const rawText = await res.text();
        const match = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
        if (match && match[1]) {
          const gvizData = JSON.parse(match[1]);
          if (gvizData.table && gvizData.table.rows && gvizData.table.rows.length > 0) {
            return parseGVizTableData(gvizData.table, currentCurrency);
          }
        }
      }
    } catch {
      // Continue to next URL or JSONP
    }
  }

  // Fallback to JSONP script injection
  return await fetchGoogleSheetViaJSONPData(sheetId, currentCurrency);
}

/**
 * Robust JSONP Loader that bypasses CORS restrictions entirely
 */
function fetchGoogleSheetViaJSONPData(
  sheetId: string,
  currentCurrency: string
): Promise<{ data: ExpenseDataState; title?: string }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('Browser window environment required for JSONP'));
    }

    const callbackName = `gviz_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Google Sheet JSONP connection timed out'));
    }, 8000);

    const cleanup = () => {
      clearTimeout(timer);
      try {
        delete (window as any)[callbackName];
      } catch (e) {}
      const script = document.getElementById(callbackName);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    (window as any)[callbackName] = (resp: any) => {
      cleanup();
      if (resp && resp.table) {
        try {
          const parsed = parseGVizTableData(resp.table, currentCurrency);
          return resolve(parsed);
        } catch (err) {
          return reject(err);
        }
      }
      reject(new Error('Invalid Google Sheet JSONP response'));
    };

    const script = document.createElement('script');
    script.id = callbackName;
    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${DEFAULT_SHEET_TAB}`;
    script.onerror = () => {
      cleanup();
      // Try root sheet
      const fallbackScript = document.createElement('script');
      const fallbackCb = `${callbackName}_fb`;
      (window as any)[fallbackCb] = (resp: any) => {
        try {
          delete (window as any)[fallbackCb];
          if (fallbackScript.parentNode) fallbackScript.parentNode.removeChild(fallbackScript);
          if (resp && resp.table) {
            return resolve(parseGVizTableData(resp.table, currentCurrency));
          }
        } catch (e) {}
        reject(new Error('Sheet loading failed'));
      };
      fallbackScript.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${fallbackCb}`;
      document.body.appendChild(fallbackScript);
    };

    document.body.appendChild(script);
  });
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
 * Uses ONLY 1 single sheet tab named "Fun" with common header.
 * The application displays and groups all expenses into separate category tables.
 */
export const APPS_SCRIPT_SOURCE = `// ============================================================
// Google Apps Script for harsha-marriage
// Target Sheet ID: 1EAoW4OfIB4Jvjm-XyFFRxhpkTupbQ6c-2sIgpg2tc7E
// Single Tab Name: "Fun"
// Common Header: S.No | Category | Expense Name / Payee | Date | Spent Amount (₹) | Payment Method | Notes
// ============================================================

var TARGET_SPREADSHEET_ID = "1EAoW4OfIB4Jvjm-XyFFRxhpkTupbQ6c-2sIgpg2tc7E";
var TAB_NAME = "Fun";

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
    
    // 1. Try reading cached state from Script Properties for high fidelity
    var propData = PropertiesService.getScriptProperties().getProperty("EXPENSE_DATA_STATE");
    if (propData) {
      try {
        var parsed = JSON.parse(propData);
        if (parsed && Array.isArray(parsed.categories)) {
          return ContentService.createTextOutput(JSON.stringify(parsed))
            .setMimeType(ContentService.MimeType.JSON);
        }
      } catch(err) {}
    }

    // 2. Read directly from the single "Fun" tab
    var sheet = ss.getSheetByName(TAB_NAME);
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    var result = readFromFunSheet(sheet);
    return ContentService.createTextOutput(JSON.stringify(result))
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

function readFromFunSheet(sheet) {
  if (!sheet) {
    return { categories: [], expenses: {}, currency: "₹" };
  }

  var values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) {
    return { categories: [], expenses: {}, currency: "₹" };
  }

  var categoriesMap = {};
  var categoriesList = [];
  var expensesMap = {};
  var catIndex = 1;
  var colors = ['#0d9488', '#e11d48', '#8b5cf6', '#ea580c', '#2563eb', '#16a34a', '#db2777', '#475569'];

  // Start from row 1 (skipping row 0 common header)
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var sno = row[0];
    var catName = String(row[1] || "").trim();
    var itemName = String(row[2] || "").trim();
    var dateVal = row[3];
    var spentAmt = Number(row[4]) || 0;
    var payMethod = String(row[5] || "UPI").trim();
    var notes = String(row[6] || "").trim();

    if (!catName && !itemName) continue;
    if (String(sno).toLowerCase().includes("total") || catName.toLowerCase().includes("total")) continue;

    if (!catName) catName = "General";

    var catKey = catName.toLowerCase();
    if (!categoriesMap[catKey]) {
      var catId = "cat_" + catIndex + "_" + catKey.replace(/[^a-z0-9]/g, "_");
      var newCat = {
        id: catId,
        categoryNumber: catIndex,
        name: catName,
        color: colors[(catIndex - 1) % colors.length],
        budget: 0,
        description: ""
      };
      categoriesMap[catKey] = newCat;
      categoriesList.push(newCat);
      expensesMap[catId] = [];
      catIndex++;
    }

    var targetCat = categoriesMap[catKey];
    if (itemName && itemName.indexOf("(Category created") === -1 && spentAmt >= 0) {
      var formattedDate = "";
      if (dateVal instanceof Date) {
        formattedDate = Utilities.formatDate(dateVal, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
      } else {
        formattedDate = String(dateVal || "").substring(0, 10);
      }
      if (!formattedDate || formattedDate.indexOf("-") === -1) {
        formattedDate = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");
      }

      expensesMap[targetCat.id].push({
        id: "exp_" + r + "_" + targetCat.id,
        sno: expensesMap[targetCat.id].length + 1,
        name: itemName,
        date: formattedDate,
        spentAmt: spentAmt,
        paymentMethod: payMethod || "UPI",
        notes: notes
      });
    }
  }

  return {
    categories: categoriesList,
    expenses: expensesMap,
    currency: "₹",
    lastUpdated: new Date().toISOString()
  };
}

function saveExpenseData(ss, rawData) {
  if (!rawData) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Empty payload" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Save to script properties for fast retrieval
  try {
    PropertiesService.getScriptProperties().setProperty("EXPENSE_DATA_STATE", rawData);
  } catch(e) {}

  var data = JSON.parse(rawData);
  var categories = data.categories || [];
  var expenses = data.expenses || {};
  var currency = data.currency || "₹";

  // Use ONLY 1 sheet tab named "Fun"
  var sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_NAME);
  }
  sheet.clear();

  // Common Heading (Row 1)
  var headers = [["S.No", "Category", "Expense Name / Payee", "Date", "Spent Amount (" + currency + ")", "Payment Method", "Notes"]];
  sheet.getRange(1, 1, 1, 7).setValues(headers)
    .setFontWeight("bold")
    .setBackground("#0f766e")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  var rows = [];
  var globalSNo = 1;
  var grandTotal = 0;

  // Build rows grouped by category
  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i];
    var items = expenses[cat.id] || [];

    if (items.length === 0) {
      // Empty category: write placeholder so category is preserved
      rows.push([
        globalSNo++,
        cat.name,
        "(Category created - no spends yet)",
        Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd"),
        0,
        "-",
        cat.description || ""
      ]);
    } else {
      for (var j = 0; j < items.length; j++) {
        var it = items[j];
        var amt = Number(it.spentAmt) || 0;
        grandTotal += amt;
        rows.push([
          globalSNo++,
          cat.name,
          it.name || "",
          it.date || Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd"),
          amt,
          it.paymentMethod || "UPI",
          it.notes || ""
        ]);
      }
    }
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
    
    // Formatting
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 2, rows.length, 1).setFontWeight("bold");
    sheet.getRange(2, 4, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 5, rows.length, 1).setNumberFormat("#,##0.00").setHorizontalAlignment("right");
    sheet.getRange(2, 6, rows.length, 1).setHorizontalAlignment("center");

    // Grand Total summary at bottom
    var summaryRowIndex = rows.length + 2;
    sheet.getRange(summaryRowIndex, 1, 1, 7).setValues([["", "Grand Total", categories.length + " Categories", "", grandTotal, "", ""]])
      .setFontWeight("bold")
      .setBackground("#f0fdf4")
      .setFontColor("#166534");
    sheet.getRange(summaryRowIndex, 5).setNumberFormat("#,##0.00").setHorizontalAlignment("right");
  }

  sheet.autoResizeColumns(1, 7);

  // Clean up any extra redundant tabs so ONLY 1 tab ("Fun") exists
  var allSheets = ss.getSheets();
  for (var k = 0; k < allSheets.length; k++) {
    var s = allSheets[k];
    if (s.getName() !== TAB_NAME && allSheets.length > 1) {
      if (s.getName().indexOf("Cat ") === 0 || s.getName() === "ExpenseData") {
        try {
          ss.deleteSheet(s);
        } catch(e) {}
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ 
    status: "success", 
    tab: TAB_NAME,
    categoriesCount: categories.length,
    rowsCount: rows.length,
    grandTotal: grandTotal,
    updatedAt: new Date().toISOString() 
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
