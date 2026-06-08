import { useEffect, useState } from 'react';
import Select from '../../components/Select';
import Loading from '../../components/Loading';
import {
  EmployeeCard,
  EmployeeRow,
  EmployeeStatusBadge,
  EmployeeEmpty,
  EmployeeError,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
} from '../../components/employee/EmployeeUI';
import { getPayrollStatusLabel } from '../../components/Badge';
import payrollService from '../../services/payrollService';
import { formatDate, getCurrentMonthYear } from '../../utils/formatDate';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import {
  parseEmployeePayrollResponse,
  getEmployeePayableAmount,
  getEmployeeHeldAmount,
  getEmployeeDeductions,
} from '../../utils/employeeDisplay';
import { getApiMessage } from '../../utils/parseApiData';

function getPayrollStatusVariant(status) {
  if (status === 'paid') return 'success';
  if (status === 'confirmed') return 'info';
  return 'default';
}

export default function EmployeePayroll() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payroll, setPayroll] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await payrollService.getMyPayroll({
        month: Number(month),
        year: Number(year),
      });
      setPayroll(parseEmployeePayrollResponse(response));
    } catch (err) {
      if (err?.response?.status === 404) {
        setPayroll(null);
      } else {
        setError(getApiMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const payable = getEmployeePayableAmount(payroll);
  const heldAmount = getEmployeeHeldAmount(payroll);
  const deductions = getEmployeeDeductions(payroll);
  const bonus = payroll?.totalBonus ?? payroll?.bonus ?? 0;

  return (
    <div className="space-y-4">
      <EmployeeCard>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tháng"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={MONTH_OPTIONS}
            placeholder={false}
          />
          <Select
            label="Năm"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEAR_OPTIONS}
            placeholder={false}
          />
        </div>
      </EmployeeCard>

      {loading ? (
        <Loading message="Đang tải bảng lương..." />
      ) : error ? (
        <EmployeeError message={error} onRetry={fetchData} />
      ) : !payroll ? (
        <EmployeeEmpty
          title="Chưa có bảng lương"
          description={`Tháng ${month}/${year} chưa có dữ liệu lương.`}
        />
      ) : (
        <>
          <EmployeeCard className="bg-[#F8FAFC]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#64748B]">Thực trả</p>
                <p className="text-4xl font-semibold text-[#0F172A] tabular-nums tracking-tight mt-1">
                  {formatCurrency(payable)}
                </p>
                <p className="text-xs text-[#64748B] mt-2">
                  Ngày trả dự kiến:{' '}
                  {formatDate(payroll.expectedPayDate ?? payroll.scheduledPayDate)}
                </p>
              </div>
              <EmployeeStatusBadge variant={getPayrollStatusVariant(payroll.status)}>
                {getPayrollStatusLabel(payroll.status)}
              </EmployeeStatusBadge>
            </div>
          </EmployeeCard>

          <EmployeeCard padding={false} className="px-4 py-1">
            <EmployeeRow
              label="Tổng giờ"
              value={`${formatNumber(payroll.totalHours ?? payroll.workHours ?? 0)} giờ`}
            />
            <EmployeeRow label="Lương cơ bản" value={formatCurrency(payroll.baseSalary ?? 0)} />
            <EmployeeRow label="Giữ lại" value={formatCurrency(heldAmount)} />
            <EmployeeRow label="Thưởng" value={formatCurrency(bonus)} />
            <EmployeeRow label="Phạt/khấu trừ" value={formatCurrency(deductions)} danger />
            <EmployeeRow label="Thực trả" value={formatCurrency(payable)} highlight />
          </EmployeeCard>
        </>
      )}
    </div>
  );
}
