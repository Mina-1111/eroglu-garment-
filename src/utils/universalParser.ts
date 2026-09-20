import { ColumnDataType, ColumnProfile, DepartmentSummary, QuickInsightItem, SheetData, UniversalDataset } from '../types/powerbi';
import { INITIAL_EMPLOYEES } from '../data/initialData';
import * as XLSX from 'xlsx';

/**
 * Universal safe parser for numeric values in Excel/CSV
 * Handles formatted numbers, currency symbols, Arabic-Indic numerals, and hour units (e.g., '24 hrs', '24h', '1,250')
 */
export function parseNumericValue(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'boolean') return null;

  if (typeof val === 'string') {
    let cleanStr = val.trim();

    // Convert Eastern Arabic and Persian digits to standard Western digits (e.g. ٢٠٨ -> 208)
    const arabicEasternMap: Record<string, string> = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    };
    cleanStr = cleanStr.replace(/[٠-٩۰-۹]/g, d => arabicEasternMap[d] || d);

    // Check for time format 'HH:MM' or 'HH:MM:SS' (supports up to 6-digit hours, e.g. 192:30 or 1200:00)
    const timeMatch = cleanStr.match(/^(\d{1,6}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      return Number((hours + minutes / 60).toFixed(2));
    }

    // Handle European comma decimal (e.g., '24,5' -> '24.5') if not a thousands separator
    if (/^\d+,\d{1,2}$/.test(cleanStr)) {
      cleanStr = cleanStr.replace(',', '.');
    }

    // Strip units, commas, spaces, currency symbols
    cleanStr = cleanStr
      .replace(/[,$,%£€¥]/g, '')
      .replace(/\b(hrs?|hours?|h|ساعة|ساعات|egp|usd)\b/gi, '')
      .trim();

    if (cleanStr === '') return null;
    const num = Number(cleanStr);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Normalizes categorical names (e.g., department titles) to avoid splitting
 * identical divisions due to trailing spaces, non-breaking spaces, or Arabic spelling variations
 * (e.g., 'خياطة' vs 'خياطه', 'إنتاج' vs 'انتاج')
 */
export function canonicalCategoryKey(name: any): string {
  if (!name) return 'unassigned';
  let str = String(name).trim().toLowerCase();
  if (!str) return 'unassigned';
  // Remove non-breaking spaces & collapse whitespaces
  str = str
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ');
  // Arabic character normalization
  str = str
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, ''); // Remove Arabic tatweel
  return str;
}

/**
 * Checks if a row is an Excel subtotal, grand total, or empty summary row
 */
export function isSummaryOrTotalRow(row: Record<string, any>): boolean {
  const vals = Object.values(row).filter(v => v !== null && v !== undefined && v !== '');
  if (vals.length === 0) return true;

  for (const v of vals) {
    if (typeof v === 'string') {
      const clean = v.trim();
      if (/^(total|grand\s*total|sum|summary|إجمالي|الاجمالي|المجموع|مجموع|المجموع\s*الكلي|total\s*hours|إجمالي\s*الساعات|كشف.*|تقرير.*)$/i.test(clean)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if a value is a date
 */
function isDateValue(val: any): boolean {
  if (val instanceof Date && !isNaN(val.getTime())) return true;
  if (typeof val === 'string') {
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(val)) {
      const parsed = Date.parse(val);
      return !isNaN(parsed);
    }
  }
  return false;
}

/**
 * Profiles all columns in a dataset for dynamic visualization
 */
export function profileSheetColumns(rows: Record<string, any>[]): ColumnProfile[] {
  if (!rows || rows.length === 0) return [];

  const allKeys = new Set<string>();
  rows.forEach(row => {
    Object.keys(row).forEach(k => {
      if (k && !k.startsWith('__EMPTY')) {
        allKeys.add(k);
      }
    });
  });

  const profiles: ColumnProfile[] = [];

  allKeys.forEach(colName => {
    const values: any[] = [];
    let numericCount = 0;
    let dateCount = 0;
    let nullCount = 0;

    rows.forEach(r => {
      const val = r[colName];
      if (val === null || val === undefined || val === '') {
        nullCount++;
      } else {
        values.push(val);
        if (parseNumericValue(val) !== null) {
          numericCount++;
        }
        if (isDateValue(val)) {
          dateCount++;
        }
      }
    });

    const totalValid = values.length;
    let type: ColumnDataType = 'string';

    // Strict identifier exclusion: columns representing codes/IDs should never be treated as additive measures
    const isIdentifierCol =
      /^(id|code|employee_id|emp_id|serial|barcode|no|num|#|كود|مسلسل)$/i.test(colName.trim()) ||
      (/(id|code|barcode|serial)/i.test(colName.trim()) && !/salary|cost|amount|hours|rate|days|price|total/i.test(colName));

    if (isIdentifierCol) {
      type = 'string';
    } else if (totalValid > 0 && numericCount / totalValid >= 0.7) {
      type = 'number';
    } else if (totalValid > 0 && dateCount / totalValid >= 0.7) {
      type = 'date';
    }

    // Unique values
    const distinctSet = new Set(values.map(v => String(v).trim()));
    const distinctValues = Array.from(distinctSet).slice(0, 50);

    const profile: ColumnProfile = {
      name: colName,
      type,
      sampleValues: values.slice(0, 5),
      distinctCount: distinctSet.size,
      distinctValues,
      totalValues: rows.length,
      nullCount,
    };

    if (type === 'number') {
      const numVals = values
        .map(v => parseNumericValue(v))
        .filter((v): v is number => v !== null && !isNaN(v));

      if (numVals.length > 0) {
        numVals.sort((a, b) => a - b);
        profile.min = numVals[0];
        profile.max = numVals[numVals.length - 1];
        profile.sum = Number(numVals.reduce((acc, curr) => acc + curr, 0).toFixed(2));
        profile.avg = Number((profile.sum / numVals.length).toFixed(2));
        const mid = Math.floor(numVals.length / 2);
        profile.median = numVals.length % 2 !== 0 ? numVals[mid] : Number(((numVals[mid - 1] + numVals[mid]) / 2).toFixed(2));
      }
    }

    profiles.push(profile);
  });

  return profiles;
}

/**
 * Builds universal dataset from parsed raw Excel sheets
 * Robustly detects header rows (skipping banner/title rows), excludes subtotal rows,
 * and preserves every legitimate worker row
 */
export function buildUniversalDataset(
  fileName: string,
  rawSheets: Record<string, any[][]>,
  fileSizeStr?: string
): UniversalDataset {
  const sheetNames = Object.keys(rawSheets);
  const activeSheetName = sheetNames[0] || 'Sheet1';
  const sheets: Record<string, SheetData> = {};

  sheetNames.forEach(sName => {
    const rawMatrix = rawSheets[sName];
    if (!rawMatrix || rawMatrix.length === 0) {
      sheets[sName] = {
        sheetName: sName,
        rowCount: 0,
        columnCount: 0,
        columns: [],
        rawRows: [],
      };
      return;
    }

    // 1. Determine maximum row width across the first 50 rows
    let maxCols = 0;
    const scanLimit = Math.min(50, rawMatrix.length);
    for (let r = 0; r < scanLimit; r++) {
      if (Array.isArray(rawMatrix[r])) {
        maxCols = Math.max(maxCols, rawMatrix[r].length);
      }
    }
    if (maxCols === 0) maxCols = 1;

    // 2. Intelligently identify the real header row within the first 10 rows
    let headerRowIdx = 0;
    let maxHeaderScore = -1;
    const headerScanLimit = Math.min(10, rawMatrix.length);

    for (let r = 0; r < headerScanLimit; r++) {
      const candidateRow = rawMatrix[r];
      if (!candidateRow || !Array.isArray(candidateRow)) continue;

      let validStringCells = 0;
      const seenHeaders = new Set<string>();
      let hasHeaderKeyword = false;

      candidateRow.forEach(cell => {
        if (cell !== null && cell !== undefined) {
          const str = String(cell).trim();
          if (str.length > 0 && isNaN(Number(str))) {
            validStringCells++;
            seenHeaders.add(str.toLowerCase());
            if (
              /name|id|code|dept|department|hour|salary|shift|اسم|كود|قسم|القسم|ساعات|ساعة|راتب|مرتب|وردية|م/i.test(
                str
              )
            ) {
              hasHeaderKeyword = true;
            }
          }
        }
      });

      const score = seenHeaders.size + (hasHeaderKeyword ? 8 : 0);
      if (seenHeaders.size >= 2 && score > maxHeaderScore) {
        maxHeaderScore = score;
        headerRowIdx = r;
      }
    }

    const headerRow = rawMatrix[headerRowIdx] || [];
    const headers: string[] = [];
    for (let c = 0; c < maxCols; c++) {
      const val = headerRow[c];
      const str = String(val || '').trim();
      headers.push(str || `Column_${c + 1}`);
    }

    // 3. Extract data rows starting from row right after detected header
    const rows: Record<string, any>[] = [];
    for (let i = headerRowIdx + 1; i < rawMatrix.length; i++) {
      const rawRow = rawMatrix[i];
      if (!rawRow || !Array.isArray(rawRow) || rawRow.length === 0) continue;

      const rowObj: Record<string, any> = {};
      let hasData = false;
      headers.forEach((hdr: string, cIdx: number) => {
        const cellVal = rawRow[cIdx];
        if (cellVal !== undefined && cellVal !== null && cellVal !== '') {
          hasData = true;
          rowObj[hdr] = cellVal;
        } else {
          rowObj[hdr] = null;
        }
      });

      // Exclude empty rows and summary/total rows so they don't corrupt counts or sums
      if (hasData && !isSummaryOrTotalRow(rowObj)) {
        rows.push(rowObj);
      }
    }

    const columns = profileSheetColumns(rows);

    sheets[sName] = {
      sheetName: sName,
      rowCount: rows.length,
      columnCount: columns.length,
      columns,
      rawRows: rows,
    };
  });

  return {
    fileName,
    fileSize: fileSizeStr || 'Ready',
    sheetNames,
    activeSheetName,
    sheets,
    uploadedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Parses any uploaded Excel file (.xlsx, .xls) or CSV into a UniversalDataset
 * Automatically propagates merged cells across rows so no employee loses their department
 */
export async function parseUniversalExcelFile(file: File): Promise<UniversalDataset> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const rawSheets: Record<string, any[][]> = {};

  workbook.SheetNames.forEach(sName => {
    const ws = workbook.Sheets[sName];
    if (ws) {
      // Propagate merged cells so that grouped departments/lines are populated for all child rows
      if (ws['!merges'] && Array.isArray(ws['!merges'])) {
        ws['!merges'].forEach(merge => {
          const startAddr = XLSX.utils.encode_cell(merge.s);
          const masterCell = ws[startAddr];
          if (
            masterCell &&
            masterCell.v !== undefined &&
            masterCell.v !== null &&
            masterCell.v !== ''
          ) {
            for (let r = merge.s.r; r <= merge.e.r; r++) {
              for (let c = merge.s.c; c <= merge.e.c; c++) {
                const targetAddr = XLSX.utils.encode_cell({ r, c });
                if (
                  !ws[targetAddr] ||
                  ws[targetAddr].v === undefined ||
                  ws[targetAddr].v === null ||
                  ws[targetAddr].v === ''
                ) {
                  ws[targetAddr] = { ...masterCell };
                }
              }
            }
          }
        });
      }

      const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];
      rawSheets[sName] = sheetData;
    }
  });

  const fileSizeStr =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

  return buildUniversalDataset(file.name, rawSheets, fileSizeStr);
}

/**
 * Generates default dataset from Garment Factory HR (100% English)
 */
export function getInitialGarmentDataset(): UniversalDataset {
  const garmentRows = INITIAL_EMPLOYEES.map(emp => ({
    'Employee ID': emp.code,
    'Full Name': emp.name,
    'Department': emp.department,
    'Job Title': emp.jobTitle,
    'Production Line': emp.line,
    'Shift': emp.shift,
    'Base Salary ($)': emp.baseSalary,
    'Regular Hours': emp.regularHours ?? ((emp.presentDays || 26) * 8),
    'Overtime Hours': emp.overtimeHours,
    'Total Working Hours': emp.totalHoursWorked ?? ((emp.regularHours ?? ((emp.presentDays || 26) * 8)) + emp.overtimeHours),
    'Present Days': emp.presentDays,
    'Absent Days': emp.absentDays,
    'Efficiency Rate %': emp.efficiencyRate,
    'Defect Rate %': emp.defectRate,
    'Contract Type': emp.contractType,
    'Gender': emp.gender,
    'Hire Date': emp.hireDate,
    'Warnings Count': emp.warningsCount,
    'Employment Status': emp.status,
  }));

  const columns = profileSheetColumns(garmentRows);

  const sheetData: SheetData = {
    sheetName: 'Factory_Workforce_HR',
    rowCount: garmentRows.length,
    columnCount: columns.length,
    columns,
    rawRows: garmentRows,
  };

  return {
    fileName: 'Eroglu_Garment_HR_Production.xlsx',
    fileSize: '45.2 KB',
    sheetNames: ['Factory_Workforce_HR'],
    activeSheetName: 'Factory_Workforce_HR',
    sheets: {
      'Factory_Workforce_HR': sheetData,
    },
    uploadedAt: 'Verified Benchmark',
  };
}

/**
 * Checks if a dataset has a genuine salary / payroll measure column
 */
export function hasValidSalaryColumn(columns: ColumnProfile[]): boolean {
  return columns.some(c => {
    if (c.type !== 'number') return false;
    const n = c.name.trim();
    if (/hour|hrs|ساعة|ساعات|day|ايام|أيام|rate|ratio|score|نسبة|كفاءة|كود|code|id|no|#/i.test(n)) {
      return false;
    }
    return (
      /^(salary|wage|payroll|base_salary|base_wage|total_salary|مرتب|المرتب|راتب|الراتب|الاجور|الأجور|الرواتب)$/i.test(n) ||
      (/(salary|wage|payroll|مرتب|راتب)/i.test(n) && !/rate|hour|day|ratio/i.test(n))
    );
  });
}

/**
 * Generates automated executive insights from active data (100% English)
 */
export function generatePowerBIQuickInsights(sheetData: SheetData, filteredRows: Record<string, any>[]): QuickInsightItem[] {
  const insights: QuickInsightItem[] = [];
  const rows = filteredRows;
  if (!rows || rows.length === 0) return insights;

  const numericCols = sheetData.columns.filter(
    c => c.type === 'number' && !/id|code|serial|barcode/i.test(c.name)
  );
  const catCols = sheetData.columns.filter(c => c.type === 'string' && c.distinctCount >= 2 && c.distinctCount <= 30);

  // 1. Total Volume Highlight
  insights.push({
    id: 'in-total-rows',
    type: 'highlight',
    title: 'Active Dataset Scope',
    description: `Analyzed ${rows.length.toLocaleString('en-US')} active employee records across ${sheetData.columns.length} analytical dimensions and measures.`,
    metric: `${rows.length}`,
  });

  // 2. Department Headcount Distribution Insight
  const deptSummaries = calculateDepartmentSummaries(rows, sheetData.columns);
  if (deptSummaries.length > 0) {
    const topDept = deptSummaries[0];
    insights.push({
      id: 'in-dept-headcount',
      type: 'distribution',
      title: `Workforce Leader: ${topDept.department}`,
      description: `${topDept.department} comprises ${topDept.headcount} individuals (${topDept.sharePercentage}% of active workforce) with ${topDept.totalWorkingHours.toLocaleString('en-US')} total hours worked.`,
      metric: `${topDept.headcount} staff`,
    });
  }

  // 3. Primary Financial / Salary Measure (ONLY if real salary column exists)
  const isSalaryAvailable = hasValidSalaryColumn(sheetData.columns);
  const salaryCol = isSalaryAvailable
    ? numericCols.find(c => {
        const n = c.name.trim();
        if (/hour|hrs|ساعة|ساعات|day|ايام|أيام|rate|score|كود|code|id/i.test(n)) return false;
        return /salary|wage|payroll|مرتب|راتب|الراتب|المرتب/i.test(n);
      })
    : null;

  if (salaryCol && catCols.length > 0) {
    const deptCol = catCols.find(c => /department|dept|division/i.test(c.name));
    const primaryCat = deptCol || catCols[0];
    const categorySums: Record<string, number> = {};

    rows.forEach(r => {
      const cat = String(r[primaryCat.name] || 'Other').trim();
      const val = parseNumericValue(r[salaryCol.name]) || 0;
      categorySums[cat] = (categorySums[cat] || 0) + val;
    });

    const sortedCats = Object.entries(categorySums).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0 && sortedCats[0][1] > 0) {
      const [topCat, topVal] = sortedCats[0];
      const totalSum = sortedCats.reduce((acc, curr) => acc + curr[1], 0);
      const share = totalSum > 0 ? ((topVal / totalSum) * 100).toFixed(1) : '0';

      insights.push({
        id: 'in-top-salary',
        type: 'trend',
        title: `Top Payroll Allocation: ${topCat}`,
        description: `${topCat} accounts for $${topVal.toLocaleString('en-US')} in total payroll, taking up ${share}% of the active budget.`,
        metric: `$${topVal.toLocaleString('en-US')}`,
      });
    }
  }

  // 4. Hours & Working Time Insight (Accurate Sum)
  if (deptSummaries.length > 0) {
    const totalWorkingHours = deptSummaries.reduce((sum, d) => sum + d.totalWorkingHours, 0);
    const totalOvertime = deptSummaries.reduce((sum, d) => sum + d.overtimeHours, 0);
    const avgHours = rows.length > 0 ? (totalWorkingHours / rows.length).toFixed(1) : '0';

    insights.push({
      id: 'in-hours-metric',
      type: 'highlight',
      title: 'Total Workforce Hours Logged',
      description: `Cumulative working hours: ${totalWorkingHours.toLocaleString('en-US')} hrs (including ${totalOvertime.toLocaleString('en-US')} hrs overtime), averaging ${avgHours} hrs per employee.`,
      metric: `${totalWorkingHours.toLocaleString('en-US')} hrs`,
    });
  }

  return insights;
}

/**
 * Accurately calculates workforce headcount and working hours breakdown per department.
 * Canonicalizes department names so minor spelling differences (e.g., 'خياطة' vs 'خياطه')
 * do not fracture headcounts or drop employees.
 * Correctly computes and sums working hours, regular hours, and overtime.
 */
export function calculateDepartmentSummaries(
  rows: Record<string, any>[],
  columns: ColumnProfile[]
): DepartmentSummary[] {
  if (!rows || rows.length === 0) return [];

  const catCols = columns.filter(c => c.type === 'string');
  const numericCols = columns.filter(c => c.type === 'number');

  // Identify department column
  const deptCol =
    catCols.find(c => /department|dept|division|section|القسم|قسم|الادارة|الإدارة/i.test(c.name)) ||
    catCols[0];

  if (!deptCol) return [];

  // Identify hours columns with exact precision
  const totalHoursCol = numericCols.find(c =>
    /total.*(work|hour)|working.*hour|total_hours|totalhours|total_work_hours|إجمالي.*ساعات|ساعات.*العمل.*الإجمالية|مجموع.*الساعات|اجمالي.*ساعات/i.test(
      c.name
    ) && !/overtime|إضافي|اضافي/i.test(c.name)
  );

  const overtimeCol = numericCols.find(c =>
    /overtime|ot.*hour|ot_hours|ساعات.*الإضافي|إضافي|ساعات.*الاضافي|اضافي|over_time/i.test(c.name)
  );

  const regularHoursCol = numericCols.find(c =>
    /regular.*hour|base.*hour|normal.*hour|ساعات.*أساسية|ساعات.*اساسية|الساعات.*الرسمية|ساعات.*الدوام|ساعات.*اساسيه/i.test(
      c.name
    )
  );

  const workHoursCol = numericCols.find(c =>
    /(ساعات.*العمل|ساعات.*عمل|عدد.*الساعات|الساعات|ساعات|working.*hours?|work.*hours?|hours?|hrs?)/i.test(
      c.name
    ) &&
    !/overtime|إضافي|اضافي|rate|ratio|كفاءة|معدل/i.test(c.name) &&
    c.name !== totalHoursCol?.name &&
    c.name !== regularHoursCol?.name
  );

  const presentDaysCol = numericCols.find(c =>
    /present.*day|attendance.*day|أيام.*الحضور|ايام.*الحضور|حضور/i.test(c.name)
  );

  // Identify salary / wage column (strictly exclude hours/days/rates)
  const salaryCol = hasValidSalaryColumn(columns)
    ? numericCols.find(c => {
        const n = c.name.trim();
        if (/hour|hrs|ساعة|ساعات|day|ايام|أيام|rate|ratio|score|كود|code|id/i.test(n)) return false;
        return /salary|wage|payroll|مرتب|راتب|الراتب|المرتب|الاجور|الأجور/i.test(n);
      })
    : null;

  // Identify efficiency column
  const effCol = numericCols.find(c =>
    /efficiency|rate|كفاءة|نسبة.*كفاءة/i.test(c.name) && !/hour|ساعات/i.test(c.name)
  );

  // Department aggregation map keyed by canonical key, storing display name
  const deptMap: Record<
    string,
    {
      displayName: string;
      nameVariants: Record<string, number>;
      headcount: number;
      regularHours: number;
      overtimeHours: number;
      totalHours: number;
      totalSalary: number;
      efficiencySum: number;
      efficiencyCount: number;
    }
  > = {};

  rows.forEach(r => {
    const rawVal = r[deptCol.name];
    const rawDeptStr = (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '')
      ? String(rawVal).trim()
      : 'Unassigned';

    const canonKey = canonicalCategoryKey(rawDeptStr);

    if (!deptMap[canonKey]) {
      deptMap[canonKey] = {
        displayName: rawDeptStr,
        nameVariants: { [rawDeptStr]: 1 },
        headcount: 0,
        regularHours: 0,
        overtimeHours: 0,
        totalHours: 0,
        totalSalary: 0,
        efficiencySum: 0,
        efficiencyCount: 0,
      };
    } else {
      deptMap[canonKey].nameVariants[rawDeptStr] = (deptMap[canonKey].nameVariants[rawDeptStr] || 0) + 1;
    }

    const d = deptMap[canonKey];
    d.headcount += 1;

    // Regular hours extraction
    let regH = 0;
    if (regularHoursCol) {
      regH = parseNumericValue(r[regularHoursCol.name]) || 0;
    }

    // Overtime hours extraction
    let otH = 0;
    if (overtimeCol) {
      otH = parseNumericValue(r[overtimeCol.name]) || 0;
    }

    // Total hours extraction
    let totH = 0;
    if (totalHoursCol) {
      totH = parseNumericValue(r[totalHoursCol.name]) || 0;
    }

    // If workHoursCol exists (e.g. "ساعات العمل")
    if (workHoursCol) {
      const parsedWork = parseNumericValue(r[workHoursCol.name]) || 0;
      if (totH === 0 && regH === 0) {
        if (otH > 0) {
          // If overtime exists separately, workHours is regular base hours
          regH = parsedWork;
        } else {
          // If no overtime, workHours is total hours
          totH = parsedWork;
          regH = parsedWork;
        }
      }
    }

    // Fallback using present days (8 hours/day) if no working hours recorded
    if (regH === 0 && totH === 0 && presentDaysCol) {
      const days = parseNumericValue(r[presentDaysCol.name]);
      if (days !== null) regH = days * 8;
    }

    // Calculate consistent total & regular hours
    if (totH === 0) {
      totH = regH + otH;
    } else if (regH === 0) {
      regH = totH >= otH ? totH - otH : totH;
    } else if (otH > 0 && totH < regH + otH) {
      totH = regH + otH;
    }

    d.regularHours += regH;
    d.overtimeHours += otH;
    d.totalHours += totH;

    // Salary (only if real salary column exists)
    if (salaryCol) {
      const sal = parseNumericValue(r[salaryCol.name]);
      if (sal !== null) d.totalSalary += sal;
    }

    // Efficiency
    if (effCol) {
      const eff = parseNumericValue(r[effCol.name]);
      if (eff !== null) {
        d.efficiencySum += eff;
        d.efficiencyCount += 1;
      }
    }
  });

  const totalPersonnel = rows.length;

  const summaries: DepartmentSummary[] = Object.values(deptMap).map(data => {
    // Choose the most frequent string variant as the display name
    let bestName = data.displayName;
    let maxFreq = 0;
    for (const [varName, freq] of Object.entries(data.nameVariants)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        bestName = varName;
      }
    }

    return {
      department: bestName,
      headcount: data.headcount,
      sharePercentage: totalPersonnel > 0 ? Number(((data.headcount / totalPersonnel) * 100).toFixed(1)) : 0,
      totalWorkingHours: Number(data.totalHours.toFixed(1)),
      regularHours: Number(data.regularHours.toFixed(1)),
      overtimeHours: Number(data.overtimeHours.toFixed(1)),
      avgHoursPerPerson: data.headcount > 0 ? Number((data.totalHours / data.headcount).toFixed(1)) : 0,
      totalSalary: Number(data.totalSalary.toFixed(0)),
      avgSalary: data.headcount > 0 ? Number((data.totalSalary / data.headcount).toFixed(0)) : 0,
      avgEfficiency: data.efficiencyCount > 0 ? Number((data.efficiencySum / data.efficiencyCount).toFixed(1)) : 0,
    };
  });

  // Sort descending by headcount, then by totalWorkingHours
  summaries.sort((a, b) => b.headcount - a.headcount || b.totalWorkingHours - a.totalWorkingHours);

  return summaries;
}

/**
 * Aggregates dataset rows for dynamic visualization
 * Accurately handles categorical grouping and distinct row-count tallies
 */
export function aggregateDataForVisual(
  rows: Record<string, any>[],
  dimCol: string,
  measureCol: string,
  aggType: 'sum' | 'avg' | 'count' | 'max' | 'min' = 'sum'
): { category: string; value: number; count: number }[] {
  if (!rows || rows.length === 0 || !dimCol) return [];

  const groups: Record<
    string,
    {
      displayName: string;
      nameVariants: Record<string, number>;
      rowCount: number;
      values: number[];
    }
  > = {};

  rows.forEach(r => {
    const rawVal = r[dimCol];
    const cat = (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '')
      ? String(rawVal).trim()
      : 'Unassigned';

    const canonKey = canonicalCategoryKey(cat);

    if (!groups[canonKey]) {
      groups[canonKey] = {
        displayName: cat,
        nameVariants: { [cat]: 1 },
        rowCount: 0,
        values: [],
      };
    } else {
      groups[canonKey].nameVariants[cat] = (groups[canonKey].nameVariants[cat] || 0) + 1;
    }

    groups[canonKey].rowCount += 1;

    if (measureCol) {
      const num = parseNumericValue(r[measureCol]);
      if (num !== null && !isNaN(num)) {
        groups[canonKey].values.push(num);
      }
    }
  });

  const result: { category: string; value: number; count: number }[] = [];

  Object.values(groups).forEach(g => {
    let bestName = g.displayName;
    let maxFreq = 0;
    for (const [varName, freq] of Object.entries(g.nameVariants)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        bestName = varName;
      }
    }

    let calculatedVal = 0;
    const rowCount = g.rowCount;
    const values = g.values;

    if (aggType === 'count') {
      calculatedVal = rowCount;
    } else if (values.length > 0) {
      if (aggType === 'sum') {
        calculatedVal = Number(values.reduce((a, b) => a + b, 0).toFixed(2));
      } else if (aggType === 'avg') {
        calculatedVal = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
      } else if (aggType === 'max') {
        calculatedVal = Math.max(...values);
      } else if (aggType === 'min') {
        calculatedVal = Math.min(...values);
      }
    }

    result.push({
      category: bestName,
      value: calculatedVal,
      count: rowCount,
    });
  });

  // Sort descending by value
  result.sort((a, b) => b.value - a.value);
  return result;
}
