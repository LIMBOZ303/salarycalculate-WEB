import { useEffect, useState, useMemo } from 'react';
import { Users, UserCheck, Store, Clock, CalendarClock, AlertTriangle, Wallet, ShoppingBag } from 'lucide-react';
import { StatCard } from '../components/Card';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import employeeService from '../services/employeeService';
import branchService from '../services/branchService';
import shiftService from '../services/shiftService';
import attendanceService from '../services/attendanceService';
import revenueService from '../services/revenueService';
import adminService from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { filterByBranch, ROLES, getUserBranchId } from '../utils/rolePermissions';
import { getCurrentMonthYear, getTodayISO } from '../utils/formatDate';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { getApiMessage } from '../utils/parseApiData';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [revenueSummary, setRevenueSummary] = useState({ totalRevenue: 0, totalOrders: 0 });

  const { month, year } = getCurrentMonthYear();
  const today = getTodayISO();

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const promises = [
        employeeService.getAll(),
        branchService.getAll(),
        shiftService.getAll(),
        attendanceService.getAll({ month, year }),
      ];

      if (user?.role === ROLES.ADMIN) {
        promises.push(adminService.getPendingEmployees());
      }

      const results = await Promise.all(promises);
      let empList = results[0] || [];
      let branchList = results[1] || [];
      let shiftList = results[2] || [];
      let attList = results[3] || [];

      if (user?.role === ROLES.BRANCH_MANAGER) {
        empList = filterByBranch(empList, user);
        attList = filterByBranch(attList, user);
        const branchId = getUserBranchId(user);
        if (branchId) {
          branchList = branchList.filter((b) => String(b.id) === String(branchId));
        }
      }

      setEmployees(empList);
      setBranches(branchList);
      setShifts(shiftList);
      setAttendances(attList);

      if (user?.role === ROLES.ADMIN && results[4]) {
        setPendingCount(results[4].length);
      }

      try {
        const summaryParams = { month, year };
        if (user?.role === ROLES.BRANCH_MANAGER) {
          const branchId = getUserBranchId(user);
          if (branchId) summaryParams.branchId = branchId;
        }
        const summary = await revenueService.getMonthlySummary(summaryParams);
        setRevenueSummary({
          totalRevenue: summary?.totalRevenue ?? 0,
          totalOrders: summary?.totalOrders ?? 0,
        });
      } catch {
        setRevenueSummary({ totalRevenue: 0, totalOrders: 0 });
      }
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const lateTodayCount = useMemo(() => {
    return attendances.filter((a) => {
      const attDate = (a.date || a.workDate || '').slice(0, 10);
      const isLate = a.isLate || a.lateMinutes > 0 || a.status === 'late';
      return attDate === today && isLate;
    }).length;
  }, [attendances, today]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Tổng nhân viên"
          value={employees.length}
          icon={Users}
          color="blue"
          subtitle={`${branches.length} chi nhánh`}
        />
        {user?.role === ROLES.ADMIN && (
          <StatCard
            label="Chờ duyệt"
            value={pendingCount}
            icon={UserCheck}
            color="amber"
            subtitle="Tài khoản nhân viên mới"
          />
        )}
        <StatCard
          label="Tổng chi nhánh"
          value={branches.length}
          icon={Store}
          color="green"
          subtitle="Chi nhánh đang quản lý"
        />
        <StatCard
          label="Tổng ca làm"
          value={shifts.length}
          icon={Clock}
          color="brand"
          subtitle="Ca làm việc trong hệ thống"
        />
        <StatCard
          label="Chấm công tháng này"
          value={attendances.length}
          icon={CalendarClock}
          color="slate"
          subtitle={`Tháng ${month}/${year}`}
        />
        <StatCard
          label="Đi trễ hôm nay"
          value={lateTodayCount}
          icon={AlertTriangle}
          color="rose"
          subtitle={lateTodayCount > 0 ? 'Cần theo dõi' : 'Không có đi trễ'}
        />
        <StatCard
          label="Doanh thu tháng này"
          value={formatCurrency(revenueSummary.totalRevenue)}
          icon={Wallet}
          color="brand"
          subtitle={`Tháng ${month}/${year}`}
        />
        <StatCard
          label="Tổng đơn tháng này"
          value={formatNumber(revenueSummary.totalOrders)}
          icon={ShoppingBag}
          color="blue"
          subtitle="Đơn hàng trong tháng"
        />
      </div>
    </div>
  );
}
