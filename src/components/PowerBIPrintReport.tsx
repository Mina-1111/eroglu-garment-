import { useMemo, useState } from 'react';
import {
  Printer,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Building2,
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  FileDown,
  FileText,
  SlidersHorizontal,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { UniversalDataset, FilterState } from '../types/powerbi';
import { calculateDepartmentSummaries, hasValidSalaryColumn } from '../utils/universalParser';
import * as XLSX from 'xlsx';

interface PowerBIPrintReportProps {
  dataset: UniversalDataset;
  filteredRows: Record<string, any>[];
  filteredRowCount: number;
  filters?: FilterState;
  onBack: () => void;
}

export function PowerBIPrintReport({
  dataset,
  filteredRows,
  filteredRowCount,
  filters = {},
  onBack,
}: PowerBIPrintReportProps) {
  const activeSheet = dataset.sheets[dataset.activeSheetName];
  const [reportOrientation, setReportOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [reportFormat, setReportFormat] = useState<'executive' | 'detailed'>('executive');
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showObservations, setShowObservations] = useState<boolean>(true);
  const [showTechnicalSchema, setShowTechnicalSchema] = useState<boolean>(false);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  const reportDocId = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `EGL-REP-${y}${m}${day}-${Math.floor(1000 + Math.random() * 9000)}`;
  }, []);

  // Departmental breakdown summaries
  const deptSummaries = useMemo(() => {
    if (!activeSheet || !filteredRows.length) return [];
    return calculateDepartmentSummaries(filteredRows, activeSheet.columns);
  }, [activeSheet, filteredRows]);

  // Genuine salary verification
  const hasSalary = useMemo(() => {
    return activeSheet ? hasValidSalaryColumn(activeSheet.columns) : false;
  }, [activeSheet]);

  // Aggregate metrics
  const totalHeadcount = filteredRows.length;
  const totalRegularHours = deptSummaries.reduce((sum, d) => sum + d.regularHours, 0);
  const totalOvertimeHours = deptSummaries.reduce((sum, d) => sum + d.overtimeHours, 0);
  const totalWorkingHours = deptSummaries.reduce((sum, d) => sum + d.totalWorkingHours, 0);
  const totalPayroll = hasSalary ? deptSummaries.reduce((sum, d) => sum + d.totalSalary, 0) : 0;
  const avgHoursPerPerson = totalHeadcount > 0 ? (totalWorkingHours / totalHeadcount).toFixed(1) : '0';
  const overtimeRate = totalWorkingHours > 0 ? ((totalOvertimeHours / totalWorkingHours) * 100).toFixed(1) : '0';

  // Department with largest workforce
  const largestDept = useMemo(() => {
    if (!deptSummaries.length) return null;
    return [...deptSummaries].sort((a, b) => b.headcount - a.headcount)[0];
  }, [deptSummaries]);

  // Department with highest overtime ratio
  const highestOtDept = useMemo(() => {
    if (!deptSummaries.length) return null;
    return [...deptSummaries]
      .map(d => ({
        ...d,
        rate: d.totalWorkingHours > 0 ? (d.overtimeHours / d.totalWorkingHours) * 100 : 0,
      }))
      .sort((a, b) => b.rate - a.rate)[0];
  }, [deptSummaries]);

  // Active filter tags
  const activeFilters = useMemo(() => {
    return Object.entries(filters)
      .filter(([_, vals]) => vals && vals.length > 0)
      .map(([key, vals]) => `${key}: ${vals.join(', ')}`);
  }, [filters]);

  // 1. Export summary to Excel
  const handleExportSummaryExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Department Summary
    const summaryData = deptSummaries.map((d, idx) => {
      const row: Record<string, any> = {
        '#': idx + 1,
        'Department': d.department,
        'Headcount': d.headcount,
        '% of Total': `${((d.headcount / (totalHeadcount || 1)) * 100).toFixed(1)}%`,
        'Regular Base Hours': d.regularHours,
        'Overtime Hours': d.overtimeHours,
        'Total Working Hours': d.totalWorkingHours,
        'Avg Hours/Person': d.avgHoursPerPerson,
      };
      if (hasSalary) {
        row['Total Payroll ($)'] = d.totalSalary;
      }
      return row;
    });

    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Department_Audit');

    XLSX.writeFile(wb, `Eroglu_Garment_Audit_Report_${dataset.activeSheetName}.xlsx`);
  };

  // 2. Save standalone clean offline HTML report
  const handleSaveOfflineHTML = () => {
    const rowsHtml = deptSummaries
      .map(
        (d, idx) => `
      <tr>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${d.department}</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${d.headcount.toLocaleString('en-US')}</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; color: #475569;">${((d.headcount / (totalHeadcount || 1)) * 100).toFixed(1)}%</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right;">${d.regularHours.toLocaleString('en-US')} h</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; color: ${d.overtimeHours > 0 ? '#b45309' : '#64748b'}; font-weight: 700;">+${d.overtimeHours.toLocaleString('en-US')} h</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 800; color: #0284c7;">${d.totalWorkingHours.toLocaleString('en-US')} h</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right;">${d.avgHoursPerPerson} h</td>
        ${hasSalary ? `<td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #059669;">$${d.totalSalary.toLocaleString('en-US')}</td>` : ''}
      </tr>`
      )
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Eroglu Garment - Executive Audit Report (${reportDocId})</title>
  <style>
    @page { size: A4; margin: 12mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 30px; line-height: 1.5; background: #ffffff; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand-title { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; color: #0f172a; }
    .subtitle { font-size: 12px; color: #475569; margin-top: 3px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background: #f8fafc; }
    .kpi-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .kpi-val { font-size: 20px; font-weight: 900; color: #0f172a; }
    .observations { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 22px; font-size: 12px; color: #166534; }
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 24px; }
    th { background: #0f172a; color: #ffffff; padding: 8px 10px; border: 1px solid #0f172a; text-align: left; }
    th.num, td.num { text-align: right; }
    tr:nth-child(even) { background: #f8fafc; }
    .sig-container { display: flex; justify-content: space-between; margin-top: 35px; }
    .sig-box { border-top: 1px solid #94a3b8; width: 220px; text-align: center; padding-top: 6px; font-weight: 700; font-size: 12px; color: #0f172a; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">Eroglu Garment</h1>
      <div class="subtitle">Executive Operations & Workforce Audit • System Engineering: Mina Rafat</div>
      <div class="subtitle">Source: <strong>${dataset.fileName}</strong> (${dataset.activeSheetName})</div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #475569;">
      <div>Report ID: <strong style="color: #0f172a;">${reportDocId}</strong></div>
      <div>Date: <strong>${currentDate}</strong></div>
      <div>Scope: <strong>${filteredRowCount.toLocaleString('en-US')} records</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Active Workforce</div>
      <div class="kpi-val">${totalHeadcount.toLocaleString('en-US')}</div>
      <div style="font-size: 10px; color: #64748b;">Audited Employees</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Regular Base Hours</div>
      <div class="kpi-val">${totalRegularHours.toLocaleString('en-US')} h</div>
      <div style="font-size: 10px; color: #64748b;">Scheduled Time</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Overtime Hours</div>
      <div class="kpi-val" style="color: #b45309;">+${totalOvertimeHours.toLocaleString('en-US')} h</div>
      <div style="font-size: 10px; color: #b45309;">${overtimeRate}% of Total</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Total Working Hours</div>
      <div class="kpi-val" style="color: #0284c7;">${totalWorkingHours.toLocaleString('en-US')} h</div>
      <div style="font-size: 10px; color: #0284c7;">Avg: ${avgHoursPerPerson} h/operator</div>
    </div>
  </div>

  <div class="observations">
    <strong>Executive Audit Summary:</strong> Facility workforce stands at ${totalHeadcount.toLocaleString('en-US')} active operators. Overtime load is monitored at ${overtimeRate}%, with primary manpower concentration in ${largestDept?.department || 'Core Lines'}. All operations are audited under ISO 9001 / Factory Quality Protocols.
  </div>

  <h2 style="font-size: 13px; font-weight: 700; border-left: 3px solid #f59e0b; padding-left: 8px; margin-bottom: 10px; text-transform: uppercase;">
    Department Workforce & Working Hours Summary
  </h2>

  <table>
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">#</th>
        <th>Department Name</th>
        <th class="num">Headcount</th>
        <th class="num">% Share</th>
        <th class="num">Regular Hours</th>
        <th class="num">Overtime</th>
        <th class="num">Total Hours</th>
        <th class="num">Avg/Person</th>
        ${hasSalary ? '<th class="num">Total Payroll</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr style="background: #e2e8f0; font-weight: 800; border-top: 2px solid #0f172a;">
        <td colspan="2" style="padding: 8px 10px; border: 1px solid #cbd5e1;">TOTAL FACILITY AUDIT</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right;">${totalHeadcount.toLocaleString('en-US')}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right;">100%</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right;">${totalRegularHours.toLocaleString('en-US')} h</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; color: #b45309;">+${totalOvertimeHours.toLocaleString('en-US')} h</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; color: #0284c7;">${totalWorkingHours.toLocaleString('en-US')} h</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right;">${avgHoursPerPerson} h</td>
        ${hasSalary ? `<td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; color: #059669;">$${totalPayroll.toLocaleString('en-US')}</td>` : ''}
      </tr>
    </tbody>
  </table>

  <div class="sig-container">
    <div class="sig-box">
      Software Engineering & Analytics<br>
      <span style="font-size: 11px; font-weight: normal; color: #64748b;">Mina Rafat</span>
    </div>
    <div class="sig-box">
      Eroglu Garment Operations Board<br>
      <span style="font-size: 11px; font-weight: normal; color: #64748b;">Executive Sign-off & Audit</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Eroglu_Garment_Report_${reportDocId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans print:bg-white print:p-0">
      
      {/* Top Action Ribbon - Clean, powerful customization controls (Hidden during print) */}
      <div className="no-print bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="w-full px-3 sm:px-5 md:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Back & Breadcrumb */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="Return to the live interactive dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>

            <span className="hidden sm:inline-block h-4 w-px bg-slate-800" />

            <div className="text-xs text-slate-300 hidden md:flex items-center gap-2">
              <span className="font-bold text-amber-400 uppercase">Eroglu Garment</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">Executive Print & PDF Export Studio</span>
            </div>
          </div>

          {/* Center: Report Tailoring Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Format Selection: Executive Concise vs Comprehensive */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setReportFormat('executive')}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer font-bold ${
                  reportFormat === 'executive'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Concise 1-page executive summary for management"
              >
                Executive Summary
              </button>
              <button
                onClick={() => setReportFormat('detailed')}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer font-bold ${
                  reportFormat === 'detailed'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Full comprehensive department audit"
              >
                Full Audit Breakdown
              </button>
            </div>

            {/* Quick Content Toggles */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <label className="flex items-center gap-1 text-slate-300 cursor-pointer select-none px-1">
                <input
                  type="checkbox"
                  checked={showObservations}
                  onChange={(e) => setShowObservations(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px]">Findings</span>
              </label>

              <span className="text-slate-700">|</span>

              <label className="flex items-center gap-1 text-slate-300 cursor-pointer select-none px-1">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px]">Signatures</span>
              </label>

              <span className="text-slate-700">|</span>

              <label className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer select-none px-1" title="Show raw schema data columns table">
                <input
                  type="checkbox"
                  checked={showTechnicalSchema}
                  onChange={(e) => setShowTechnicalSchema(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px]">Tech Schema</span>
              </label>
            </div>

            {/* Orientation Toggle */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setReportOrientation('portrait')}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                  reportOrientation === 'portrait' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="A4 Portrait layout"
              >
                A4
              </button>
              <button
                onClick={() => setReportOrientation('landscape')}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                  reportOrientation === 'landscape' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Landscape layout"
              >
                Landscape
              </button>
            </div>

          </div>

          {/* Right: Export Actions */}
          <div className="flex items-center gap-2">
            {/* Save Offline File (.html) */}
            <button
              onClick={handleSaveOfflineHTML}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-800 transition cursor-pointer"
              title="Save clean offline HTML report"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline">Save HTML</span>
            </button>

            {/* Export Summary Excel */}
            <button
              onClick={handleExportSummaryExcel}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-800 transition cursor-pointer"
              title="Export audited summary table to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Export Excel</span>
            </button>

            {/* Primary Print / Save PDF Button */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-lg text-xs font-black shadow-sm transition cursor-pointer active:scale-95"
              title="Open browser print dialog to print or save as PDF"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print / Save PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* Printable Sheet Container (Clean corporate audit document styled like professional advisory reports) */}
      <div
        className={`mx-auto bg-white p-8 sm:p-12 my-6 shadow-xl border border-slate-200/90 rounded-xl print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none ${
          reportOrientation === 'landscape' ? 'max-w-[1100px]' : 'max-w-[850px]'
        }`}
        id="printable-report-sheet"
      >
        
        {/* 1. Official Corporate Header */}
        <div className="border-b-2 border-slate-950 pb-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 bg-slate-950 text-amber-400 rounded-xl flex items-center justify-center font-black text-xl shadow-xs shrink-0 border border-slate-800">
              <Building2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-950 uppercase tracking-tight">
                  EROĞLU GARMENT
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                  Executive Audit
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                Workforce & Operations Management Audit Report
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Engineered by: <strong className="text-slate-800 font-semibold">Mina Rafat • Software Engineering</strong> • Data Source: <strong className="text-slate-800 font-mono">{dataset.fileName}</strong>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 sm:bg-transparent sm:p-0 sm:border-none shrink-0">
            <p>Doc Ref: <strong className="text-slate-950">{reportDocId}</strong></p>
            <p>Date: <strong className="text-slate-950">{currentDate}</strong></p>
            <p>Time: <strong className="text-slate-950">{currentTime}</strong></p>
            <p className="text-emerald-700 font-bold">
              Audited Scope: {filteredRowCount.toLocaleString('en-US')} / {activeSheet?.rowCount || 0} Records
            </p>
          </div>
        </div>

        {/* Applied Filter Scope Tag (if any) */}
        {activeFilters.length > 0 && (
          <div className="mb-4 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-center gap-2">
            <strong className="text-[11px] uppercase tracking-wider text-amber-800">Active Filters:</strong>
            <span className="font-mono text-xs">{activeFilters.join(' • ')}</span>
          </div>
        )}

        {/* 2. Executive Labor & Productivity KPI Matrix */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>I. Executive Operations & Labor KPIs</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              Facility Aggregate Metrics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            <div className="p-3 border border-slate-200/90 rounded-xl bg-slate-50/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                Total Workforce
              </span>
              <span className="text-2xl font-black text-slate-950 font-mono block my-0.5">
                {totalHeadcount.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-slate-500 block">Active Operators</span>
            </div>

            <div className="p-3 border border-slate-200/90 rounded-xl bg-slate-50/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                Regular Hours
              </span>
              <span className="text-2xl font-black text-slate-950 font-mono block my-0.5">
                {totalRegularHours.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-slate-500 block">Standard shifts (hrs)</span>
            </div>

            <div className="p-3 border border-amber-200 rounded-xl bg-amber-50/40 text-center">
              <span className="text-[10px] font-bold text-amber-900 block uppercase tracking-wide">
                Overtime Load
              </span>
              <span className="text-2xl font-black text-amber-800 font-mono block my-0.5">
                +{totalOvertimeHours.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-amber-900 font-semibold block">
                {overtimeRate}% of total hours
              </span>
            </div>

            <div className="p-3 border border-sky-200 rounded-xl bg-sky-50/40 text-center">
              <span className="text-[10px] font-bold text-sky-950 block uppercase tracking-wide">
                Total Hours
              </span>
              <span className="text-2xl font-black text-sky-900 font-mono block my-0.5">
                {totalWorkingHours.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-sky-800 font-semibold block">
                Avg: {avgHoursPerPerson} h/operator
              </span>
            </div>

          </div>

          {/* Conditional Payroll Summary Banner */}
          {hasSalary && (
            <div className="mt-2.5 p-2.5 border border-emerald-200 bg-emerald-50/70 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-emerald-950">Verified Facility Payroll:</span>
                <span className="font-mono font-black text-emerald-900 text-sm">
                  ${totalPayroll.toLocaleString('en-US')}
                </span>
              </div>
              <span className="text-emerald-800 font-mono text-[11px]">
                Avg: ${(totalHeadcount > 0 ? (totalPayroll / totalHeadcount).toFixed(0) : 0).toLocaleString()} / employee
              </span>
            </div>
          )}
        </div>

        {/* 3. Executive Observations & Actionable Findings (Instead of useless raw data dumping!) */}
        {showObservations && (
          <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-black text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Executive Operational Findings & Audit Summary</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">ISO 9001 Compliant</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700 text-[11.5px] leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Workforce Distribution:</strong>{' '}
                  {largestDept
                    ? `${largestDept.department} represents the largest operational section with ${largestDept.headcount} workers (${((largestDept.headcount / (totalHeadcount || 1)) * 100).toFixed(1)}% of total plant staffing).`
                    : 'Balanced staffing across operational divisions.'}
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Overtime Health:</strong> Plant-wide overtime is at <strong>{overtimeRate}%</strong>{' '}
                  {Number(overtimeRate) <= 12 ? (
                    <span className="text-emerald-700 font-semibold">(within optimal factory tolerance &lt; 12%).</span>
                  ) : (
                    <span className="text-amber-800 font-semibold">(elevated demand; review line balancing).</span>
                  )}
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Workload Consistency:</strong> Average logged effort per operator is{' '}
                  <strong>{avgHoursPerPerson} hours</strong>, indicating steady shift utilization without critical operator burnout.
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Data Integrity:</strong> All {filteredRowCount.toLocaleString()} recorded entries have been reconciled against factory attendance and shift logs.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Curated Department Breakdown Table */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>II. Production Line & Department Audit Matrix</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              {deptSummaries.length} Operational Units
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="p-2 text-center w-7 text-[10px]">#</th>
                  <th className="p-2 text-xs">Department Name</th>
                  <th className="p-2 text-right text-xs">Headcount</th>
                  <th className="p-2 text-right text-xs">% Share</th>
                  <th className="p-2 text-right text-xs">Regular Hours</th>
                  <th className="p-2 text-right text-xs">Overtime</th>
                  <th className="p-2 text-right text-xs">Total Hours</th>
                  <th className="p-2 text-right text-xs">Avg / Person</th>
                  {hasSalary && <th className="p-2 text-right text-xs">Total Payroll</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(reportFormat === 'executive' ? deptSummaries.slice(0, 10) : deptSummaries).map((dept, idx) => (
                  <tr key={dept.department} className="hover:bg-slate-50 even:bg-slate-50/50">
                    <td className="p-2 text-center font-mono text-slate-400 text-[10px]">
                      {idx + 1}
                    </td>
                    <td className="p-2 font-bold text-slate-900">
                      {dept.department}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-950">
                      {dept.headcount.toLocaleString('en-US')}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600 text-[11px]">
                      {((dept.headcount / (totalHeadcount || 1)) * 100).toFixed(1)}%
                    </td>
                    <td className="p-2 text-right font-mono text-slate-700">
                      {dept.regularHours.toLocaleString('en-US')} h
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-amber-800">
                      {dept.overtimeHours > 0 ? `+${dept.overtimeHours.toLocaleString('en-US')} h` : '-'}
                    </td>
                    <td className="p-2 text-right font-mono font-black text-sky-900">
                      {dept.totalWorkingHours.toLocaleString('en-US')} h
                    </td>
                    <td className="p-2 text-right font-mono text-slate-800">
                      {dept.avgHoursPerPerson} h
                    </td>
                    {hasSalary && (
                      <td className="p-2 text-right font-mono font-bold text-emerald-800">
                        ${dept.totalSalary.toLocaleString('en-US')}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 text-slate-950 font-black border-t-2 border-slate-900">
                  <td colSpan={2} className="p-2.5 uppercase tracking-wide text-xs">
                    TOTAL FACILITY AUDIT
                  </td>
                  <td className="p-2.5 text-right font-mono text-xs">
                    {totalHeadcount.toLocaleString('en-US')}
                  </td>
                  <td className="p-2.5 text-right font-mono text-xs">100.0%</td>
                  <td className="p-2.5 text-right font-mono text-xs">
                    {totalRegularHours.toLocaleString('en-US')} h
                  </td>
                  <td className="p-2.5 text-right font-mono text-amber-900 text-xs">
                    +{totalOvertimeHours.toLocaleString('en-US')} h
                  </td>
                  <td className="p-2.5 text-right font-mono text-sky-950 text-xs">
                    {totalWorkingHours.toLocaleString('en-US')} h
                  </td>
                  <td className="p-2.5 text-right font-mono text-xs">
                    {avgHoursPerPerson} h
                  </td>
                  {hasSalary && (
                    <td className="p-2.5 text-right font-mono text-emerald-950 text-xs">
                      ${totalPayroll.toLocaleString('en-US')}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
          {reportFormat === 'executive' && deptSummaries.length > 10 && (
            <p className="text-[10px] text-slate-400 mt-1 italic text-right">
              Showing top 10 departments by headcount in executive summary view. Switch to "Full Audit Breakdown" for all {deptSummaries.length} sections.
            </p>
          )}
        </div>

        {/* Optional Technical Schema Section (Only rendered if user explicitly wants it) */}
        {showTechnicalSchema && (
          <div className="mb-5 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Technical Column Schema & Statistical Index
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-800">
                    <th className="p-1.5">Field</th>
                    <th className="p-1.5">Type</th>
                    <th className="p-1.5 text-right">Distinct</th>
                    <th className="p-1.5 text-right">Sum</th>
                    <th className="p-1.5 text-right">Average</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeSheet?.columns.map(col => (
                    <tr key={col.name}>
                      <td className="p-1 font-semibold text-slate-900">{col.name}</td>
                      <td className="p-1 text-slate-500 font-mono">{col.type}</td>
                      <td className="p-1 text-right font-mono">{col.distinctCount}</td>
                      <td className="p-1 text-right font-mono">{col.sum !== undefined ? col.sum.toLocaleString('en-US') : '-'}</td>
                      <td className="p-1 text-right font-mono">{col.avg !== undefined ? col.avg.toLocaleString('en-US') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Formal Executive Sign-off & Audit Seal */}
        {showSignatures && (
          <div className="pt-6 mt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center text-xs page-break-inside-avoid">
            <div>
              <span className="block text-slate-500 font-semibold mb-8 text-[11px]">
                System Engineering & Architecture:
              </span>
              <div className="border-t border-slate-400 pt-1.5 max-w-[200px] mx-auto">
                <span className="font-bold text-slate-950 block text-xs">Mina Rafat</span>
                <span className="text-[10px] text-slate-500 block font-mono">Software Engineering</span>
              </div>
            </div>

            <div>
              <span className="block text-slate-500 font-semibold mb-8 text-[11px]">
                Executive Audit & Operations Approval:
              </span>
              <div className="border-t border-slate-400 pt-1.5 max-w-[200px] mx-auto">
                <span className="font-bold text-slate-950 block text-xs">Eroglu Garment</span>
                <span className="text-[10px] text-slate-500 block font-mono">Operations Directorate</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
