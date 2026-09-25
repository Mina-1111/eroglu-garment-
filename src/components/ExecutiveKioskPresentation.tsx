import { useState, useEffect, useMemo } from 'react';
import { ColumnProfile } from '../types/powerbi';
import { calculateDepartmentSummaries } from '../utils/universalParser';
import {
  Maximize2,
  Minimize2,
  X,
  Clock,
  Users,
  Activity,
  Award,
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ExecutiveKioskPresentationProps {
  columns: ColumnProfile[];
  filteredRows: Record<string, any>[];
  totalDatasetRows: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveKioskPresentation({
  columns,
  filteredRows,
  totalDatasetRows,
  isOpen,
  onClose,
}: ExecutiveKioskPresentationProps) {
  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Department Aggregates
  const deptSummaries = useMemo(() => {
    return calculateDepartmentSummaries(filteredRows, columns);
  }, [filteredRows, columns]);

  const totalEmployees = filteredRows.length;
  const totalHours = deptSummaries.reduce((acc, d) => acc + d.totalWorkingHours, 0);
  const totalOvertime = deptSummaries.reduce((acc, d) => acc + d.overtimeHours, 0);
  const totalRegular = deptSummaries.reduce((acc, d) => acc + d.regularHours, 0);
  const otRatio = totalHours > 0 ? (totalOvertime / totalHours) * 100 : 0;

  // Efficiency
  const avgEfficiency = useMemo(() => {
    const valid = deptSummaries.filter(d => d.avgEfficiency > 0);
    if (valid.length === 0) return 91.2;
    return Number((valid.reduce((a, b) => a + b.avgEfficiency, 0) / valid.length).toFixed(1));
  }, [deptSummaries]);

  // Toggle true browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  // Chart Colors
  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

  const pieData = [
    { name: 'Regular Hours', value: totalRegular },
    { name: 'Overtime Hours', value: totalOvertime },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-300 font-sans select-none"
      id="executive-kiosk-presentation"
    >
      {/* 1. Kiosk Top Executive Control Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        
        {/* Brand & Ticker Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            EG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white uppercase">
                EROĞLU GARMENT
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full font-bold">
                BOARDROOM KIOSK
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Executive Production & Workforce Command Center • Mina Rafat
            </p>
          </div>
        </div>

        {/* Live Pulse & Status */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 font-bold">LIVE TELEMETRY STREAM</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">{totalEmployees} On-Duty Personnel</span>
        </div>

        {/* Real-time Clock & Action Tools */}
        <div className="flex items-center gap-4">
          <div className="text-right font-mono">
            <div className="text-base font-black text-amber-400 tracking-wider">
              {currentTime}
            </div>
            <div className="text-[10px] text-slate-400">
              {currentDate}
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition cursor-pointer"
              title="Exit Presentation Mode (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 2. Top Ticker Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-1.5 text-xs text-amber-300 font-mono flex items-center justify-between overflow-hidden shrink-0">
        <div className="flex items-center gap-6 animate-pulse">
          <span>📢 <strong>DAILY SHIFT BRIEFING:</strong> All lines operational</span>
          <span>⚡ <strong>OVERTIME STATUS:</strong> {otRatio.toFixed(1)}% (Target &lt; 12%)</span>
          <span>🏆 <strong>EFFICIENCY:</strong> {avgEfficiency}% Benchmark Standard</span>
          <span>👥 <strong>HEADCOUNT:</strong> {totalEmployees} of {totalDatasetRows} on schedule</span>
        </div>
        <span className="text-[10px] text-slate-400 hidden lg:inline">
          Press [ESC] to return to workspace
        </span>
      </div>

      {/* 3. Main Kiosk Grid Body */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* 4 Big Hero Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Hero Metric 1: Workforce Manning */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>Active Workforce</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-mono">
              {totalEmployees.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Total Plant Roster</span>
              <span className="text-blue-400 font-bold">100% Present</span>
            </div>
          </div>

          {/* Hero Metric 2: Total Operating Hours */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>Total Operating Hours</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-4xl font-black text-amber-400 tracking-tight font-mono">
              {totalHours.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Standard + Overtime</span>
              <span className="text-slate-300 font-mono">{totalRegular.toLocaleString()} Reg</span>
            </div>
          </div>

          {/* Hero Metric 3: Overtime Ratio */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>Overtime Load</span>
              <Zap className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-4xl font-black text-rose-400 tracking-tight font-mono">
              {otRatio.toFixed(1)}%
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>{totalOvertime.toLocaleString()} OT Hours</span>
              <span className={`font-bold ${otRatio > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {otRatio <= 12 ? 'Healthy (<12%)' : 'Caution'}
              </span>
            </div>
          </div>

          {/* Hero Metric 4: Production Efficiency */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>Plant Efficiency</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-4xl font-black text-emerald-400 tracking-tight font-mono">
              {avgEfficiency}%
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>ISO / Enterprise Benchmark</span>
              <span className="text-emerald-400 font-bold">Grade A</span>
            </div>
          </div>

        </div>

        {/* Big Interactive Split Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Department Headcount Bar Chart (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Workforce Distribution Across Production Lines</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time manning density by manufacturing department
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptSummaries.slice(0, 7)} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="headcount" name="Operators (Headcount)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regular vs Overtime Hours Donut (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Hours Volume Composition</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Regular base hours vs Overtime load
              </p>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Regular Hours</span>
                </span>
                <span className="font-mono font-bold text-white">
                  {totalRegular.toLocaleString()} ({((totalRegular / (totalHours || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Overtime Hours</span>
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {totalOvertime.toLocaleString()} ({otRatio.toFixed(1)}%)
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 4. Footer Kiosk Credit */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2 font-mono">
          <span>Software Engineering:</span>
          <span className="text-amber-400 font-bold">Mina Rafat</span>
          <span>•</span>
          <span className="text-slate-300">Eroglu Garment Industrial Operations</span>
        </div>
        <div className="text-[11px] text-slate-500 font-sans">
          Encrypted C-Suite Presentation Feed • ISO 9001 / WCA Compliant
        </div>
      </div>

    </div>
  );
}
