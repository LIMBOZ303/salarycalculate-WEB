import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import Badge, { getStatusBadgeVariant } from '../components/Badge';
import Avatar from '../components/Avatar';
import employeeService from '../services/employeeService';
import branchService from '../services/branchService';
import { useAuth } from '../contexts/AuthContext';
import { canWrite, STATUS_LABELS } from '../utils/rolePermissions';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { getApiMessage } from '../utils/parseApiData';
import { getBranchId, getEntityId, hasValidId } from '../utils/getEntityId';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = canWrite(user?.role);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);
  const [branch, setBranch] = useState(null);

  const fetchData = async () => {
    if (!hasValidId(id)) {
      setError('ID nhân viên không hợp lệ');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const emp = await employeeService.getById(id);
      setEmployee(emp);

      const branchId = getBranchId(emp) || getEntityId(emp.branch);
      if (hasValidId(branchId)) {
        const branchData = await branchService.getById(branchId);
        setBranch(branchData?.branch ?? branchData);
      }
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!employee) return <ErrorState message="Không tìm thấy nhân viên" />;

  const name = employee.fullName || employee.name || employee.user?.fullName || '—';

  const fields = [
    { label: 'Họ tên', value: name },
    { label: 'Email', value: employee.email || employee.user?.email || '—' },
    { label: 'SĐT', value: employee.phone || employee.user?.phone || '—' },
    { label: 'Chi nhánh', value: branch?.name || employee.branch?.name || '—' },
    { label: 'Chức vụ', value: employee.position || '—' },
    { label: 'Lương/giờ', value: formatCurrency(employee.hourlyRate) },
    { label: 'Ngày bắt đầu', value: formatDate(employee.startDate) },
    { label: 'Trạng thái', value: STATUS_LABELS[employee.status] || employee.status || '—' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/employees')}>
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>
        {isAdmin && (
          <Button variant="secondary" onClick={() => navigate('/employees')}>
            <Edit className="w-4 h-4" />
            Sửa tại danh sách
          </Button>
        )}
      </div>

      <Card title={name} subtitle="Thông tin chi tiết nhân viên">
        <div className="flex items-center gap-4 mb-6">
          <Avatar 
            src={employee.avatarUrl || employee.user?.avatarUrl} 
            name={name} 
            size="xl" 
          />
          <div>
            <div className="text-xl font-bold text-slate-800 mb-1">{name}</div>
            <Badge variant={getStatusBadgeVariant(employee.status)}>
              {STATUS_LABELS[employee.status] || employee.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label} className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{field.label}</div>
              <div className="text-sm font-medium text-slate-800 mt-1">{field.value}</div>
            </div>
          ))}
        </div>

        {employee.note && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="text-xs font-semibold text-amber-600">Ghi chú</div>
            <p className="text-sm text-slate-700 mt-1">{employee.note}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
