import { useEffect, useState, useRef } from 'react';
import { LogOut, Camera, Trash2 } from 'lucide-react';
import Loading from '../../components/Loading';
import {
  EmployeeCard,
  EmployeeRow,
  EmployeeStatusBadge,
  EmployeeError,
} from '../../components/employee/EmployeeUI';
import employeeService from '../../services/employeeService';
import avatarService from '../../services/avatarService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Avatar from '../../components/Avatar';
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
  const { user, logout, updateUserAvatar } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 5MB', 'error');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Chỉ hỗ trợ định dạng JPG, PNG, WEBP', 'error');
      return;
    }

    setUploading(true);
    try {
      const res = await avatarService.uploadMyAvatar(file);
      const newAvatarUrl = res.data?.avatarUrl;
      const updatedUser = res.data?.user;
      
      updateUserAvatar(newAvatarUrl, updatedUser);
      
      setEmployee(prev => {
        if (!prev) return prev;
        return { ...prev, avatarUrl: newAvatarUrl };
      });
      
      showToast(res.message || 'Cập nhật ảnh đại diện thành công', 'success');
    } catch (err) {
      showToast(getApiMessage(err) || 'Lỗi khi tải ảnh lên', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh đại diện?')) return;
    
    setUploading(true);
    try {
      await avatarService.deleteMyAvatar();
      
      updateUserAvatar(null);
      setEmployee(prev => {
        if (!prev) return prev;
        return { ...prev, avatarUrl: null };
      });
      
      showToast('Đã xóa ảnh đại diện', 'success');
    } catch (err) {
      showToast(getApiMessage(err) || 'Lỗi khi xóa ảnh', 'error');
    } finally {
      setUploading(false);
    }
  };

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
          <Avatar 
            src={profile?.avatarUrl || profile?.user?.avatarUrl} 
            name={name} 
            size="2xl" 
            className="mb-3"
          />
          
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              {uploading ? 'Đang tải...' : 'Đổi ảnh'}
            </button>
            {(profile?.avatarUrl || profile?.user?.avatarUrl) && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa ảnh
              </button>
            )}
          </div>
          
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />

          <h2 className="text-lg font-semibold text-[#0F172A]">{name}</h2>
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
