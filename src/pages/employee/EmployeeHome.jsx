import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn, LogOut, Wallet, ChevronRight } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import Badge, { getPayrollStatusBadgeVariant, getPayrollStatusLabel } from '../../components/Badge';
import attendanceService from '../../services/attendanceService';
import payrollService from '../../services/payrollService';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDisplayName } from '../../utils/rolePermissions';
import { formatTime, getCurrentMonthYear } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { getPayable } from '../../utils/payrollDisplay';
import { getApiMessage } from '../../utils/parseApiData';

function getTodayStatus(summary) {
  const today = summary?.today || summary?.todayAttendance || summary;
  const status = today?.status || summary?.todayStatus || 'unknown';
  const checkIn = today?.checkInTime || summary?.checkInTime;
  const checkOut = today?.checkOutTime || summary?.checkOutTime;
  const hasCheckedIn = Boolean(checkIn);
  const hasCheckedOut = Boolean(checkOut);

  if (hasCheckedOut) return { label: 'Đã chấm ra', variant: 'success', checkIn, checkOut };
  if (hasCheckedIn) return { label: 'Đang làm việc', variant: 'info', checkIn, checkOut };
  if (status === 'absent') return { label: 'Chưa chấm công', variant: 'warning', checkIn, checkOut };
  return { label: 'Chưa chấm công', variant: 'default', checkIn, checkOut };
}

export default function EmployeeHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { month, year } = getCurrentMonthYear();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [payroll, setPayroll] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryData, payrollData] = await Promise.all([
          attendanceService.getMySummary({ month, year }).catch(() => null),
          payrollService.getMyPayroll({ month, year }).catch(() => null),
        ]);
        setSummary(summaryData);
        setPayroll(payrollData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month, year]);

  if (loading) return <Loading message="Đang tải..." />;

  const todayStatus = getTodayStatus(summary);
  const name = getUserDisplayName(user);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-brand-100 text-sm">Xin chào,</p>
        <h2 className="text-xl font-bold mt-0.5">{name}</h2>
        <p className="text-brand-100 text-xs mt-1">Chúc bạn một ngày làm việc hiệu quả!</p>
      </div>

      <Card title="Trạng thái hôm nay">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">Hôm nay</span>
          <Badge variant={todayStatus.variant}>{todayStatus.label}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <LogIn className="w-4 h-4" />
              <span className="text-xs font-semibold">Giờ vào</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{formatTime(todayStatus.checkIn)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-semibold">Giờ ra</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{formatTime(todayStatus.checkOut)}</p>
          </div>
        </div>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={() => navigate('/employee/attendance')}
      >
        <Clock className="w-5 h-5" />
        Chấm công nhanh
      </Button>

      {payroll && (
        <Card
          title={`Lương tháng ${month}/${year}`}
          action={
            <button
              type="button"
              onClick={() => navigate('/employee/payroll')}
              className="text-brand-600 text-xs font-semibold flex items-center gap-0.5"
            >
              Chi tiết
              <ChevronRight className="w-4 h-4" />
            </button>
          }
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Thực trả</p>
              <p className="text-xl font-bold text-brand-600 mt-0.5">
                {formatCurrency(getPayable(payroll))}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={getPayrollStatusBadgeVariant(payroll.status)}>
                {getPayrollStatusLabel(payroll.status)}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-2 justify-end">
                <Wallet className="w-3.5 h-3.5" />
                {formatCurrency(payroll.baseSalary ?? 0)} cơ bản
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
