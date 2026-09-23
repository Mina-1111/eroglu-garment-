import { useMemo, useState } from 'react';
import {
  Printer,
  ArrowLeft,
  FileSpreadsheet,
  Building2,
  Clock,
  Users,
  CheckCircle2,
  FileDown,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Monitor,
  FileText,
  CalendarCheck,
  ExternalLink,
  Layers,
  Sparkles,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { UniversalDataset, FilterState, ColumnProfile } from '../types/powerbi';
import { calculateDepartmentSummaries, hasValidSalaryColumn, parseNumericValue } from '../utils/universalParser';
import * as XLSX from 'xlsx';

interface PowerBIPrintReportProps {
  dataset: UniversalDataset;
  filteredRows: Record<string, any>[];
  filteredRowCount: number;
  filters?: FilterState;
  onBack: () => void;
}

// Robust helper to extract overtime hours for an individual worker row
function extractWorkerOvertimeHours(
  row: Record<string, any>,
  columns: ColumnProfile[],
  isOvertimeMode: boolean
): number {
  if (!row) return 0;

  // 1. Explicit Overtime Column
  const otCol = columns.find(
    c => /overtime|ot.*hour|ساعات.*إضافي|إضافي|اضافي|\bot\b/i.test(c.name)
  );
  if (otCol) {
    const val = parseNumericValue(row[otCol.name]);
    if (val !== null && !isNaN(val) && val > 0) return val;
  }

  // 2. If Overtime Mode is active, any work hours column represents overtime hours!
  if (isOvertimeMode) {
    const workCol = columns.find(
      c => /total.*(work|hour)|working.*hour|ساعات.*العمل|ساعات|hour|hrs|ساعة/i.test(c.name)
    );
    if (workCol) {
      const val = parseNumericValue(row[workCol.name]);
      if (val !== null && !isNaN(val) && val > 0) return val;
    }

    // 3. Fallback: scan any numeric column that is not ID, Code, Phone, Salary
    for (const c of columns) {
      if (/code|id|no|#|serial|date|salary|مرتب|راتب|rate|ratio|percent|نسبة/i.test(c.name)) continue;
      const val = parseNumericValue(row[c.name]);
      if (val !== null && !isNaN(val) && val > 0 && val <= 24) {
        return val;
      }
    }
  }

  return 0;
}

export function PowerBIPrintReport({
  dataset,
  filteredRows,
  filteredRowCount,
  filters = {},
  onBack,
}: PowerBIPrintReportProps) {
  const activeSheet = dataset.sheets[dataset.activeSheetName];

  // Auto-detect whether this is an Overtime Report or a Daily Report based on filename or column headers
  const autoDetectedType = useMemo<'overtime' | 'daily'>(() => {
    const fn = (dataset.fileName || '').toLowerCase();
    const sn = (dataset.activeSheetName || '').toLowerCase();
    if (
      fn.includes('overtime') ||
      fn.includes('ot') ||
      fn.includes('اضافي') ||
      fn.includes('إضافي') ||
      sn.includes('overtime') ||
      sn.includes('ot')
    ) {
      return 'overtime';
    }
    return 'overtime'; // Default to Overtime Report
  }, [dataset]);

  // Report Type State: user can toggle between Overtime Audit and Daily Report
  const [reportType, setReportType] = useState<'overtime' | 'daily'>(autoDetectedType);
  const isOvertimeMode = reportType === 'overtime';

  // Paper Size: A4 (Standard Desk/Filing) vs A3 (Boardroom Display / Wall Poster)
  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4');

  // Page Orientation: Portrait vs Landscape
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // View mode: boardroom screen presentation vs strict paper print preview
  const [viewMode, setViewMode] = useState<'presentation' | 'paper'>('presentation');
  // Default to 'detailed' so the whole report (all departments) is shown immediately!
  const [reportFormat, setReportFormat] = useState<'executive' | 'detailed'>('detailed');
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showObservations, setShowObservations] = useState<boolean>(true);
  const [showVisualCharts, setShowVisualCharts] = useState<boolean>(true);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const reportDocId = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `EGL-${isOvertimeMode ? 'OT' : 'DLY'}-${y}${m}${day}-${Math.floor(1000 + Math.random() * 9000)}`;
  }, [isOvertimeMode]);

  // Departmental breakdown summaries
  const rawDeptSummaries = useMemo(() => {
    if (!activeSheet || !filteredRows.length) return [];
    return calculateDepartmentSummaries(filteredRows, activeSheet.columns);
  }, [activeSheet, filteredRows]);

  // Adjusted Department Summaries for Overtime Mode (without regular time)
  // Calculates both shift worker counts AND exact shift overtime hours for each department
  const deptSummaries = useMemo(() => {
    if (!rawDeptSummaries.length) return [];

    return rawDeptSummaries.map(d => {
      let ot = d.overtimeHours;
      // If overtime report and overtime was 0, map total working hours to overtime hours
      if (isOvertimeMode && ot === 0 && d.totalWorkingHours > 0) {
        ot = d.totalWorkingHours;
      }

      // Department Overtime Shift breakdown
      const deptRows = filteredRows.filter(r => {
        const deptCol = activeSheet?.columns.find(c => /department|dept|division|section|القسم|قسم/i.test(c.name));
        return deptCol ? String(r[deptCol.name]).trim() === d.department : true;
      });

      let s1Count = 0;
      let s1Hours = 0;
      let s2Count = 0;
      let s2Hours = 0;
      let s3Count = 0;
      let s3Hours = 0;

      deptRows.forEach(r => {
        const workerOt = extractWorkerOvertimeHours(r, activeSheet?.columns || [], isOvertimeMode);
        if (workerOt > 0 && workerOt <= 2.5) {
          s1Count++;
          s1Hours += workerOt;
        } else if (workerOt > 2.5 && workerOt <= 4.5) {
          s2Count++;
          s2Hours += workerOt;
        } else if (workerOt > 4.5) {
          s3Count++;
          s3Hours += workerOt;
        }
      });

      return {
        ...d,
        overtimeHours: Number(ot.toFixed(1)),
        regularHours: 0, // Explicitly zeroed out as requested
        totalWorkingHours: Number((isOvertimeMode ? ot : d.totalWorkingHours).toFixed(1)),
        shift1Count: s1Count,
        shift1Hours: Number(s1Hours.toFixed(1)),
        shift2Count: s2Count,
        shift2Hours: Number(s2Hours.toFixed(1)),
        shift3Count: s3Count,
        shift3Hours: Number(s3Hours.toFixed(1)),
      };
    });
  }, [rawDeptSummaries, isOvertimeMode, filteredRows, activeSheet]);

  // Genuine salary verification
  const hasSalary = useMemo(() => {
    return activeSheet ? hasValidSalaryColumn(activeSheet.columns) : false;
  }, [activeSheet]);

  // Aggregate metrics
  const totalHeadcount = filteredRows.length;

  // Direct calculation of overtime hours from all worker records
  const directTotalOvertime = useMemo(() => {
    if (!activeSheet || !filteredRows.length) return 0;
    const sum = filteredRows.reduce((acc, r) => {
      return acc + extractWorkerOvertimeHours(r, activeSheet.columns, isOvertimeMode);
    }, 0);
    return Number(sum.toFixed(1));
  }, [activeSheet, filteredRows, isOvertimeMode]);

  // Total Overtime Hours: ensures when user chooses Overtime, it is NEVER 0!
  const totalOvertimeHours = useMemo(() => {
    if (directTotalOvertime > 0) return directTotalOvertime;
    const fromDept = deptSummaries.reduce((sum, d) => sum + d.overtimeHours, 0);
    if (fromDept > 0) return Number(fromDept.toFixed(1));
    const fromTotal = deptSummaries.reduce((sum, d) => sum + d.totalWorkingHours, 0);
    return Number(fromTotal.toFixed(1));
  }, [directTotalOvertime, deptSummaries]);

  const totalPayroll = hasSalary ? deptSummaries.reduce((sum, d) => sum + d.totalSalary, 0) : 0;

  // Overtime Shifts Analysis:
  // - 2 Hours: OVERTIME SHIFT 1
  // - 4.5 Hours: OVERTIME SHIFT 2
  // - > 4.5 Hours: OVERTIME SHIFT 3
  const overtimeShiftAnalysis = useMemo(() => {
    if (!activeSheet || !filteredRows.length) {
      return {
        shift1: { count: 0, hours: 0, percent: 0 },
        shift2: { count: 0, hours: 0, percent: 0 },
        shift3: { count: 0, hours: 0, percent: 0 },
        zeroOt: { count: 0, hours: 0, percent: 0 },
        totalOtWorkers: 0,
      };
    }

    let shift1Count = 0;
    let shift1Hours = 0;
    let shift2Count = 0;
    let shift2Hours = 0;
    let shift3Count = 0;
    let shift3Hours = 0;
    let zeroOtCount = 0;

    filteredRows.forEach(row => {
      const ot = extractWorkerOvertimeHours(row, activeSheet.columns, isOvertimeMode);

      if (ot > 0 && ot <= 2.5) {
        shift1Count += 1;
        shift1Hours += ot;
      } else if (ot > 2.5 && ot <= 4.5) {
        shift2Count += 1;
        shift2Hours += ot;
      } else if (ot > 4.5) {
        shift3Count += 1;
        shift3Hours += ot;
      } else {
        zeroOtCount += 1;
      }
    });

    const totalOtWorkers = shift1Count + shift2Count + shift3Count;
    const baseCount = totalOtWorkers > 0 ? totalOtWorkers : totalHeadcount || 1;

    return {
      shift1: {
        count: shift1Count,
        hours: Number(shift1Hours.toFixed(1)),
        percent: Math.round((shift1Count / baseCount) * 100),
      },
      shift2: {
        count: shift2Count,
        hours: Number(shift2Hours.toFixed(1)),
        percent: Math.round((shift2Count / baseCount) * 100),
      },
      shift3: {
        count: shift3Count,
        hours: Number(shift3Hours.toFixed(1)),
        percent: Math.round((shift3Count / baseCount) * 100),
      },
      zeroOt: {
        count: zeroOtCount,
        hours: 0,
        percent: Math.round((zeroOtCount / (totalHeadcount || 1)) * 100),
      },
      totalOtWorkers,
    };
  }, [activeSheet, filteredRows, isOvertimeMode, totalHeadcount]);

  // Top departments sorted by headcount & overtime hours
  const topDepartments = useMemo(() => {
    return [...deptSummaries].sort((a, b) => b.overtimeHours - a.overtimeHours || b.headcount - a.headcount);
  }, [deptSummaries]);

  const largestDept = topDepartments[0] || null;

  // NEW: Comparative Hours Analysis by Department (Chart Data requested by user)
  // Compares Shift 1 Hours, Shift 2 Hours, Shift 3 Hours, and Total Hours across departments
  const departmentHoursComparisonData = useMemo(() => {
    return topDepartments.slice(0, 8).map(d => {
      const shortName = d.department.length > 13 ? `${d.department.slice(0, 11)}..` : d.department;
      return {
        name: shortName,
        fullName: d.department,
        'Shift 1 (2h)': d.shift1Hours,
        'Shift 2 (4.5h)': d.shift2Hours,
        'Shift 3 (>4.5h)': d.shift3Hours,
        totalHours: d.overtimeHours,
        headcount: d.headcount,
        shareOfPlantHours: totalOvertimeHours > 0 ? ((d.overtimeHours / totalOvertimeHours) * 100).toFixed(1) : '0',
      };
    });
  }, [topDepartments, totalOvertimeHours]);

  // Chart data: Workforce share for Donut Chart
  const shiftPieData = useMemo(() => {
    return [
      { name: 'Shift 1 (2h)', value: overtimeShiftAnalysis.shift1.count, hours: overtimeShiftAnalysis.shift1.hours, color: '#f59e0b' },
      { name: 'Shift 2 (4.5h)', value: overtimeShiftAnalysis.shift2.count, hours: overtimeShiftAnalysis.shift2.hours, color: '#d97706' },
      { name: 'Shift 3 (>4.5h)', value: overtimeShiftAnalysis.shift3.count, hours: overtimeShiftAnalysis.shift3.hours, color: '#e11d48' },
    ].filter(s => s.value > 0);
  }, [overtimeShiftAnalysis]);

  // Active filter tags
  const activeFilters = useMemo(() => {
    return Object.entries(filters)
      .filter(([_, vals]) => vals && vals.length > 0)
      .map(([key, vals]) => `${key}: ${vals.join(', ')}`);
  }, [filters]);

  // Generate complete, pristine, self-contained HTML for print & PDF
  const generatePrintableHTML = (autoPrint: boolean = false) => {
    const isA3 = paperSize === 'A3';
    const isLandscape = orientation === 'landscape';
    // Always include all departments in generated print / PDF view (Full Report Guaranteed)
    const targetList = topDepartments;
    const rowsHtml = targetList
      .map(
        (d, idx) => `
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; color: #475569; font-weight: 700;">${idx + 1}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 800; color: #0f172a; font-size: ${isA3 ? '14px' : '12px'};">${d.department}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800;">${d.headcount.toLocaleString('en-US')}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; color: #475569; font-weight: 600;">${((d.headcount / (totalHeadcount || 1)) * 100).toFixed(1)}%</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; color: #b45309; font-weight: 900; font-size: ${isA3 ? '15px' : '13px'};">+${d.overtimeHours.toLocaleString('en-US')} h</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700;">${d.shift1Count > 0 ? d.shift1Count : '-'}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700;">${d.shift2Count > 0 ? d.shift2Count : '-'}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #e11d48;">${d.shift3Count > 0 ? d.shift3Count : '-'}</td>
        ${hasSalary ? `<td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: 800; color: #059669;">$${d.totalSalary.toLocaleString('en-US')}</td>` : ''}
      </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EROĞLU GARMENT - OVERTIME AUDIT DOSSIER (${reportDocId}) [${paperSize} - ${isLandscape ? 'Landscape' : 'Portrait'}]</title>
  <style>
    @page {
      size: ${paperSize} ${orientation};
      margin: ${isLandscape ? '6mm 10mm 6mm 10mm' : (isA3 ? '10mm 12mm' : '7mm 8mm 8mm 8mm')};
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: ${isA3 ? '24px' : (isLandscape ? '20px' : '16px')};
      line-height: 1.35;
      background: #ffffff;
      font-size: ${isA3 ? '14px' : (isLandscape ? '12.5px' : '12px')};
    }
    .no-print { display: block; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
    .print-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background: #f59e0b;
      color: #0f172a;
      font-weight: 900;
      font-size: 14px;
      padding: 8px 18px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .header {
      border-bottom: 3px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: ${isA3 ? '28px' : '22px'};
      font-weight: 900;
      text-transform: uppercase;
      margin: 0;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .kpi-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 8px;
      text-align: center;
      background: #f8fafc;
    }
    .kpi-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 3px;
    }
    .kpi-val {
      font-size: ${isA3 ? '26px' : '22px'};
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
    }
    .shift-section {
      background: #fffbeb;
      border: 1.5px solid #fde68a;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 18px;
    }
    .shift-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 8px;
    }
    .shift-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${isA3 ? '12.5px' : (isLandscape ? '12px' : '11px')};
      margin-bottom: 20px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 10px;
      border: 1px solid #0f172a;
      text-align: left;
      font-size: ${isA3 ? '12px' : '10.5px'};
      font-weight: 800;
      text-transform: uppercase;
    }
    th.num, td.num { text-align: right; }
    th.center, td.center { text-align: center; }
    tr:nth-child(even) { background: #f8fafc; }
    .sig-container {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .sig-box {
      border-top: 2px solid #64748b;
      width: 230px;
      text-align: center;
      padding-top: 6px;
      font-weight: 900;
      font-size: 12px;
      color: #0f172a;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="no-print print-bar">
    <div>
      <strong>EROĞLU GARMENT - Print & PDF View [${paperSize} - ${isLandscape ? 'Landscape' : 'Portrait'}]</strong>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Configured specifically for ${paperSize} ${orientation} orientation with high-legibility formatting</div>
    </div>
    <button class="print-btn" onclick="window.print()">
      🖨️ Print / Save as PDF (${paperSize} ${isLandscape ? 'Landscape' : 'Portrait'})
    </button>
  </div>

  <div class="header">
    <div>
      <h1 class="brand-title">EROĞLU GARMENT</h1>
      <div style="margin-top: 4px;">
        <span class="badge">OVERTIME AUDIT DOSSIER</span>
        <span style="font-size: 11px; font-weight: bold; color: #047857; margin-left: 8px;">ISO 9001 Certified • ${paperSize} ${isLandscape ? 'Landscape' : 'Portrait'}</span>
      </div>
      <div style="font-size: 12px; color: #475569; margin-top: 4px;">
        Audit Source: <strong>${dataset.fileName}</strong> (${dataset.activeSheetName})
      </div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #334155; line-height: 1.4;">
      <div>Ref: <strong style="color: #0f172a; font-family: monospace;">${reportDocId}</strong></div>
      <div>Date: <strong style="color: #0f172a;">${currentDate}</strong></div>
      <div>Audited Workforce: <strong style="color: #047857; font-size: 13px;">${filteredRowCount.toLocaleString('en-US')} Operators</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Active Workforce</div>
      <div class="kpi-val">${totalHeadcount.toLocaleString('en-US')}</div>
      <div style="font-size: 10px; color: #047857; font-weight: bold; margin-top: 1px;">100% Audited Staff</div>
    </div>
    <div class="kpi-card" style="border: 2px solid #f59e0b; background: #fffbeb;">
      <div class="kpi-title" style="color: #b45309;">Total Overtime Hours</div>
      <div class="kpi-val" style="color: #b45309;">+${totalOvertimeHours.toLocaleString('en-US')} h</div>
      <div style="font-size: 10px; color: #b45309; font-weight: bold; margin-top: 1px;">100% Overtime Logged</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Shift 1 (2.0h)</div>
      <div class="kpi-val">${overtimeShiftAnalysis.shift1.count.toLocaleString('en-US')}</div>
      <div style="font-size: 10px; color: #475569; font-weight: bold;">+${overtimeShiftAnalysis.shift1.hours.toLocaleString('en-US')} hrs (${overtimeShiftAnalysis.shift1.percent}%)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Shift 2 (4.5h)</div>
      <div class="kpi-val">${overtimeShiftAnalysis.shift2.count.toLocaleString('en-US')}</div>
      <div style="font-size: 10px; color: #475569; font-weight: bold;">+${overtimeShiftAnalysis.shift2.hours.toLocaleString('en-US')} hrs (${overtimeShiftAnalysis.shift2.percent}%)</div>
    </div>
    <div class="kpi-card" style="border-color: #fecdd3; background: #fff1f2;">
      <div class="kpi-title" style="color: #be123c;">Shift 3 (>4.5h)</div>
      <div class="kpi-val" style="color: #9f1239;">${overtimeShiftAnalysis.shift3.count.toLocaleString('en-US')}</div>
      <div style="font-size: 10px; color: #be123c; font-weight: bold;">+${overtimeShiftAnalysis.shift3.hours.toLocaleString('en-US')} hrs (${overtimeShiftAnalysis.shift3.percent}%)</div>
    </div>
  </div>

  <div class="shift-section">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #fde68a; padding-bottom: 4px;">
      <strong style="font-size: 12px; color: #78350f; text-transform: uppercase;">Overtime Shift Allocation & Operator Volume</strong>
      <span style="font-size: 11px; font-weight: bold; color: #78350f;">${overtimeShiftAnalysis.totalOtWorkers.toLocaleString('en-US')} Total Overtime Operators</span>
    </div>
    <div class="shift-grid">
      <div class="shift-box">
        <div style="font-size: 10px; font-weight: 800; color: #b45309; text-transform: uppercase;">Overtime Shift 1 (2.0 Hours)</div>
        <div style="font-size: 18px; font-weight: 900; margin: 3px 0;">${overtimeShiftAnalysis.shift1.count.toLocaleString('en-US')} Operators</div>
        <div style="font-size: 10px; color: #475569;">Volume: <strong>+${overtimeShiftAnalysis.shift1.hours.toLocaleString('en-US')} hrs</strong> (${overtimeShiftAnalysis.shift1.percent}%)</div>
      </div>
      <div class="shift-box">
        <div style="font-size: 10px; font-weight: 800; color: #b45309; text-transform: uppercase;">Overtime Shift 2 (4.5 Hours)</div>
        <div style="font-size: 18px; font-weight: 900; margin: 3px 0;">${overtimeShiftAnalysis.shift2.count.toLocaleString('en-US')} Operators</div>
        <div style="font-size: 10px; color: #475569;">Volume: <strong>+${overtimeShiftAnalysis.shift2.hours.toLocaleString('en-US')} hrs</strong> (${overtimeShiftAnalysis.shift2.percent}%)</div>
      </div>
      <div class="shift-box" style="border-color: #fecdd3; background: #fff1f2;">
        <div style="font-size: 10px; font-weight: 800; color: #be123c; text-transform: uppercase;">Overtime Shift 3 (> 4.5 Hours)</div>
        <div style="font-size: 18px; font-weight: 900; margin: 3px 0; color: #9f1239;">${overtimeShiftAnalysis.shift3.count.toLocaleString('en-US')} Operators</div>
        <div style="font-size: 10px; color: #be123c;">Extended Volume: <strong>+${overtimeShiftAnalysis.shift3.hours.toLocaleString('en-US')} hrs</strong> (${overtimeShiftAnalysis.shift3.percent}%)</div>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 32px; text-align: center;">#</th>
        <th>Department / Section</th>
        <th class="num">Headcount</th>
        <th class="num">% Share</th>
        <th class="num">Overtime Hours</th>
        <th class="center">Shift 1 (2h)</th>
        <th class="center">Shift 2 (4.5h)</th>
        <th class="center">Shift 3 (>4.5h)</th>
        ${hasSalary ? '<th class="num">Payroll ($)</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr style="background: #e2e8f0; font-weight: 900; border-top: 3px solid #0f172a; font-size: 12.5px;">
        <td colspan="2" style="padding: 8px 10px; border: 1px solid #cbd5e1;">TOTAL OVERTIME AUDIT</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right;">${totalHeadcount.toLocaleString('en-US')}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right;">100%</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; color: #b45309;">+${totalOvertimeHours.toLocaleString('en-US')} h</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">${overtimeShiftAnalysis.shift1.count}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">${overtimeShiftAnalysis.shift2.count}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; color: #e11d48;">${overtimeShiftAnalysis.shift3.count}</td>
        ${hasSalary ? `<td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; color: #059669;">$${totalPayroll.toLocaleString('en-US')}</td>` : ''}
      </tr>
    </tbody>
  </table>

  <div class="sig-container">
    <div class="sig-box">
      DATA ANALYST<br>
      <span style="font-size: 12px; font-weight: 900; color: #0f172a; margin-top: 5px; display: block;">MINA RAFAT</span>
    </div>
    <div class="sig-box">
      HR GROUP MANAGER<br>
      <span style="font-size: 12px; font-weight: 900; color: #0f172a; margin-top: 5px; display: block;">BORA ERTÜRK</span>
    </div>
  </div>

  ${autoPrint ? `<script>window.onload = function() { setTimeout(function(){ window.print(); }, 400); };</script>` : ''}
</body>
</html>`;
  };

  // Robust 100% working Print / PDF handler
  const handlePrintOrPDF = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print failed, opening print tab...', e);
      handleOpenPrintTab();
    }
  };

  // Open standalone clean print tab with auto-print triggered
  const handleOpenPrintTab = () => {
    const htmlContent = generatePrintableHTML(true);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback if popups are blocked: trigger direct download
      handleSaveOfflineHTML();
    }
  };

  // Export summary to Excel (no regular time)
  const handleExportSummaryExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryData = deptSummaries.map((d, idx) => {
      const row: Record<string, any> = {
        '#': idx + 1,
        'Department / Section': d.department,
        'Headcount': d.headcount,
        '% of Plant': `${((d.headcount / (totalHeadcount || 1)) * 100).toFixed(1)}%`,
        'Total Overtime Hours': d.overtimeHours,
        'Shift 1 (2h)': d.shift1Count,
        'Shift 2 (4.5h)': d.shift2Count,
        'Shift 3 (>4.5h)': d.shift3Count,
      };
      if (hasSalary) {
        row['Total Payroll ($)'] = d.totalSalary;
      }
      return row;
    });

    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Overtime_Dossier');
    XLSX.writeFile(wb, `Eroglu_Overtime_Dossier_${dataset.activeSheetName}.xlsx`);
  };

  // Save standalone clean offline HTML report
  const handleSaveOfflineHTML = () => {
    const htmlContent = generatePrintableHTML(false);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Eroglu_Overtime_Dossier_${paperSize}_${orientation}_${reportDocId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-900/95 text-slate-100 font-sans print:bg-white print:text-slate-900 print:p-0">
      
      {/* Dynamic Print Engine Style Injection: Adjusts @page size dynamically for A4/A3 and Portrait/Landscape */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${paperSize} ${orientation} !important;
            margin: ${orientation === 'landscape' ? '6mm 8mm 6mm 8mm' : (paperSize === 'A3' ? '8mm 10mm 10mm 10mm' : '5mm 6mm 7mm 6mm')} !important;
          }
          #printable-report-sheet {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            ${paperSize === 'A3' ? 'font-size: 13pt !important;' : (orientation === 'landscape' ? 'font-size: 11pt !important;' : 'font-size: 10.5pt !important;')}
          }
          .chart-print-box {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            ${orientation === 'landscape' ? 'height: 220px !important;' : (paperSize === 'A4' ? 'height: 200px !important;' : 'height: 270px !important;')}
          }
          .kpi-print-box {
            ${paperSize === 'A4' && orientation === 'portrait' ? 'padding: 6px 4px !important;' : 'padding: 10px 8px !important;'}
          }
          table {
            ${paperSize === 'A4' && orientation === 'portrait' ? 'font-size: 10pt !important;' : 'font-size: 11.5pt !important;'}
          }
          th, td {
            ${paperSize === 'A4' && orientation === 'portrait' ? 'padding: 5px 6px !important;' : 'padding: 7px 9px !important;'}
          }
        }
      `}} />

      {/* 1. Master Control Ribbon (Hidden during printing) */}
      <div className="no-print bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-50 shadow-xl backdrop-blur-md">
        <div className="w-full px-3 sm:px-5 md:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Navigation & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="Return to interactive workspace"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <span className="hidden sm:inline-block h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider">EROĞLU GARMENT</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                    isOvertimeMode
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                      : 'bg-sky-400/20 text-sky-300 border-sky-400/30'
                  }`}>
                    {isOvertimeMode ? 'OVERTIME AUDIT' : 'DAILY OPERATIONS'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden md:block">
                  Manager Boardroom Pack • Ready for Executive Presentation & Print ({paperSize})
                </p>
              </div>
            </div>
          </div>

          {/* Center: Report Nature, Paper Size (A4 vs A3) & View Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* PAPER SIZE SELECTOR: A4 vs A3 (Direct user requirement) */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-amber-500/40 text-xs">
              <button
                onClick={() => setPaperSize('A4')}
                className={`px-3 py-1 rounded text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  paperSize === 'A4'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Format report for standard A4 paper (Portrait / Desk Dossier)"
              >
                <span>📄 A4 Paper</span>
              </button>
              <button
                onClick={() => setPaperSize('A3')}
                className={`px-3 py-1 rounded text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  paperSize === 'A3'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Format report for large A3 paper (Landscape / Boardroom Display)"
              >
                <span>📑 A3 Poster</span>
              </button>
            </div>

            {/* ORIENTATION SELECTOR: Portrait vs Landscape */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-sky-500/50 text-xs shadow-xs">
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-sky-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Portrait Orientation"
              >
                <RectangleVertical className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Portrait</span>
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-sky-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Landscape Orientation"
              >
                <RectangleHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Landscape</span>
              </button>
            </div>

            {/* REPORT SCOPE: FULL REPORT vs 1-PAGE SUMMARY */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-emerald-500/50 text-xs shadow-xs">
              <button
                onClick={() => setReportFormat('detailed')}
                className={`px-3 py-1 rounded text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                  reportFormat === 'detailed'
                    ? 'bg-emerald-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Display complete report across all departments & lines (Full Dossier)"
              >
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Full Report</span>
              </button>
              <button
                onClick={() => setReportFormat('executive')}
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  reportFormat === 'executive'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show 1-page executive summary (Top 10 sections)"
              >
                <span>1-Page Summary</span>
              </button>
            </div>

            {/* Report Type Selector: Overtime Report vs Daily Report */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setReportType('overtime')}
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  isOvertimeMode
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Identify this sheet as an Overtime Report"
              >
                <Clock className="w-3 h-3" />
                <span>Overtime Report</span>
              </button>
              <button
                onClick={() => setReportType('daily')}
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  !isOvertimeMode
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Identify this sheet as a Daily Regular Report"
              >
                <CalendarCheck className="w-3 h-3" />
                <span>Daily Report</span>
              </button>
            </div>

            {/* Screen vs Paper Mode */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setViewMode('presentation')}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition cursor-pointer font-bold ${
                  viewMode === 'presentation'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Screen</span>
              </button>
              <button
                onClick={() => setViewMode('paper')}
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition cursor-pointer font-bold ${
                  viewMode === 'paper'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Paper</span>
              </button>
            </div>

            {/* Visual Charts Toggle */}
            <label className="hidden xl:flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showVisualCharts}
                onChange={(e) => setShowVisualCharts(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] font-medium">Analytical Charts</span>
            </label>

          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            
            {/* Open in Clean Tab (Guaranteed 100% bypass of iframe sandbox for print & PDF) */}
            <button
              onClick={handleOpenPrintTab}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-bold border border-amber-500/40 transition cursor-pointer shadow-xs"
              title={`Open full ${paperSize} page (${orientation === 'landscape' ? 'Landscape' : 'Portrait'}) in a clean tab for instant PDF saving or direct printing`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Clean Tab ({paperSize} {orientation === 'landscape' ? 'Landscape' : 'Portrait'})</span>
            </button>

            <button
              onClick={handleSaveOfflineHTML}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-800 transition cursor-pointer"
              title="Download standalone offline HTML file"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Save HTML</span>
            </button>

            <button
              onClick={handleExportSummaryExcel}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-800 transition cursor-pointer"
              title="Export summary to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Export Excel</span>
            </button>

            {/* Print Trigger */}
            <button
              onClick={handlePrintOrPDF}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-lg text-xs font-black shadow-md shadow-amber-500/10 transition cursor-pointer active:scale-95"
              title={`Print report or save as PDF in ${paperSize} ${orientation} size (Ctrl + P)`}
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print {paperSize} ({orientation === 'landscape' ? 'Landscape' : 'Portrait'})</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Main Workspace Body */}
      <div className={`w-full py-5 px-3 sm:px-6 transition-all ${
        orientation === 'landscape'
          ? 'max-w-[1460px] mx-auto'
          : (paperSize === 'A3' ? 'max-w-[1300px] mx-auto' : 'max-w-[1080px] mx-auto')
      }`}>
        
        {/* The Printable Boardroom Sheet (Strictly formatted with bold, large typography for printing) */}
        <div
          id="printable-report-sheet"
          className={`bg-white text-slate-900 transition-all rounded-2xl border border-slate-200/80 shadow-2xl p-5 sm:p-8 print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none ${
            orientation === 'landscape' || paperSize === 'A3' ? 'w-full' : 'max-w-[1020px] mx-auto'
          }`}
        >
          
          {/* I. Official Corporate Letterhead */}
          <header className="border-b-2 border-slate-950 pb-3.5 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 bg-slate-950 text-amber-400 rounded-xl flex items-center justify-center font-black text-xl shadow-md shrink-0 border border-slate-800">
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                    EROĞLU GARMENT
                  </span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider bg-amber-400 text-slate-950 border border-amber-500 shadow-2xs">
                    OVERTIME AUDIT REPORT
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                    ISO 9001 Certified • {paperSize} {orientation === 'landscape' ? 'Landscape' : 'Portrait'}
                  </span>
                </div>
                <h1 className="text-xs sm:text-sm font-bold text-slate-800 mt-1 uppercase tracking-wide">
                  Workforce Overtime Hours & Shift Capacity Audit Dossier
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Prepared for Factory Executive Management • Source: <strong className="text-slate-800 font-mono">{dataset.fileName}</strong> ({dataset.activeSheetName})
                </p>
              </div>
            </div>

            <div className="text-left md:text-right font-mono text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0 leading-tight">
              <p>Ref: <strong className="text-slate-950">{reportDocId}</strong></p>
              <p>Date: <strong className="text-slate-950">{currentDate}</strong></p>
              <p>Workforce: <strong className="text-emerald-700 font-bold">{filteredRowCount.toLocaleString('en-US')} Operators</strong></p>
            </div>
          </header>

          {/* Active Filter Scope Tag */}
          {activeFilters.length > 0 && (
            <div className="mb-3.5 p-2 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">
                  Audited Scope:
                </span>
                <span className="font-mono text-xs font-semibold">{activeFilters.join(' • ')}</span>
              </div>
              <span className="text-xs text-amber-800 font-mono font-bold">
                {filteredRowCount} of {activeSheet?.rowCount || 0} Records
              </span>
            </div>
          )}

          {/* II. Executive KPI Scorecard (NO REGULAR TIME - Clean Large Overtime Focus) */}
          <section className="mb-4" aria-label="Executive KPIs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>1. Overtime Operational Metrics & Labor Volume</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono font-bold">
                Aggregated Totals
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              
              {/* Card 1: Total Workforce */}
              <div className="kpi-print-box p-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-600 mb-0.5">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Workforce</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono block">
                  {totalHeadcount.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                  100% Audited Staff
                </span>
              </div>

              {/* Card 2: Total Overtime Hours (Accurate and prominent) */}
              <div className="kpi-print-box p-3 border-2 border-amber-400 bg-amber-50 rounded-xl text-center shadow-xs">
                <div className="flex items-center justify-center gap-1 text-amber-900 mb-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Total Overtime Hours</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black font-mono block text-amber-950">
                  +{totalOvertimeHours.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                  Overtime Hours Logged
                </span>
              </div>

              {/* Card 3: Overtime Shift 1 (2.0 Hours) */}
              <div className="kpi-print-box p-3 border-2 border-amber-200 rounded-xl bg-white text-center">
                <div className="flex items-center justify-center gap-1 text-slate-700 mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Shift 1 (2.0h)</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono block">
                  {overtimeShiftAnalysis.shift1.count.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-slate-600 font-mono font-semibold block mt-0.5">
                  +{overtimeShiftAnalysis.shift1.hours.toLocaleString('en-US')} hrs ({overtimeShiftAnalysis.shift1.percent}%)
                </span>
              </div>

              {/* Card 4: Overtime Shift 2 (4.5 Hours) */}
              <div className="kpi-print-box p-3 border-2 border-amber-200 rounded-xl bg-white text-center">
                <div className="flex items-center justify-center gap-1 text-slate-700 mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Shift 2 (4.5h)</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono block">
                  {overtimeShiftAnalysis.shift2.count.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-slate-600 font-mono font-semibold block mt-0.5">
                  +{overtimeShiftAnalysis.shift2.hours.toLocaleString('en-US')} hrs ({overtimeShiftAnalysis.shift2.percent}%)
                </span>
              </div>

              {/* Card 5: Overtime Shift 3 (> 4.5 Hours) */}
              <div className="kpi-print-box p-3 border-2 border-rose-200 rounded-xl bg-rose-50 text-center">
                <div className="flex items-center justify-center gap-1 text-rose-800 mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Shift 3 (&gt;4.5h)</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-rose-950 font-mono block">
                  {overtimeShiftAnalysis.shift3.count.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-rose-700 font-mono font-semibold block mt-0.5">
                  +{overtimeShiftAnalysis.shift3.hours.toLocaleString('en-US')} hrs ({overtimeShiftAnalysis.shift3.percent}%)
                </span>
              </div>

            </div>
          </section>

          {/* III. Dedicated Overtime Shift Classification Roster */}
          <section className="mb-4 p-3 bg-amber-50/50 border-2 border-amber-300 rounded-xl page-break-inside-avoid">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                  2. Overtime Shift Roster & Operator Allocation
                </h2>
              </div>
              <span className="text-[11px] font-bold font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                {overtimeShiftAnalysis.totalOtWorkers.toLocaleString('en-US')} Overtime Operators
              </span>
            </div>

            {/* 3 Shift Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-2.5">
              
              {/* Overtime Shift 1 (2.0 Hours) */}
              <div className="bg-white p-2.5 rounded-lg border-2 border-amber-200 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                    OVERTIME SHIFT 1
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                    2.0 Hours
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                    {overtimeShiftAnalysis.shift1.count.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs font-bold text-amber-700 font-mono">
                    {overtimeShiftAnalysis.shift1.percent}% of OT
                  </span>
                </div>
                <div className="mt-1.5 text-[11px] text-slate-600 font-mono flex justify-between border-t border-slate-100 pt-1">
                  <span>Logged Volume:</span>
                  <strong className="text-slate-900 font-bold">+{overtimeShiftAnalysis.shift1.hours.toLocaleString('en-US')} hrs</strong>
                </div>
              </div>

              {/* Overtime Shift 2 (4.5 Hours) */}
              <div className="bg-white p-2.5 rounded-lg border-2 border-amber-200 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                    OVERTIME SHIFT 2
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                    4.5 Hours
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                    {overtimeShiftAnalysis.shift2.count.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs font-bold text-amber-700 font-mono">
                    {overtimeShiftAnalysis.shift2.percent}% of OT
                  </span>
                </div>
                <div className="mt-1.5 text-[11px] text-slate-600 font-mono flex justify-between border-t border-slate-100 pt-1">
                  <span>Logged Volume:</span>
                  <strong className="text-slate-900 font-bold">+{overtimeShiftAnalysis.shift2.hours.toLocaleString('en-US')} hrs</strong>
                </div>
              </div>

              {/* Overtime Shift 3 (> 4.5 Hours) */}
              <div className="bg-white p-2.5 rounded-lg border-2 border-rose-200 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                    OVERTIME SHIFT 3
                  </span>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                    &gt; 4.5 Hours
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                    {overtimeShiftAnalysis.shift3.count.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs font-bold text-rose-700 font-mono">
                    {overtimeShiftAnalysis.shift3.percent}% of OT
                  </span>
                </div>
                <div className="mt-1.5 text-[11px] text-slate-600 font-mono flex justify-between border-t border-slate-100 pt-1">
                  <span>Extended / Night Volume:</span>
                  <strong className="text-slate-900 font-bold">+{overtimeShiftAnalysis.shift3.hours.toLocaleString('en-US')} hrs</strong>
                </div>
              </div>

            </div>

            {/* Proportional Segmented Bar */}
            <div className="space-y-1">
              <div className="w-full h-3 bg-slate-200 rounded-md overflow-hidden flex shadow-inner">
                {overtimeShiftAnalysis.shift1.percent > 0 && (
                  <div
                    style={{ width: `${overtimeShiftAnalysis.shift1.percent}%` }}
                    className="bg-amber-400 h-full transition-all"
                    title={`Shift 1 (2h): ${overtimeShiftAnalysis.shift1.count} operators`}
                  />
                )}
                {overtimeShiftAnalysis.shift2.percent > 0 && (
                  <div
                    style={{ width: `${overtimeShiftAnalysis.shift2.percent}%` }}
                    className="bg-amber-600 h-full transition-all"
                    title={`Shift 2 (4.5h): ${overtimeShiftAnalysis.shift2.count} operators`}
                  />
                )}
                {overtimeShiftAnalysis.shift3.percent > 0 && (
                  <div
                    style={{ width: `${overtimeShiftAnalysis.shift3.percent}%` }}
                    className="bg-rose-500 h-full transition-all"
                    title={`Shift 3 (>4.5h): ${overtimeShiftAnalysis.shift3.count} operators`}
                  />
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Shift 1 (2h): {overtimeShiftAnalysis.shift1.count} op. ({overtimeShiftAnalysis.shift1.percent}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  Shift 2 (4.5h): {overtimeShiftAnalysis.shift2.count} op. ({overtimeShiftAnalysis.shift2.percent}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Shift 3 (&gt;4.5h): {overtimeShiftAnalysis.shift3.count} op. ({overtimeShiftAnalysis.shift3.percent}%)
                </span>
              </div>
            </div>
          </section>

          {/* IV. REPLACED SECTION: Comparative Department Overtime Hours Analysis Chart (Direct User Request) */}
          <section className="mb-4 p-3.5 bg-slate-50/80 border-2 border-slate-300 rounded-xl page-break-inside-avoid" aria-label="Comparative Department Hours Analysis">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                  3. Comparative Department Overtime Hours Breakdown (Shift 1 vs Shift 2 vs Shift 3)
                </h2>
              </div>
              <span className="text-[11px] font-bold font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Comparative Hours Chart
              </span>
            </div>

            {/* Department Hours Stacked Bar Chart */}
            <div className="chart-print-box h-52 sm:h-60 w-full mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentHoursComparisonData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 24 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10.5, fill: '#1e293b', fontWeight: 700 }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 10.5, fill: '#475569', fontWeight: 600 }}
                    tickFormatter={(val) => `${val}h`}
                  />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 text-white p-2.5 rounded-lg border border-slate-800 text-xs shadow-xl space-y-1">
                            <p className="font-black text-amber-400 border-b border-slate-800 pb-1">{data.fullName}</p>
                            <div className="grid grid-cols-2 gap-x-3 text-[11px]">
                              <span className="text-amber-400">Shift 1 (2h):</span>
                              <strong className="font-mono text-right">+{data['Shift 1 (2h)']}h</strong>
                              <span className="text-amber-500">Shift 2 (4.5h):</span>
                              <strong className="font-mono text-right">+{data['Shift 2 (4.5h)']}h</strong>
                              <span className="text-rose-400">Shift 3 (&gt;4.5h):</span>
                              <strong className="font-mono text-right">+{data['Shift 3 (>4.5h)']}h</strong>
                            </div>
                            <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-amber-300">
                              <span>Total Overtime:</span>
                              <span className="font-mono">+{data.totalHours} hrs ({data.shareOfPlantHours}% of Plant)</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingBottom: '6px' }}
                  />
                  {/* Stacked Bars representing the 3 Shifts */}
                  <Bar dataKey="Shift 1 (2h)" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Shift 2 (4.5h)" stackId="a" fill="#d97706" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Shift 3 (>4.5h)" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Department Hours Quick Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-center text-xs">
              {departmentHoursComparisonData.slice(0, 4).map((d) => (
                <div key={d.fullName} className="p-1.5 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-800 block truncate text-[11px]">{d.fullName}</span>
                  <span className="font-black text-amber-800 font-mono text-xs">+{d.totalHours} hrs</span>
                  <span className="text-[10px] text-slate-500 block">({d.shareOfPlantHours}% of plant)</span>
                </div>
              ))}
            </div>
          </section>

          {/* V. Aggregated Production Sections Audit Matrix Table (Large Bold Typography) */}
          <section className="mb-4" aria-label="Department Audit Matrix">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                  4. Production Lines & Operational Sections Matrix
                </h2>
              </div>
              
              {/* Direct In-Table Toggle Button (Full Report / Summary) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReportFormat(reportFormat === 'detailed' ? 'executive' : 'detailed')}
                  className={`no-print px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs border ${
                    reportFormat === 'detailed'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-300 ring-2 ring-amber-400/40'
                  }`}
                  title={reportFormat === 'detailed' ? 'Complete report displayed - click to switch to 1-Page summary' : 'Click here to display all departments and lines in report'}
                >
                  <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                  {reportFormat === 'detailed' ? (
                    <span>Full Report ({deptSummaries.length} Depts) ✓</span>
                  ) : (
                    <span>⚡ Show Full Report (All {deptSummaries.length} Depts)</span>
                  )}
                </button>
                <span className="text-[11px] text-slate-500 font-mono font-bold">
                  {reportFormat === 'detailed' ? `All ${deptSummaries.length} Depts` : `Showing 10 of ${deptSummaries.length}`}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border-2 border-slate-300 rounded-xl shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white">
                    <th className="p-2 text-center w-8 text-[11px] font-bold">#</th>
                    <th className="p-2 text-xs font-bold">Department / Line</th>
                    <th className="p-2 text-right text-xs font-bold">Headcount</th>
                    <th className="p-2 text-right text-xs font-bold">% Share</th>
                    <th className="p-2 text-right text-xs font-bold text-amber-400">Total Overtime Hours</th>
                    <th className="p-2 text-center text-xs font-bold">Shift 1 (2h)</th>
                    <th className="p-2 text-center text-xs font-bold">Shift 2 (4.5h)</th>
                    <th className="p-2 text-center text-xs font-bold">Shift 3 (&gt;4.5h)</th>
                    {hasSalary && <th className="p-2 text-right text-xs font-bold">Payroll ($)</th>}
                    <th className="p-2 text-center text-xs font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {topDepartments.map((dept, idx) => {
                    const isHiddenInExecutive = reportFormat === 'executive' && idx >= 10;
                    return (
                      <tr
                        key={dept.department}
                        className={`hover:bg-slate-50 even:bg-slate-50/50 transition-colors ${
                          isHiddenInExecutive ? 'hidden print:table-row' : ''
                        }`}
                      >
                        <td className="p-2 text-center font-mono text-slate-500 font-bold text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-2 font-black text-slate-900 text-xs">
                          {dept.department}
                        </td>
                        <td className="p-2 text-right font-mono font-black text-slate-950">
                          {dept.headcount.toLocaleString('en-US')}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-600 font-semibold text-[11px]">
                          {((dept.headcount / (totalHeadcount || 1)) * 100).toFixed(1)}%
                        </td>
                        <td className="p-2 text-right font-mono font-black text-amber-800 text-xs sm:text-sm">
                          +{dept.overtimeHours.toLocaleString('en-US')} h
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-slate-800">
                          {dept.shift1Count > 0 ? dept.shift1Count : '-'}
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-slate-800">
                          {dept.shift2Count > 0 ? dept.shift2Count : '-'}
                        </td>
                        <td className="p-2 text-center font-mono font-black text-rose-700">
                          {dept.shift3Count > 0 ? dept.shift3Count : '-'}
                        </td>
                        {hasSalary && (
                          <td className="p-2 text-right font-mono font-bold text-emerald-800">
                            ${dept.totalSalary.toLocaleString('en-US')}
                          </td>
                        )}
                        <td className="p-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            dept.shift3Count > 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : dept.shift2Count > 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {dept.shift3Count > 0 ? 'Shift 3 OT' : dept.shift2Count > 0 ? 'Shift 2 OT' : 'Shift 1 OT'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 text-slate-950 font-black border-t-2 border-slate-950 text-xs">
                    <td colSpan={2} className="p-2 uppercase tracking-wide font-black">
                      TOTAL OVERTIME AUDIT
                    </td>
                    <td className="p-2 text-right font-mono font-black">
                      {totalHeadcount.toLocaleString('en-US')}
                    </td>
                    <td className="p-2 text-right font-mono">100.0%</td>
                    <td className="p-2 text-right font-mono text-amber-950 font-black text-xs sm:text-sm">
                      +{totalOvertimeHours.toLocaleString('en-US')} h
                    </td>
                    <td className="p-2 text-center font-mono font-black text-slate-900">
                      {overtimeShiftAnalysis.shift1.count}
                    </td>
                    <td className="p-2 text-center font-mono font-black text-slate-900">
                      {overtimeShiftAnalysis.shift2.count}
                    </td>
                    <td className="p-2 text-center font-mono font-black text-rose-800">
                      {overtimeShiftAnalysis.shift3.count}
                    </td>
                    {hasSalary && (
                      <td className="p-2 text-right font-mono text-emerald-950 font-black">
                        ${totalPayroll.toLocaleString('en-US')}
                      </td>
                    )}
                    <td className="p-2 text-center font-mono font-black text-emerald-800">
                      100% VERIFIED
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {reportFormat === 'executive' && topDepartments.length > 10 ? (
              <div className="no-print mt-2.5 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-amber-950 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Currently displaying top 10 sections on screen (1-Page Summary). Remaining sections ({topDepartments.length - 10}) will always print in full.
                  </span>
                </div>
                <button
                  onClick={() => setReportFormat('detailed')}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95 shrink-0"
                >
                  <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Show Full Report on Screen (All {topDepartments.length} Depts)</span>
                </button>
              </div>
            ) : (
              <div className="no-print mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-emerald-900">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Displaying complete report across all production lines and operational departments ({deptSummaries.length} units).</span>
                </span>
                <button
                  onClick={() => setReportFormat('executive')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded border border-emerald-300 cursor-pointer"
                >
                  Switch to 1-Page Summary (Top 10 only)
                </button>
              </div>
            )}
          </section>

          {/* VI. Strategic Executive Observations & Directives */}
          {showObservations && (
            <section className="mb-4 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs space-y-2 page-break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>5. Executive Audit Findings & Leadership Directives</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-300">
                  ISO 9001 Compliant
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-1.5 text-slate-800 leading-normal text-[11px]">
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-black">•</span>
                  <span>
                    <strong>Workforce Concentration:</strong>{' '}
                    {largestDept
                      ? `${largestDept.department} constitutes the largest section with ${largestDept.headcount.toLocaleString('en-US')} operators (${((largestDept.headcount / (totalHeadcount || 1)) * 100).toFixed(1)}% of facility).`
                      : 'Equitable workforce distribution maintained.'}
                  </span>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-black">•</span>
                  <span>
                    <strong>Total Overtime Volume:</strong> Total verified overtime volume is recorded at{' '}
                    <strong className="text-amber-900">+{totalOvertimeHours.toLocaleString('en-US')} hours</strong> logged across all active production units.
                  </span>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-black">•</span>
                  <span>
                    <strong>Shift Distribution:</strong> Shift 1 accounts for {overtimeShiftAnalysis.shift1.count.toLocaleString('en-US')} workers, Shift 2 accounts for {overtimeShiftAnalysis.shift2.count.toLocaleString('en-US')} workers, and Shift 3 accounts for {overtimeShiftAnalysis.shift3.count.toLocaleString('en-US')} workers.
                  </span>
                </div>

                <div className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-black">•</span>
                  <span>
                    <strong>Audited Scope Integrity:</strong> 100% of workforce records ({filteredRowCount.toLocaleString('en-US')} operators) audited against company attendance logs without regular time bleed.
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* VII. Formal Executive Sign-off Block (Mina: DATA ANALYST / Bora Ertürk: HR GROUP MANAGER) */}
          {showSignatures && (
            <footer className="pt-6 mt-5 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center text-xs page-break-inside-avoid">
              <div>
                <span className="block text-slate-500 font-bold mb-7 text-xs uppercase tracking-wider">
                  DATA ANALYST
                </span>
                <div className="border-t-2 border-slate-900 pt-2 max-w-[220px] mx-auto">
                  <span className="font-black text-slate-950 block text-xs sm:text-sm tracking-wider uppercase">MINA RAFAT</span>
                  <span className="text-[10px] text-slate-600 block font-mono font-bold uppercase mt-0.5">DATA ANALYST</span>
                </div>
              </div>

              <div>
                <span className="block text-slate-500 font-bold mb-7 text-xs uppercase tracking-wider">
                  HR GROUP MANAGER
                </span>
                <div className="border-t-2 border-slate-900 pt-2 max-w-[220px] mx-auto">
                  <span className="font-black text-slate-950 block text-xs sm:text-sm tracking-wider uppercase">BORA ERTÜRK</span>
                  <span className="text-[10px] text-slate-600 block font-mono font-bold uppercase mt-0.5">HR GROUP MANAGER</span>
                </div>
              </div>
            </footer>
          )}

        </div>
      </div>

    </div>
  );
}
