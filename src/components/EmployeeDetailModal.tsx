import { X, Award, AlertTriangle, Calendar, CheckCircle2, DollarSign, TrendingUp, ShieldAlert } from 'lucide-react';
import { Employee } from '../types/hr';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  onClose: () => void;
}

export function EmployeeDetailModal({ employee, onClose }: EmployeeDetailModalProps) {
  if (!employee) return null;

  const totalDays = (employee.presentDays + employee.absentDays) || 26;
  const attendanceRate = Math.round((employee.presentDays / totalDays) * 100);
  const hourlyRate = (employee.baseSalary / 208);
  const overtimeEarnings = Math.round(employee.overtimeHours * hourlyRate * 1.35);
  const totalEstimatedEarnings = employee.baseSalary + overtimeEarnings;

  const isHighPerformer = employee.efficiencyRate >= 92 && employee.defectRate <= 1.0;

  return (
    <div id="employee-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left my-8">
        
        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-white text-2xl font-black shadow-inner">
              {employee.name.split(' ')[0]?.[0] || 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {employee.code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-medium">
                  {employee.status}
                </span>
                {isHighPerformer && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    Top Performer
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold mt-1 text-white">{employee.name}</h2>
              <p className="text-xs text-slate-300 mt-0.5">{employee.jobTitle} • {employee.department}</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Production & Line Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            
            {/* Efficiency */}
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <div className="flex items-center justify-center gap-1 text-indigo-700 text-xs font-semibold mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Production Efficiency
              </div>
              <span className="text-xl font-mono font-black text-indigo-950">
                {employee.efficiencyRate}%
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">Hourly SAM Benchmark</p>
            </div>

            {/* Attendance Rate */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center justify-center gap-1 text-emerald-700 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Attendance Rate
              </div>
              <span className="text-xl font-mono font-black text-emerald-950">
                {attendanceRate}%
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">{employee.presentDays} Days Present</p>
            </div>

            {/* Defect Rate */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-center gap-1 text-slate-700 text-xs font-semibold mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Defect Rate
              </div>
              <span className={`text-xl font-mono font-black ${employee.defectRate > 2.0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {employee.defectRate}%
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">Quality Inspection QC</p>
            </div>

          </div>

          {/* Details List */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">Assigned Production Line:</span>
              <strong className="text-slate-900">{employee.line}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">Work Shift:</span>
              <span className="text-slate-800 font-semibold">{employee.shift}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">Contract & Gender:</span>
              <span className="text-slate-800 font-medium">{employee.contractType} Contract ({employee.gender})</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Hire Date:
              </span>
              <span className="font-mono text-slate-800">{employee.hireDate}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                Disciplinary Warnings:
              </span>
              <span className={`font-semibold ${employee.warningsCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {employee.warningsCount} Recorded Warnings
              </span>
            </div>
          </div>

          {/* Payroll & Overtime Breakdown Card */}
          <div className="bg-blue-50/50 border border-blue-200/70 rounded-xl p-4 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
              <span className="flex items-center gap-1 text-blue-900">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Estimated Monthly Compensation
              </span>
              <span className="font-mono text-sm text-blue-950">
                ${totalEstimatedEarnings.toLocaleString('en-US')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 text-slate-600 text-[11px]">
              <div>
                Base Salary: <strong className="text-slate-800">${employee.baseSalary.toLocaleString('en-US')}</strong>
              </div>
              <div>
                Overtime Incentive ({employee.overtimeHours} hrs): <strong className="text-emerald-700">+${overtimeEarnings.toLocaleString('en-US')}</strong>
              </div>
            </div>
          </div>

          {/* Notes */}
          {employee.notes && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
              <strong className="block mb-0.5 text-amber-950">Supervisory HR Notes:</strong>
              {employee.notes}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-400">Software Engineering / Mina Rafat</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close Record
          </button>
        </div>

      </div>
    </div>
  );
}
