import { useState } from 'react';
import { ExpenseDataState } from '../types';
import { generateCSV, generateGoogleSheetsTSV, formatCurrency } from '../utils/storage';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  FileSpreadsheet, 
  Table, 
  CheckCircle2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExpenseDataState;
}

export function ExportModal({ isOpen, onClose, data }: ExportModalProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const csvContent = generateCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `spends_expense_calculator_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyGoogleSheets = () => {
    const tsvContent = generateGoogleSheetsTSV(data);
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopiedType('sheets');
      setTimeout(() => setCopiedType(null), 3000);
    });
  };

  const handleCopyCSV = () => {
    const csvContent = generateCSV(data);
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopiedType('csv');
      setTimeout(() => setCopiedType(null), 3000);
    });
  };

  let grandTotal = 0;
  let totalRows = 0;
  data.categories.forEach((cat) => {
    (data.expenses[cat.id] || []).forEach((item) => {
      grandTotal += Number(item.spentAmt) || 0;
      totalRows += 1;
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Export Sheet & Storage
              </h3>
              <p className="text-xs text-slate-500">
                {data.categories.length} categories • {totalRows} expense rows • {formatCurrency(grandTotal, data.currency)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Option 1: Copy for Google Sheets */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <span>Google Sheets Direct Paste</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-200 text-emerald-800 rounded-full">
                    Recommended
                  </span>
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Copies all category tables into tab-separated values. Open Google Sheets and simply press <strong>Ctrl + V</strong> (or <strong>Cmd + V</strong>) into cell A1.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopyGoogleSheets}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                {copiedType === 'sheets' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Copied! Ready to Paste in Google Sheets</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Sheet Data for Google Sheets</span>
                  </>
                )}
              </button>

              <a
                href="https://sheets.new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors"
                title="Open a blank sheet in Google Sheets in a new tab"
              >
                <span>Open sheets.new</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Option 2: Download CSV File */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Download .CSV Spreadsheet
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Formatted CSV containing all separate category tables, subtotals, and grand total summary.
              </p>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Local Storage Confirmation status */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Automatic Sheet Storage: </span>
              Every edit, row, and category is saved in real-time to your browser's persistent database.
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
