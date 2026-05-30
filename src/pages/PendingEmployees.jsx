import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
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
import adminService from '../services/adminService';
import branchService from '../services/branchService';
import shiftService from '../services/shiftService';
import { useToast } from '../contexts/ToastContext';
import { formatDate, toInputDate } from '../utils/formatDate';
import { STATUS_LABELS } from '../utils/rolePermissions';
import { getApiMessage } from '../utils/parseApiData';
import {
  getUserId,
  getEntityId,
  getShiftId,
  hasValidId,
  devLog,
} from '../utils/getEntityId';

const emptyApproveForm = {
  branchId: '',
  position: '',
  hourlyRate: '',
  shiftId: '',
  startDate: toInputDate(new Date()),
  note: '',
};

export default function PendingEmployees() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [approveModal, setApproveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(emptyApproveForm);
  const [submitting, setSubmitting] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pending, branchList, shiftList] = await Promise.all([
        adminService.getPendingEmployees(),
        branchService.getAll(),
        shiftService.getAll(),
      ]);
      setPendingUsers(pending);
      setBranches(branchList);
      setShifts(shiftList);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getName = (item) => item.fullName || item.name || item.user?.fullName || '—';
  const getEmail = (item) => item.email || item.user?.email || '—';
  const getPhone = (item) => item.phone || item.user?.phone || '—';

  const openApprove = (item) => {
    const userId = getUserId(item);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID tài khoản nhân viên', 'error');
      devLog('Invalid pending item:', item, 'userId:', userId);
      return;
    }
    devLog('Approve pending item:', item, 'userId:', userId);
    setSelectedItem(item);
    setForm(emptyApproveForm);
    setApproveModal(true);
  };

  const openReject = (item) => {
    const userId = getUserId(item);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID tài khoản nhân viên', 'error');
      devLog('Invalid pending item:', item, 'userId:', userId);
      return;
    }
    devLog('Reject pending item:', item, 'userId:', userId);
    setRejectDialog(item);
  };

  const handleApprove = async () => {
    const userId = getUserId(selectedItem);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID tài khoản nhân viên', 'error');
      devLog('Invalid pending item:', selectedItem, 'userId:', userId);
      return;
    }
    if (!form.branchId || !form.position || !form.hourlyRate || !form.startDate) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        branchId: form.branchId,
        position: form.position,
        hourlyRate: Number(form.hourlyRate),
        startDate: form.startDate,
        note: form.note || undefined,
      };
      if (form.shiftId) payload.shiftId = form.shiftId;

      await adminService.approveEmployee(userId, payload);
      showToast('Duyệt nhân viên thành công', 'success');
      setApproveModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    const userId = getUserId(rejectDialog);
    if (!hasValidId(userId)) {
      showToast('Không tìm thấy ID tài khoản nhân viên', 'error');
      devLog('Invalid pending item:', rejectDialog, 'userId:', userId);
      return;
    }
    setSubmitting(true);
    try {
      await adminService.rejectEmployee(userId);
      showToast('Đã từ chối nhân viên', 'success');
      setRejectDialog(null);
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', title: 'Họ tên', render: (row) => getName(row) },
    { key: 'email', title: 'Email', render: (row) => getEmail(row) },
    { key: 'phone', title: 'SĐT', render: (row) => getPhone(row) },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status || 'pending')}>
          {STATUS_LABELS[row.status] || row.status || 'Chờ duyệt'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: 'Ngày đăng ký',
      render: (row) => formatDate(row.createdAt || row.registeredAt),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="success" onClick={() => openApprove(row)}>
            <Check className="w-3.5 h-3.5" />
            Duyệt
          </Button>
          <Button size="sm" variant="danger" onClick={() => openReject(row)}>
            <X className="w-3.5 h-3.5" />
            Từ chối
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-4">
      <Card title="Danh sách chờ duyệt" subtitle={`${pendingUsers.length} tài khoản`}>
        {pendingUsers.length === 0 ? (
          <EmptyState title="Không có nhân viên chờ duyệt" description="Tất cả đăng ký đã được xử lý." />
        ) : (
          <Table columns={columns} data={pendingUsers} />
        )}
      </Card>

      {approveModal && selectedItem && (
        <Modal
          open={approveModal}
          onClose={() => {
            setApproveModal(false);
            setSelectedItem(null);
          }}
          title={`Duyệt nhân viên: ${getName(selectedItem)}`}
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setApproveModal(false);
                  setSelectedItem(null);
                }}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button variant="success" onClick={handleApprove} loading={submitting}>
                Xác nhận duyệt
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Chi nhánh"
              required
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              options={branches.map((b) => ({ value: getEntityId(b), label: b.name }))}
              placeholder="Chọn chi nhánh"
            />
            <Input
              label="Chức vụ"
              required
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Nhân viên bán hàng"
            />
            <Input
              label="Lương/giờ (VND)"
              type="number"
              required
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
              placeholder="30000"
            />
            <Select
              label="Ca làm (tuỳ chọn)"
              value={form.shiftId}
              onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
              options={shifts.map((s) => ({ value: getShiftId(s), label: s.name }))}
              placeholder="Không chọn"
            />
            <Input
              label="Ngày bắt đầu"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="Ghi chú"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Ghi chú thêm..."
              containerClassName="sm:col-span-2"
            />
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!rejectDialog}
        onClose={() => setRejectDialog(null)}
        onConfirm={handleReject}
        title="Từ chối nhân viên"
        message={`Bạn có chắc muốn từ chối "${getName(rejectDialog || {})}"?`}
        confirmText="Từ chối"
        loading={submitting}
      />
    </div>
  );
}
