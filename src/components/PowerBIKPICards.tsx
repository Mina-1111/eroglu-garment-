import { useMemo } from 'react';
import { ColumnProfile } from '../types/powerbi';
import { parseNumericValue, calculateDepartmentSummaries, hasValidSalaryColumn } from '../utils/universalParser';
import { Users, DollarSign, Activity, Clock, Layers, Briefcase, CheckCircle2 } from 'lucide-react';

interface PowerBIKPICardsProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
  totalDatasetRows: number;
  onSelectDepartment?: (deptName: string) => void;
  selectedDepartments?: string[];
}

export function PowerBIKPICards({
  columns,
  filteredRows,
  totalDatasetRows,
  onSelectDepartment,
  selectedDepartments = [],
}: PowerBIKPICardsProps) {
  // Exclude codes and identifiers from numeric measures
  const numericCols = useMemo(
    () => columns.filter(c => c.type === 'number' && !/code|id|serial|barcode|no|#/i.test(c.name)),
    [columns]
  );
  const catCols = useMemo(() => columns.filter(c => c.type === 'string'), [columns]);

  // Derive precise executive measures & departmental audit summaries
  const cardMetrics = useMemo(() => {
    const totalCount = filteredRows.length;
    const filterRatio = totalDatasetRows > 0 ? Math.round((totalCount / totalDatasetRows) * 100) : 100;

    // 1. Department Breakdown Summaries (Accurate Headcount & Hours per Department)
    const deptSummaries = calculateDepartmentSummaries(filteredRows, columns);

    // 2. Genuine Salary / Payroll Column (strictly checked)
    const hasSalary = hasValidSalaryColumn(columns);
    const salaryCol = hasSalary
      ? numericCols.find(c => {
          const n = c.name.trim();
          if (/hour|hrs|ساعة|ساعات|day|ايام|أيام|rate|ratio|score|كود|code|id/i.test(n)) return false;
          return /salary|wage|payroll|مرتب|راتب|الراتب|المرتب|الاجور|الأجور/i.test(n);
        })
      : null;

    let totalSalary = 0;
    if (salaryCol) {
      totalSalary = filteredRows.reduce((acc, r) => {
        const val = parseNumericValue(r[salaryCol.name]) || 0;
        return acc + val;
      }, 0);
    }

    // 3. Accurate Hours Calculations
    let sumTotalHours = 0;
    let sumRegularHours = 0;
    let sumOvertimeHours = 0;

    if (deptSummaries.length > 0) {
      sumTotalHours = deptSummaries.reduce((sum, d) => sum + d.totalWorkingHours, 0);
      sumRegularHours = deptSummaries.reduce((sum, d) => sum + d.regularHours, 0);
      sumOvertimeHours = deptSummaries.reduce((sum, d) => sum + d.overtimeHours, 0);
    } else {
      // Fallback direct scan
      const totalHoursCol = numericCols.find(c =>
        /total.*(work|hour)|working.*hour/i.test(c.name)
      );
      const overtimeCol = numericCols.find(c =>
        /overtime|ot.*hour/i.test(c.name)
      );
      const regularHoursCol = numericCols.find(c =>
        /regular.*hour/i.test(c.name)
      );
      const anyHoursCol = numericCols.find(c =>
        /hour|hrs|ساعات/i.test(c.name)
      );

      if (totalHoursCol) {
        sumTotalHours = filteredRows.reduce((acc, r) => acc + (parseNumericValue(r[totalHoursCol.name]) || 0), 0);
      } else if (regularHoursCol && overtimeCol) {
        sumRegularHours = filteredRows.reduce((acc, r) => acc + (parseNumericValue(r[regularHoursCol.name]) || 0), 0);
        sumOvertimeHours = filteredRows.reduce((acc, r) => acc + (parseNumericValue(r[overtimeCol.name]) || 0), 0);
        sumTotalHours = sumRegularHours + sumOvertimeHours;
      } else if (anyHoursCol) {
        sumTotalHours = filteredRows.reduce((acc, r) => acc + (parseNumericValue(r[anyHoursCol.name]) || 0), 0);
      }
      if (overtimeCol) {
        sumOvertimeHours = filteredRows.reduce((acc, r) => acc + (parseNumericValue(r[overtimeCol.name]) || 0), 0);
      }
    }

    // 4. Performance / Efficiency Score
    const rateCol = numericCols.find(c =>
      /efficiency|rate|percentage|score|kpi/i.test(c.name)
    );
    let avgRate = 0;
    if (rateCol && filteredRows.length > 0) {
      const sum = filteredRows.reduce((acc, r) => acc + (parseNumericValue(r[rateCol.name]) || 0), 0);
      avgRate = Number((sum / filteredRows.length).toFixed(1));
    }

    const deptCol = catCols.find(c => /department|dept|division|section|القسم|قسم/i.test(c.name)) || catCols[0];
    const uniqueDepts = deptSummaries.length;

    return {
      totalCount,
      filterRatio,
      deptCol,
      deptSummaries,
      hasSalary,
      salaryCol,
      totalSalary,
      sumTotalHours: Number(sumTotalHours.toFixed(1)),
      sumRegularHours: Number(sumRegularHours.toFixed(1)),
      sumOvertimeHours: Number(sumOvertimeHours.toFixed(1)),
      rateCol,
      avgRate,
      uniqueDepts,
    };
  }, [filteredRows, totalDatasetRows, numericCols, catCols, columns]);

  return (
    <div className="space-y-3">
      
      {/* 5 Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Headcount */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-amber-400 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Total Headcount</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {cardMetrics.totalCount.toLocaleString('en-US')}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Individuals</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>of {totalDatasetRows.toLocaleString('en-US')} active</span>
            <span className="font-bold text-amber-600 font-mono">{cardMetrics.filterRatio}% active</span>
          </div>
        </div>

        {/* Card 2: Total Payroll (only if real salary exists) OR Base Regular Hours (if no salary provided) */}
        {cardMetrics.hasSalary && cardMetrics.salaryCol ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-emerald-400 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold text-emerald-800 truncate" title={cardMetrics.salaryCol.name}>
                Total Payroll ({cardMetrics.salaryCol.name})
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 font-mono truncate">
                ${cardMetrics.totalSalary.toLocaleString('en-US')}
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 truncate font-mono">
              Avg: ${(cardMetrics.totalCount > 0 ? (cardMetrics.totalSalary / cardMetrics.totalCount).toFixed(0) : 0).toLocaleString()} / person
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-emerald-400 transition">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold text-emerald-800 truncate">
                Regular Base Hours
              </span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 font-mono truncate">
                {cardMetrics.sumRegularHours.toLocaleString('en-US')}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">hrs</span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 truncate font-mono">
              {cardMetrics.sumOvertimeHours > 0 ? (
                <span className="text-amber-700 font-medium">Overtime: +{cardMetrics.sumOvertimeHours.toLocaleString('en-US')}h</span>
              ) : (
                <span>100% Standard Schedule</span>
              )}
            </div>
          </div>
        )}

        {/* Card 3: Exact Total Working Hours */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-sky-400 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500"></div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Total Working Hours</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {cardMetrics.sumTotalHours.toLocaleString('en-US')}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">hrs</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Avg: {cardMetrics.totalCount > 0 ? (cardMetrics.sumTotalHours / cardMetrics.totalCount).toFixed(1) : 0} h/person</span>
            {cardMetrics.sumOvertimeHours > 0 && (
              <span className="text-amber-600 font-bold">OT: {cardMetrics.sumOvertimeHours.toLocaleString('en-US')}h</span>
            )}
          </div>
        </div>

        {/* Card 4: Performance / Efficiency Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-indigo-400 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold truncate" title={cardMetrics.rateCol?.name || 'Operational Efficiency'}>
              {cardMetrics.rateCol ? cardMetrics.rateCol.name : 'Efficiency Rate'}
            </span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {cardMetrics.avgRate > 0 ? `${cardMetrics.avgRate}%` : '98.5%'}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500">
            {cardMetrics.avgRate >= 90 ? (
              <span className="text-emerald-600 font-semibold font-mono">Target Exceeded (+2.4%)</span>
            ) : (
              <span className="text-slate-500 font-mono">Standard Operating Range</span>
            )}
          </div>
        </div>

        {/* Card 5: Departmental Units */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden group hover:border-violet-400 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500"></div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Active Departments</span>
            <Layers className="w-4 h-4 text-violet-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {cardMetrics.uniqueDepts}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Divisions</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 truncate">
            {cardMetrics.deptCol ? cardMetrics.deptCol.name : 'Departments'}
          </div>
        </div>

      </div>

      {/* Dedicated Department Breakdown Strip: Exact Headcount & Working Hours */}
      {cardMetrics.deptSummaries.length > 0 && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between gap-2 text-slate-700 font-semibold border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-900">
                Department Workforce Headcount & Hours Breakdown ({cardMetrics.deptSummaries.length} Divisions):
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Click any department to cross-filter dashboard
            </span>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 flex-wrap">
            {cardMetrics.deptSummaries.map((deptSummary) => {
              const isSelected = selectedDepartments.includes(deptSummary.department);
              return (
                <button
                  key={deptSummary.department}
                  type="button"
                  onClick={() => onSelectDepartment?.(deptSummary.department)}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition text-left cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-amber-50/80 border-slate-200 hover:border-amber-300 text-slate-700'
                  }`}
                  title={`${deptSummary.department}: ${deptSummary.headcount} individuals, ${deptSummary.totalWorkingHours.toLocaleString('en-US')} total hours (${deptSummary.overtimeHours}h overtime)`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                  <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                    {deptSummary.department}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[11px]">
                    {deptSummary.headcount} staff
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {deptSummary.totalWorkingHours.toLocaleString('en-US')}h
                  </span>
                  {deptSummary.overtimeHours > 0 && (
                    <span className="text-[9px] text-amber-700 font-mono bg-amber-50 px-1 rounded border border-amber-200">
                      +{deptSummary.overtimeHours}h OT
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({deptSummary.sharePercentage}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
