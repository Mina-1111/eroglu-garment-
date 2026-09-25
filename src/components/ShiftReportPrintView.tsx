import { Printer, ArrowLeft, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DepartmentStat, FactoryKPIs, LineStat, PrivateAccessState } from '../types/hr';

interface ShiftReportPrintViewProps {
  kpis: FactoryKPIs;
  deptStats: DepartmentStat[];
  lineStats: LineStat[];
  accessState: PrivateAccessState;
  onBack: () => void;
}

export function ShiftReportPrintView({
  kpis,
  deptStats,
  lineStats,
  accessState,
  onBack,
}: ShiftReportPrintViewProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 md:p-10 font-sans text-left" dir="ltr">
      
      {/* Print Trigger & Back Control (Hidden when printing) */}
      <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Official Report / Save as PDF
        </button>
      </div>

      {/* Official Enterprise Header */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-black text-slate-950">
              Enterprise Operations & Workforce Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Software Engineering / Mina Rafat • Official Certified Production & Operations Audit Report
          </p>
        </div>

        <div className="text-right font-mono text-xs text-slate-600 space-y-0.5">
          <p>Audit Date: <strong className="text-slate-900">{currentDate}</strong></p>
          <p>Authorizing Lead: <strong className="text-slate-900">Mina Rafat</strong></p>
          <p>Designation: <span className="text-amber-700 font-semibold">Lead Software Engineer</span></p>
        </div>
      </div>

      {/* Summary KPI Matrix */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-2 border-l-4 border-amber-500 pl-2">
          Section 1: Workforce & Operating Hours Strategic Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 border border-slate-300 rounded-lg text-center">
            <span className="text-xs text-slate-500 block">Total Workforce</span>
            <span className="text-xl font-black text-slate-900 font-mono">{kpis.totalEmployees}</span>
            <span className="text-[10px] text-slate-500 block">Active Personnel</span>
          </div>
          <div className="p-3 border border-slate-300 rounded-lg text-center">
            <span className="text-xs text-slate-500 block">Overall Attendance Rate</span>
            <span className="text-xl font-black text-emerald-700 font-mono">{kpis.averageAttendanceRate}%</span>
            <span className="text-[10px] text-slate-500 block">Presence Benchmark</span>
          </div>
          <div className="p-3 border border-slate-300 rounded-lg text-center">
            <span className="text-xs text-slate-500 block">Average Efficiency</span>
            <span className="text-xl font-black text-indigo-700 font-mono">{kpis.averageEfficiencyRate}%</span>
            <span className="text-[10px] text-slate-500 block">Hourly SAM Performance</span>
          </div>
          <div className="p-3 border border-slate-300 rounded-lg text-center">
            <span className="text-xs text-slate-500 block">Total Overtime Hours</span>
            <span className="text-xl font-black text-slate-900 font-mono">{kpis.totalOvertimeHours} hrs</span>
            <span className="text-[10px] text-slate-500 block">~ ${kpis.overtimeCostEstimated.toLocaleString('en-US')} Cost</span>
          </div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-2 border-l-4 border-amber-500 pl-2">
          Section 2: Comparative Departmental Analysis & Working Hours
        </h2>
        <table className="w-full text-xs text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-semibold">
              <th className="border border-slate-300 p-2">Department / Division</th>
              <th className="border border-slate-300 p-2 text-right">Headcount</th>
              <th className="border border-slate-300 p-2 text-right">Avg Efficiency %</th>
              <th className="border border-slate-300 p-2 text-right">Attendance %</th>
              <th className="border border-slate-300 p-2 text-right">Overtime Hours</th>
              <th className="border border-slate-300 p-2 text-right">Defect Rate %</th>
              <th className="border border-slate-300 p-2 text-right">Base Payroll</th>
            </tr>
          </thead>
          <tbody>
            {deptStats.map((dept) => (
              <tr key={dept.department} className="hover:bg-slate-50">
                <td className="border border-slate-300 p-2 font-bold text-slate-900">{dept.department}</td>
                <td className="border border-slate-300 p-2 font-mono text-right">{dept.headcount}</td>
                <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-800 text-right">{dept.avgEfficiency}%</td>
                <td className="border border-slate-300 p-2 font-mono text-emerald-800 text-right">{dept.avgAttendance}%</td>
                <td className="border border-slate-300 p-2 font-mono text-right">{dept.totalOvertime} hrs</td>
                <td className="border border-slate-300 p-2 font-mono text-right">{dept.defectRate}%</td>
                <td className="border border-slate-300 p-2 font-mono text-right">${dept.payroll.toLocaleString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Production Lines Breakdown */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-900 mb-2 border-l-4 border-amber-500 pl-2">
          Section 3: Production Lines Status & Capacity Balance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {lineStats.map((line) => (
            <div key={line.lineName} className="p-2.5 border border-slate-300 rounded flex items-center justify-between">
              <div>
                <strong className="block text-slate-900">{line.lineName}</strong>
                <span className="text-[11px] text-slate-500">{line.operatorsCount} Operators</span>
              </div>
              <div className="text-right font-mono font-bold">
                <span className="block text-indigo-700">Efficiency: {line.efficiency}%</span>
                <span className="block text-[10px] text-slate-500">Absent: {line.absenteeism}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Signatures & Verification (Mina Rafat / Marwa Ramadan / Bora Ertürk) */}
      <div className="pt-8 mt-10 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-xs page-break-inside-avoid">
        <div>
          <span className="block font-bold text-slate-500 mb-6 uppercase tracking-wider text-[11px]">DATA ANALYST</span>
          <div className="border-t-2 border-slate-900 pt-2 max-w-[180px] mx-auto">
            <span className="font-black text-slate-950 block text-xs uppercase tracking-wide">MINA RAFAT</span>
            <span className="text-[10px] text-slate-600 block uppercase mt-0.5">Data Analyst</span>
          </div>
        </div>
        <div>
          <span className="block font-bold text-slate-500 mb-6 uppercase tracking-wider text-[11px]">HR MANAGER</span>
          <div className="border-t-2 border-slate-900 pt-2 max-w-[180px] mx-auto">
            <span className="font-black text-slate-950 block text-xs uppercase tracking-wide">MARWA RAMADAN</span>
            <span className="text-[10px] text-slate-600 block uppercase mt-0.5">HR Manager</span>
          </div>
        </div>
        <div>
          <span className="block font-bold text-slate-500 mb-6 uppercase tracking-wider text-[11px]">HR GROUP MANAGER</span>
          <div className="border-t-2 border-slate-900 pt-2 max-w-[180px] mx-auto">
            <span className="font-black text-slate-950 block text-xs uppercase tracking-wide">BORA ERTÜRK</span>
            <span className="text-[10px] text-slate-600 block uppercase mt-0.5">HR Group Manager</span>
          </div>
        </div>
      </div>

    </div>
  );
}
