import { useEffect, useState } from 'react';
import { Edit, Filter } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Badge, { getStatusBadgeVariant } from '../components/Badge';
import attendanceService from '../services/attendanceService';
import branchService from '../services/branchService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { canWrite, filterByBranch, getUserBranchId, ROLES } from '../utils/rolePermissions';
import { formatDate, formatTime, getCurrentMonthYear } from '../utils/formatDate';
import { getApiMessage } from '../utils/parseApiData';
import { buildAttendanceUpdatePayload } from '../utils/buildPayload';
import { getEntityId, hasValidId, devLog } from '../utils/getEntityId';

const emptyEditForm = {
  checkInTime: '',
  checkOutTime: '',
  breakMinutes: '',
  status: '',
  note: '',
  reason: '',
};

export default function Attendance() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = canWrite(user?.role);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
    branchId: user?.role === ROLES.BRANCH_MANAGER ? getUserBranchId(user) || '' : '',
    status: '',
  });
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [reasonError, setReasonError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        month: filters.month,
        year: filters.year,
      };
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.status) params.status = filters.status;

      const [attList, branchList] = await Promise.all([
        attendanceService.getAll(params),
        branchService.getAll(),
      ]);

      let filtered = attList;
      if (user?.role === ROLES.BRANCH_MANAGER) {
        filtered = filterByBranch(attList, user);
      }

      setAttendances(filtered);
      setBranches(branchList);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.month, filters.year, filters.branchId, filters.status, user]);

  const getEmployeeName = (row) =>
    row.employee?.fullName || row.employee?.name || row.employeeName || row.fullName || '—';

  const getBranchName = (row) =>
    row.branch?.name || row.branchName || '—';

  const closeEditModal = () => {
    setEditModal(false);
    setEditing(null);
    setEditForm(emptyEditForm);
    setReasonError('');
  };

  const openEdit = (row) => {
    setEditing(row);
    setEditForm({
      checkInTime: row.checkInTime ? row.checkInTime.slice(0, 16) : '',
      checkOutTime: row.checkOutTime ? row.checkOutTime.slice(0, 16) : '',
      breakMinutes: row.breakMinutes ?? '',
      status: row.status || '',
      note: row.note || '',
      reason: '',
    });
    setReasonError('');
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editing) return;

    if (!editForm.reason?.trim()) {
      setReasonError('Vui lòng nhập lý do sửa công');
      return;
    }
    setReasonError('');

    const attendanceId = getEntityId(editing);
    if (!hasValidId(attendanceId)) {
      showToast('Không tìm thấy ID bản công', 'error');
      devLog('Invalid attendance item:', editing, 'attendanceId:', attendanceId);
      return;
    }

    const payload = buildAttendanceUpdatePayload(editForm);

    devLog('Update attendance debug', { attendance: editing, attendanceId, payload });

    setSubmitting(true);
    try {
      await attendanceService.update(attendanceId, payload);
      showToast('Cập nhật chấm công thành công', 'success');
      closeEditModal();
      fetchData();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.log('Update attendance debug', {
          attendance: editing,
          attendanceId,
          payload,
          error: err.response?.data || err.message,
        });
      }
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'employee', title: 'Nhân viên', render: (row) => getEmployeeName(row) },
    { key: 'branch', title: 'Chi nhánh', render: (row) => getBranchName(row) },
    { key: 'date', title: 'Ngày', render: (row) => formatDate(row.date || row.workDate) },
    { key: 'checkIn', title: 'Giờ vào', render: (row) => formatTime(row.checkInTime) },
    { key: 'checkOut', title: 'Giờ ra', render: (row) => formatTime(row.checkOutTime) },
    {
      key: 'totalHours',
      title: 'Tổng giờ',
      render: (row) => row.totalHours ?? row.workedHours ?? row.hours ?? '—',
    },
    {
      key: 'late',
      title: 'Đi trễ',
      render: (row) => {
        const late = row.lateMinutes ?? (row.isLate ? 'Có' : null);
        if (late === null || late === undefined) return '—';
        if (typeof late === 'number') return late > 0 ? `${late} phút` : 'Không';
        return late ? 'Có' : 'Không';
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {row.status || '—'}
        </Badge>
      ),
    },
    {
      key: 'gps',
      title: 'GPS (m)',
      render: (row) => {
        const dist = row.gpsDistance ?? row.distanceMeters ?? row.checkInDistance;
        return dist != null ? `${Number(dist).toFixed(0)}m` : '—';
      },
    },
    {
      key: 'suspicious',
      title: 'Suspicious',
      render: (row) => (
        row.isSuspicious || row.suspicious ? (
          <Badge variant="danger">Có</Badge>
        ) : (
          <Badge variant="success">Không</Badge>
        )
      ),
    },
    ...(isAdmin ? [{
      key: 'actions',
      title: 'Thao tác',
      render: (row) => (
        <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
          <Edit className="w-4 h-4" />
        </Button>
      ),
    }] : []),
  ];

  const branchOptions = user?.role === ROLES.BRANCH_MANAGER
    ? branches.filter((b) => String(getEntityId(b)) === String(getUserBranchId(user)))
    : branches;

  return (
    <div className="space-y-4">
      <Card title="Bộ lọc" subtitle="Lọc theo tháng, chi nhánh, trạng thái">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Tháng"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: i + 1,
              label: `Tháng ${i + 1}`,
            }))}
            placeholder=""
          />
          <Select
            label="Năm"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
            options={[
              { value: currentYear - 1, label: String(currentYear - 1) },
              { value: currentYear, label: String(currentYear) },
              { value: currentYear + 1, label: String(currentYear + 1) },
            ]}
            placeholder=""
          />
          {user?.role !== ROLES.BRANCH_MANAGER && (
            <Select
              label="Chi nhánh"
              value={filters.branchId}
              onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
              options={branchOptions.map((b) => ({ value: getEntityId(b), label: b.name }))}
              placeholder="Tất cả"
            />
          )}
          <Select
            label="Trạng thái"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'on_time', label: 'Đúng giờ' },
              { value: 'late', label: 'Đi trễ' },
              { value: 'absent', label: 'Vắng' },
            ]}
            placeholder="Tất cả"
          />
        </div>
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={fetchData}>
            <Filter className="w-4 h-4" />
            Áp dụng bộ lọc
          </Button>
        </div>
      </Card>

      <Card title="Bảng công" subtitle={`${attendances.length} bản ghi`}>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : attendances.length === 0 ? (
          <EmptyState title="Không có bản ghi chấm công" description="Thử thay đổi bộ lọc hoặc kiểm tra lại dữ liệu." />
        ) : (
          <Table columns={columns} data={attendances} />
        )}
      </Card>

      {editModal && editing && (
        <Modal
          open={editModal}
          onClose={closeEditModal}
          title="Sửa chấm công"
          footer={
            <>
              <Button variant="secondary" onClick={closeEditModal} disabled={submitting}>Hủy</Button>
              <Button onClick={handleUpdate} loading={submitting}>Lưu</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Giờ vào"
              type="datetime-local"
              value={editForm.checkInTime}
              onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
            />
            <Input
              label="Giờ ra"
              type="datetime-local"
              value={editForm.checkOutTime}
              onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
            />
            <Input
              label="Nghỉ (phút)"
              type="number"
              value={editForm.breakMinutes}
              onChange={(e) => setEditForm({ ...editForm, breakMinutes: e.target.value })}
            />
            <Select
              label="Trạng thái"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'on_time', label: 'Đúng giờ' },
                { value: 'late', label: 'Đi trễ' },
                { value: 'absent', label: 'Vắng' },
              ]}
              placeholder="Giữ nguyên"
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">
                Lý do sửa công
                <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <textarea
                name="reason"
                value={editForm.reason}
                onChange={(e) => {
                  setEditForm({ ...editForm, reason: e.target.value });
                  if (reasonError) setReasonError('');
                }}
                placeholder="Ví dụ: Nhân viên quên chấm ra, admin điều chỉnh lại giờ công"
                rows={3}
                className={`w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all resize-none ${
                  reasonError ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {reasonError && <p className="text-xs text-rose-600">{reasonError}</p>}
            </div>
            <Input
              label="Ghi chú"
              value={editForm.note}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
              hint="Ghi chú bổ sung (không thay cho lý do sửa công)"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
