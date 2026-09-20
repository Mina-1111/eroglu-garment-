import {
  Upload,
  Download,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Filter,
  LayoutGrid,
  Table,
  Sliders,
  ShieldCheck,
  Building2,
  Tv,
  Sparkles,
  GitCompare,
} from 'lucide-react';
import { UniversalDataset } from '../types/powerbi';

export type HeaderTab = 'dashboard' | 'briefing' | 'simulator' | 'benchmarking' | 'matrix' | 'builder';

interface PowerBIHeaderProps {
  dataset: UniversalDataset;
  activeTab: HeaderTab;
  setActiveTab: (tab: HeaderTab) => void;
  onUploadClick: () => void;
  onDownloadTemplate: () => void;
  onExportExcel: () => void;
  onPrintReport: () => void;
  onResetSample: () => void;
  onSheetChange: (sheetName: string) => void;
  isFilterPaneOpen: boolean;
  setIsFilterPaneOpen: (open: boolean) => void;
  activeFilterCount: number;
  onOpenKiosk?: () => void;
}

export function PowerBIHeader({
  dataset,
  activeTab,
  setActiveTab,
  onUploadClick,
  onDownloadTemplate,
  onExportExcel,
  onPrintReport,
  onResetSample,
  onSheetChange,
  isFilterPaneOpen,
  setIsFilterPaneOpen,
  activeFilterCount,
  onOpenKiosk,
}: PowerBIHeaderProps) {
  const activeSheet = dataset.sheets[dataset.activeSheetName];

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl select-none" id="main-powerbi-header">
      
      {/* 1. Primary Top Ribbon */}
      <div className="w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Left: Brand Identity & Executive Title */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            {/* Logo Emblem */}
            <div className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-xl text-slate-950 font-black shadow-md shadow-amber-500/10 shrink-0 ring-1 ring-amber-400/30">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>

            {/* Titles & Engineering Attribution */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-black tracking-tight uppercase text-white font-sans truncate">
                  EROĞLU GARMENT
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Operations Suite
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Mina Rafat</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-normal text-slate-400 truncate mt-0.5">
                Executive HR & Factory Operations Intelligence Platform
              </p>
            </div>
          </div>

          {/* Center: File & Sheet Summary Pill (Displayed on large screens) */}
          <div className="hidden xl:flex items-center gap-2.5 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-200 truncate max-w-[170px] font-medium" title={dataset.fileName}>
              {dataset.fileName}
            </span>
            {dataset.sheetNames.length > 1 && (
              <select
                value={dataset.activeSheetName}
                onChange={(e) => onSheetChange(e.target.value)}
                className="bg-slate-950 text-amber-300 text-xs border border-slate-700 rounded-md px-2 py-0.5 outline-none cursor-pointer"
              >
                {dataset.sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s} ({dataset.sheets[s]?.rowCount || 0})
                  </option>
                ))}
              </select>
            )}
            {activeSheet && (
              <span className="text-[11px] text-slate-400 border-l border-slate-800 pl-2.5">
                <strong className="text-slate-200 font-semibold">{activeSheet.rowCount.toLocaleString()}</strong> Rows • <strong className="text-slate-200 font-semibold">{activeSheet.columnCount}</strong> Cols
              </span>
            )}
          </div>

          {/* Right: Master Controls Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* 1. Upload Excel (Primary CTA) */}
            <button
              id="btn-upload-excel"
              onClick={onUploadClick}
              className="h-9 px-3 sm:px-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Upload Excel or CSV file for automatic analysis"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Upload Excel</span>
              <span className="sm:hidden">Upload</span>
            </button>

            {/* 2. Executive Kiosk Mode */}
            {onOpenKiosk && (
              <button
                id="btn-open-kiosk"
                onClick={onOpenKiosk}
                className="h-9 px-2.5 sm:px-3 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Open Executive Kiosk Presentation Mode"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Kiosk Mode</span>
              </button>
            )}

            {/* 3. Print / Save PDF */}
            <button
              id="btn-print-report"
              onClick={onPrintReport}
              className="h-9 px-2.5 sm:px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Print report or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Print / PDF</span>
            </button>

            {/* 4. Download Template */}
            <button
              id="btn-download-template"
              onClick={onDownloadTemplate}
              className="h-9 px-2.5 sm:px-3 hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Download standard template"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Template</span>
            </button>

            {/* 5. Slicers & Filters Toggle Button */}
            <button
              id="btn-toggle-filters"
              onClick={() => setIsFilterPaneOpen(!isFilterPaneOpen)}
              className={`h-9 px-2.5 sm:px-3 rounded-lg text-xs border transition flex items-center gap-1.5 cursor-pointer relative ${
                isFilterPaneOpen
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 font-medium'
              }`}
              title="Toggle interactive slicers and filters pane"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* 6. Reset Sample Dataset */}
            <button
              id="btn-reset-sample"
              onClick={onResetSample}
              className="h-9 w-9 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg text-xs transition flex items-center justify-center cursor-pointer shrink-0"
              title="Reset to default benchmark dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      </div>

      {/* 2. Navigation Sub-Ribbon (Interactive Tabs Bar) */}
      <div className="bg-slate-950/95 border-t border-slate-800/80 px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10">
        <div className="w-full flex items-center justify-between overflow-x-auto py-1.5 gap-4 scrollbar-none">
          
          {/* Tabs Group */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            
            {/* Tab 1: Executive Dashboard */}
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Executive Dashboard</span>
            </button>

            {/* Tab 2: Leadership Scorecard & Health */}
            <button
              id="tab-briefing"
              onClick={() => setActiveTab('briefing')}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'briefing'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Leadership Scorecard</span>
            </button>

            {/* Tab 3: What-If Scenario Simulator */}
            <button
              id="tab-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>What-If Simulator</span>
            </button>

            {/* Tab 4: Head-to-Head Line Benchmarking */}
            <button
              id="tab-benchmarking"
              onClick={() => setActiveTab('benchmarking')}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'benchmarking'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Line Benchmarking</span>
            </button>

            {/* Tab 5: Data Matrix View */}
            <button
              id="tab-matrix"
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Data Matrix View</span>
            </button>

            {/* Tab 6: Custom Visual Builder */}
            <button
              id="tab-builder"
              onClick={() => setActiveTab('builder')}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'builder'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Visual Builder</span>
            </button>
          </div>

          {/* Right Sub-Ribbon Badge */}
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 shrink-0 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">Live Operational Feed</span>
            <span className="text-slate-700">•</span>
            <span>Mina Rafat</span>
          </div>

        </div>
      </div>

    </header>
  );
}
