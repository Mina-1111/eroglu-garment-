import { useState, useMemo } from 'react';
import { ColumnProfile } from '../types/powerbi';
import { parseNumericValue } from '../utils/universalParser';
import { Target, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PowerBIGaugeProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
}

export function PowerBIGauge({ columns, filteredRows }: PowerBIGaugeProps) {
  const numericCols = useMemo(
    () => columns.filter(c => c.type === 'number' && !/code|id|serial|barcode|no|#/i.test(c.name)),
    [columns]
  );

  // Selected rate/percentage column for gauge
  const [gaugeColName, setGaugeColName] = useState<string>(() => {
    const rateCol = numericCols.find(c => /efficiency|rate|percentage|score|attendance/i.test(c.name));
    return rateCol ? rateCol.name : (numericCols[0]?.name || '');
  });

  const [targetVal, setTargetVal] = useState<number>(85);

  const stats = useMemo(() => {
    if (!gaugeColName || filteredRows.length === 0) {
      return { avg: 0, min: 0, max: 100, count: 0 };
    }

    const vals = filteredRows
      .map(r => parseNumericValue(r[gaugeColName]))
      .filter((v): v is number => v !== null && !isNaN(v));

    if (vals.length === 0) return { avg: 0, min: 0, max: 100, count: 0 };

    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = Number((sum / vals.length).toFixed(1));
    const maxVal = Math.max(100, Math.ceil(Math.max(...vals) / 10) * 10);
    return {
      avg,
      min: 0,
      max: maxVal,
      count: vals.length,
    };
  }, [gaugeColName, filteredRows]);

  const isTargetAchieved = stats.avg >= targetVal;
  const variance = (stats.avg - targetVal).toFixed(1);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-400/20 text-amber-600">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">
              KPI Target Achievement Gauge
            </h3>
            <span className="text-[10px] text-slate-400">
              Operational benchmark vs target
            </span>
          </div>
        </div>

        {numericCols.length > 1 && (
          <select
            value={gaugeColName}
            onChange={(e) => setGaugeColName(e.target.value)}
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

      {/* Semicircle Gauge Visual */}
      <div className="relative flex flex-col items-center justify-center my-3">
        
        <svg viewBox="0 0 160 95" className="w-48 h-28 overflow-visible">
          {/* Background Track Arc */}
          <path
            d="M 20 85 A 60 60 0 0 1 140 85"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Target marker position */}
          {targetVal <= stats.max && (
            <circle
              cx={80 + 60 * Math.cos(Math.PI - (targetVal / stats.max) * Math.PI)}
              cy={85 - 60 * Math.sin(Math.PI - (targetVal / stats.max) * Math.PI)}
              r="4.5"
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
          {/* Progress Arc */}
          <path
            d="M 20 85 A 60 60 0 0 1 140 85"
            fill="none"
            stroke={isTargetAchieved ? '#10b981' : '#f59e0b'}
            strokeWidth="14"
            strokeDasharray="188.5"
            strokeDashoffset={188.5 - (Math.min(100, (stats.avg / stats.max) * 100) / 100) * 188.5}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Digital Metric Value */}
        <div className="absolute top-12 flex flex-col items-center">
          <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {stats.avg.toLocaleString('en-US')}%
          </span>
          <span className="text-[10px] text-slate-400 font-sans">
            Current Average
          </span>
        </div>

        {/* Min / Max labels */}
        <div className="w-48 flex justify-between text-[10px] text-slate-400 font-mono px-2 -mt-2">
          <span>0%</span>
          <span className="text-rose-600 font-semibold">Target: {targetVal}%</span>
          <span>{stats.max}%</span>
        </div>
      </div>

      {/* Target Status & Controls */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px]">
          {isTargetAchieved ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Target Achieved (+{variance}%)</span>
            </span>
          ) : (
            <span className="text-amber-700 font-bold flex items-center gap-1 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Variance: {variance}%</span>
            </span>
          )}
        </div>

        {/* Target Stepper */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-slate-400">Target:</span>
          {[75, 85, 90, 95].map(t => (
            <button
              key={t}
              onClick={() => setTargetVal(t)}
              className={`px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer transition ${
                targetVal === t
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}%
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
