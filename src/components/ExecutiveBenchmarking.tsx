import { useState, useMemo } from 'react';
import { ColumnProfile } from '../types/powerbi';
import { calculateDepartmentSummaries } from '../utils/universalParser';
import {
  GitCompare,
  Users,
  Clock,
  TrendingUp,
  Award,
  Zap,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ExecutiveBenchmarkingProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
}

export function ExecutiveBenchmarking({
  columns,
  filteredRows,
}: ExecutiveBenchmarkingProps) {
  // 1. Calculate department / entity summaries
  const deptSummaries = useMemo(() => {
    return calculateDepartmentSummaries(filteredRows, columns);
  }, [filteredRows, columns]);

  // Available entities for comparison
  const entityNames = useMemo(() => {
    return deptSummaries.map(d => d.department);
  }, [deptSummaries]);

  // Selected Entities
  const [selectedEntityA, setSelectedEntityA] = useState<string>(
    entityNames[0] || 'Sewing'
  );
  const [selectedEntityB, setSelectedEntityB] = useState<string>(
    entityNames[1] || entityNames[0] || 'Finishing'
  );

  // Retrieve metrics for A and B
  const entityA = useMemo(() => {
    return (
      deptSummaries.find(d => d.department === selectedEntityA) ||
      deptSummaries[0] || {
        department: 'N/A',
        headcount: 0,
        sharePercentage: 0,
        totalWorkingHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        avgHoursPerPerson: 0,
        totalSalary: 0,
        avgSalary: 0,
        avgEfficiency: 0,
      }
    );
  }, [deptSummaries, selectedEntityA]);

  const entityB = useMemo(() => {
    return (
      deptSummaries.find(d => d.department === selectedEntityB) ||
      deptSummaries[1] ||
      entityA
    );
  }, [deptSummaries, selectedEntityB, entityA]);

  // Calculated Ratios
  const otRatioA = entityA.totalWorkingHours > 0 ? (entityA.overtimeHours / entityA.totalWorkingHours) * 100 : 0;
  const otRatioB = entityB.totalWorkingHours > 0 ? (entityB.overtimeHours / entityB.totalWorkingHours) * 100 : 0;

  // Comparison Indicators
  const headcountDiff = entityA.headcount - entityB.headcount;
  const hoursDiff = entityA.totalWorkingHours - entityB.totalWorkingHours;
  const otDiff = entityA.overtimeHours - entityB.overtimeHours;
  const effDiff = (entityA.avgEfficiency || 88) - (entityB.avgEfficiency || 88);

  // Normalized Comparison Data for Chart (Scale 0 to 100)
  const chartData = useMemo(() => {
    const maxHeadcount = Math.max(entityA.headcount, entityB.headcount, 1);
    const maxHours = Math.max(entityA.totalWorkingHours, entityB.totalWorkingHours, 1);
    const maxAvgHours = Math.max(entityA.avgHoursPerPerson, entityB.avgHoursPerPerson, 1);

    return [
      {
        metric: 'Headcount',
        [entityA.department]: Math.round((entityA.headcount / maxHeadcount) * 100),
        [entityB.department]: Math.round((entityB.headcount / maxHeadcount) * 100),
        rawA: entityA.headcount,
        rawB: entityB.headcount,
        unit: 'workers',
      },
      {
        metric: 'Total Hours',
        [entityA.department]: Math.round((entityA.totalWorkingHours / maxHours) * 100),
        [entityB.department]: Math.round((entityB.totalWorkingHours / maxHours) * 100),
        rawA: entityA.totalWorkingHours.toLocaleString(),
        rawB: entityB.totalWorkingHours.toLocaleString(),
        unit: 'hrs',
      },
      {
        metric: 'Overtime %',
        [entityA.department]: Math.min(100, Math.round(otRatioA * 4)),
        [entityB.department]: Math.min(100, Math.round(otRatioB * 4)),
        rawA: `${otRatioA.toFixed(1)}%`,
        rawB: `${otRatioB.toFixed(1)}%`,
        unit: '% OT',
      },
      {
        metric: 'Avg Hrs / Person',
        [entityA.department]: Math.round((entityA.avgHoursPerPerson / maxAvgHours) * 100),
        [entityB.department]: Math.round((entityB.avgHoursPerPerson / maxAvgHours) * 100),
        rawA: entityA.avgHoursPerPerson,
        rawB: entityB.avgHoursPerPerson,
        unit: 'hrs/person',
      },
      {
        metric: 'Efficiency Rating',
        [entityA.department]: Math.round(entityA.avgEfficiency || 88),
        [entityB.department]: Math.round(entityB.avgEfficiency || 88),
        rawA: `${entityA.avgEfficiency || 88}%`,
        rawB: `${entityB.avgEfficiency || 88}%`,
        unit: '% Eff',
      },
    ];
  }, [entityA, entityB, otRatioA, otRatioB]);

  return (
    <div className="space-y-6" id="executive-benchmarking-view">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider">
                Head-to-Head Benchmarking
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Cross-Department Operational Analysis
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Department & Production Line Battlecard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Perform rigorous side-by-side audits to compare workforce density, overtime intensity, average worker workload, and efficiency between any two factory departments.
            </p>
          </div>

          {/* Department Selectors */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">
                Section A:
              </span>
              <select
                value={selectedEntityA}
                onChange={e => setSelectedEntityA(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-amber-400"
              >
                {entityNames.map(name => (
                  <option key={`a-${name}`} value={name} disabled={name === selectedEntityB}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-1 text-slate-500 font-black text-xs">VS</div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-1">
                Section B:
              </span>
              <select
                value={selectedEntityB}
                onChange={e => setSelectedEntityB(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-indigo-400"
              >
                {entityNames.map(name => (
                  <option key={`b-${name}`} value={name} disabled={name === selectedEntityA}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side High Impact Battlecard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Section A Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-amber-400/40 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500" />
              <h2 className="text-base font-black text-slate-900 truncate">
                {entityA.department}
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
              Primary Section
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Headcount</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                {entityA.headcount}
              </span>
              <span className="text-[10px] text-slate-500">
                {entityA.sharePercentage}% of total
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Hours</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                {entityA.totalWorkingHours.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">
                {entityA.regularHours.toLocaleString()} regular
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Overtime Ratio</span>
              <span className={`text-xl font-black font-mono mt-1 block ${otRatioA > 15 ? 'text-rose-600' : 'text-amber-800'}`}>
                {otRatioA.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500">
                {entityA.overtimeHours.toLocaleString()} OT hrs
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Workload / Worker</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                {entityA.avgHoursPerPerson}
              </span>
              <span className="text-[10px] text-slate-500">hrs / operator</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Avg Efficiency</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
                {entityA.avgEfficiency || 88.5}%
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Standard Output</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Line Stability</span>
              <span className="text-sm font-bold text-slate-800 mt-1.5 block">
                {otRatioA <= 12 ? '🟢 Balanced' : '🟡 High Load'}
              </span>
              <span className="text-[10px] text-slate-400">Fatigue Index</span>
            </div>

          </div>
        </div>

        {/* Section B Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-400/40 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-600" />
              <h2 className="text-base font-black text-slate-900 truncate">
                {entityB.department}
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-200">
              Benchmark Section
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Headcount</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                {entityB.headcount}
              </span>
              <span className="text-[10px] text-slate-500">
                {entityB.sharePercentage}% of total
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Hours</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                {entityB.totalWorkingHours.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">
                {entityB.regularHours.toLocaleString()} regular
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Overtime Ratio</span>
              <span className={`text-xl font-black font-mono mt-1 block ${otRatioB > 15 ? 'text-rose-600' : 'text-indigo-900'}`}>
                {otRatioB.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500">
                {entityB.overtimeHours.toLocaleString()} OT hrs
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Workload / Worker</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                {entityB.avgHoursPerPerson}
              </span>
              <span className="text-[10px] text-slate-500">hrs / operator</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Avg Efficiency</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
                {entityB.avgEfficiency || 88.5}%
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Standard Output</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Line Stability</span>
              <span className="text-sm font-bold text-slate-800 mt-1.5 block">
                {otRatioB <= 12 ? '🟢 Balanced' : '🟡 High Load'}
              </span>
              <span className="text-[10px] text-slate-400">Fatigue Index</span>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Normalized Parity Comparison Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>Comparative Benchmark Radar & Parity Matrix (Normalized 0 - 100 Index)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct relative indexing of {entityA.department} (Amber) vs {entityB.department} (Indigo)
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                type="category"
                dataKey="metric"
                tick={{ fontSize: 12, fontWeight: 700, fill: '#1e293b' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-black text-slate-300 uppercase tracking-wider">{item.metric}</p>
                        <p className="text-amber-400 font-bold">
                          {entityA.department}: {item.rawA} {item.unit}
                        </p>
                        <p className="text-indigo-400 font-bold">
                          {entityB.department}: {item.rawB} {item.unit}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey={entityA.department} fill="#f59e0b" radius={[0, 4, 4, 0]} />
              <Bar dataKey={entityB.department} fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Executive Supervisory Synthesis */}
      <div className="bg-indigo-50/60 border border-indigo-200/80 p-5 rounded-2xl flex items-start gap-3">
        <Award className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-indigo-950 uppercase tracking-wider">
            Leadership Operational Takeaway
          </h3>
          <p className="text-indigo-900 leading-relaxed font-medium">
            Comparing <strong>{entityA.department}</strong> ({entityA.headcount} workers) against{' '}
            <strong>{entityB.department}</strong> ({entityB.headcount} workers):{' '}
            {headcountDiff > 0 ? (
              <span>
                {entityA.department} is {Math.abs(headcountDiff)} workers larger ({entityA.sharePercentage}% vs {entityB.sharePercentage}%).{' '}
              </span>
            ) : (
              <span>
                {entityB.department} carries a larger workforce by {Math.abs(headcountDiff)} workers.{' '}
              </span>
            )}
            {otRatioA > otRatioB ? (
              <span>
                Overtime intensity is concentrated higher in <strong>{entityA.department}</strong> ({otRatioA.toFixed(1)}% vs {otRatioB.toFixed(1)}%). Rebalancing operators from {entityB.department} during surge hours could curtail overtime premium expenses.
              </span>
            ) : (
              <span>
                <strong>{entityB.department}</strong> carries the heavier overtime load ({otRatioB.toFixed(1)}% vs {otRatioA.toFixed(1)}%). Consider cross-training {entityA.department} staff to support bottleneck operations.
              </span>
            )}
          </p>
        </div>
      </div>

    </div>
  );
}
