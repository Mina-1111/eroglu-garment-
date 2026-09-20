import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, Download, Layers } from 'lucide-react';
import { parseUniversalExcelFile } from '../utils/universalParser';
import { UniversalDataset } from '../types/powerbi';

interface PowerBIUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: UniversalDataset) => void;
  onDownloadTemplate: () => void;
  onLoadSampleData: () => void;
}

export function PowerBIUploadModal({
  isOpen,
  onClose,
  onDatasetLoaded,
  onDownloadTemplate,
  onLoadSampleData,
}: PowerBIUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<UniversalDataset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const dataset = await parseUniversalExcelFile(file);
      setParsedPreview(dataset);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse Excel file. Please ensure the format is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmLaunch = () => {
    if (parsedPreview) {
      onDatasetLoaded(parsedPreview);
      setParsedPreview(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Upload Excel Sheet for Analysis</h2>
              <p className="text-xs text-slate-300">
                Upload any Excel (.xlsx, .xls) or CSV file to auto-generate analytics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
              }
            }}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-amber-500 bg-amber-50/50'
                : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Drag and drop your Excel sheet here, or click to browse files
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports Excel (.xlsx, .xls) and Tabular CSV files
              </p>
            </div>

            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
              Auto-detects columns, hours, wages, and headcount
            </span>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-900 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Profiling workbook sheets, numeric columns, and categorical dimensions...</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview of Parsed Dataset if ready */}
          {parsedPreview && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>File parsed successfully: {parsedPreview.fileName}</span>
                </div>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded font-mono">
                  {parsedPreview.fileSize}
                </span>
              </div>

              {/* Sheet summary */}
              {parsedPreview.sheets[parsedPreview.activeSheetName] && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-500 block">Total Rows</span>
                    <strong className="text-slate-900 font-mono font-bold text-sm">
                      {parsedPreview.sheets[parsedPreview.activeSheetName].rowCount}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-500 block">Detected Columns</span>
                    <strong className="text-slate-900 font-mono font-bold text-sm">
                      {parsedPreview.sheets[parsedPreview.activeSheetName].columnCount}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-slate-500 block">Worksheets</span>
                    <strong className="text-slate-900 font-mono font-bold text-sm">
                      {parsedPreview.sheetNames.length}
                    </strong>
                  </div>
                </div>
              )}

              {/* Detected columns chips */}
              <div className="pt-2 border-t border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-900 block mb-1.5">
                  Detected Fields & Data Types:
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {parsedPreview.sheets[parsedPreview.activeSheetName]?.columns.map((c) => (
                    <span
                      key={c.name}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-sans ${
                        c.type === 'number'
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {c.type === 'number' ? '🔢 ' : '🔤 '}
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Launch Action */}
              <button
                onClick={handleConfirmLaunch}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load & Visualize Dataset Now</span>
              </button>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onLoadSampleData();
                  onClose();
                }}
                className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Load Eroglu Garment HR Benchmark Data</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onDownloadTemplate}
              className="text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Excel Template (.xlsx)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
