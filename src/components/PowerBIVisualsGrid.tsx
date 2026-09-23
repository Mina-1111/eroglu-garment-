import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  ComposedChart, Legend,
} from 'recharts';
import { ColumnProfile, FilterState } from '../types/powerbi';
import { aggregateDataForVisual, calculateDepartmentSummaries, hasValidSalaryColumn } from '../utils/universalParser';
import { PowerBIGauge } from './PowerBIGauge';
import { PowerBITreemap } from './PowerBITreemap';
import { PowerBILeaderboard } from './PowerBILeaderboard';
import { PowerBIRadar } from './PowerBIRadar';
import {
  BarChart3, PieChart as PieIcon, TrendingUp, Search, ArrowUpDown,
  Layers, SlidersHorizontal, BarChart2, Users, DollarSign, Activity,
  Briefcase, Clock, CheckCircle2,
} from 'lucide-react';

interface PowerBIVisualsGridProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
  filters: FilterState;
  onSelectCategoryFilter: (colName: string, categoryVal: string) => void;
}

const PALETTE = [
  '#f59e0b', // Amber
  '#0284c7', // Sky Blue
  '#10b981', // Emerald Green
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export function PowerBIVisualsGrid({
  columns,
  filteredRows,
  filters,
  onSelectCategoryFilter,
}: PowerBIVisualsGridProps) {
  // Genuine salary presence check
  const hasSalary = useMemo(() => hasValidSalaryColumn(columns), [columns]);

  // Exclude codes and identifiers from numeric measures so they are never summed
  const numericCols = useMemo(
    () => columns.filter(c => c.type === 'number' && !/code|id|serial|barcode|no|#/i.test(c.name)),
    [columns]
  );
  const catCols = useMemo(
    () => columns.filter(c => c.type === 'string' && c.distinctCount >= 2 && c.distinctCount <= 50),
    [columns]
  );

  // Filter view tabs for visuals section
  const [visualsFilter, setVisualsFilter] = useState<'all' | 'workforce' | 'financial' | 'efficiency' | 'matrix'>('all');

  // Primary Dimension (e.g. Department / Line / Category)
  const [primaryDimCol, setPrimaryDimCol] = useState<string>(() => {
    const found = catCols.find(c => /department|dept|line|division|category|القسم|قسم/i.test(c.name)) || catCols[0];
    return found ? found.name : '';
  });

  // Primary Measure - prioritize salary ONLY if valid salary exists, otherwise default to hours
  const [primaryMeasureCol, setPrimaryMeasureCol] = useState<string>(() => {
    if (hasValidSalaryColumn(columns)) {
      const salary = numericCols.find(c => /salary|wage|payroll/i.test(c.name));
      if (salary) return salary.name;
    }
    const hours = numericCols.find(c => /total.*(work|hour)|working.*hour|hour|ساعات/i.test(c.name));
    return hours ? hours.name : (numericCols[0]?.name || '');
  });

  // Secondary Category for Donut (e.g. Shift / Contract / Status / Gender)
  const [secondaryDimCol, setSecondaryDimCol] = useState<string>(() => {
    const found = catCols.find(c => c.name !== primaryDimCol && /shift|contract|status|gender/i.test(c.name)) || catCols[1] || catCols[0];
    return found ? found.name : '';
  });

  // Secondary Measure for Trend / Line / Dual-Axis
  const [trendMeasureCol, setTrendMeasureCol] = useState<string>(() => {
    const found = numericCols.find(c => c.name !== primaryMeasureCol && /efficiency|rate|defect|absent/i.test(c.name)) || numericCols[1] || numericCols[0];
    return found ? found.name : '';
  });

  // Aggregation switcher for Main Visual
  const [mainAggType, setMainAggType] = useState<'sum' | 'avg' | 'count'>('sum');

  // Matrix Table states
  const [tableSearch, setTableSearch] = useState('');
  const [sortCol, setSortCol] = useState<string>('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Aggregate Data for Main Column Chart
  const mainChartData = useMemo(() => {
    if (!primaryDimCol || !primaryMeasureCol) return [];
    return aggregateDataForVisual(filteredRows, primaryDimCol, primaryMeasureCol, mainAggType);
  }, [filteredRows, primaryDimCol, primaryMeasureCol, mainAggType]);

  // Metric selector for department breakdown visual: headcount | hours | overtime
  const [deptMetricType, setDeptMetricType] = useState<'headcount' | 'hours' | 'overtime'>('headcount');

  // Exact departmental summaries using universal parser
  const departmentSummaries = useMemo(() => {
    return calculateDepartmentSummaries(filteredRows, columns);
  }, [filteredRows, columns]);

  // Aggregate Department Chart Data based on selected metric
  const departmentChartData = useMemo(() => {
    const data = departmentSummaries.map(d => ({
      category: d.department,
      value: deptMetricType === 'headcount'
        ? d.headcount
        : deptMetricType === 'hours'
        ? d.totalWorkingHours
        : d.overtimeHours,
      headcount: d.headcount,
      totalWorkingHours: d.totalWorkingHours,
      regularHours: d.regularHours,
      overtimeHours: d.overtimeHours,
      sharePercentage: d.sharePercentage,
      avgHoursPerPerson: d.avgHoursPerPerson,
      avgSalary: d.avgSalary,
    }));

    // Sort descending by selected value
    data.sort((a, b) => b.value - a.value);
    return data;
  }, [departmentSummaries, deptMetricType]);

  // Department column name for cross-filtering
  const deptColName = useMemo(() => {
    const c = catCols.find(col => /department|dept|division|section|القسم|قسم/i.test(col.name));
    return c ? c.name : primaryDimCol;
  }, [catCols, primaryDimCol]);

  // Aggregate Data for Donut Chart
  const donutChartData = useMemo(() => {
    if (!secondaryDimCol) return [];
    return aggregateDataForVisual(filteredRows, secondaryDimCol, primaryMeasureCol || columns[0]?.name, 'count');
  }, [filteredRows, secondaryDimCol, primaryMeasureCol, columns]);

  // Aggregate Data for Trend Chart
  const trendChartData = useMemo(() => {
    if (!primaryDimCol || !trendMeasureCol) return [];
    return aggregateDataForVisual(filteredRows, primaryDimCol, trendMeasureCol, 'avg');
  }, [filteredRows, primaryDimCol, trendMeasureCol]);

  // Aggregate Data for Dual-Axis Combo Chart (Primary Measure Bar + Secondary Rate Line)
  const comboChartData = useMemo(() => {
    if (!primaryDimCol || !primaryMeasureCol) return [];
    const measureAgg = aggregateDataForVisual(filteredRows, primaryDimCol, primaryMeasureCol, 'sum');
    const rateAgg = trendMeasureCol ? aggregateDataForVisual(filteredRows, primaryDimCol, trendMeasureCol, 'avg') : [];
    const rateMap = new Map(rateAgg.map(r => [r.category, r.value]));

    return measureAgg.map(item => ({
      category: item.category,
      measureVal: item.value,
      rateVal: rateMap.get(item.category) || 0,
      count: item.count,
    }));
  }, [filteredRows, primaryDimCol, primaryMeasureCol, trendMeasureCol]);

  // Filtered & Sorted Table Rows
  const tableDisplayRows = useMemo(() => {
    let list = [...filteredRows];
    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      list = list.filter(r =>
        Object.values(r).some(v => String(v).toLowerCase().includes(q))
      );
    }
    if (sortCol) {
      list.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA || '').localeCompare(String(valB || ''))
          : String(valB || '').localeCompare(String(valA || ''));
      });
    }
    return list;
  }, [filteredRows, tableSearch, sortCol, sortAsc]);

  const totalPages = Math.ceil(tableDisplayRows.length / pageSize) || 1;
  const pagedRows = tableDisplayRows.slice((page - 1) * pageSize, page * pageSize);

  const activeFiltersForDim = filters[primaryDimCol] || [];

  return (
    <div className="space-y-4">
      
      {/* Visual Categories Filter Strip */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setVisualsFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              visualsFilter === 'all'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Analytics (8 Visuals)</span>
          </button>

          <button
            onClick={() => setVisualsFilter('workforce')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              visualsFilter === 'workforce'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Workforce & Headcount</span>
          </button>

          {hasSalary && (
            <button
              onClick={() => setVisualsFilter('financial')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                visualsFilter === 'financial'
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Salary & Payroll</span>
            </button>
          )}

          <button
            onClick={() => setVisualsFilter('efficiency')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              visualsFilter === 'efficiency'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Efficiency & Benchmarks</span>
          </button>

          <button
            onClick={() => setVisualsFilter('matrix')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              visualsFilter === 'matrix'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Data Matrix Table</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block whitespace-nowrap">
          Interactive Cross-Filtering: Click bars or tiles to filter
        </div>
      </div>

      {/* Row 1: Dual-Axis Combo & Dedicated Headcount Distribution */}
      {(visualsFilter === 'all' || visualsFilter === 'workforce' || visualsFilter === 'financial') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Visual 1: Dual-Axis Combo Chart */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-400/20 text-amber-600">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Dual-Axis Combo Chart (Volume vs Rate)
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Bars: {primaryMeasureCol} • Line: {trendMeasureCol}
                  </span>
                </div>
              </div>

              {/* Dynamic Field Selectors */}
              <div className="flex items-center gap-1 text-xs">
                {catCols.length > 1 && (
                  <select
                    value={primaryDimCol}
                    onChange={(e) => setPrimaryDimCol(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-700 text-[10px] rounded px-1.5 py-0.5 outline-none font-sans"
                  >
                    {catCols.map(c => (
                      <option key={c.name} value={c.name}>
                        Axis: {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {numericCols.length > 1 && (
                  <select
                    value={primaryMeasureCol}
                    onChange={(e) => setPrimaryMeasureCol(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-700 text-[10px] rounded px-1.5 py-0.5 outline-none font-sans"
                  >
                    {numericCols.map(c => (
                      <option key={c.name} value={c.name}>
                        Bars: {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Chart Container */}
            <div className="h-64 w-full" dir="ltr">
              {comboChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No data available for chart
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={comboChartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#f59e0b' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-md border border-slate-800 space-y-1">
                              <p className="font-bold text-amber-400 border-b border-slate-800 pb-1">{d.category}</p>
                              <p className="text-slate-200">
                                {primaryMeasureCol}: <strong className="font-mono text-white font-bold">{d.measureVal.toLocaleString('en-US')}</strong>
                              </p>
                              {trendMeasureCol && (
                                <p className="text-amber-300">
                                  {trendMeasureCol}: <strong className="font-mono text-white">{d.rateVal}%</strong>
                                </p>
                              )}
                              <p className="text-slate-400 text-[10px]">Headcount: {d.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Bar
                      yAxisId="left"
                      dataKey="measureVal"
                      name={primaryMeasureCol}
                      fill="#0284c7"
                      radius={[4, 4, 0, 0]}
                    />
                    {trendMeasureCol && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="rateVal"
                        name={trendMeasureCol}
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#f59e0b' }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Visual 2: Dedicated Headcount & Working Hours Breakdown Chart */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-400/20 text-amber-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Department Breakdown: {deptMetricType === 'headcount' ? 'Headcount (Individuals)' : deptMetricType === 'hours' ? 'Total Working Hours' : 'Overtime Hours'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Exact breakdown across {departmentSummaries.length} active divisions ({filteredRows.length} total staff)
                  </span>
                </div>
              </div>

              {/* Metric Type Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDeptMetricType('headcount')}
                  className={`px-2 py-0.5 rounded transition ${
                    deptMetricType === 'headcount'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Headcount
                </button>
                <button
                  type="button"
                  onClick={() => setDeptMetricType('hours')}
                  className={`px-2 py-0.5 rounded transition ${
                    deptMetricType === 'hours'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Total Hours
                </button>
                <button
                  type="button"
                  onClick={() => setDeptMetricType('overtime')}
                  className={`px-2 py-0.5 rounded transition ${
                    deptMetricType === 'overtime'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overtime
                </button>
              </div>
            </div>

            <div className="h-64 w-full" dir="ltr">
              {departmentChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No department breakdown data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={95} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-md border border-slate-800 space-y-1">
                              <p className="font-bold text-amber-400">{d.category}</p>
                              <div className="text-[11px] text-slate-200 border-t border-slate-700 pt-1 space-y-0.5">
                                <p>• Headcount: <strong className="text-white font-mono">{d.headcount} staff</strong> ({d.sharePercentage}%)</p>
                                <p>• Total Working Hours: <strong className="text-sky-300 font-mono">{d.totalWorkingHours.toLocaleString('en-US')} hrs</strong></p>
                                <p>• Regular Base Hours: <strong className="text-slate-300 font-mono">{d.regularHours.toLocaleString('en-US')} hrs</strong></p>
                                <p>• Overtime Hours: <strong className="text-amber-300 font-mono">{d.overtimeHours.toLocaleString('en-US')} hrs</strong></p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                      onClick={(data: any) => {
                        if (data && data.category) {
                          onSelectCategoryFilter(deptColName, data.category);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {departmentChartData.map((_, index) => (
                        <Cell key={`cell-dept-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Prominent Full-Width Proportional Treemap Distribution */}
      {(visualsFilter === 'all' || visualsFilter === 'efficiency' || visualsFilter === 'workforce') && (
        <div className="w-full">
          <PowerBITreemap
            columns={columns}
            filteredRows={filteredRows}
            filters={filters}
            onSelectCategoryFilter={onSelectCategoryFilter}
          />
        </div>
      )}

      {/* Row 2: KPI Target Gauge & Spider / Radar Chart */}
      {(visualsFilter === 'all' || visualsFilter === 'efficiency') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PowerBIGauge columns={columns} filteredRows={filteredRows} />
          <PowerBIRadar columns={columns} filteredRows={filteredRows} />
        </div>
      )}

      {/* Row 3: Leaderboard & Category Distribution Donut */}
      {(visualsFilter === 'all' || visualsFilter === 'workforce') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PowerBILeaderboard
            columns={columns}
            filteredRows={filteredRows}
            onSelectCategory={(dim, val) => onSelectCategoryFilter(dim, val)}
          />
          
          {/* Donut Chart: Shift / Role / Status breakdown */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-400/20 text-amber-600">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Personnel Share: {secondaryDimCol}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Proportional segmentation
                  </span>
                </div>
              </div>

              {catCols.length > 1 && (
                <select
                  value={secondaryDimCol}
                  onChange={(e) => setSecondaryDimCol(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-[10px] rounded px-1.5 py-0.5 outline-none font-sans"
                >
                  {catCols.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="h-60 w-full flex items-center justify-center" dir="ltr">
              {donutChartData.length === 0 ? (
                <div className="text-xs text-slate-400">No distribution data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const total = donutChartData.reduce((a, b) => a + b.value, 0);
                          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded-lg text-xs shadow-md border border-slate-800">
                              <p className="font-bold text-amber-400">{d.category}</p>
                              <p className="mt-1">Count: <strong className="text-white font-mono">{d.value}</strong> ({pct}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Pie
                      data={donutChartData}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      onClick={(data: any) => {
                        if (data && data.category) {
                          onSelectCategoryFilter(secondaryDimCol, data.category);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {donutChartData.map((_, index) => (
                        <Cell key={`donut-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Row 4: Full-Width Metric Trend Area Chart */}
      {(visualsFilter === 'all' || visualsFilter === 'workforce') && (
        <div className="w-full">
          {/* Area Chart: Trend Measure */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-400/20 text-amber-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Metric Trend: {trendMeasureCol}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Average distribution across {primaryDimCol}
                  </span>
                </div>
              </div>

              {numericCols.length > 1 && (
                <select
                  value={trendMeasureCol}
                  onChange={(e) => setTrendMeasureCol(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-[10px] rounded px-1.5 py-0.5 outline-none font-sans"
                >
                  {numericCols.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="h-60 w-full" dir="ltr">
              {trendChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No trend data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded-lg text-xs shadow-md border border-slate-800">
                              <p className="font-bold text-violet-400">{d.category}</p>
                              <p className="mt-1 text-slate-200">
                                {trendMeasureCol}: <strong className="text-white font-mono">{d.value}</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#trendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Row 4.5: Official Department Workforce & Hours Audit Table */}
      {departmentSummaries.length > 0 && (visualsFilter === 'all' || visualsFilter === 'workforce') && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Department Workforce & Working Hours Official Audit</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                    {departmentSummaries.length} Divisions
                  </span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  Comprehensive audit verifying exact individuals count and logged hours per departmental unit
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Total Active Workforce: <strong className="text-slate-900">{filteredRows.length} individuals</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-semibold border-y border-slate-200">
                <tr>
                  <th className="p-2.5">Department</th>
                  <th className="p-2.5 text-right">Headcount</th>
                  <th className="p-2.5 text-right">Workforce Share</th>
                  <th className="p-2.5 text-right">Total Hours</th>
                  <th className="p-2.5 text-right">Regular Hours</th>
                  <th className="p-2.5 text-right">Overtime</th>
                  {hasSalary && <th className="p-2.5 text-right">Total Payroll</th>}
                  <th className="p-2.5 text-center">Cross-Filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {departmentSummaries.map((dept) => {
                  const isFiltered = deptColName ? filters[deptColName]?.includes(dept.department) : false;
                  return (
                    <tr
                      key={dept.department}
                      className={`hover:bg-amber-50/50 transition ${isFiltered ? 'bg-amber-50/80 font-medium' : ''}`}
                    >
                      <td className="p-2.5 font-medium text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="truncate max-w-[160px]">{dept.department}</span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {dept.headcount}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        {dept.sharePercentage}%
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-sky-700">
                        {dept.totalWorkingHours.toLocaleString('en-US')} hrs
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        {dept.regularHours.toLocaleString('en-US')} hrs
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold text-amber-700">
                        {dept.overtimeHours > 0 ? `+${dept.overtimeHours.toLocaleString('en-US')} hrs` : '-'}
                      </td>
                      {hasSalary && (
                        <td className="p-2.5 text-right font-mono text-emerald-700">
                          ${dept.totalSalary.toLocaleString('en-US')}
                        </td>
                      )}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectCategoryFilter(deptColName, dept.department)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                            isFiltered
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-100 hover:bg-amber-100 text-slate-700'
                          }`}
                        >
                          {isFiltered ? 'Active Filter' : 'Filter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/90 text-slate-900 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="p-2.5 text-slate-900">
                    Total Active Workforce
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-950">
                    {departmentSummaries.reduce((sum, d) => sum + d.headcount, 0)}
                  </td>
                  <td className="p-2.5 text-right font-mono">100.0%</td>
                  <td className="p-2.5 text-right font-mono text-sky-800">
                    {departmentSummaries.reduce((sum, d) => sum + d.totalWorkingHours, 0).toLocaleString('en-US')} hrs
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-700">
                    {departmentSummaries.reduce((sum, d) => sum + d.regularHours, 0).toLocaleString('en-US')} hrs
                  </td>
                  <td className="p-2.5 text-right font-mono text-amber-800">
                    +{departmentSummaries.reduce((sum, d) => sum + d.overtimeHours, 0).toLocaleString('en-US')} hrs
                  </td>
                  {hasSalary && (
                    <td className="p-2.5 text-right font-mono text-emerald-800">
                      ${departmentSummaries.reduce((sum, d) => sum + d.totalSalary, 0).toLocaleString('en-US')}
                    </td>
                  )}
                  <td className="p-2.5 text-center text-slate-400 text-[10px]">Audit Verified</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Row 5: Detailed Matrix Table View */}
      {(visualsFilter === 'all' || visualsFilter === 'matrix') && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>Executive Data Matrix (Filtered Records: {filteredRows.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400">
                Click table headers to sort, or filter records with the search box
              </span>
            </div>

            {/* Table Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search active records..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-400 font-sans"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold border-y border-slate-200">
                <tr>
                  <th className="p-2 w-10 text-slate-400 font-mono">#</th>
                  {columns.slice(0, 8).map(col => (
                    <th
                      key={col.name}
                      onClick={() => {
                        if (sortCol === col.name) {
                          setSortAsc(!sortAsc);
                        } else {
                          setSortCol(col.name);
                          setSortAsc(true);
                        }
                      }}
                      className="p-2 cursor-pointer hover:bg-slate-200/60 transition select-none truncate"
                      title="Click to sort"
                    >
                      <div className="flex items-center gap-1">
                        <span className="truncate">{col.name}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-xs text-slate-400">
                      No records match the current filter or search criteria
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 transition">
                      <td className="p-2 text-slate-400 font-mono text-[11px]">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      {columns.slice(0, 8).map(col => (
                        <td key={col.name} className="p-2 text-slate-800 font-mono truncate max-w-[160px]">
                          {row[col.name] !== undefined && row[col.name] !== null
                            ? typeof row[col.name] === 'number'
                              ? row[col.name].toLocaleString('en-US')
                              : String(row[col.name])
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-500 font-mono">
              Page {page} of {totalPages} ({tableDisplayRows.length} items)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded text-xs transition cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded text-xs transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
