import { QuickInsightItem } from '../types/powerbi';
import { Sparkles, TrendingUp, AlertTriangle, PieChart, Layers } from 'lucide-react';

interface PowerBIQuickInsightsProps {
  insights: QuickInsightItem[];
}

export function PowerBIQuickInsights({ insights }: PowerBIQuickInsightsProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 rounded-2xl text-white shadow-sm border border-slate-700/60">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/80">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-400/20 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-100">
            Executive Automated Intelligence & Data Insights
          </h3>
        </div>
        <span className="text-[10px] text-amber-300 font-mono bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
          Mina Rafat AI Engine
        </span>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-bold text-amber-300 truncate">
                  {item.title}
                </span>
                {item.type === 'highlight' && <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                {item.type === 'trend' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                {item.type === 'distribution' && <PieChart className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                {item.type === 'outlier' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {item.description}
              </p>
            </div>

            {item.metric && (
              <div className="mt-2.5 pt-2 border-t border-white/10 text-right">
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                  {item.metric}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
