import { useState, useMemo } from 'react';
import {
  Filter,
  X,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  Pin,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Zap,
  Users,
} from 'lucide-react';
import { ColumnProfile, FilterState } from '../types/powerbi';

interface PowerBISlicersProps {
  columns: ColumnProfile[];
  rawRows: Record<string, any>[];
  filters: FilterState;
  onFilterChange: (columnName: string, selectedValues: string[]) => void;
  onClearAllFilters: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PowerBISlicers({
  columns,
  rawRows,
  filters,
  onFilterChange,
  onClearAllFilters,
  isOpen,
  onClose,
}: PowerBISlicersProps) {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [collapsedCols, setCollapsedCols] = useState<Record<string, boolean>>({});

  // Categorical columns eligible for slicers (2 to 45 distinct values)
  const slicerColumns = useMemo(() => {
    return columns.filter(
      col => col.type === 'string' && col.distinctCount >= 2 && col.distinctCount <= 45
    );
  }, [columns]);

  // Total raw dataset size
  const totalRawCount = rawRows.length;

  // Compute counts and percentage shares for each distinct value
  const valueMetrics = useMemo(() => {
    const metrics: Record<string, Record<string, { count: number; pct: string }>> = {};
    slicerColumns.forEach(col => {
      metrics[col.name] = {};
      const counts: Record<string, number> = {};
      rawRows.forEach(row => {
        const val = String(row[col.name] || 'Unassigned').trim();
        counts[val] = (counts[val] || 0) + 1;
      });

      Object.entries(counts).forEach(([val, count]) => {
        const pct = totalRawCount > 0 ? ((count / totalRawCount) * 100).toFixed(1) : '0';
        metrics[col.name][val] = { count, pct };
      });
    });
    return metrics;
  }, [slicerColumns, rawRows, totalRawCount]);

  // Identify special overtime column if available for smart quick filters
  const overtimeCol = useMemo(() => {
    return columns.find(
      c => c.type === 'number' && /overtime|ot.*hour|ساعات.*إضافي|إضافي|اضافي/i.test(c.name)
    );
  }, [columns]);

  if (!isOpen) return null;

  const totalActiveFilters = Object.values(filters).reduce((acc, curr) => acc + (curr ? curr.length : 0), 0);

  // Toggle single item selection
  const toggleValue = (colName: string, val: string) => {
    const current = filters[colName] || [];
    if (current.includes(val)) {
      onFilterChange(colName, current.filter(v => v !== val));
    } else {
      onFilterChange(colName, [...current, val]);
    }
  };

  // Select all matching values for a column
  const handleSelectAll = (colName: string, values: string[]) => {
    onFilterChange(colName, values);
  };

  // Clear all selections for a single column
  const handleClearColumn = (colName: string) => {
    onFilterChange(colName, []);
  };

  // Collapse / Expand toggle
  const toggleColumnCollapse = (colName: string) => {
    setCollapsedCols(prev => ({ ...prev, [colName]: !prev[colName] }));
  };

  // Global Collapse / Expand All
  const handleToggleAllCollapse = () => {
    const allCollapsed = slicerColumns.every(col => collapsedCols[col.name]);
    const nextState: Record<string, boolean> = {};
    slicerColumns.forEach(col => {
      nextState[col.name] = !allCollapsed;
    });
    setCollapsedCols(nextState);
  };

  return (
    <aside
      id="interactive-slicers-pane"
      className="w-full lg:w-80 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden flex flex-col shrink-0 lg:sticky lg:top-20 z-30 max-h-[calc(100vh-5.5rem)] transition-all duration-300 ring-1 ring-slate-950/5 animate-in fade-in"
      aria-label="Interactive Data Slicers"
    >
      {/* Slicers Header - Floating & Sticky Anchor */}
      <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Filter className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-slate-100 tracking-tight">Interactive Slicers</h3>
              {totalActiveFilters > 0 && (
                <span className="text-[10px] font-mono font-black px-2 py-0.2 bg-amber-400 text-slate-950 rounded-full shadow-xs">
                  {totalActiveFilters}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 font-sans">
              <Pin className="w-2.5 h-2.5 text-amber-400" />
              <span>Floating & Sticky Mode</span>
            </div>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Collapse/Expand all */}
          <button
            type="button"
            onClick={handleToggleAllCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Toggle Collapse / Expand All"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Reset all filters */}
          {totalActiveFilters > 0 && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="px-2 py-1 text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg flex items-center gap-1 transition cursor-pointer font-bold"
              title="Reset all active slicers"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Close Panel Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Slicers Pane"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Filter Pills Quick Bar (if any active filters exist) */}
      {totalActiveFilters > 0 && (
        <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center gap-1.5 shrink-0 max-h-24 overflow-y-auto">
          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Active:</span>
          {Object.entries(filters).map(([colName, vals]) => {
            if (!vals || vals.length === 0) return null;
            return vals.map(val => (
              <button
                key={`${colName}-${val}`}
                type="button"
                onClick={() => toggleValue(colName, val)}
                className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-slate-800 border border-amber-300 text-[10px] font-semibold hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition cursor-pointer shadow-2xs"
                title={`Remove filter: ${colName} = ${val}`}
              >
                <span className="max-w-[120px] truncate">{val}</span>
                <X className="w-2.5 h-2.5 text-slate-400 group-hover:text-rose-600" />
              </button>
            ));
          })}
        </div>
      )}

      {/* Slicers Scrollable Body */}
      <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 divide-y divide-slate-100">
        {slicerColumns.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No categorical columns</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Upload a dataset with department, shift, or role data</p>
          </div>
        ) : (
          slicerColumns.map(col => {
            const isCollapsed = collapsedCols[col.name];
            const currentSelected = filters[col.name] || [];
            const searchTerm = searchTerms[col.name] || '';
            const allVals = col.distinctValues;
            const filteredVals = searchTerm
              ? allVals.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
              : allVals;

            const isAllSelected = filteredVals.length > 0 && filteredVals.every(v => currentSelected.includes(v));

            return (
              <div key={col.name} className="pt-3 first:pt-0">
                
                {/* Slicer Column Card Header */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
                  <div
                    onClick={() => toggleColumnCollapse(col.name)}
                    className="w-full px-3 py-2.5 bg-slate-100/90 hover:bg-slate-200/70 flex items-center justify-between text-xs font-bold text-slate-800 transition cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate tracking-tight font-black">{col.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({col.distinctCount})
                      </span>
                      {currentSelected.length > 0 && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full font-mono shadow-2xs">
                          {currentSelected.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Slicer Column Body */}
                  {!isCollapsed && (
                    <div className="p-2.5 space-y-2 bg-white">
                      
                      {/* Search & Quick Select Controls */}
                      <div className="flex items-center gap-1.5">
                        {allVals.length > 5 && (
                          <div className="relative flex-1">
                            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2.5" />
                            <input
                              type="text"
                              placeholder={`Filter ${col.name}...`}
                              value={searchTerm}
                              onChange={e => setSearchTerms(prev => ({ ...prev, [col.name]: e.target.value }))}
                              className="w-full pl-6 pr-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-400 focus:bg-white transition"
                            />
                            {searchTerm && (
                              <button
                                type="button"
                                onClick={() => setSearchTerms(prev => ({ ...prev, [col.name]: '' }))}
                                className="absolute right-1.5 top-2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Quick Select All / Clear Toggle Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (isAllSelected) {
                                handleClearColumn(col.name);
                              } else {
                                handleSelectAll(col.name, filteredVals);
                              }
                            }}
                            className="px-1.5 py-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer flex items-center gap-1"
                            title={isAllSelected ? 'Deselect All' : 'Select All'}
                          >
                            {isAllSelected ? <CheckSquare className="w-3 h-3 text-amber-600" /> : <Square className="w-3 h-3" />}
                            <span>{isAllSelected ? 'None' : 'All'}</span>
                          </button>

                          {currentSelected.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleClearColumn(col.name)}
                              className="px-1.5 py-1 text-[10px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded transition cursor-pointer"
                              title="Clear selection"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Value Checkbox List */}
                      <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                        {filteredVals.map(val => {
                          const isChecked = currentSelected.includes(val);
                          const metric = valueMetrics[col.name]?.[val] || { count: 0, pct: '0' };

                          return (
                            <label
                              key={val}
                              onClick={() => toggleValue(col.name, val)}
                              className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition select-none group ${
                                isChecked
                                  ? 'bg-amber-100/90 text-amber-950 font-bold shadow-2xs border border-amber-300/60'
                                  : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                <div
                                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition shrink-0 ${
                                    isChecked
                                      ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-2xs'
                                      : 'border-slate-300 bg-white group-hover:border-slate-400'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="truncate text-[11px]" title={val}>
                                  {val}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                                <span className="text-slate-500 font-semibold">{metric.count}</span>
                                <span className="px-1 rounded bg-slate-100 text-slate-400 font-normal">
                                  {metric.pct}%
                                </span>
                              </div>
                            </label>
                          );
                        })}

                        {filteredVals.length === 0 && (
                          <div className="text-center py-3 text-[11px] text-slate-400">
                            No matching records
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Slicers Footer Sticky Summary */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-semibold">
            {totalActiveFilters > 0 ? `${totalActiveFilters} Slicers Applied` : 'Ready to slice'}
          </span>
        </div>

        {totalActiveFilters > 0 && (
          <button
            type="button"
            onClick={onClearAllFilters}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 transition cursor-pointer underline decoration-amber-300"
          >
            Clear All
          </button>
        )}
      </div>
    </aside>
  );
}
