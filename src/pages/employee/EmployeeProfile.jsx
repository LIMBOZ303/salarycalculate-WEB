import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import Loading from '../../components/Loading';
import {
  EmployeeCard,
  EmployeeRow,
  EmployeeStatusBadge,
  EmployeeError,
} from '../../components/employee/EmployeeUI';
import employeeService from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDisplayName, STATUS_LABELS } from '../../utils/rolePermissions';
import { formatCurrency } from '../../utils/formatCurrency';
import { getApiMessage } from '../../utils/parseApiData';
import { getEmployeeCode, getPosition } from '../../utils/payrollDisplay';
import {
  getEmployeeBranchName,
  getEmployeeBranchAddress,
} from '../../utils/employeeDisplay';

function getStatusVariant(status) {
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'locked' || status === 'rejected') return 'danger';
  return 'default';
}

export default function EmployeeProfile() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await employeeService.getMe();
      setEmployee(data);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Loading message="Đang tải hồ sơ..." />;
  if (error) return <EmployeeError message={error} onRetry={fetchData} />;

  const profile = employee || user?.employee || user;
  const name = getUserDisplayName(user) || profile?.fullName || profile?.name || '--';
  const branchName = getEmployeeBranchName(profile, user);
  const branchAddress = getEmployeeBranchAddress(profile, user);
  const rawPosition = getPosition(profile);
  const position = rawPosition && rawPosition !== '-' ? rawPosition : null;
  const email = user?.email || profile?.email || '--';
  const phone = profile?.phone || profile?.user?.phone || user?.phone || '--';
  const hourlyRate = profile?.hourlyRate ?? profile?.salaryPerHour ?? 0;

  return (
    <div className="space-y-4">
      <EmployeeCard>
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-2xl font-semibold">
            {name !== '--' ? name.charAt(0).toUpperCase() : '?'}
          </div>
          <h2 className="text-lg font-semibold text-[#0F172A] mt-3">{name}</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {position || 'Nhân viên'}
            {branchName !== '--' ? ` · ${branchName}` : ''}
          </p>
          {profile?.status && (
            <EmployeeStatusBadge variant={getStatusVariant(profile.status)} className="mt-2">
              {STATUS_LABELS[profile.status] || profile.status}
            </EmployeeStatusBadge>
          )}
        </div>
      </EmployeeCard>

      <EmployeeCard padding={false} className="px-4 py-1">
        <EmployeeRow label="Mã nhân viên" value={getEmployeeCode(profile)} />
        <EmployeeRow label="Email" value={email} />
        {phone !== '--' && <EmployeeRow label="SĐT" value={phone} />}
        <EmployeeRow label="Chi nhánh" value={branchName} />
        <EmployeeRow label="Địa chỉ chi nhánh" value={branchAddress} />
        <EmployeeRow label="Lương/giờ" value={formatCurrency(hourlyRate)} />
      </EmployeeCard>

      <button
        type="button"
        onClick={logout}
        className="w-full rounded-2xl border border-[#E2E8F0] bg-white py-3.5 text-sm font-medium text-[#DC2626] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất
      </button>
    </div>
  );
}
