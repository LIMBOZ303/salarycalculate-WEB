import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge from '../components/Badge';
import shiftService from '../services/shiftService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { canWrite } from '../utils/rolePermissions';
import { getApiMessage } from '../utils/parseApiData';
import { getShiftId, hasValidId, devLog } from '../utils/getEntityId';

const emptyForm = {
  name: '',
  startTime: '08:00',
  endTime: '17:00',
  breakMinutes: '60',
  graceMinutes: '5',
  allowCheckInBeforeMinutes: '15',
  allowCheckOutAfterMinutes: '15',
  isActive: true,
};

export default function Shifts() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = canWrite(user?.role);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shifts, setShifts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await shiftService.getAll();
      setShifts(data);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (shift) => {
    const shiftId = getShiftId(shift);
    if (!hasValidId(shiftId)) {
      showToast('Không tìm thấy ID ca làm', 'error');
      devLog('Shift action item:', shift, 'shiftId:', shiftId);
      return;
    }
    devLog('Shift action item:', shift, 'shiftId:', shiftId);
    setEditing(shift);
    setForm({
      name: shift.name || '',
      startTime: shift.startTime?.slice(0, 5) || '08:00',
      endTime: shift.endTime?.slice(0, 5) || '17:00',
      breakMinutes: shift.breakMinutes ?? '60',
      graceMinutes: shift.graceMinutes ?? '5',
      allowCheckInBeforeMinutes: shift.allowCheckInBeforeMinutes ?? '15',
      allowCheckOutAfterMinutes: shift.allowCheckOutAfterMinutes ?? '15',
      isActive: shift.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.startTime || !form.endTime) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: Number(form.breakMinutes) || 0,
        graceMinutes: Number(form.graceMinutes) || 0,
        allowCheckInBeforeMinutes: Number(form.allowCheckInBeforeMinutes) || 0,
        allowCheckOutAfterMinutes: Number(form.allowCheckOutAfterMinutes) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        const shiftId = getShiftId(editing);
        if (!hasValidId(shiftId)) {
          showToast('Không tìm thấy ID ca làm', 'error');
          return;
        }
        await shiftService.update(shiftId, payload);
        showToast('Cập nhật ca làm thành công', 'success');
      } else {
        await shiftService.create(payload);
        showToast('Thêm ca làm thành công', 'success');
      }
      setModalOpen(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (shift) => {
    const shiftId = getShiftId(shift);
    if (!hasValidId(shiftId)) {
      showToast('Không tìm thấy ID ca làm', 'error');
      devLog('Invalid shift item:', shift, 'shiftId:', shiftId);
      return;
    }
    setDeleteDialog(shift);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const shiftId = getShiftId(deleteDialog);
    if (!hasValidId(shiftId)) {
      showToast('Không tìm thấy ID ca làm', 'error');
      devLog('Invalid shift item:', deleteDialog, 'shiftId:', shiftId);
      return;
    }
    setSubmitting(true);
    try {
      await shiftService.remove(shiftId);
      showToast('Xóa ca làm thành công', 'success');
      setDeleteDialog(null);
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', title: 'Tên ca' },
    { key: 'startTime', title: 'Giờ vào', render: (row) => row.startTime?.slice(0, 5) || '—' },
    { key: 'endTime', title: 'Giờ ra', render: (row) => row.endTime?.slice(0, 5) || '—' },
    { key: 'breakMinutes', title: 'Nghỉ (phút)', render: (row) => row.breakMinutes ?? '—' },
    { key: 'graceMinutes', title: 'Grace (phút)', render: (row) => row.graceMinutes ?? '—' },
    {
      key: 'isActive',
      title: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.isActive !== false ? 'success' : 'default'}>
          {row.isActive !== false ? 'Hoạt động' : 'Ngưng'}
        </Badge>
      ),
    },
    ...(isAdmin ? [{
      key: 'actions',
      title: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openDelete(row)}>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-4">
      <Card
        title="Danh sách ca làm"
        subtitle={`${shifts.length} ca làm việc`}
        action={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Thêm ca làm
            </Button>
          )
        }
      >
        {shifts.length === 0 ? (
          <EmptyState
            title="Chưa có ca làm"
            actionLabel={isAdmin ? 'Thêm ca làm' : undefined}
            onAction={isAdmin ? openCreate : undefined}
          />
        ) : (
          <Table columns={columns} data={shifts} />
        )}
      </Card>

      {modalOpen && (
        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          title={editing ? 'Sửa ca làm' : 'Thêm ca làm'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Tên ca" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Giờ bắt đầu" type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="Giờ kết thúc" type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            <Input label="Nghỉ giữa ca (phút)" type="number" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })} />
            <Input label="Grace minutes" type="number" value={form.graceMinutes} onChange={(e) => setForm({ ...form, graceMinutes: e.target.value })} hint="Thời gian chấp nhận đi trễ" />
            <Input label="Check-in trước (phút)" type="number" value={form.allowCheckInBeforeMinutes} onChange={(e) => setForm({ ...form, allowCheckInBeforeMinutes: e.target.value })} />
            <Input label="Check-out sau (phút)" type="number" value={form.allowCheckOutAfterMinutes} onChange={(e) => setForm({ ...form, allowCheckOutAfterMinutes: e.target.value })} />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="shiftActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="shiftActive" className="text-sm text-slate-700">Đang hoạt động</label>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Xóa ca làm"
        message={`Bạn có chắc muốn xóa ca "${deleteDialog?.name}"?`}
        loading={submitting}
      />
    </div>
  );
}
