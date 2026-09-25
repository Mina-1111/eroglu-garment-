import * as XLSX from 'xlsx';
import { Department, Employee, ShiftType, ContractType, EmploymentStatus, Gender } from '../types/hr';

// Standard Factory Departments for validation and profiling
export const VALID_DEPARTMENTS: Department[] = [
  'Sewing & Assembly',
  'Cutting & Pattern',
  'Finishing & Ironing',
  'Quality Inspection',
  'Packaging & Logistics',
  'Maintenance & Utility',
  'Warehouse & Fabric',
  'Management & Admin',
];

export const VALID_SHIFTS: ShiftType[] = ['Morning Shift', 'Evening Shift', 'Night Shift'];
export const VALID_CONTRACTS: ContractType[] = ['Permanent', 'Contractor', 'Trainee', 'Seasonal'];
export const VALID_STATUSES: EmploymentStatus[] = ['Active', 'Sick Leave', 'Annual Leave', 'Terminated'];

/**
 * Downloads the official Excel template for Oraglo Garment HR
 */
export function downloadOragloExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Worker Template Data (Clean English columns)
  const templateRows = [
    {
      'Employee ID': 'OGL-101',
      'Full Name': 'Ahmed Mahmoud El-Sayed',
      'Department': 'Sewing & Assembly',
      'Job Title': 'Sewing Line Supervisor A1',
      'Production Line': 'Sewing Line A1 (Shirts)',
      'Shift': 'Morning Shift',
      'Regular Hours': 208,
      'Overtime Hours': 24,
      'Present Days': 26,
      'Absent Days': 0,
      'Efficiency Rate %': 96,
      'Defect Rate %': 0.8,
      'Contract Type': 'Permanent',
      'Gender': 'Male',
      'Hire Date': '2021-03-15',
      'Warnings Count': 0,
      'Employment Status': 'Active',
      'Notes': 'High-performing line leader with on-time delivery record',
    },
    {
      'Employee ID': 'OGL-102',
      'Full Name': 'Fatima Ibrahim Ali',
      'Department': 'Sewing & Assembly',
      'Job Title': 'Single-Needle Lockstitch Operator',
      'Production Line': 'Sewing Line A1 (Shirts)',
      'Shift': 'Morning Shift',
      'Regular Hours': 200,
      'Overtime Hours': 32,
      'Present Days': 25,
      'Absent Days': 1,
      'Efficiency Rate %': 94,
      'Defect Rate %': 1.2,
      'Contract Type': 'Permanent',
      'Gender': 'Female',
      'Hire Date': '2022-06-10',
      'Warnings Count': 0,
      'Employment Status': 'Active',
      'Notes': 'High precision in export specification collars',
    },
    {
      'Employee ID': 'OGL-201',
      'Full Name': 'Essam Abdel Fattah',
      'Department': 'Cutting & Pattern',
      'Job Title': 'Cutting Room Master',
      'Production Line': 'Main Cutting Floor',
      'Shift': 'Morning Shift',
      'Regular Hours': 208,
      'Overtime Hours': 35,
      'Present Days': 26,
      'Absent Days': 0,
      'Efficiency Rate %': 98,
      'Defect Rate %': 0.4,
      'Contract Type': 'Permanent',
      'Gender': 'Male',
      'Hire Date': '2019-09-01',
      'Warnings Count': 0,
      'Employment Status': 'Active',
      'Notes': 'Standard-setting fabric yield and CAD marker nesting',
    },
    {
      'Employee ID': 'OGL-301',
      'Full Name': 'Rania Maher Zaki',
      'Department': 'Quality Inspection',
      'Job Title': 'Quality Assurance Manager (QA)',
      'Production Line': 'Total Quality Management',
      'Shift': 'Morning Shift',
      'Regular Hours': 208,
      'Overtime Hours': 15,
      'Present Days': 26,
      'Absent Days': 0,
      'Efficiency Rate %': 97,
      'Defect Rate %': 0.3,
      'Contract Type': 'Permanent',
      'Gender': 'Female',
      'Hire Date': '2020-07-01',
      'Warnings Count': 0,
      'Employment Status': 'Active',
      'Notes': 'Audited to global AQL 1.5 standards',
    },
    {
      'Employee ID': 'OGL-401',
      'Full Name': 'Sherif Abdel Azim',
      'Department': 'Finishing & Ironing',
      'Job Title': 'Finishing & Steam Press Supervisor',
      'Production Line': 'Steam Press & Finishing Hall',
      'Shift': 'Morning Shift',
      'Regular Hours': 208,
      'Overtime Hours': 26,
      'Present Days': 26,
      'Absent Days': 0,
      'Efficiency Rate %': 94,
      'Defect Rate %': 0.9,
      'Contract Type': 'Permanent',
      'Gender': 'Male',
      'Hire Date': '2021-10-10',
      'Warnings Count': 0,
      'Employment Status': 'Active',
      'Notes': 'Final export garment readiness inspection',
    },
    {
      'Employee ID': 'OGL-501',
      'Full Name': 'Samia Medhat Radwan',
      'Department': 'Packaging & Logistics',
      'Job Title': 'Export Packaging Lead',
      'Production Line': 'Carton Packing & Palletizing',
      'Shift': 'Morning Shift',
      'Regular Hours': 208,
      'Overtime Hours': 20,
      'Present Days': 26,
      'Absent Days': 0,
      'Efficiency Rate %': 95,
      'Defect Rate %': 0.5,
      'Contract Type': 'Permanent',
      'Gender': 'Female',
      'Hire Date': '2022-02-18',
      'Warnings Count': 0,
      'Employment Status': 'Active',
      'Notes': 'Export packing manifest compliance',
    },
    {
      'Employee ID': 'OGL-601',
      'Full Name': 'Eng. Ibrahim Fathi',
      'Department': 'Maintenance & Utility',
      'Job Title': 'Sewing Machine Maintenance Engineer',
      'Production Line': 'Central Workshop',
      'Shift': 'Morning Shift',
      'Regular Hours': 208,
      'Overtime Hours': 36,
      'Present Days': 26,
      'Absent Days': 0,
      'Efficiency Rate %': 96,
      'Defect Rate %': 0.2,
      'Contract Type': 'Permanent',
      'Gender': 'Male',
      'Hire Date': '2020-01-10',
      'Warnings Count': 0,
      'Employment Status': 'Active',
      'Notes': 'Zero-downtime preventative servicing',
    },
  ];

  const ws1 = XLSX.utils.json_to_sheet(templateRows);

  // Column widths
  ws1['!cols'] = [
    { wch: 14 }, // Employee ID
    { wch: 24 }, // Full Name
    { wch: 22 }, // Department
    { wch: 28 }, // Job Title
    { wch: 26 }, // Production Line
    { wch: 16 }, // Shift
    { wch: 14 }, // Regular Hours
    { wch: 14 }, // Overtime Hours
    { wch: 12 }, // Present Days
    { wch: 12 }, // Absent Days
    { wch: 16 }, // Efficiency Rate %
    { wch: 14 }, // Defect Rate %
    { wch: 14 }, // Contract Type
    { wch: 10 }, // Gender
    { wch: 14 }, // Hire Date
    { wch: 14 }, // Warnings Count
    { wch: 18 }, // Employment Status
    { wch: 35 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Eroglu_Garment_HR');

  // Sheet 2: Reference & Instructions guide
  const guideData = [
    { 'Field': 'Facility Name', 'Value / Description': 'Eroglu Garment Factory' },
    { 'Field': 'System Architecture', 'Value / Description': 'Software Engineering / Mina Rafat' },
    { 'Field': 'Standard Departments', 'Value / Description': VALID_DEPARTMENTS.join(' | ') },
    { 'Field': 'Standard Shifts', 'Value / Description': VALID_SHIFTS.join(' | ') },
    { 'Field': 'Contract Types', 'Value / Description': VALID_CONTRACTS.join(' | ') },
    { 'Field': 'Employment Statuses', 'Value / Description': VALID_STATUSES.join(' | ') },
    { 'Field': 'Working Hours Formula', 'Value / Description': 'Regular Hours = Present Days * 8; Overtime Hours logged per production shift' },
  ];

  const ws2 = XLSX.utils.json_to_sheet(guideData);
  ws2['!cols'] = [{ wch: 24 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'System_Guidelines');

  XLSX.writeFile(wb, 'Eroglu_Garment_HR_Template_MinaRafat.xlsx');
}

export const downloadErogluExcelTemplate = downloadOragloExcelTemplate;

/**
 * Normalizes strings for robust matching across English and Arabic
 */
function normalizeStr(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
}

/**
 * Safely looks up a field from a row using multiple possible column aliases
 */
function getFieldValue(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);
  for (const pKey of possibleKeys) {
    const normPKey = normalizeStr(pKey);
    const foundKey = rowKeys.find(rk => normalizeStr(rk) === normPKey);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return row[foundKey];
    }
  }
  return undefined;
}

export const parseUploadedExcelFile = parseExcelToEmployees;

/**
 * Robust parser for uploaded Excel files into Employee models
 */
export async function parseExcelToEmployees(file: File): Promise<{
  employees: Employee[];
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const employees: Employee[] = [];

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { employees: [], errors: ['Excel file does not contain any sheets.'], warnings: [] };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });

    if (!rawRows || rawRows.length === 0) {
      return { employees: [], errors: [`Worksheet (${firstSheetName}) contains no data rows.`], warnings: [] };
    }

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;

      // Name
      const nameVal = getFieldValue(row, ['الاسم الكامل', 'الاسم', 'اسم الموظف', 'Name', 'Full Name', 'Employee Name']);
      const name = nameVal ? String(nameVal).trim() : '';

      if (!name) {
        warnings.push(`Row ${rowNum}: Skipped row with empty name.`);
        return;
      }

      // Code
      const codeVal = getFieldValue(row, ['كود الموظف', 'الكود', 'كود', 'الرقم الوظيفي', 'Code', 'ID', 'Employee ID']);
      const code = codeVal ? String(codeVal).trim() : `OGL-${(100 + index).toString()}`;

      // Department
      const deptVal = getFieldValue(row, ['القسم', 'قسم', 'الادارة', 'Department', 'Dept']);
      let department: Department = 'Sewing & Assembly';
      if (deptVal) {
        const normDept = normalizeStr(String(deptVal));
        const matched = VALID_DEPARTMENTS.find(d => normalizeStr(d) === normDept || normDept.includes(normalizeStr(d)));
        if (matched) {
          department = matched;
        } else if (normDept.includes('خياطة') || normDept.includes('sew')) {
          department = 'Sewing & Assembly';
        } else if (normDept.includes('قص') || normDept.includes('cut')) {
          department = 'Cutting & Pattern';
        } else if (normDept.includes('تشطيب') || normDept.includes('finish') || normDept.includes('iron')) {
          department = 'Finishing & Ironing';
        } else if (normDept.includes('جودة') || normDept.includes('qual')) {
          department = 'Quality Inspection';
        } else if (normDept.includes('تعبئة') || normDept.includes('pack')) {
          department = 'Packaging & Logistics';
        } else if (normDept.includes('صيانة') || normDept.includes('maint')) {
          department = 'Maintenance & Utility';
        } else if (normDept.includes('مخازن') || normDept.includes('ware')) {
          department = 'Warehouse & Fabric';
        } else if (normDept.includes('إدارة') || normDept.includes('ادارة') || normDept.includes('admin') || normDept.includes('mgmt')) {
          department = 'Management & Admin';
        } else {
          warnings.push(`Row ${rowNum}: Department "${deptVal}" normalized to "Sewing & Assembly".`);
        }
      }

      // Job title
      const jobVal = getFieldValue(row, ['المسمى الوظيفي', 'الوظيفة', 'المهنة', 'Job Title', 'Role']);
      const jobTitle = jobVal ? String(jobVal).trim() : 'Production Operator';

      // Line
      const lineVal = getFieldValue(row, ['خط الإنتاج', 'الخط', 'خط', 'Line', 'Production Line']);
      const line = lineVal ? String(lineVal).trim() : `Line ${department}`;

      // Shift
      const shiftVal = getFieldValue(row, ['الوردية', 'وردية', 'Shift']);
      let shift: ShiftType = 'Morning Shift';
      if (shiftVal) {
        const normShift = normalizeStr(String(shiftVal));
        if (normShift.includes('مسائ') || normShift.includes('even')) shift = 'Evening Shift';
        else if (normShift.includes('ليل') || normShift.includes('night')) shift = 'Night Shift';
      }

      // Salary
      const salaryVal = getFieldValue(row, ['الراتب الأساسي', 'الراتب', 'المرتب', 'Salary', 'Base Salary', 'Base Salary ($)']);
      const baseSalary = salaryVal ? Math.max(0, Number(String(salaryVal).replace(/[^0-9.]/g, '')) || 4500) : 4500;

      // Overtime
      const otVal = getFieldValue(row, ['ساعات الإضافي', 'الإضافي', 'ساعات اضافي', 'Overtime', 'OT', 'Overtime Hours']);
      const overtimeHours = otVal ? Math.max(0, Number(String(otVal).replace(/[^0-9.]/g, '')) || 0) : 0;

      // Absent & Present Days
      const absentVal = getFieldValue(row, ['أيام الغياب', 'الغياب', 'غياب', 'Absent', 'Absence', 'Absent Days']);
      const absentDays = absentVal !== undefined ? Math.max(0, Number(absentVal) || 0) : 0;

      const presentVal = getFieldValue(row, ['أيام الحضور', 'الحضور', 'حضور', 'Present', 'Attendance', 'Present Days']);
      const presentDays = presentVal !== undefined ? Math.max(0, Number(presentVal) || 26 - absentDays) : Math.max(0, 26 - absentDays);

      // Exact hours
      const regHoursVal = getFieldValue(row, ['Regular Hours', 'ساعات أساسية']);
      const regularHours = regHoursVal ? Number(regHoursVal) : (presentDays * 8);

      const totHoursVal = getFieldValue(row, ['Total Working Hours', 'إجمالي ساعات العمل']);
      const totalHoursWorked = totHoursVal ? Number(totHoursVal) : (regularHours + overtimeHours);

      // Efficiency Rate
      const effVal = getFieldValue(row, ['كفاءة الإنتاج %', 'كفاءة الإنتاج', 'الكفاءة', 'Efficiency', 'Efficiency Rate %']);
      let efficiencyRate = 85;
      if (effVal !== undefined) {
        let parsedEff = Number(effVal);
        if (parsedEff > 0 && parsedEff <= 1) parsedEff = parsedEff * 100;
        efficiencyRate = Math.min(100, Math.max(10, Math.round(parsedEff || 85)));
      }

      // Defect Rate
      const defVal = getFieldValue(row, ['نسبة الهالك والعيوب %', 'نسبة الهالك', 'الهالك', 'Defects', 'Defect Rate', 'Defect Rate %']);
      let defectRate = 1.0;
      if (defVal !== undefined) {
        let parsedDef = Number(defVal);
        if (parsedDef > 0 && parsedDef < 0.3) parsedDef = parsedDef * 100;
        defectRate = Math.min(25, Math.max(0, Number(parsedDef.toFixed(1)) || 1.0));
      }

      // Contract
      const contractVal = getFieldValue(row, ['نوع العقد', 'العقد', 'Contract', 'Contract Type']);
      let contractType: ContractType = 'Permanent';
      if (contractVal) {
        const normCont = normalizeStr(String(contractVal));
        if (normCont.includes('مؤقت') || normCont.includes('contract')) contractType = 'Contractor';
        else if (normCont.includes('متدرب') || normCont.includes('train')) contractType = 'Trainee';
        else if (normCont.includes('موسم') || normCont.includes('season')) contractType = 'Seasonal';
      }

      // Gender
      const genderVal = getFieldValue(row, ['النوع', 'الجنس', 'Gender']);
      let gender: Gender = 'Male';
      if (genderVal) {
        const normGen = normalizeStr(String(genderVal));
        if (normGen.includes('انثي') || normGen.includes('أنثى') || normGen.includes('female') || normGen.includes('f')) gender = 'Female';
      }

      // Hire Date
      const dateVal = getFieldValue(row, ['تاريخ التعيين', 'التعيين', 'Hire Date', 'Date']);
      let hireDate = '2023-01-01';
      if (dateVal) {
        if (typeof dateVal === 'number') {
          const d = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
          hireDate = d.toISOString().split('T')[0];
        } else {
          hireDate = String(dateVal).trim();
        }
      }

      // Warnings
      const warnVal = getFieldValue(row, ['عدد الإنذارات', 'الإنذارات', 'الجزاءات', 'Warnings', 'Warnings Count']);
      const warningsCount = warnVal ? Math.max(0, Number(warnVal) || 0) : 0;

      // Status
      const statusVal = getFieldValue(row, ['حالة العمل', 'الحالة', 'Status', 'Employment Status']);
      let status: EmploymentStatus = 'Active';
      if (statusVal) {
        const normStat = normalizeStr(String(statusVal));
        if (normStat.includes('مرض') || normStat.includes('sick')) status = 'Sick Leave';
        else if (normStat.includes('اعتياد') || normStat.includes('annual')) status = 'Annual Leave';
        else if (normStat.includes('مستقيل') || normStat.includes('انهاء') || normStat.includes('term')) status = 'Terminated';
      }

      // Notes
      const notesVal = getFieldValue(row, ['ملاحظات', 'ملاحظات شؤون العاملين', 'Notes', 'Comment']);
      const notes = notesVal ? String(notesVal).trim() : undefined;

      employees.push({
        id: `emp-upload-${Date.now()}-${index}`,
        code,
        name,
        department,
        jobTitle,
        line,
        shift,
        baseSalary,
        overtimeHours,
        regularHours,
        totalHoursWorked,
        absentDays,
        presentDays,
        efficiencyRate,
        defectRate,
        contractType,
        gender,
        hireDate,
        warningsCount,
        status,
        notes,
      });
    });

    if (employees.length === 0) {
      errors.push('No valid employee records found in file. Please verify column headers against template.');
    }
  } catch (err: unknown) {
    errors.push(`Error parsing Excel file: ${(err as Error)?.message || 'Unsupported format'}`);
  }

  return { employees, errors, warnings };
}

/**
 * Exports currently analyzed employees to Excel
 */
export function exportCurrentDataToExcel(employees: Employee[], filename = 'Oraglo_Garment_Staff_Report.xlsx') {
  const exportData = employees.map(emp => ({
    'Employee ID': emp.code,
    'Full Name': emp.name,
    'Department': emp.department,
    'Job Title': emp.jobTitle,
    'Production Line': emp.line,
    'Shift': emp.shift,
    'Regular Hours': emp.regularHours ?? (emp.presentDays * 8),
    'Overtime Hours': emp.overtimeHours,
    'Absent Days': emp.absentDays,
    'Present Days': emp.presentDays,
    'Efficiency Rate %': emp.efficiencyRate,
    'Defect Rate %': emp.defectRate,
    'Contract Type': emp.contractType,
    'Gender': emp.gender,
    'Hire Date': emp.hireDate,
    'Warnings Count': emp.warningsCount,
    'Employment Status': emp.status,
    'Notes': emp.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Staff_Records');
  XLSX.writeFile(wb, filename);
}
