import { useState, useMemo } from 'react';
import { ColumnProfile } from '../types/powerbi';
import { calculateDepartmentSummaries } from '../utils/universalParser';
import {
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  BarChart3,
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

interface ExecutiveScenarioSimulatorProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
  totalDatasetRows: number;
}

export function ExecutiveScenarioSimulator({
  columns,
  filteredRows,
  totalDatasetRows,
}: ExecutiveScenarioSimulatorProps) {
  // 1. Simulator Parameters State
  const [otAdjustmentPct, setOtAdjustmentPct] = useState<number>(0); // -50 to +50
  const [headcountAdjustmentPct, setHeadcountAdjustmentPct] = useState<number>(0); // -25 to +35
  const [efficiencyBoostPct, setEfficiencyBoostPct] = useState<number>(0); // 0 to 25
  const [hourlyWageRate, setHourlyWageRate] = useState<number>(20); // base hourly wage
  const [currencySymbol, setCurrencySymbol] = useState<string>('USD'); // USD or EGP
  const [otMultiplier, setOtMultiplier] = useState<number>(1.5); // 1.5x standard premium

  // 2. Department Base Summaries
  const deptSummaries = useMemo(() => {
    return calculateDepartmentSummaries(filteredRows, columns);
  }, [filteredRows, columns]);

  // Baseline Aggregates
  const baselineHeadcount = filteredRows.length;
  const baselineRegularHours = deptSummaries.reduce((sum, d) => sum + d.regularHours, 0);
  const baselineOvertimeHours = deptSummaries.reduce((sum, d) => sum + d.overtimeHours, 0);
  const baselineTotalHours = baselineRegularHours + baselineOvertimeHours;

  // Baseline Financials
  const baselineRegularPayroll = baselineRegularHours * hourlyWageRate;
  const baselineOvertimePayroll = baselineOvertimeHours * (hourlyWageRate * otMultiplier);
  const baselineTotalPayroll = baselineRegularPayroll + baselineOvertimePayroll;

  // 3. Simulated Model Calculations
  const simulated = useMemo(() => {
    // Multipliers
    const otFactor = 1 + otAdjustmentPct / 100;
    const hcFactor = 1 + headcountAdjustmentPct / 100;
    const effFactor = 1 + efficiencyBoostPct / 100;

    // Simulated Headcount
    const simHeadcount = Math.round(baselineHeadcount * hcFactor);

    // Simulated Regular Hours (scales with headcount)
    const simRegularHours = Math.round(baselineRegularHours * hcFactor);

    // Simulated Overtime Hours (scales with OT factor, dampened by efficiency boost)
    // When efficiency improves, required overtime drops proportionally
    const effectiveOtHours = Math.max(0, Math.round((baselineOvertimeHours * otFactor) / Math.sqrt(effFactor)));
    const simTotalHours = simRegularHours + effectiveOtHours;

    // Simulated Payroll
    const simRegularPayroll = simRegularHours * hourlyWageRate;
    const simOvertimePayroll = effectiveOtHours * (hourlyWageRate * otMultiplier);
    const simTotalPayroll = simRegularPayroll + simOvertimePayroll;

    // Differences
    const diffHours = simTotalHours - baselineTotalHours;
    const diffOvertimeHours = effectiveOtHours - baselineOvertimeHours;
    const diffPayroll = simTotalPayroll - baselineTotalPayroll;
    const payrollSavingsPct = baselineTotalPayroll > 0 ? ((baselineTotalPayroll - simTotalPayroll) / baselineTotalPayroll) * 100 : 0;

    // Output Capacity Gain in Garment Units (Assuming benchmark 2.2 garments per standard hour)
    const baselineGarments = Math.round(baselineTotalHours * 2.2);
    const simGarments = Math.round(simTotalHours * 2.2 * effFactor);
    const diffGarments = simGarments - baselineGarments;

    // Department-by-department simulation data for chart
    const deptComparisonData = deptSummaries.slice(0, 8).map(d => {
      const simDeptReg = d.regularHours * hcFactor;
      const simDeptOt = Math.max(0, (d.overtimeHours * otFactor) / Math.sqrt(effFactor));
      return {
        name: d.department.length > 12 ? `${d.department.slice(0, 10)}...` : d.department,
        fullName: d.department,
        baseline: Math.round(d.totalWorkingHours),
        simulated: Math.round(simDeptReg + simDeptOt),
      };
    });

    return {
      simHeadcount,
      simRegularHours,
      effectiveOtHours,
      simTotalHours,
      simTotalPayroll,
      diffHours,
      diffOvertimeHours,
      diffPayroll,
      payrollSavingsPct,
      baselineGarments,
      simGarments,
      diffGarments,
      deptComparisonData,
    };
  }, [
    baselineHeadcount,
    baselineRegularHours,
    baselineOvertimeHours,
    baselineTotalHours,
    baselineTotalPayroll,
    otAdjustmentPct,
    headcountAdjustmentPct,
    efficiencyBoostPct,
    hourlyWageRate,
    otMultiplier,
    deptSummaries,
  ]);

  // Presets Handlers
  const applyPreset = (preset: 'cost_cut' | 'rush_peak' | 'lean_compliance' | 'reset') => {
    if (preset === 'cost_cut') {
      setOtAdjustmentPct(-30);
      setHeadcountAdjustmentPct(0);
      setEfficiencyBoostPct(8);
    } else if (preset === 'rush_peak') {
      setOtAdjustmentPct(25);
      setHeadcountAdjustmentPct(15);
      setEfficiencyBoostPct(5);
    } else if (preset === 'lean_compliance') {
      setOtAdjustmentPct(-45);
      setHeadcountAdjustmentPct(8);
      setEfficiencyBoostPct(10);
    } else {
      setOtAdjustmentPct(0);
      setHeadcountAdjustmentPct(0);
      setEfficiencyBoostPct(0);
    }
  };

  return (
    <div className="space-y-6" id="executive-scenario-simulator">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                What-If Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Predictive Operations & Labor Model
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Executive Decision & Scenario Simulator
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Model the operational and financial impact of adjusting overtime policies, factory headcount capacity, and production efficiency in real time.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => applyPreset('cost_cut')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
            >
              💰 Cost Optimization
            </button>
            <button
              type="button"
              onClick={() => applyPreset('rush_peak')}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
            >
              🚀 Peak Surge
            </button>
            <button
              type="button"
              onClick={() => applyPreset('lean_compliance')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
            >
              ⚖️ Lean Compliance
            </button>
            <button
              type="button"
              onClick={() => applyPreset('reset')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Reset to Current Baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Control Sliders & Rate Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Slider 1: Overtime Hours Policy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Overtime Policy Adjustment</span>
            </span>
            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${
              otAdjustmentPct < 0 ? 'bg-emerald-100 text-emerald-800' : otAdjustmentPct > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {otAdjustmentPct > 0 ? `+${otAdjustmentPct}%` : `${otAdjustmentPct}%`}
            </span>
          </div>

          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={otAdjustmentPct}
            onChange={e => setOtAdjustmentPct(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-50% (Strict Cap)</span>
            <span>0% Baseline</span>
            <span>+50% (Max Shift)</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Reduces operator fatigue and overtime premium pay liability.
          </p>
        </div>

        {/* Slider 2: Headcount Capacity Rebalancing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Headcount Capacity (Staffing)</span>
            </span>
            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${
              headcountAdjustmentPct > 0 ? 'bg-blue-100 text-blue-800' : headcountAdjustmentPct < 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {headcountAdjustmentPct > 0 ? `+${headcountAdjustmentPct}%` : `${headcountAdjustmentPct}%`}
            </span>
          </div>

          <input
            type="range"
            min="-20"
            max="30"
            step="5"
            value={headcountAdjustmentPct}
            onChange={e => setHeadcountAdjustmentPct(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-20% (Downsizing)</span>
            <span>Baseline ({baselineHeadcount})</span>
            <span>+30% (Hiring)</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Adjusts regular factory workforce across all sewing and finishing lines.
          </p>
        </div>

        {/* Slider 3: Production Efficiency Gain */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Efficiency Target Boost</span>
            </span>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              +{efficiencyBoostPct}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="25"
            step="1"
            value={efficiencyBoostPct}
            onChange={e => setEfficiencyBoostPct(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0% Current</span>
            <span>+10% Lean Ops</span>
            <span>+25% Benchmark</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Achieved via line balancing, SMED changeovers, and operator upskilling.
          </p>
        </div>

      </div>

      {/* 3. Wage & Rate Parameter Strip */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Financial Assumptions:</span>
          <span className="text-slate-500">Base Hourly Wage:</span>
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1">
            <input
              type="number"
              min="1"
              max="500"
              value={hourlyWageRate}
              onChange={e => setHourlyWageRate(Math.max(1, Number(e.target.value)))}
              className="w-14 text-center font-mono font-bold text-slate-800 outline-none"
            />
            <select
              value={currencySymbol}
              onChange={e => setCurrencySymbol(e.target.value)}
              className="bg-transparent font-bold text-slate-700 text-[11px] outline-none cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="EGP">EGP</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Overtime Multiplier:</span>
          <div className="flex items-center gap-1">
            {[1.5, 2.0].map(mult => (
              <button
                key={mult}
                type="button"
                onClick={() => setOtMultiplier(mult)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  otMultiplier === mult
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Live Impact Scorecards (Before vs After) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Hours Impact */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Factory Hours</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {simulated.simTotalHours.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              vs {baselineTotalHours.toLocaleString()}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Net Variance:</span>
            <span className={simulated.diffHours < 0 ? 'text-emerald-600' : simulated.diffHours > 0 ? 'text-blue-600' : 'text-slate-700'}>
              {simulated.diffHours > 0 ? `+${simulated.diffHours.toLocaleString()}` : simulated.diffHours.toLocaleString()} hrs
            </span>
          </div>
        </div>

        {/* Card 2: Overtime Burden Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Overtime Volume</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900 tracking-tight">
              {simulated.effectiveOtHours.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              vs {baselineOvertimeHours.toLocaleString()}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">OT Reduction:</span>
            <span className={simulated.diffOvertimeHours < 0 ? 'text-emerald-600' : simulated.diffOvertimeHours > 0 ? 'text-rose-600' : 'text-slate-700'}>
              {simulated.diffOvertimeHours > 0 ? `+${simulated.diffOvertimeHours.toLocaleString()}` : simulated.diffOvertimeHours.toLocaleString()} hrs
            </span>
          </div>
        </div>

        {/* Card 3: Estimated Financial Impact */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Projected Payroll Impact</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {currencySymbol === 'USD' ? '$' : 'EGP '}{Math.abs(Math.round(simulated.diffPayroll)).toLocaleString()}
            </span>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
              simulated.diffPayroll < 0 ? 'bg-emerald-100 text-emerald-800' : simulated.diffPayroll > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {simulated.diffPayroll <= 0 ? 'Net Savings' : 'Added Cost'}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Savings Rate:</span>
            <span className={simulated.payrollSavingsPct > 0 ? 'text-emerald-600' : 'text-slate-700'}>
              {simulated.payrollSavingsPct.toFixed(1)}% of Budget
            </span>
          </div>
        </div>

        {/* Card 4: Garment Output Capacity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Estimated Production Capacity</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-950 tracking-tight">
              {simulated.simGarments.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              garments
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Capacity Delta:</span>
            <span className={simulated.diffGarments >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {simulated.diffGarments >= 0 ? `+${simulated.diffGarments.toLocaleString()}` : simulated.diffGarments.toLocaleString()} pcs
            </span>
          </div>
        </div>

      </div>

      {/* 5. Department-by-Department Comparison Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>Department Working Hours: Baseline vs Simulated Scenario</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Projected hours distribution across primary manufacturing and finishing sections
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simulated.deptComparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                angle={-20}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="baseline" name="Current Baseline (hrs)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="simulated" name="Simulated Scenario (hrs)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Executive Decision Synthesis Box */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
            Leadership Decision Assessment
          </h3>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            {simulated.diffPayroll < 0 && simulated.diffGarments >= 0 ? (
              <>
                <strong>Optimal Strategy Detected:</strong> This configuration achieves net monthly payroll savings of{' '}
                <strong>{currencySymbol === 'USD' ? '$' : 'EGP '}{Math.abs(Math.round(simulated.diffPayroll)).toLocaleString()}</strong> while maintaining or expanding production capacity by{' '}
                <strong>+{simulated.diffGarments.toLocaleString()} garments</strong> due to efficiency gains. Recommended for immediate operational rollout.
              </>
            ) : simulated.diffPayroll < 0 ? (
              <>
                <strong>Cost-Driven Contraction:</strong> Generates significant payroll relief of{' '}
                <strong>{currencySymbol === 'USD' ? '$' : 'EGP '}{Math.abs(Math.round(simulated.diffPayroll)).toLocaleString()}</strong>, but with a slight volume contraction of{' '}
                <strong>{Math.abs(simulated.diffGarments).toLocaleString()} garments</strong>. Suitable for off-peak seasons or inventory rationalization.
              </>
            ) : (
              <>
                <strong>Capacity Expansion Investment:</strong> Requires an estimated labor investment of{' '}
                <strong>{currencySymbol === 'USD' ? '$' : 'EGP '}{Math.round(simulated.diffPayroll).toLocaleString()}</strong> to unlock{' '}
                <strong>+{simulated.diffGarments.toLocaleString()} additional garments</strong>. Justifiable for rush export contracts with high gross profit margins.
              </>
            )}
          </p>
        </div>
      </div>

    </div>
  );
}
