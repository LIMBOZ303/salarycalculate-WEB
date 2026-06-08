import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Loading from '../../components/Loading';
import {
  EmployeeCard,
  EmployeeSectionTitle,
  EmployeeStatusBadge,
} from '../../components/employee/EmployeeUI';
import Button from '../../components/Button';
import { getPayrollStatusLabel } from '../../components/Badge';
import attendanceService from '../../services/attendanceService';
import payrollService from '../../services/payrollService';
import employeeService from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/Avatar';
import { getUserDisplayName } from '../../utils/rolePermissions';
import { formatClockTime, getCurrentMonthYear } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { getPosition } from '../../utils/payrollDisplay';
import {
  parseTodayAttendance,
  getTodayAttendanceStatus,
  parseEmployeePayrollResponse,
  getEmployeePayableAmount,
  getEmployeeBranchName,
} from '../../utils/employeeDisplay';
import { getApiMessage } from '../../utils/parseApiData';

function getPayrollStatusVariant(status) {
  if (status === 'paid') return 'success';
  if (status === 'confirmed') return 'info';
  return 'default';
}

export default function EmployeeHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { month, year } = getCurrentMonthYear();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [today, setToday] = useState({ checkInTime: null, checkOutTime: null, status: null });
  const [payroll, setPayroll] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [todayRes, payrollRes, profileRes] = await Promise.all([
          attendanceService.getMyToday().catch(() => null),
          payrollService.getMyPayroll({ month, year }).catch(() => null),
          employeeService.getMe().catch(() => null),
        ]);

        setToday(parseTodayAttendance(todayRes));
        setPayroll(payrollRes ? parseEmployeePayrollResponse(payrollRes) : null);
        setProfile(profileRes);
      } catch (err) {
        setError(getApiMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month, year]);

  if (loading) return <Loading message="Đang tải..." />;

  const name = getUserDisplayName(user);
  const branchName = getEmployeeBranchName(profile, user);
  const rawPosition = getPosition(profile || user?.employee || user);
  const position = rawPosition && rawPosition !== '-' ? rawPosition : null;
  const todayStatus = getTodayAttendanceStatus(today);
  const payable = getEmployeePayableAmount(payroll);

  return (
    <div className="space-y-4">
      {error && (
        <EmployeeCard className="border-[#FECACA]">
          <p className="text-sm text-[#DC2626]">{error}</p>
        </EmployeeCard>
      )}

      <div className="pt-1 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#64748B]">Xin chào,</p>
          <h2 className="text-2xl font-semibold text-[#0F172A] tracking-tight mt-0.5">{name}</h2>
          <p className="text-sm text-[#64748B] mt-1">
            {[position, branchName !== '--' ? branchName : null]
              .filter(Boolean)
              .join(' · ') || 'Nhân viên'}
          </p>
        </div>
        <Avatar 
          src={profile?.avatarUrl || profile?.user?.avatarUrl || user?.avatarUrl} 
          name={name} 
          size="lg" 
        />
      </div>

      <EmployeeCard>
        <EmployeeSectionTitle
          action={<EmployeeStatusBadge variant={todayStatus.variant}>{todayStatus.label}</EmployeeStatusBadge>}
        >
          Trạng thái hôm nay
        </EmployeeSectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[#64748B] mb-1">Giờ vào</p>
            <p className="text-3xl font-semibold text-[#0F172A] tabular-nums tracking-tight">
              {formatClockTime(today.checkInTime)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#64748B] mb-1">Giờ ra</p>
            <p className="text-3xl font-semibold text-[#0F172A] tabular-nums tracking-tight">
              {formatClockTime(today.checkOutTime)}
            </p>
          </div>
        </div>

        <Button className="w-full mt-4" onClick={() => navigate('/employee/attendance')}>
          Đi tới Chấm công
        </Button>
      </EmployeeCard>

      <EmployeeCard>
        <EmployeeSectionTitle
          action={
            payroll ? (
              <button
                type="button"
                onClick={() => navigate('/employee/payroll')}
                className="text-xs font-medium text-[#2563EB] flex items-center gap-0.5"
              >
                Chi tiết
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : null
          }
        >
          Lương tháng {month}/{year}
        </EmployeeSectionTitle>

        {payroll ? (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-[#64748B]">Thực trả</p>
              <p className="text-2xl font-semibold text-[#2563EB] tabular-nums mt-0.5">
                {formatCurrency(payable)}
              </p>
            </div>
            <EmployeeStatusBadge variant={getPayrollStatusVariant(payroll.status)}>
              {getPayrollStatusLabel(payroll.status)}
            </EmployeeStatusBadge>
          </div>
        ) : (
          <p className="text-sm text-[#64748B]">Chưa có bảng lương</p>
        )}
      </EmployeeCard>
    </div>
  );
}
