const EMPTY = '--';

function isValidText(value) {
  if (value == null || value === '') return false;
  const str = String(value).trim();
  return str !== '' && str !== '_' && str !== '-';
}

export function getEmployeeBranchName(profile, user) {
  const candidates = [
    profile?.branchId?.name,
    profile?.branch?.name,
    profile?.branchName,
    user?.branchId?.name,
    user?.branch?.name,
    user?.employee?.branchId?.name,
    user?.employee?.branch?.name,
    user?.employee?.branchName,
  ];

  for (const name of candidates) {
    if (isValidText(name)) return String(name).trim();
  }
  return EMPTY;
}

export function getEmployeeBranchAddress(profile, user) {
  const candidates = [
    profile?.branchId?.address,
    profile?.branch?.address,
    profile?.branchAddress,
    user?.branchId?.address,
    user?.branch?.address,
    user?.employee?.branchId?.address,
    user?.employee?.branch?.address,
    user?.employee?.branchAddress,
  ];

  for (const address of candidates) {
    if (isValidText(address)) return String(address).trim();
  }
  return EMPTY;
}

export function parseTodayAttendance(response) {
  const root = response?.data ?? response;
  const payload = root?.data ?? root;

  const attendance =
    (payload?.attendance && typeof payload.attendance === 'object' ? payload.attendance : null) ||
    (payload?.today && typeof payload.today === 'object' ? payload.today : null) ||
    (payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null);

  const checkInTime = attendance?.checkInTime ?? payload?.checkInTime ?? null;
  const checkOutTime = attendance?.checkOutTime ?? payload?.checkOutTime ?? null;
  const status = attendance?.status ?? payload?.status ?? null;

  return { checkInTime, checkOutTime, status, attendance };
}

export function getTodayAttendanceStatus({ checkInTime, checkOutTime }) {
  if (checkOutTime) {
    return { label: 'Đã chấm ra', variant: 'success' };
  }
  if (checkInTime) {
    return { label: 'Đã chấm vào', variant: 'info' };
  }
  return { label: 'Chưa chấm', variant: 'default' };
}

export function parseEmployeePayrollResponse(response) {
  const root = response?.data ?? response;

  if (import.meta.env.DEV) {
    console.log('Employee payroll response:', root);
  }

  let payroll =
    root?.data?.payroll ??
    root?.payroll ??
    (root?.data && typeof root.data === 'object' && !Array.isArray(root.data) ? root.data : null) ??
    root;

  if (payroll?.payroll && typeof payroll.payroll === 'object') {
    payroll = payroll.payroll;
  }

  if (!payroll || typeof payroll !== 'object' || Array.isArray(payroll)) {
    return null;
  }

  const normalized = {
    ...payroll,
    payableAmount: toNumber(
      payroll.payableAmount ??
        payroll.payable ??
        payroll.totalPayable ??
        payroll.actualPay
    ),
    totalBonus: toNumber(payroll.totalBonus ?? payroll.bonus),
    totalPenalty: toNumber(payroll.totalPenalty ?? payroll.penalty),
    totalFixedDeduction: toNumber(payroll.totalFixedDeduction ?? payroll.fixedDeduction),
    totalOtherDeduction: toNumber(payroll.totalOtherDeduction ?? payroll.otherDeduction),
    totalDeductions: toNumber(
      payroll.totalDeductions ??
        payroll.deductions ??
        (toNumber(payroll.totalPenalty ?? payroll.penalty) +
          toNumber(payroll.totalFixedDeduction ?? payroll.fixedDeduction) +
          toNumber(payroll.totalOtherDeduction ?? payroll.otherDeduction))
    ),
    baseSalary: toNumber(payroll.baseSalary),
    heldCurrentAmount: toNumber(
      payroll.heldCurrentAmount ?? payroll.heldThisMonth ?? payroll.holdThisMonth
    ),
    carryInHeldAmount: toNumber(
      payroll.carryInHeldAmount ?? payroll.heldFromPrevious ?? payroll.holdFromPrevious
    ),
    totalHours: toNumber(payroll.totalHours ?? payroll.workHours),
    bonus: toNumber(payroll.totalBonus ?? payroll.bonus),
  };

  if (import.meta.env.DEV) {
    console.log('Parsed employee payroll:', normalized);
  }

  return normalized;
}

export function getEmployeePayableAmount(payroll) {
  if (!payroll) return 0;
  return toNumber(
    payroll.payableAmount ?? payroll.payable ?? payroll.totalPayable ?? payroll.actualPay
  );
}

export function getEmployeeHeldAmount(payroll) {
  if (!payroll) return 0;
  return (
    toNumber(payroll.heldCurrentAmount ?? payroll.heldThisMonth ?? payroll.holdThisMonth) +
    toNumber(payroll.carryInHeldAmount ?? payroll.heldFromPrevious ?? payroll.holdFromPrevious)
  );
}

export function getEmployeeDeductions(payroll) {
  if (!payroll) return 0;
  const explicit = payroll.totalDeductions ?? payroll.deductions;
  if (explicit != null && explicit !== '') return toNumber(explicit);
  return (
    toNumber(payroll.totalPenalty) +
    toNumber(payroll.totalFixedDeduction) +
    toNumber(payroll.totalOtherDeduction)
  );
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}
