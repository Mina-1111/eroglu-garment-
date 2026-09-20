import { useState, useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { ColumnProfile } from '../types/powerbi';
import { Compass } from 'lucide-react';

interface PowerBIRadarProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
}

export function PowerBIRadar({ columns, filteredRows }: PowerBIRadarProps) {
  const numericCols = useMemo(
    () => columns.filter(c => c.type === 'number' && !/code|id|serial|barcode|no|#/i.test(c.name)),
    [columns]
  );
  const catCols = useMemo(
    () => columns.filter(c => c.type === 'string' && c.distinctCount >= 2 && c.distinctCount <= 20),
    [columns]
  );

  const [compareDim, setCompareDim] = useState<string>(() => {
    const found = catCols.find(c => /department|dept|line|division/i.test(c.name)) || catCols[0];
    return found ? found.name : '';
  });

  // Top 3 distinct categories to compare
  const topCategories = useMemo(() => {
    if (!compareDim || filteredRows.length === 0) return [];
    const counts: Record<string, number> = {};
    filteredRows.forEach(r => {
      const val = String(r[compareDim] || 'Unassigned').trim();
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.keys(counts).slice(0, 3);
  }, [compareDim, filteredRows]);

  // Dimensions for radar axes (pick up to 5 key numeric columns)
  const radarAxes = useMemo(() => {
    return numericCols.slice(0, 5);
  }, [numericCols]);

  // Construct radar data normalized to 0-100 scale for comparison
  const radarData = useMemo(() => {
    if (radarAxes.length === 0 || topCategories.length === 0) return [];

    return radarAxes.map(axisCol => {
      const maxVal = axisCol.max && axisCol.max > 0 ? axisCol.max : 100;
      const point: Record<string, any> = {
        subject: axisCol.name,
      };

      topCategories.forEach(cat => {
        const catRows = filteredRows.filter(r => String(r[compareDim] || '').trim() === cat);
        if (catRows.length === 0) {
          point[cat] = 0;
        } else {
          const sum = catRows.reduce((acc, r) => {
            const raw = r[axisCol.name];
            return acc + (typeof raw === 'number' ? raw : parseFloat(String(raw || '0')) || 0);
          }, 0);
          const avg = sum / catRows.length;
          point[cat] = Number(((avg / maxVal) * 100).toFixed(1));
          point[`${cat}_raw`] = Number(avg.toFixed(1));
        }
      });

      return point;
    });
  }, [radarAxes, topCategories, filteredRows, compareDim]);

  const RADAR_COLORS = ['#f59e0b', '#0284c7', '#10b981'];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-400/20 text-amber-600">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">
              Multi-Dimensional Spider / Radar Matrix
            </h3>
            <span className="text-[10px] text-slate-400">
              Comparative benchmark across key operational dimensions
            </span>
          </div>
        </div>

        {catCols.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] text-slate-400">Comparison Group:</span>
            <select
              value={compareDim}
              onChange={(e) => setCompareDim(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-[10px] rounded px-1.5 py-0.5 outline-none font-sans"
            >
              {catCols.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Radar Chart Viewport */}
      <div className="h-64 w-full" dir="ltr">
        {radarData.length === 0 || topCategories.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Insufficient dimensions for radar analysis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const point = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-md border border-slate-800 space-y-1">
                        <strong className="text-amber-400 block border-b border-slate-800 pb-1">
                          {point.subject}
                        </strong>
                        {topCategories.map((cat, idx) => (
                          <div key={cat} className="flex justify-between gap-3 text-[11px]">
                            <span style={{ color: RADAR_COLORS[idx] }}>{cat}:</span>
                            <span className="font-mono font-bold text-white">
                              {point[`${cat}_raw`]} ({point[cat]}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              {topCategories.map((cat, idx) => (
                <Radar
                  key={cat}
                  name={cat}
                  dataKey={cat}
                  stroke={RADAR_COLORS[idx]}
                  fill={RADAR_COLORS[idx]}
                  fillOpacity={0.25}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
