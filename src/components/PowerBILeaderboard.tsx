import { useState, useMemo } from 'react';
import { ColumnProfile } from '../types/powerbi';
import { aggregateDataForVisual } from '../utils/universalParser';
import { Trophy, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';

interface PowerBILeaderboardProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
  onSelectCategory: (dimName: string, catVal: string) => void;
}

export function PowerBILeaderboard({
  columns,
  filteredRows,
  onSelectCategory,
}: PowerBILeaderboardProps) {
  const numericCols = useMemo(
    () => columns.filter(c => c.type === 'number' && !/code|id|serial|barcode|no|#/i.test(c.name)),
    [columns]
  );
  const catCols = useMemo(
    () => columns.filter(c => c.type === 'string' && c.distinctCount >= 2 && c.distinctCount <= 50),
    [columns]
  );

  const [dimCol, setDimCol] = useState<string>(() => {
    const found = catCols.find(c => /name|employee|job|department|line|category/i.test(c.name)) || catCols[0];
    return found ? found.name : '';
  });

  const [measureCol, setMeasureCol] = useState<string>(() => {
    const salary = numericCols.find(c => /salary|wage|payroll/i.test(c.name));
    if (salary) return salary.name;
    const eff = numericCols.find(c => /efficiency|rate|score/i.test(c.name));
    return eff ? eff.name : (numericCols[0]?.name || '');
  });

  const [viewMode, setViewMode] = useState<'top' | 'bottom'>('top');

  // Aggregated and ranked list
  const rankedItems = useMemo(() => {
    if (!dimCol || !measureCol || filteredRows.length === 0) return [];
    const agg = aggregateDataForVisual(filteredRows, dimCol, measureCol, 'avg');
    const overallAvg = agg.reduce((a, b) => a + b.value, 0) / (agg.length || 1);
    const maxVal = agg[0]?.value || 1;

    return agg.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      percentOfMax: maxVal > 0 ? Math.round((item.value / maxVal) * 100) : 0,
      diffFromAvg: (item.value - overallAvg).toFixed(1),
    }));
  }, [filteredRows, dimCol, measureCol]);

  const displayList = useMemo(() => {
    if (viewMode === 'top') {
      return rankedItems.slice(0, 5);
    } else {
      return [...rankedItems].reverse().slice(0, 5);
    }
  }, [rankedItems, viewMode]);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-400/20 text-amber-600">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">
              Top & Bottom Performer Rankings
            </h3>
            <span className="text-[10px] text-slate-400">
              Pareto ranking and variance analysis against benchmark
            </span>
          </div>
        </div>

        {/* View Mode Toggle & Selectors */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px] font-sans">
            <button
              onClick={() => setViewMode('top')}
              className={`px-2 py-0.5 rounded cursor-pointer font-bold transition ${
                viewMode === 'top' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 5 Performers
            </button>
            <button
              onClick={() => setViewMode('bottom')}
              className={`px-2 py-0.5 rounded cursor-pointer font-bold transition ${
                viewMode === 'bottom' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bottom 5 Focus
            </button>
          </div>

          {catCols.length > 1 && (
            <select
              value={dimCol}
              onChange={(e) => setDimCol(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-[10px] rounded px-1.5 py-0.5 outline-none font-sans"
              title="Rank Dimension"
            >
              {catCols.map(c => (
                <option key={c.name} value={c.name}>
                  By: {c.name}
                </option>
              ))}
            </select>
          )}

          {numericCols.length > 1 && (
            <select
              value={measureCol}
              onChange={(e) => setMeasureCol(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-[10px] rounded px-1.5 py-0.5 outline-none font-sans"
              title="Measure"
            >
              {numericCols.map(c => (
                <option key={c.name} value={c.name}>
                  Metric: {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Leaderboard Stack */}
      <div className="space-y-2.5 my-1">
        {displayList.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-8">
            No ranking data available
          </div>
        ) : (
          displayList.map((item, idx) => {
            const isPositive = Number(item.diffFromAvg) >= 0;
            const rankNumber = viewMode === 'top' ? idx + 1 : rankedItems.length - idx;

            return (
              <div
                key={item.category}
                onClick={() => onSelectCategory(dimCol, item.category)}
                className="p-2.5 rounded-lg border border-slate-100 hover:border-amber-300 bg-slate-50/70 hover:bg-amber-50/50 transition cursor-pointer flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                        rankNumber === 1
                          ? 'bg-amber-400 text-slate-950'
                          : rankNumber === 2
                          ? 'bg-slate-300 text-slate-900'
                          : rankNumber === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {rankNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-slate-900">
                      {item.value.toLocaleString('en-US')}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {item.diffFromAvg}
                    </span>
                  </div>
                </div>

                {/* Progress Bar representation */}
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      viewMode === 'top' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(5, item.percentOfMax)}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
