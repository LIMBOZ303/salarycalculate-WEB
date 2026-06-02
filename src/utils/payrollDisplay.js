export function getEmployeeName(row) {
  if (!row) return '—';
  const emp = row.employee || row.employeeId;
  if (typeof emp === 'object' && emp) {
    return emp.fullName || emp.name || '—';
  }
  return row.employeeName || row.fullName || '—';
}

export function getEmployeeCode(row) {
  if (!row) return '—';
  const emp = row.employee || row.employeeId;
  if (typeof emp === 'object' && emp) {
    return emp.employeeCode || emp.code || '—';
  }
  return row.employeeCode || row.code || '—';
}

export function getPosition(row) {
  if (!row) return '—';
  const emp = row.employee || row.employeeId;
  if (typeof emp === 'object' && emp) {
    return emp.position || emp.jobTitle || '—';
  }
  return row.position || row.jobTitle || '—';
}

export function getPayable(row) {
  if (!row) return 0;
  return row.netPay ?? row.payable ?? row.totalPayable ?? row.actualPay ?? 0;
}

export function getHourlyRate(row) {
  if (!row) return 0;
  const emp = row.employee || row.employeeId;
  if (typeof emp === 'object' && emp) {
    return emp.hourlyRate ?? emp.salaryPerHour ?? row.hourlyRate ?? row.salaryPerHour ?? 0;
  }
  return row.hourlyRate ?? row.salaryPerHour ?? 0;
}

export function getPayrollPeriodLabel(row) {
  if (!row?.month || !row?.year) return '—';
  return `Tháng ${row.month}/${row.year}`;
}
