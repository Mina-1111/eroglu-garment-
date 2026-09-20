import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ColumnProfile, VisualType, AggregationType } from '../types/powerbi';
import { aggregateDataForVisual } from '../utils/universalParser';
import { Sliders, BarChart3, LineChart as LineIcon, PieChart as PieIcon, Sparkles } from 'lucide-react';

interface PowerBIVisualBuilderProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
}

const PALETTE = ['#f59e0b', '#0284c7', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4', '#eab308', '#6366f1'];

export function PowerBIVisualBuilder({
  columns,
  filteredRows,
}: PowerBIVisualBuilderProps) {
  const numericCols = useMemo(
    () => columns.filter(c => c.type === 'number' && !/code|id|serial|barcode|no|#/i.test(c.name)),
    [columns]
  );
  const catCols = useMemo(() => columns.filter(c => c.type === 'string'), [columns]);

  // Visual type
  const [visualType, setVisualType] = useState<VisualType>('column');

  // Selected Dimension (X-Axis / Category)
  const [selectedDim, setSelectedDim] = useState<string>(() => {
    return catCols[0]?.name || columns[0]?.name || '';
  });

  // Selected Measure (Y-Axis / Value) - prioritize salary
  const [selectedMeasure, setSelectedMeasure] = useState<string>(() => {
    const salary = numericCols.find(c => /salary|wage|payroll/i.test(c.name));
    if (salary) return salary.name;
    const hours = numericCols.find(c => /hour|overtime/i.test(c.name));
    if (hours) return hours.name;
    return numericCols[0]?.name || columns[1]?.name || '';
  });

  // Selected Aggregation
  const [aggregation, setAggregation] = useState<AggregationType>('sum');

  // Computed data for the custom visual
  const chartData = useMemo(() => {
    if (!selectedDim || !selectedMeasure) return [];
    return aggregateDataForVisual(filteredRows, selectedDim, selectedMeasure, aggregation);
  }, [filteredRows, selectedDim, selectedMeasure, aggregation]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400 text-slate-950">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Interactive Visualizations & Custom Fields Designer
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build any dynamic chart on the fly by selecting visualization type, category axis (X-Axis), metric measure (Y-Axis), and aggregation formula
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Real-time dynamic aggregation on active dataset</span>
        </div>
      </div>

      {/* Field Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        
        {/* 1. Visual Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1. Visual Type
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setVisualType('column')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                visualType === 'column'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Column</span>
            </button>
            <button
              onClick={() => setVisualType('bar')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                visualType === 'bar'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 rotate-90" />
              <span>Bar (Horiz)</span>
            </button>
            <button
              onClick={() => setVisualType('line')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                visualType === 'line'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LineIcon className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
            <button
              onClick={() => setVisualType('donut')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                visualType === 'donut'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Donut</span>
            </button>
          </div>
        </div>

        {/* 2. Dimension (X-Axis) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            2. Category Axis (X-Axis)
          </label>
          <select
            value={selectedDim}
            onChange={(e) => setSelectedDim(e.target.value)}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-amber-500"
          >
            {columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.type === 'string' ? '🔤 ' : '🔢 '} {col.name} ({col.distinctCount} distinct)
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Grouping and segmentation field
          </span>
        </div>

        {/* 3. Measure (Y-Axis / Value) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            3. Numeric Measure (Y-Axis)
          </label>
          <select
            value={selectedMeasure}
            onChange={(e) => setSelectedMeasure(e.target.value)}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-amber-500"
          >
            {numericCols.length > 0 ? (
              numericCols.map((col) => (
                <option key={col.name} value={col.name}>
                  🔢 {col.name}
                </option>
              ))
            ) : (
              columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name}
                </option>
              ))
            )}
          </select>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Aggregated metric calculation
          </span>
        </div>

        {/* 4. Aggregation Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            4. Aggregation Function
          </label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setAggregation('sum')}
              className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                aggregation === 'sum' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white border border-slate-200'
              }`}
            >
              Sum
            </button>
            <button
              onClick={() => setAggregation('avg')}
              className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                aggregation === 'avg' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white border border-slate-200'
              }`}
            >
              Average
            </button>
            <button
              onClick={() => setAggregation('count')}
              className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                aggregation === 'count' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white border border-slate-200'
              }`}
            >
              Count
            </button>
            <button
              onClick={() => setAggregation('max')}
              className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                aggregation === 'max' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white border border-slate-200'
              }`}
            >
              Max
            </button>
            <button
              onClick={() => setAggregation('min')}
              className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                aggregation === 'min' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white border border-slate-200'
              }`}
            >
              Min
            </button>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Summarization formula
          </span>
        </div>

      </div>

      {/* Rendered Live Visual Preview */}
      <div className="p-5 bg-slate-900 rounded-2xl text-white">
        
        {/* Visual Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              {aggregation} of <span className="text-amber-400 font-mono font-bold">{selectedMeasure}</span> by{' '}
              <span className="text-cyan-400 font-mono font-bold">{selectedDim}</span>
            </h3>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {chartData.length} Categories
          </span>
        </div>

        {/* Chart Viewport */}
        <div className="h-80 w-full" dir="ltr">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No data available for current selection
            </div>
          ) : visualType === 'column' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-2.5 rounded-lg border border-slate-800 text-xs font-sans">
                          <p className="font-bold text-amber-400">{d.category}</p>
                          <p className="mt-1 text-slate-200">
                            {selectedMeasure}: <strong className="text-white font-mono">{d.value.toLocaleString('en-US')}</strong>
                          </p>
                          <p className="text-slate-400 text-[10px]">Record Count: {d.count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`b-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : visualType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={75} />
                <Tooltip />
                <Bar dataKey="value" fill="#0284c7" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`bar-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : visualType === 'line' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`pie-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

    </div>
  );
}
