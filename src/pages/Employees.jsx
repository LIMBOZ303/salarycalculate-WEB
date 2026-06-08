import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Edit, Lock, Unlock, Trash2, UserCheck } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge, { getStatusBadgeVariant } from '../components/Badge';
import Avatar from '../components/Avatar';
import employeeService from '../services/employeeService';
import branchService from '../services/branchService';
import adminService from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { canWrite, filterByBranch, STATUS_LABELS, getUserRole } from '../utils/rolePermissions';
import { formatCurrency } from '../utils/formatCurrency';
import { getApiMessage } from '../utils/parseApiData';
import { buildEmployeeUpdatePayload } from '../utils/buildPayload';
import {
  getEmployeeProfileId,
  getUserId,
  getEntityId,
  getBranchId,
  getShiftId,
  hasValidId,
  devLog,
} from '../utils/getEntityId';

export default function Employees() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const currentRole = getUserRole(user);
  const isAdmin = canWrite(currentRole);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [lockDialog, setLockDialog] = useState(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    branchId: '',
    position: '',
    hourlyRate: '',
    shiftId: '',
    startDate: '',
    note: '',
  });

  const mapEmployeeToEditForm = (emp) => ({
    fullName: emp.fullName || emp.name || '',
    phone: emp.phone || emp.user?.phone || '',
    email: emp.email || emp.user?.email || '',
    branchId: getBranchId(emp) || '',
    position: emp.position || '',
    hourlyRate: emp.hourlyRate ?? '',
    shiftId: getShiftId(emp.shift) || getShiftId({ id: emp.shiftId }) || (typeof emp.shiftId === 'string' ? emp.shiftId : ''),
    startDate: emp.startDate ? String(emp.startDate).slice(0, 10) : '',
    note: emp.note || '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [empList, branchList] = await Promise.all([
        employeeService.getAll(),
        branchService.getAll(),
      ]);
      setEmployees(filterByBranch(empList, user));
      setBranches(branchList);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getBranchName = (emp) => {
    const id = getBranchId(emp) || getBranchId(emp.branch);
    const branch = branches.find((b) => String(getEntityId(b)) === String(id));
    return branch?.name || emp.branch?.name || '—';
  };

  const getName = (emp) => emp.fullName || emp.name || '—';

  const openEdit = (emp) => {
    const employeeId = getEmployeeProfileId(emp);
    if (!hasValidId(employeeId)) {
      showToast('Không tìm thấy ID hồ sơ nhân viên', 'error');
      devLog('Employee action item:', emp, 'employeeId:', employeeId);
      return;
    }
    devLog('Employee action item:', emp, 'employeeId:', employeeId, 'userId:', getUserId(emp));
    setEditing(emp);
    setForm(mapEmployeeToEditForm(emp));
    setModalOpen(true);
  };

  const handleView = (emp) => {
    const employeeId = getEmployeeProfileId(emp);
    if (!hasValidId(employeeId)) {
      showToast('Không tìm thấy ID hồ sơ nhân viên', 'error');
      devLog('Employee action item:', emp, 'employeeId:', employeeId);
      return;
    }
    navigate(`/employees/${employeeId}`);
  };

  const handleSubmit = async () => {
    if (!editing || !isAdmin) return;
    const employeeId = getEmployeeProfileId(editing);
    if (!hasValidId(employeeId)) {
      showToast('Không tìm thấy ID hồ sơ nhân viên', 'error');
      return;
    }
    if (!form.fullName || !form.branchId) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    const payload = buildEmployeeUpdatePayload(form);

    if ('status' in payload || 'role' in payload) {
      showToast('Không được cập nhật role/status tại mục Nhân sự', 'error');
      return;
    }

    if (import.meta.env.DEV) {
      console.log('Update employee clean payload:', payload);
    }

    const endpoint = `/api/employees/${employeeId}`;

    devLog('Edit employee debug', {
      currentUser: user,
      currentRole,
      employee: editing,
      employeeId,
      payload,
      endpoint,
    });

    setSubmitting(true);
    try {
      await employeeService.update(employeeId, payload);
      showToast('Cập nhật nhân viên thành công', 'success');
      setModalOpen(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      if (import.meta.env.DEV && err.response?.status === 403) {
        console.log('Edit employee 403', {
          currentRole,
          endpoint,
          employeeId,
          payload,
          backendMessage: err.response?.data?.message,
          backendResponse: err.response?.data,
        });
      }
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (emp) => {
    const employeeId = getEmployeeProfileId(emp);
    if (!hasValidId(employeeId)) {
      showToast('Không tìm thấy ID hồ sơ nhân viên', 'error');
      devLog('Employee action item:', emp, 'employeeId:', employeeId);
      return;
    }
    setDeleteDialog(emp);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const employeeId = getEmployeeProfileId(deleteDialog);
    if (!hasValidId(employeeId)) {
      showToast('Không tìm thấy ID hồ sơ nhân viên', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await employeeService.remove(employeeId);
      showToast('Xóa nhân viên thành công', 'success');
      setDeleteDialog(null);
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openLockDialog = (emp) => {
    const userId = getUserId(emp);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID tài khoản của nhân viên', 'error');
      devLog('Employee action item:', emp, 'employeeId:', getEmployeeProfileId(emp), 'userId:', userId);
      return;
    }
    setLockDialog(emp);
  };

  const handleLockToggle = async () => {
    if (!lockDialog) return;
    const userId = getUserId(lockDialog);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID tài khoản của nhân viên', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const isLocked = lockDialog.status === 'locked' || lockDialog.user?.status === 'locked';
      if (isLocked) {
        await adminService.unlockUser(userId);
        showToast('Mở khóa tài khoản thành công', 'success');
      } else {
        await adminService.lockUser(userId);
        showToast('Khóa tài khoản thành công', 'success');
      }
      setLockDialog(null);
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { 
      key: 'name', 
      title: 'Họ tên', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={row.avatarUrl || row.user?.avatarUrl} 
            name={getName(row)} 
            size="md" 
          />
          <span className="font-medium text-slate-800">{getName(row)}</span>
        </div>
      ) 
    },
    { key: 'email', title: 'Email', render: (row) => row.email || row.user?.email || '—' },
    { key: 'phone', title: 'SĐT', render: (row) => row.phone || row.user?.phone || '—' },
    { key: 'branch', title: 'Chi nhánh', render: (row) => getBranchName(row) },
    { key: 'position', title: 'Chức vụ', render: (row) => row.position || '—' },
    {
      key: 'hourlyRate',
      title: 'Lương/giờ',
      render: (row) => formatCurrency(row.hourlyRate),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status || row.user?.status)}>
          {STATUS_LABELS[row.status || row.user?.status] || row.status || '—'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (row) => {
        const isLocked = row.status === 'locked' || row.user?.status === 'locked';
        return (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => handleView(row)} title="Xem">
              <Eye className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <>
                <Button size="sm" variant="ghost" onClick={() => openEdit(row)} title="Sửa">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openLockDialog(row)}
                  title={isLocked ? 'Mở khóa' : 'Khóa'}
                >
                  {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openDelete(row)} title="Xóa">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-brand-800">
            Nhân viên cần đăng ký tài khoản trước. Admin duyệt tại mục <strong>Chờ duyệt</strong>.
          </p>
          <Link to="/pending-employees">
            <Button variant="secondary" size="sm">
              <UserCheck className="w-4 h-4" />
              Duyệt nhân viên chờ
            </Button>
          </Link>
        </div>
      )}

      <Card title="Danh sách nhân viên" subtitle={`${employees.length} nhân viên`}>
        {employees.length === 0 ? (
          <EmptyState
            title="Chưa có nhân viên"
            description="Nhân viên cần đăng ký tài khoản và được admin duyệt trước."
            actionLabel={isAdmin ? 'Đến trang chờ duyệt' : undefined}
            onAction={isAdmin ? () => navigate('/pending-employees') : undefined}
          />
        ) : (
          <Table columns={columns} data={employees} />
        )}
      </Card>

      {modalOpen && editing && (
        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          title={`Sửa nhân viên: ${getName(editing)}`}
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalOpen(false);
                  setEditing(null);
                }}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button onClick={handleSubmit} loading={submitting}>Lưu</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Họ tên" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="SĐT" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Select
                label="Chi nhánh"
                required
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                options={branches.map((b) => ({ value: getEntityId(b), label: b.name }))}
              />
              <Input label="Chức vụ" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              <Input label="Lương/giờ" type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
              <Input label="Ngày bắt đầu" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <Input label="Ghi chú" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} containerClassName="sm:col-span-2" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <span className="text-xs font-semibold text-slate-500">Trạng thái hiện tại:</span>
              <Badge variant={getStatusBadgeVariant(editing.status || editing.user?.status)}>
                {STATUS_LABELS[editing.status || editing.user?.status] || editing.status || '—'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Trạng thái tài khoản được quản lý tại mục Tài khoản.
            </p>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Xóa nhân viên"
        message={`Bạn có chắc muốn xóa "${getName(deleteDialog || {})}"?`}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!lockDialog}
        onClose={() => setLockDialog(null)}
        onConfirm={handleLockToggle}
        title={
          lockDialog?.status === 'locked' || lockDialog?.user?.status === 'locked'
            ? 'Mở khóa tài khoản'
            : 'Khóa tài khoản'
        }
        message={`Xác nhận ${
          lockDialog?.status === 'locked' || lockDialog?.user?.status === 'locked' ? 'mở khóa' : 'khóa'
        } tài khoản "${getName(lockDialog || {})}"?`}
        variant={
          lockDialog?.status === 'locked' || lockDialog?.user?.status === 'locked' ? 'success' : 'danger'
        }
        loading={submitting}
      />
    </div>
  );
}
