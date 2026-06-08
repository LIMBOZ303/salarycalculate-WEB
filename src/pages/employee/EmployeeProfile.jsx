import { useEffect, useState } from 'react';
import { LogOut, User, Building2, Briefcase, BadgeDollarSign, Hash } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import Badge, { getStatusBadgeVariant } from '../../components/Badge';
import employeeService from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDisplayName, STATUS_LABELS } from '../../utils/rolePermissions';
import { formatCurrency } from '../../utils/formatCurrency';
import { getApiMessage } from '../../utils/parseApiData';
import { getEmployeeCode, getPosition } from '../../utils/payrollDisplay';

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="p-2 bg-brand-50 rounded-xl text-brand-600 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
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
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const profile = employee || user?.employee || user;
  const name = getUserDisplayName(user) || profile?.fullName || profile?.name || '—';
  const branchName = profile?.branch?.name || employee?.branchName || '—';

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-20 h-20 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-3xl font-bold mb-3">
            {name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-lg font-bold text-slate-800">{name}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{user?.email || profile?.email || '—'}</p>
          {profile?.status && (
            <Badge variant={getStatusBadgeVariant(profile.status)} className="mt-2">
              {STATUS_LABELS[profile.status] || profile.status}
            </Badge>
          )}
        </div>
      </Card>

      <Card title="Thông tin làm việc">
        <ProfileRow icon={Hash} label="Mã nhân viên" value={getEmployeeCode(profile)} />
        <ProfileRow icon={Building2} label="Chi nhánh" value={branchName} />
        <ProfileRow icon={Briefcase} label="Chức vụ" value={getPosition(profile)} />
        <ProfileRow
          icon={BadgeDollarSign}
          label="Lương/giờ"
          value={formatCurrency(profile?.hourlyRate ?? profile?.salaryPerHour ?? 0)}
        />
        <ProfileRow icon={User} label="Email" value={user?.email || profile?.email || '—'} />
      </Card>

      <Button variant="danger" className="w-full" size="lg" onClick={logout}>
        <LogOut className="w-5 h-5" />
        Đăng xuất
      </Button>
    </div>
  );
}
