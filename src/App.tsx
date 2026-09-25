import { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { UniversalDataset, FilterState } from './types/powerbi';
import {
  getInitialGarmentDataset,
  generatePowerBIQuickInsights,
} from './utils/universalParser';
import { downloadOragloExcelTemplate } from './utils/excelUtils';
import * as XLSX from 'xlsx';

import { PowerBIHeader, HeaderTab } from './components/PowerBIHeader';
import { PowerBISlicers } from './components/PowerBISlicers';
import { PowerBIKPICards } from './components/PowerBIKPICards';
import { PowerBIVisualsGrid } from './components/PowerBIVisualsGrid';
import { PowerBIQuickInsights } from './components/PowerBIQuickInsights';
import { PowerBIVisualBuilder } from './components/PowerBIVisualBuilder';
import { PowerBIUploadModal } from './components/PowerBIUploadModal';
import { PowerBIPrintReport } from './components/PowerBIPrintReport';
import { ExecutiveBriefingScorecard } from './components/ExecutiveBriefingScorecard';
import { ExecutiveScenarioSimulator } from './components/ExecutiveScenarioSimulator';
import { ExecutiveBenchmarking } from './components/ExecutiveBenchmarking';
import { ExecutiveKioskPresentation } from './components/ExecutiveKioskPresentation';
import { ExecutiveBoardroomDashboard } from './components/ExecutiveBoardroomDashboard';
import { Upload, FileSpreadsheet, RotateCcw, Table, Filter, ArrowUp, X, Tv } from 'lucide-react';

const STORAGE_KEY_DATASET = 'mina_rafat_analytics_dataset_v3';

export default function App() {
  // 1. Universal Dataset State (persisted locally)
  const [dataset, setDataset] = useState<UniversalDataset>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATASET);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.sheets && parsed.sheetNames?.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return getInitialGarmentDataset();
  });

  // Active view tab: boardroom | dashboard | dossier | briefing | simulator | benchmarking | matrix | builder
  const [activeTab, setActiveTab] = useState<HeaderTab>('boardroom');
  const [isKioskOpen, setIsKioskOpen] = useState(false);

  // Filter state for cross-filtering across all visuals
  const [filters, setFilters] = useState<FilterState>({});

  // Filter pane (Slicers) open/closed state
  const [isFilterPaneOpen, setIsFilterPaneOpen] = useState(true);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPrintView, setIsPrintView] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync dataset to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DATASET, JSON.stringify(dataset));
    } catch (e) {
      console.error('Error caching dataset:', e);
    }
  }, [dataset]);

  // Active sheet reference
  const activeSheet = useMemo(() => {
    return dataset.sheets[dataset.activeSheetName] || Object.values(dataset.sheets)[0];
  }, [dataset]);

  // Reset filters when changing active sheet or dataset
  const handleSheetChange = (sheetName: string) => {
    setDataset(prev => ({
      ...prev,
      activeSheetName: sheetName,
    }));
    setFilters({});
    showToast(`Switched active worksheet to: ${sheetName}`);
  };

  // Cross-filtering engine: calculates filtered rows
  const filteredRows = useMemo(() => {
    if (!activeSheet || !activeSheet.rawRows) return [];
    const activeFilterEntries = Object.entries(filters).filter(([_, vals]) => vals && vals.length > 0);
    if (activeFilterEntries.length === 0) return activeSheet.rawRows;

    return activeSheet.rawRows.filter(row => {
      return activeFilterEntries.every(([colName, selectedValues]) => {
        const rowVal = String(row[colName] || 'Unassigned').trim();
        return selectedValues.includes(rowVal);
      });
    });
  }, [activeSheet, filters]);

  // Executive Automated Intelligence Insights
  const quickInsights = useMemo(() => {
    if (!activeSheet) return [];
    return generatePowerBIQuickInsights(activeSheet, filteredRows);
  }, [activeSheet, filteredRows]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce((acc, curr) => acc + (curr ? curr.length : 0), 0);
  }, [filters]);

  // Filter handlers
  const handleFilterChange = (colName: string, selectedValues: string[]) => {
    setFilters(prev => ({
      ...prev,
      [colName]: selectedValues,
    }));
  };

  const handleClearAllFilters = () => {
    setFilters({});
    showToast('All slicers and cross-filters cleared');
  };

  // Category click on visuals (cross-filtering)
  const handleSelectCategoryFilter = (colName: string, categoryVal: string) => {
    setFilters(prev => {
      const current = prev[colName] || [];
      if (current.includes(categoryVal)) {
        // Toggle off
        const nextVals = current.filter(v => v !== categoryVal);
        return { ...prev, [colName]: nextVals };
      } else {
        // Toggle on
        return { ...prev, [colName]: [...current, categoryVal] };
      }
    });
  };

  // Upload handler
  const handleDatasetLoaded = (newDataset: UniversalDataset) => {
    setDataset(newDataset);
    setFilters({});
    setActiveTab('dashboard');
    showToast(`Successfully loaded and visualized (${newDataset.fileName})!`);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  // Reset to default Garment HR sample
  const handleResetSample = () => {
    const sample = getInitialGarmentDataset();
    setDataset(sample);
    setFilters({});
    showToast('Reset to default Eroglu Garment HR Benchmark Dataset');
  };

  // Export current active view / sheet to Excel
  const handleExportExcel = () => {
    if (!activeSheet || !filteredRows.length) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    XLSX.utils.book_append_sheet(wb, ws, activeSheet.sheetName || 'Data');
    XLSX.writeFile(wb, `export_${activeSheet.sheetName || 'dataset'}.xlsx`);
    showToast('Dataset exported to Excel file successfully');
  };

  // Printable View
  if (isPrintView) {
    return (
      <PowerBIPrintReport
        dataset={dataset}
        filteredRows={filteredRows}
        filteredRowCount={filteredRows.length}
        filters={filters}
        onBack={() => setIsPrintView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 flex flex-col font-sans" dir="ltr">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          {toastMessage}
        </div>
      )}

      {/* Top Application Ribbon Header */}
      <div className="print:hidden">
        <PowerBIHeader
          dataset={dataset}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onUploadClick={() => setIsUploadModalOpen(true)}
          onDownloadTemplate={downloadOragloExcelTemplate}
          onExportExcel={handleExportExcel}
          onPrintReport={() => setIsPrintView(true)}
          onResetSample={handleResetSample}
          onSheetChange={handleSheetChange}
          isFilterPaneOpen={isFilterPaneOpen}
          setIsFilterPaneOpen={setIsFilterPaneOpen}
          activeFilterCount={activeFilterCount}
          onOpenKiosk={() => setIsKioskOpen(true)}
        />
      </div>

      {/* Main Container - Full Fluid Screen Workspace */}
      <main className="w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 py-5 space-y-5 flex-1 print:p-0 print:m-0 print:w-full">
        
        {/* Dataset Scope & Filter Status Strip */}
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono truncate">
                  {dataset.fileName}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">
                  {activeSheet?.rowCount || 0} Rows • {activeSheet?.columnCount || 0} Columns
                </span>
                {activeFilterCount > 0 ? (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300">
                    Scope: {filteredRows.length} of {activeSheet?.rowCount || 0} rows ({activeFilterCount} filters active)
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    Full Plant Scope (100%)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters ({activeFilterCount})</span>
              </button>
            )}
            <button
              onClick={() => setIsFilterPaneOpen(!isFilterPaneOpen)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
            >
              <Filter className="w-3.5 h-3.5 text-slate-600" />
              <span>{isFilterPaneOpen ? 'Hide Filters' : 'Filter Slicers'}</span>
            </button>
          </div>
        </div>

        {/* Active Filters Summary Breadcrumb Strip */}
        {activeFilterCount > 0 && (
          <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs print:hidden">
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1.5 text-amber-950 text-xs font-black mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-600" />
                <span>Active Cross-Filters ({activeFilterCount}):</span>
              </div>
              {Object.entries(filters).map(([colName, vals]) => {
                if (!vals || vals.length === 0) return null;
                return vals.map(val => (
                  <span
                    key={`${colName}-${val}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-slate-900 border border-amber-300 text-xs font-semibold shadow-2xs"
                  >
                    <span className="text-slate-500 text-[11px] font-normal">{colName}:</span>
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={() => handleSelectCategoryFilter(colName, val)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 rounded-full hover:bg-rose-50"
                      title={`Remove ${val} filter`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ));
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 underline decoration-amber-400 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Layout: Content on Main + Slicers on Side */}
        <div className="flex flex-col lg:flex-row items-start gap-5 relative">
          
          {/* Main Content Workspace */}
          <div className="flex-1 space-y-5 w-full min-w-0">
            
            {/* View Tab 0: Flagship Executive Boardroom Dark Dashboard (Driven 100% by active uploaded sheet) */}
            {activeTab === 'boardroom' && (
              <ExecutiveBoardroomDashboard
                dataset={dataset}
                columns={activeSheet?.columns || []}
                filteredRows={filteredRows}
                filters={filters}
                onSelectCategoryFilter={handleSelectCategoryFilter}
                onOpenPrintReport={() => setIsPrintView(true)}
                onSwitchToDossierTab={() => setActiveTab('dossier')}
                onUploadNewSheet={() => setIsUploadModalOpen(true)}
              />
            )}

            {/* View Tab 1: Full Analytics Dashboard */}
            {activeTab === 'dashboard' && (
              <>
                {/* 1. Multi-Row KPI Metric Cards */}
                <section aria-label="Executive KPI Metrics">
                  <PowerBIKPICards
                    columns={activeSheet?.columns || []}
                    filteredRows={filteredRows}
                    totalDatasetRows={activeSheet?.rowCount || 0}
                    selectedDepartments={
                      (() => {
                        const dCol = activeSheet?.columns.find(c => /department|dept|division|section|القسم|قسم/i.test(c.name));
                        return dCol ? (filters[dCol.name] || []) : [];
                      })()
                    }
                    onSelectDepartment={(dept) => {
                      const dCol = activeSheet?.columns.find(c => /department|dept|division|section|القسم|قسم/i.test(c.name));
                      handleSelectCategoryFilter(dCol ? dCol.name : 'Department', dept);
                    }}
                  />
                </section>

                {/* 2. Automated Intelligence Insights */}
                <section aria-label="Automated Insights">
                  <PowerBIQuickInsights insights={quickInsights} />
                </section>

                {/* 3. Interactive Visuals Grid & Matrix */}
                <section aria-label="Visual Analytics Grid">
                  <PowerBIVisualsGrid
                    columns={activeSheet?.columns || []}
                    filteredRows={filteredRows}
                    filters={filters}
                    onSelectCategoryFilter={handleSelectCategoryFilter}
                  />
                </section>
              </>
            )}

            {/* View Tab: Manager Boardroom Dossier & Print */}
            {activeTab === 'dossier' && (
              <PowerBIPrintReport
                dataset={dataset}
                filteredRows={filteredRows}
                filteredRowCount={filteredRows.length}
                filters={filters}
                onBack={() => setActiveTab('dashboard')}
              />
            )}

            {/* View Tab 2: Executive Leadership Scorecard & Plant Health */}
            {activeTab === 'briefing' && (
              <ExecutiveBriefingScorecard
                columns={activeSheet?.columns || []}
                filteredRows={filteredRows}
                totalDatasetRows={activeSheet?.rowCount || 0}
                onSelectDepartment={(dept) => {
                  const dCol = activeSheet?.columns.find(c => /department|dept|division|section|القسم|قسم/i.test(c.name));
                  handleSelectCategoryFilter(dCol ? dCol.name : 'Department', dept);
                }}
                onOpenPrintReport={() => setIsPrintView(true)}
              />
            )}

            {/* View Tab 3: Executive What-If Operational Simulator */}
            {activeTab === 'simulator' && (
              <ExecutiveScenarioSimulator
                columns={activeSheet?.columns || []}
                filteredRows={filteredRows}
                totalDatasetRows={activeSheet?.rowCount || 0}
              />
            )}

            {/* View Tab 4: Head-to-Head Section & Line Benchmarking */}
            {activeTab === 'benchmarking' && (
              <ExecutiveBenchmarking
                columns={activeSheet?.columns || []}
                filteredRows={filteredRows}
              />
            )}

            {/* View Tab 5: Full Data Matrix View */}
            {activeTab === 'matrix' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Table className="w-4 h-4 text-amber-500" />
                      <span>Executive Raw Data Matrix Table</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Granular tabular view of active filtered records ({filteredRows.length} rows)
                    </p>
                  </div>

                  <button
                    onClick={handleExportExcel}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Export to Excel</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 text-slate-800 shadow-xs z-10">
                      <tr>
                        <th className="p-2.5 font-bold border-b border-slate-300">#</th>
                        {activeSheet?.columns.map(col => (
                          <th key={col.name} className="p-2.5 font-bold border-b border-slate-300 truncate">
                            {col.type === 'number' ? '🔢 ' : '🔤 '} {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.slice(0, 100).map((row, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/50 transition">
                          <td className="p-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          {activeSheet?.columns.map(col => (
                            <td key={col.name} className="p-2 font-mono text-slate-800">
                              {row[col.name] !== undefined && row[col.name] !== null ? String(row[col.name]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredRows.length > 100 && (
                  <p className="text-center text-xs text-slate-400 pt-2">
                    Showing top 100 records out of {filteredRows.length}. Filter or export to review all records.
                  </p>
                )}
              </div>
            )}

            {/* View Tab 3: Visuals & Fields Customizer */}
            {activeTab === 'builder' && (
              <PowerBIVisualBuilder
                columns={activeSheet?.columns || []}
                filteredRows={filteredRows}
              />
            )}

          </div>

          {/* Slicers / Filters Side Pane */}
          {activeSheet && (
            <PowerBISlicers
              columns={activeSheet.columns}
              rawRows={activeSheet.rawRows}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearAllFilters={handleClearAllFilters}
              isOpen={isFilterPaneOpen}
              onClose={() => setIsFilterPaneOpen(false)}
            />
          )}

        </div>

      </main>

      {/* Upload Excel Modal */}
      <PowerBIUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
        onDownloadTemplate={downloadOragloExcelTemplate}
        onLoadSampleData={handleResetSample}
      />

      {/* Executive Boardroom Kiosk Presentation Overlay */}
      <ExecutiveKioskPresentation
        columns={activeSheet?.columns || []}
        filteredRows={filteredRows}
        totalDatasetRows={activeSheet?.rowCount || 0}
        isOpen={isKioskOpen}
        onClose={() => setIsKioskOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 pt-8 pb-4 text-center text-xs text-slate-500 no-print">
        <p className="font-semibold text-slate-700">
          Executive Data Analytics Platform • Engineered by <span className="text-amber-600 font-bold">Software Engineering / Mina Rafat</span>
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Designed for Excel & CSV ingestion, automated schema profiling, workforce headcount distribution, and dynamic multi-metric analysis.
        </p>
      </footer>

      {/* Floating Quick Action Dock (FAB): Floating Slicers Toggle & Back to Top */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 no-print">
        {/* Floating Slicers Toggle */}
        <button
          type="button"
          onClick={() => setIsFilterPaneOpen(prev => !prev)}
          className={`px-3.5 py-2.5 rounded-full shadow-2xl border flex items-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer transform hover:scale-105 select-none ${
            isFilterPaneOpen
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30'
              : 'bg-slate-950/90 hover:bg-slate-900 text-white border-slate-700/80 shadow-slate-950/50 backdrop-blur-md'
          }`}
          title={isFilterPaneOpen ? 'Hide Interactive Slicers' : 'Open Floating Interactive Slicers'}
        >
          <Filter className="w-4 h-4 text-inherit" />
          <span className="hidden sm:inline">Interactive Slicers</span>
          {activeFilterCount > 0 && (
            <span className={`w-5 h-5 rounded-full font-mono font-black text-[10px] flex items-center justify-center border ${
              isFilterPaneOpen ? 'bg-slate-950 text-amber-300 border-slate-800' : 'bg-amber-400 text-slate-950 border-amber-300'
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Floating Back to Top Button */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 rounded-full bg-slate-950/90 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 shadow-2xl flex items-center justify-center transition-all cursor-pointer backdrop-blur-md hover:scale-105"
          title="Scroll to Top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
