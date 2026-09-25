import { Department, Employee, FactoryKPIs, DepartmentStat, LineStat, SmartAlert } from '../types/hr';

export function calculateFactoryKPIs(employees: Employee[]): FactoryKPIs {
  const totalEmployees = employees.length;
  if (totalEmployees === 0) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      averageAttendanceRate: 0,
      averageEfficiencyRate: 0,
      averageDefectRate: 0,
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      totalWorkingHours: 0,
      totalPayrollCost: 0,
      overtimeCostEstimated: 0,
      turnoverRate: 0,
      maleRatio: 0,
      femaleRatio: 0,
      totalWarnings: 0,
    };
  }

  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const resignedEmployees = employees.filter(e => e.status === 'Terminated').length;

  let sumAttendance = 0;
  let sumEfficiency = 0;
  let sumDefect = 0;
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;
  let totalPayrollCost = 0;
  let overtimeCostEstimated = 0;
  let maleCount = 0;
  let femaleCount = 0;
  let totalWarnings = 0;

  employees.forEach(emp => {
    const totalDays = (emp.presentDays + emp.absentDays) || 26;
    const attRate = (emp.presentDays / totalDays) * 100;
    sumAttendance += attRate;

    sumEfficiency += emp.efficiencyRate;
    sumDefect += emp.defectRate;
    
    // Exact regular hours = present days * 8 hours
    const regHours = emp.regularHours !== undefined ? emp.regularHours : (emp.presentDays * 8);
    totalRegularHours += regHours;
    totalOvertimeHours += emp.overtimeHours;
    totalPayrollCost += emp.baseSalary;

    // Approximate hourly wage: baseSalary / (26 days * 8 hours) * 1.35x overtime rate
    const hourlyRate = emp.baseSalary / 208;
    overtimeCostEstimated += emp.overtimeHours * hourlyRate * 1.35;

    if (emp.gender === 'Female') femaleCount++;
    else maleCount++;

    totalWarnings += emp.warningsCount;
  });

  const totalWorkingHours = totalRegularHours + totalOvertimeHours;
  const averageAttendanceRate = Math.round((sumAttendance / totalEmployees) * 10) / 10;
  const averageEfficiencyRate = Math.round((sumEfficiency / totalEmployees) * 10) / 10;
  const averageDefectRate = Math.round((sumDefect / totalEmployees) * 10) / 10;
  const turnoverRate = Math.round(((resignedEmployees / totalEmployees) * 100) * 10) / 10;
  const maleRatio = Math.round((maleCount / totalEmployees) * 100);
  const femaleRatio = Math.round((femaleCount / totalEmployees) * 100);

  return {
    totalEmployees,
    activeEmployees,
    averageAttendanceRate,
    averageEfficiencyRate,
    averageDefectRate,
    totalRegularHours,
    totalOvertimeHours,
    totalWorkingHours,
    totalPayrollCost,
    overtimeCostEstimated: Math.round(overtimeCostEstimated),
    turnoverRate,
    maleRatio,
    femaleRatio,
    totalWarnings,
  };
}

export function calculateDepartmentStats(employees: Employee[]): DepartmentStat[] {
  const map = new Map<Department, Employee[]>();

  employees.forEach(emp => {
    const list = map.get(emp.department) || [];
    list.push(emp);
    map.set(emp.department, list);
  });

  const results: DepartmentStat[] = [];

  map.forEach((deptEmployees, dept) => {
    const count = deptEmployees.length;
    let sumEff = 0;
    let sumAtt = 0;
    let sumRegularHours = 0;
    let sumOvertime = 0;
    let sumDefect = 0;
    let sumPayroll = 0;
    let activeCount = 0;

    deptEmployees.forEach(emp => {
      sumEff += emp.efficiencyRate;
      const totalDays = (emp.presentDays + emp.absentDays) || 26;
      sumAtt += (emp.presentDays / totalDays) * 100;
      const regHours = emp.regularHours !== undefined ? emp.regularHours : (emp.presentDays * 8);
      sumRegularHours += regHours;
      sumOvertime += emp.overtimeHours;
      sumDefect += emp.defectRate;
      sumPayroll += emp.baseSalary;
      if (emp.status === 'Active') activeCount++;
    });

    const totalWorkingHours = sumRegularHours + sumOvertime;
    const activeRatio = count > 0 ? Math.round((activeCount / count) * 100) : 0;

    results.push({
      department: dept,
      headcount: count,
      avgEfficiency: Math.round((sumEff / count) * 10) / 10,
      avgAttendance: Math.round((sumAtt / count) * 10) / 10,
      totalSalary: sumPayroll,
      totalOvertimeHours: sumOvertime,
      totalWorkingHours,
      activeRatio,
      totalOvertime: sumOvertime,
      defectRate: Math.round((sumDefect / count) * 10) / 10,
      payroll: sumPayroll,
    });
  });

  // Sort descending by headcount
  return results.sort((a, b) => b.headcount - a.headcount);
}

export function calculateLineStats(employees: Employee[]): LineStat[] {
  const lineMap = new Map<string, { dept: Department; emps: Employee[] }>();

  employees.forEach(emp => {
    const lineKey = emp.line || `Line ${emp.department}`;
    const entry = lineMap.get(lineKey) || { dept: emp.department, emps: [] };
    entry.emps.push(emp);
    lineMap.set(lineKey, entry);
  });

  const lines: LineStat[] = [];

  lineMap.forEach((data, lineName) => {
    const count = data.emps.length;
    let sumEff = 0;
    let totalAbsent = 0;
    let totalDays = 0;

    data.emps.forEach(emp => {
      sumEff += emp.efficiencyRate;
      totalAbsent += emp.absentDays;
      totalDays += (emp.presentDays + emp.absentDays) || 26;
    });

    const avgEff = Math.round((sumEff / count) * 10) / 10;
    const absRate = Math.round(((totalAbsent / (totalDays || 1)) * 100) * 10) / 10;

    let status: 'optimal' | 'warning' | 'critical' = 'optimal';
    if (avgEff < 80 || absRate > 10) status = 'critical';
    else if (avgEff < 88 || absRate > 5) status = 'warning';

    lines.push({
      lineName,
      department: data.dept,
      operatorsCount: count,
      efficiency: avgEff,
      absenteeism: absRate,
      status,
    });
  });

  return lines.sort((a, b) => b.operatorsCount - a.operatorsCount);
}

export function generateSmartFactoryAlerts(employees: Employee[]): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const kpis = calculateFactoryKPIs(employees);
  const deptStats = calculateDepartmentStats(employees);
  const lineStats = calculateLineStats(employees);

  // 1. Sewing Line Bottleneck check
  const criticalLines = lineStats.filter(l => l.status === 'critical');
  if (criticalLines.length > 0) {
    criticalLines.forEach(l => {
      alerts.push({
        id: `crit-line-${l.lineName}`,
        type: 'critical',
        title: `Production Bottleneck: ${l.lineName}`,
        message: `Line registered below-target efficiency (${l.efficiency}%) and elevated absenteeism (${l.absenteeism}%).`,
        recommendation: `Initiate immediate line re-balancing and reassign cross-trained floaters.`,
        department: l.department,
        impactScore: 'High delivery impact',
      });
    });
  }

  // 2. Overtime cost inflation
  if (kpis.totalOvertimeHours > employees.length * 22) {
    alerts.push({
      id: 'ot-spike',
      type: 'warning',
      title: 'Elevated Overtime Hours',
      message: `Total overtime reached ${kpis.totalOvertimeHours.toLocaleString('en-US')} hours ($${kpis.overtimeCostEstimated.toLocaleString('en-US')}), averaging >22 hrs/worker monthly.`,
      recommendation: `Review shift rotation scheduling and introduce piece-rate efficiency incentives.`,
      impactScore: 'Operational budget',
    });
  }

  // 3. High Defect in Cutting or Finishing
  const cuttingDept = deptStats.find(d => d.department === 'Cutting & Pattern');
  if (cuttingDept && cuttingDept.defectRate > 1.2) {
    alerts.push({
      id: 'cutting-defect',
      type: 'warning',
      title: 'Elevated Defect Rate in Cutting Room',
      message: `Cutting room recorded a ${cuttingDept.defectRate}% defect rate, impacting fabric utilization.`,
      recommendation: `Calibrate automated circular cutter blades and optimize CAD marker nestings.`,
      department: 'Cutting & Pattern',
      impactScore: 'Material cost',
    });
  }

  // 4. Star Performers Recognition
  const starWorkers = employees.filter(e => e.efficiencyRate >= 94 && e.absentDays === 0 && e.defectRate <= 1.0);
  if (starWorkers.length > 0) {
    alerts.push({
      id: 'stars-recognition',
      type: 'success',
      title: `Excellence Benchmark (${starWorkers.length} Top Operators)`,
      message: `Elite operators achieved >94% efficiency with 100% attendance and negligible defect rates (<1%).`,
      recommendation: `Disburse monthly quality bonus and award certificate of distinction.`,
      impactScore: 'Workforce retention',
    });
  }

  // 5. Warning & Absenteeism Follow-up
  const highAbsentCount = employees.filter(e => e.absentDays >= 4).length;
  if (highAbsentCount > 0) {
    alerts.push({
      id: 'absentee-warning',
      type: 'info',
      title: `Repeated Absence Follow-up (${highAbsentCount} staff)`,
      message: `${highAbsentCount} operators exceeded 4 days of unscheduled absence this schedule.`,
      recommendation: `Schedule HR counseling sessions to address transit or health obstacles.`,
      impactScore: 'Floor discipline',
    });
  }

  return alerts;
}
