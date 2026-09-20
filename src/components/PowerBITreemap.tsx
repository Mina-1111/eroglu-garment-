import { useState, useMemo } from 'react';
import { ColumnProfile, FilterState } from '../types/powerbi';
import { aggregateDataForVisual } from '../utils/universalParser';
import {
  LayoutGrid,
  Filter,
  Maximize2,
  Minimize2,
  Users,
  Clock,
  Zap,
  DollarSign,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PowerBITreemapProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
  filters: FilterState;
  onSelectCategoryFilter: (colName: string, categoryVal: string) => void;
}

// Enterprise high-contrast bento card gradients & color classes
const BENTO_THEMES = [
  {
    bg: 'bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 text-slate-950 border-amber-400/80 shadow-amber-500/10',
    bar: 'bg-slate-950/30',
    badge: 'bg-slate-950/20 text-slate-950 border-slate-950/20',
    subText: 'text-slate-900/80',
    rankBadge: 'bg-slate-950 text-amber-400',
  },
  {
    bg: 'bg-gradient-to-br from-sky-600 via-sky-600 to-blue-700 text-white border-sky-400/50 shadow-sky-500/10',
    bar: 'bg-white/30',
    badge: 'bg-black/25 text-sky-100 border-white/20',
    subText: 'text-sky-100/90',
    rankBadge: 'bg-black/40 text-sky-300',
  },
  {
    bg: 'bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white border-emerald-400/50 shadow-emerald-500/10',
    bar: 'bg-white/30',
    badge: 'bg-black/25 text-emerald-100 border-white/20',
    subText: 'text-emerald-100/90',
    rankBadge: 'bg-black/40 text-emerald-300',
  },
  {
    bg: 'bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 text-white border-violet-400/50 shadow-violet-500/10',
    bar: 'bg-white/30',
    badge: 'bg-black/25 text-violet-100 border-white/20',
    subText: 'text-violet-100/90',
    rankBadge: 'bg-black/40 text-violet-300',
  },
  {
    bg: 'bg-gradient-to-br from-rose-600 via-rose-600 to-pink-700 text-white border-rose-400/50 shadow-rose-500/10',
    bar: 'bg-white/30',
    badge: 'bg-black/25 text-rose-100 border-white/20',
    subText: 'text-rose-100/90',
    rankBadge: 'bg-black/40 text-rose-300',
  },
  {
    bg: 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-slate-800 text-white border-indigo-400/50 shadow-indigo-500/10',
    bar: 'bg-white/30',
    badge: 'bg-black/25 text-indigo-100 border-white/20',
    subText: 'text-indigo-100/90',
    rankBadge: 'bg-black/40 text-indigo-300',
  },
  {
    bg: 'bg-gradient-to-br from-teal-600 via-teal-600 to-emerald-700 text-white border-teal-400/50 shadow-teal-500/10',
    bar: 'bg-white/30',
    badge: 'bg-black/25 text-teal-100 border-white/20',
    subText: 'text-teal-100/90',
    rankBadge: 'bg-black/40 text-teal-300',
  },
  {
    bg: 'bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 text-white border-orange-400/50 shadow-orange-500/10',
    bar: 'bg-white/30',
    badge: 'bg-black/25 text-orange-100 border-white/20',
    subText: 'text-orange-100/90',
    rankBadge: 'bg-black/40 text-orange-300',
  },
  {
    bg: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white border-slate-600 shadow-slate-900/10',
    bar: 'bg-amber-400/50',
    badge: 'bg-black/40 text-slate-200 border-white/20',
    subText: 'text-slate-300',
    rankBadge: 'bg-amber-500 text-slate-950',
  },
  {
    bg: 'bg-gradient-to-br from-cyan-600 via-cyan-600 to-sky-700 text-white border-cyan-400/50 shadow-cyan-500/10',
    bar: 'bg-white/30',
    badge: 'bg-black/25 text-cyan-100 border-white/20',
    subText: 'text-cyan-100/90',
    rankBadge: 'bg-black/40 text-cyan-300',
  },
];

export function PowerBITreemap({
  columns,
  filteredRows,
  filters,
  onSelectCategoryFilter,
}: PowerBITreemapProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'alpha'>('desc');

  const numericCols = useMemo(
    () => columns.filter(c => c.type === 'number' && !/code|id|serial|barcode|no|#/i.test(c.name)),
    [columns]
  );
  const catCols = useMemo(
    () => columns.filter(c => c.type === 'string' && c.distinctCount >= 2 && c.distinctCount <= 40),
    [columns]
  );

  // Detect key columns
  const hoursCol = useMemo(
    () => numericCols.find(c => /total.*(work|hour)|working.*hour|total_hours|ساعات.*العمل|اجمالي.*ساعات/i.test(c.name)),
    [numericCols]
  );
  const overtimeCol = useMemo(
    () => numericCols.find(c => /overtime|ot.*hour|ساعات.*إضافي|إضافي|اضافي/i.test(c.name)),
    [numericCols]
  );
  const regularHoursCol = useMemo(
    () => numericCols.find(c => /regular.*hour|base.*hour|ساعات.*أساسية|ساعات.*اساسية/i.test(c.name)),
    [numericCols]
  );
  const salaryCol = useMemo(
    () => numericCols.find(c => /salary|wage|payroll|مرتب|راتب/i.test(c.name)),
    [numericCols]
  );

  // Selected dimension (category)
  const [dimCol, setDimCol] = useState<string>(() => {
    const found = catCols.find(c => /department|dept|line|division|shift|category|القسم|قسم/i.test(c.name)) || catCols[0];
    return found ? found.name : '';
  });

  // Selected measure (__HEADCOUNT__ for count, or column name for numeric measure)
  const [measureKey, setMeasureKey] = useState<string>(() => {
    if (hoursCol) return hoursCol.name;
    return '__HEADCOUNT__';
  });

  const [aggType, setAggType] = useState<'sum' | 'avg'>('sum');

  // Calculate Treemap data with proportional hierarchy and ranking
  const treemapData = useMemo(() => {
    if (!dimCol) return { items: [], totalVolume: 0, maxVolume: 0 };

    let rawItems: { category: string; value: number; count: number }[] = [];

    if (measureKey === '__HEADCOUNT__') {
      // Group by distinct categories and count rows
      const counts: Record<string, number> = {};
      filteredRows.forEach(row => {
        const cat = String(row[dimCol] || 'Unassigned').trim();
        counts[cat] = (counts[cat] || 0) + 1;
      });
      rawItems = Object.entries(counts).map(([category, count]) => ({
        category,
        value: count,
        count,
      }));
    } else {
      rawItems = aggregateDataForVisual(filteredRows, dimCol, measureKey, aggType);
    }

    // Filter out 0-value items if there are other valid items
    const positiveItems = rawItems.filter(i => i.value > 0);
    const validItems = positiveItems.length > 0 ? positiveItems : rawItems;

    // Sorting
    const sorted = [...validItems].sort((a, b) => {
      if (sortOrder === 'desc') return b.value - a.value;
      if (sortOrder === 'asc') return a.value - b.value;
      return a.category.localeCompare(b.category);
    });

    const totalVolume = sorted.reduce((acc, curr) => acc + curr.value, 0);
    const maxVolume = sorted.length > 0 ? Math.max(...sorted.map(s => s.value)) : 0;

    const items = sorted.map((item, idx) => {
      const pctNum = totalVolume > 0 ? (item.value / totalVolume) * 100 : 0;
      const theme = BENTO_THEMES[idx % BENTO_THEMES.length];
      const isTop3 = idx < 3;

      // Assign proportional grid spans for Bento layout:
      // Top 1 item gets the biggest hero span
      // Top 2 & 3 get wide prominent spans
      // Rank 4 to 6 get medium spans
      // Remaining get compact spans
      let spanClass = 'col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3 min-h-[145px]';
      if (idx === 0) {
        spanClass = 'col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-5 min-h-[190px]';
      } else if (idx === 1) {
        spanClass = 'col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-4 min-h-[190px]';
      } else if (idx === 2) {
        spanClass = 'col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3 min-h-[190px]';
      } else if (idx < 6) {
        spanClass = 'col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-4 xl:col-span-3 min-h-[160px]';
      } else {
        spanClass = 'col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-3 xl:col-span-2 min-h-[140px]';
      }

      return {
        ...item,
        rank: idx + 1,
        isTop3,
        percentage: pctNum.toFixed(1),
        percentageNum: pctNum,
        relativeBarWidth: maxVolume > 0 ? Math.max(8, Math.round((item.value / maxVolume) * 100)) : 10,
        theme,
        spanClass,
      };
    });

    return { items, totalVolume, maxVolume };
  }, [filteredRows, dimCol, measureKey, aggType, sortOrder]);

  const activeFiltersForCol = filters[dimCol] || [];

  // Format metric value
  const formatMetricValue = (val: number) => {
    if (measureKey === '__HEADCOUNT__') {
      return `${val.toLocaleString('en-US')} staff`;
    }
    if (/hour|hrs|ساعات|ساعة/i.test(measureKey)) {
      return `${val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val.toLocaleString('en-US')} h`;
    }
    if (/salary|wage|payroll|مرتب|راتب/i.test(measureKey)) {
      return `$${val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val.toLocaleString('en-US')}`;
    }
    return val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val.toLocaleString('en-US');
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm transition-all flex flex-col justify-between overflow-hidden ${
        isExpanded ? 'p-5 sm:p-6 min-h-[640px]' : 'p-4 sm:p-5 min-h-[460px] lg:min-h-[520px]'
      }`}
    >
      {/* Top Header & Interactive Control Center */}
      <div className="flex flex-col gap-3 pb-3.5 mb-3 border-b border-slate-100">
        
        {/* Title Bar & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-xs shrink-0 ring-2 ring-amber-400/20">
              <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Proportional Treemap Distribution
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold border border-amber-300">
                  {treemapData.items.length} Segments
                </span>
                {activeFiltersForCol.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                    <Filter className="w-2.5 h-2.5" /> Filtered ({activeFiltersForCol.length})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Proportional Bento tile sizing mapped to workforce volume contribution • Click any tile to cross-filter
              </p>
            </div>
          </div>

          {/* Quick Actions & Maximize */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
            {activeFiltersForCol.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  activeFiltersForCol.forEach(v => onSelectCategoryFilter(dimCol, v));
                }}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                title="Clear current dimension filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ({dimCol})</span>
              </button>
            )}

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : prev === 'asc' ? 'alpha' : 'desc'))}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
              title={`Sorting: ${sortOrder === 'desc' ? 'Highest First' : sortOrder === 'asc' ? 'Lowest First' : 'Alphabetical'}`}
            >
              {sortOrder === 'desc' ? (
                <>
                  <ArrowDownWideNarrow className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Highest</span>
                </>
              ) : sortOrder === 'asc' ? (
                <>
                  <ArrowUpNarrowWide className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden md:inline">Lowest</span>
                </>
              ) : (
                <span className="font-mono text-slate-800">A-Z</span>
              )}
            </button>

            {/* Expand / Maximize View Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className={`p-1.5 rounded-lg border text-xs transition cursor-pointer flex items-center gap-1 ${
                isExpanded
                  ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={isExpanded ? 'Collapse Treemap to Standard Height' : 'Enlarge Treemap to Full Viewport Height'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="text-[11px] font-medium hidden sm:inline">
                {isExpanded ? 'Standard' : 'Enlarge'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Metric Presets & Dimension Selectors Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100/80">
          
          {/* Quick Presets Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-0.5">
              Quick Metric:
            </span>

            {/* Headcount Preset */}
            <button
              type="button"
              onClick={() => setMeasureKey('__HEADCOUNT__')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                measureKey === '__HEADCOUNT__'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Headcount (Staff)</span>
            </button>

            {/* Total Hours Preset */}
            {hoursCol && (
              <button
                type="button"
                onClick={() => setMeasureKey(hoursCol.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  measureKey === hoursCol.name
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Total Hours</span>
              </button>
            )}

            {/* Overtime Preset */}
            {overtimeCol && (
              <button
                type="button"
                onClick={() => setMeasureKey(overtimeCol.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  measureKey === overtimeCol.name
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Overtime</span>
              </button>
            )}

            {/* Regular Base Hours Preset */}
            {regularHoursCol && (
              <button
                type="button"
                onClick={() => setMeasureKey(regularHoursCol.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  measureKey === regularHoursCol.name
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>Regular Base</span>
              </button>
            )}

            {/* Salary / Value Preset */}
            {salaryCol && (
              <button
                type="button"
                onClick={() => setMeasureKey(salaryCol.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  measureKey === salaryCol.name
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <DollarSign className="w-3 h-3" />
                <span>Payroll</span>
              </button>
            )}
          </div>

          {/* Granular Dropdown Selectors */}
          <div className="flex items-center gap-2 text-xs ml-auto">
            {/* Dimension Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-semibold">Group By:</span>
              <select
                value={dimCol}
                onChange={(e) => setDimCol(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold rounded-lg px-2 py-1 outline-none font-sans cursor-pointer"
                title="Select Dimension Field"
              >
                {catCols.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.distinctCount} vals)
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Measure Column Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-semibold">Value:</span>
              <select
                value={measureKey}
                onChange={(e) => setMeasureKey(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold rounded-lg px-2 py-1 outline-none font-sans cursor-pointer max-w-[140px] truncate"
                title="Select Quantitative Measure"
              >
                <option value="__HEADCOUNT__">Headcount (Count)</option>
                {numericCols.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Aggregation type toggle for numeric measures */}
            {measureKey !== '__HEADCOUNT__' && (
              <button
                type="button"
                onClick={() => setAggType(prev => (prev === 'sum' ? 'avg' : 'sum'))}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-mono font-bold cursor-pointer uppercase"
                title="Toggle Sum / Average aggregation"
              >
                {aggType}
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Bento Grid Proportional Treemap Canvas */}
      <div className="flex-1 w-full">
        {treemapData.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-xs text-slate-400 py-16">
            <LayoutGrid className="w-8 h-8 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No distribution records found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try clearing active slicers or changing the dimension</p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-3 w-full">
            {treemapData.items.map((item) => {
              const isSelected = activeFiltersForCol.includes(item.category);

              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => onSelectCategoryFilter(dimCol, item.category)}
                  className={`${item.spanClass} ${item.theme.bg} rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left relative overflow-hidden border shadow-sm group ${
                    isSelected
                      ? 'ring-4 ring-amber-400 scale-[0.99] shadow-lg brightness-105'
                      : 'hover:scale-[1.012] hover:shadow-md'
                  }`}
                  title={`${item.category}: ${formatMetricValue(item.value)} (${item.percentage}%), Headcount: ${item.count} staff`}
                >
                  {/* Decorative faint background volume watermark */}
                  <div className="absolute -right-3 -bottom-4 opacity-10 text-6xl font-black select-none pointer-events-none font-mono">
                    #{item.rank}
                  </div>

                  {/* Tile Top Row: Rank, Category Title & Percentage Badge */}
                  <div className="flex items-start justify-between gap-2 w-full z-10">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md ${item.theme.rankBadge} shadow-xs shrink-0`}
                      >
                        #{item.rank}
                      </span>
                      <h4 className="text-sm font-black truncate drop-shadow-xs tracking-tight" title={item.category}>
                        {item.category}
                      </h4>
                    </div>

                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded-full border shadow-2xs shrink-0 ${item.theme.badge}`}
                    >
                      {item.percentage}%
                    </span>
                  </div>

                  {/* Tile Middle: Prominent Formatted Value & Proportional Progress Track */}
                  <div className="my-2.5 w-full z-10">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight drop-shadow-xs">
                        {formatMetricValue(item.value)}
                      </span>
                    </div>

                    {/* Proportional Volume Progress Bar */}
                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mt-2 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.theme.bar}`}
                        style={{ width: `${item.relativeBarWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Tile Bottom Row: Detailed Sub-metrics & Active Indicator */}
                  <div className="pt-2 border-t border-white/20 flex items-center justify-between gap-2 w-full text-[11px] z-10">
                    <div className={`flex items-center gap-2 font-medium ${item.theme.subText}`}>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 opacity-80" />
                        <strong>{item.count}</strong> staff
                      </span>
                      {measureKey !== '__HEADCOUNT__' && item.count > 0 && (
                        <span className="hidden sm:inline opacity-80">
                          • avg {(item.value / item.count).toFixed(1)}/p
                        </span>
                      )}
                    </div>

                    {isSelected ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-xs shrink-0 animate-pulse">
                        <CheckCircle2 className="w-3 h-3" /> Filter Active
                      </span>
                    ) : (
                      <span className="text-[10px] opacity-0 group-hover:opacity-90 transition font-semibold hidden md:inline">
                        Click to filter →
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Summary & Volume Ledger Strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-slate-700 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Cumulative Volume:</span>
            <strong className="text-slate-900 font-mono">{formatMetricValue(treemapData.totalVolume)}</strong>
          </span>

          {treemapData.items.length > 0 && (
            <span className="hidden md:inline text-slate-400">
              • Dominant Unit: <strong className="text-amber-700">{treemapData.items[0].category}</strong> ({treemapData.items[0].percentage}%)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Click any bento card to cross-filter entire dashboard</span>
        </div>
      </div>
    </div>
  );
}
