export type Department =
  | 'Sewing & Assembly'
  | 'Cutting & Pattern'
  | 'Finishing & Ironing'
  | 'Quality Inspection'
  | 'Packaging & Logistics'
  | 'Maintenance & Utility'
  | 'Warehouse & Fabric'
  | 'Management & Admin';

export type ShiftType = 'Morning Shift' | 'Evening Shift' | 'Night Shift';

export type ContractType = 'Permanent' | 'Contractor' | 'Trainee' | 'Seasonal';

export type EmploymentStatus = 'Active' | 'Sick Leave' | 'Annual Leave' | 'Terminated';

export type Gender = 'Male' | 'Female';

export interface Employee {
  id: string;
  code: string; // e.g. OGL-0101
  name: string;
  department: Department;
  jobTitle: string;
  line: string;
  shift: ShiftType;
  baseSalary: number; // in USD / local currency
  overtimeHours: number;
  regularHours?: number; // presentDays * 8
  totalHoursWorked?: number; // regularHours + overtimeHours
  absentDays: number;
  presentDays: number;
  efficiencyRate: number; // 0 - 100%
  defectRate: number; // 0 - 10%
  contractType: ContractType;
  gender: Gender;
  hireDate: string;
  warningsCount: number;
  status: EmploymentStatus;
  notes?: string;
  phone?: string;
}

export interface FactoryKPIs {
  totalEmployees: number;
  activeEmployees: number;
  averageAttendanceRate: number; // %
  averageEfficiencyRate: number; // %
  averageDefectRate: number; // %
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalWorkingHours: number;
  totalPayrollCost: number;
  overtimeCostEstimated: number;
  turnoverRate: number; // %
  maleRatio: number;
  femaleRatio: number;
  totalWarnings: number;
}

export interface DepartmentStat {
  department: Department;
  headcount: number;
  avgEfficiency: number;
  totalSalary: number;
  totalOvertimeHours: number;
  totalWorkingHours: number;
  activeRatio: number;
  avgAttendance: number;
  totalOvertime: number;
  defectRate: number;
  payroll: number;
}

export interface LineStat {
  lineName: string;
  department: Department;
  operatorsCount: number;
  efficiency: number;
  absenteeism: number;
  status: 'optimal' | 'warning' | 'critical';
}

export interface SmartAlert {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  recommendation: string;
  department?: Department;
  impactScore?: string;
}

export interface PrivateAccessState {
  isLocked: boolean;
  pin: string;
  ownerName: string;
  ownerTitle: string;
  lastLogin: string;
}
