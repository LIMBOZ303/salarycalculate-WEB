import { useEffect, useState } from 'react';
import { Edit, Lock, Unlock } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Select from '../components/Select';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge, { getStatusBadgeVariant } from '../components/Badge';
import Avatar from '../components/Avatar';
import adminService from '../services/adminService';
import branchService from '../services/branchService';
import { useToast } from '../contexts/ToastContext';
import { ROLE_LABELS, STATUS_LABELS } from '../utils/rolePermissions';
import { getApiMessage } from '../utils/parseApiData';
import { getUserId, getEntityId, getBranchId, hasValidId, devLog } from '../utils/getEntityId';

export default function Users() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [roleSelectedUser, setRoleSelectedUser] = useState(null);
  const [statusSelectedUser, setStatusSelectedUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const [roleForm, setRoleForm] = useState({ role: '', branchId: '' });
  const [statusForm, setStatusForm] = useState({ status: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [userList, branchList] = await Promise.all([
        adminService.getUsers(),
        branchService.getAll(),
      ]);
      setUsers(userList);
      setBranches(branchList);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getName = (u) => u.fullName || u.name || '—';

  const getBranchName = (u) => {
    const id = getBranchId(u) || getEntityId(u.branch);
    const branch = branches.find((b) => String(getEntityId(b)) === String(id));
    return branch?.name || u.branch?.name || '—';
  };

  const openRoleModal = (user) => {
    const userId = getUserId(user);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID người dùng', 'error');
      devLog('Invalid user item:', user, 'userId:', userId);
      return;
    }
    devLog('User action item:', user, 'userId:', userId);
    setRoleSelectedUser(user);
    setRoleForm({
      role: user.role || '',
      branchId: getBranchId(user) || '',
    });
    setRoleModalOpen(true);
  };

  const openStatusModal = (user) => {
    const userId = getUserId(user);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID người dùng', 'error');
      devLog('Invalid user item:', user, 'userId:', userId);
      return;
    }
    devLog('User action item:', user, 'userId:', userId);
    setStatusSelectedUser(user);
    setStatusForm({ status: user.status || 'active' });
    setStatusModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setRoleSelectedUser(null);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setStatusSelectedUser(null);
  };

  const openLockConfirm = (user) => {
    const userId = getUserId(user);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID người dùng', 'error');
      devLog('Invalid user item:', user, 'userId:', userId);
      return;
    }
    const isLocked = user.status === 'locked';
    setConfirmAction({
      user,
      userId,
      type: isLocked ? 'unlock' : 'lock',
    });
  };

  const handleRoleUpdate = async () => {
    const userId = getUserId(roleSelectedUser);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID người dùng', 'error');
      return;
    }
    if (!roleForm.role) {
      showToast('Vui lòng chọn role', 'error');
      return;
    }
    if (roleForm.role === 'branch_manager' && !roleForm.branchId) {
      showToast('Quản lý chi nhánh cần chọn chi nhánh', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const payload = { role: roleForm.role };
      if (roleForm.role === 'branch_manager') {
        payload.branchId = roleForm.branchId;
      }
      await adminService.updateUserRole(userId, payload);
      showToast('Cập nhật role thành công', 'success');
      closeRoleModal();
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    const userId = getUserId(statusSelectedUser);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID người dùng', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.updateUserStatus(userId, { status: statusForm.status });
      showToast('Cập nhật trạng thái thành công', 'success');
      closeStatusModal();
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmLockAction = async () => {
    if (!confirmAction) return;
    const { userId, type } = confirmAction;
    setActionLoading(true);
    try {
      if (type === 'unlock') {
        await adminService.unlockUser(userId);
        showToast('Mở khóa tài khoản thành công', 'success');
      } else {
        await adminService.lockUser(userId);
        showToast('Khóa tài khoản thành công', 'success');
      }
      setConfirmAction(null);
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { 
      key: 'name', 
      title: 'Tên', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatarUrl} name={getName(row)} size="md" />
          <span className="font-medium text-slate-800">{getName(row)}</span>
        </div>
      ) 
    },
    { key: 'email', title: 'Email', render: (row) => row.email || '—' },
    { key: 'phone', title: 'SĐT', render: (row) => row.phone || '—' },
    {
      key: 'role',
      title: 'Role',
      render: (row) => (
        <Badge variant="brand">{ROLE_LABELS[row.role] || row.role}</Badge>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {STATUS_LABELS[row.status] || row.status || '—'}
        </Badge>
      ),
    },
    { key: 'branch', title: 'Chi nhánh', render: (row) => getBranchName(row) },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openRoleModal(row)} title="Đổi role">
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openStatusModal(row)} title="Đổi status">
            <Edit className="w-4 h-4 text-brand-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openLockConfirm(row)}
            title={row.status === 'locked' ? 'Mở khóa' : 'Khóa'}
            disabled={actionLoading}
          >
            {row.status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-4">
      <Card title="Danh sách tài khoản" subtitle={`${users.length} người dùng`}>
        {users.length === 0 ? (
          <EmptyState title="Không có tài khoản" />
        ) : (
          <Table columns={columns} data={users} />
        )}
      </Card>

      {roleModalOpen && roleSelectedUser && (
        <Modal
          open={roleModalOpen}
          onClose={closeRoleModal}
          title="Đổi role người dùng"
          footer={
            <>
              <Button variant="secondary" onClick={closeRoleModal} disabled={actionLoading}>Hủy</Button>
              <Button onClick={handleRoleUpdate} loading={actionLoading}>Lưu</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-sm">
              <div className="font-semibold text-slate-800">{getName(roleSelectedUser)}</div>
              <div className="text-slate-500 text-xs mt-0.5">{roleSelectedUser.email || '—'}</div>
            </div>
            <Select
              label="Role"
              required
              value={roleForm.role}
              onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
              options={[
                { value: 'admin', label: 'Quản trị viên' },
                { value: 'owner', label: 'Chủ sở hữu' },
                { value: 'branch_manager', label: 'Quản lý chi nhánh' },
                { value: 'employee', label: 'Nhân viên' },
              ]}
            />
            {roleForm.role === 'branch_manager' && (
              <Select
                label="Chi nhánh"
                required
                value={roleForm.branchId}
                onChange={(e) => setRoleForm({ ...roleForm, branchId: e.target.value })}
                options={branches.map((b) => ({ value: getEntityId(b), label: b.name }))}
                placeholder="Chọn chi nhánh"
              />
            )}
          </div>
        </Modal>
      )}

      {statusModalOpen && statusSelectedUser && (
        <Modal
          open={statusModalOpen}
          onClose={closeStatusModal}
          title="Đổi trạng thái người dùng"
          footer={
            <>
              <Button variant="secondary" onClick={closeStatusModal} disabled={actionLoading}>Hủy</Button>
              <Button onClick={handleStatusUpdate} loading={actionLoading}>Lưu</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-sm">
              <div className="font-semibold text-slate-800">{getName(statusSelectedUser)}</div>
              <div className="text-slate-500 text-xs mt-0.5">{statusSelectedUser.email || '—'}</div>
            </div>
            <Select
              label="Trạng thái"
              required
              value={statusForm.status}
              onChange={(e) => setStatusForm({ status: e.target.value })}
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Ngưng hoạt động' },
                { value: 'locked', label: 'Đã khóa' },
              ]}
            />
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmLockAction}
        title={confirmAction?.type === 'unlock' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
        message={
          confirmAction
            ? `Xác nhận ${confirmAction.type === 'unlock' ? 'mở khóa' : 'khóa'} tài khoản "${getName(confirmAction.user)}"?`
            : ''
        }
        variant={confirmAction?.type === 'unlock' ? 'success' : 'danger'}
        confirmText={confirmAction?.type === 'unlock' ? 'Mở khóa' : 'Khóa'}
        loading={actionLoading}
      />
    </div>
  );
}
