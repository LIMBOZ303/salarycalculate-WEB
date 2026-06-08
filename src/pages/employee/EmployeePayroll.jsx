import { useEffect, useState } from 'react';
import { Wallet, Clock, PiggyBank, Gift, MinusCircle, Calendar } from 'lucide-react';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge, { getPayrollStatusBadgeVariant, getPayrollStatusLabel } from '../../components/Badge';
import payrollService from '../../services/payrollService';
import { formatDate, getCurrentMonthYear } from '../../utils/formatDate';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import { getPayable } from '../../utils/payrollDisplay';
import { getApiMessage } from '../../utils/parseApiData';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}));

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { value: String(y), label: String(y) };
});

function PayrollRow({ icon: Icon, label, value, highlight, danger }) {
  return (
    <div className={`flex items-center justify-between py-3 ${highlight ? '' : 'border-b border-slate-50'}`}>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <span
        className={`text-sm font-bold tabular-nums ${
          highlight ? 'text-brand-600 text-base' : danger ? 'text-rose-600' : 'text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  );
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
      const data = await payrollService.getMyPayroll({
        month: Number(month),
        year: Number(year),
      });
      setPayroll(data);
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

  const payable = getPayable(payroll);
  const heldAmount =
    (payroll?.heldThisMonth ?? payroll?.holdThisMonth ?? 0) +
    (payroll?.heldFromPrevious ?? payroll?.holdFromPrevious ?? 0);
  const deductions = payroll?.totalDeductions ?? payroll?.deductions ?? 0;
  const bonus = payroll?.bonus ?? payroll?.totalBonus ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tháng"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={MONTHS}
            placeholder={false}
          />
          <Select
            label="Năm"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEARS}
            placeholder={false}
          />
        </div>
      </Card>

      {loading ? (
        <Loading message="Đang tải bảng lương..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : !payroll ? (
        <EmptyState
          title="Chưa có bảng lương"
          description={`Bảng lương tháng ${month}/${year} chưa được tạo hoặc chưa công bố.`}
        />
      ) : (
        <>
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-brand-100 text-sm">Thực trả</span>
              <Badge variant={getPayrollStatusBadgeVariant(payroll.status)} className="!bg-white/20 !text-white">
                {getPayrollStatusLabel(payroll.status)}
              </Badge>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(payable)}</p>
            <p className="text-brand-100 text-xs mt-1">Tháng {month}/{year}</p>
          </div>

          <Card title="Chi tiết lương">
            <PayrollRow
              icon={Clock}
              label="Tổng giờ"
              value={`${formatNumber(payroll.totalHours ?? payroll.workHours ?? 0)} giờ`}
            />
            <PayrollRow
              icon={Wallet}
              label="Lương cơ bản"
              value={formatCurrency(payroll.baseSalary ?? 0)}
            />
            <PayrollRow
              icon={PiggyBank}
              label="Giữ lại"
              value={formatCurrency(heldAmount)}
            />
            <PayrollRow
              icon={Gift}
              label="Thưởng"
              value={formatCurrency(bonus)}
            />
            <PayrollRow
              icon={MinusCircle}
              label="Phạt/khấu trừ"
              value={formatCurrency(deductions)}
              danger
            />
            <PayrollRow
              icon={Calendar}
              label="Ngày trả dự kiến"
              value={formatDate(payroll.expectedPayDate ?? payroll.scheduledPayDate)}
            />
            <PayrollRow
              icon={Wallet}
              label="Thực trả"
              value={formatCurrency(payable)}
              highlight
            />
          </Card>
        </>
      )}
    </div>
  );
}
