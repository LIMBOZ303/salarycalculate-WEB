import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge, { getStatusBadgeVariant } from '../components/Badge';
import branchService from '../services/branchService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { canWrite } from '../utils/rolePermissions';
import { getApiMessage } from '../utils/parseApiData';
import { getEntityId, hasValidId, devLog } from '../utils/getEntityId';

const emptyForm = {
  name: '',
  address: '',
  phone: '',
  latitude: '',
  longitude: '',
  allowedRadiusMeters: '100',
  isActive: true,
};

export default function Branches() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = canWrite(user?.role);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await branchService.getAll();
      setBranches(data);
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

  const openEdit = (branch) => {
    setEditing(branch);
    setForm({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      latitude: branch.latitude ?? '',
      longitude: branch.longitude ?? '',
      allowedRadiusMeters: branch.allowedRadiusMeters ?? '100',
      isActive: branch.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address) {
      showToast('Tên và địa chỉ không được để trống', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        phone: form.phone || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        allowedRadiusMeters: form.allowedRadiusMeters ? Number(form.allowedRadiusMeters) : undefined,
        isActive: form.isActive,
      };
      if (editing) {
        const branchId = getEntityId(editing);
        if (!hasValidId(branchId)) {
          showToast('Không tìm thấy ID chi nhánh', 'error');
          devLog('Invalid branch item:', editing, 'branchId:', branchId);
          return;
        }
        await branchService.update(branchId, payload);
        showToast('Cập nhật chi nhánh thành công', 'success');
      } else {
        await branchService.create(payload);
        showToast('Thêm chi nhánh thành công', 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const branchId = getEntityId(deleteDialog);
    if (!hasValidId(branchId)) {
      showToast('Không tìm thấy ID chi nhánh', 'error');
      devLog('Invalid branch item:', deleteDialog, 'branchId:', branchId);
      return;
    }
    setSubmitting(true);
    try {
      await branchService.remove(branchId);
      showToast('Xóa chi nhánh thành công', 'success');
      setDeleteDialog(null);
      fetchData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', title: 'Tên chi nhánh' },
    { key: 'address', title: 'Địa chỉ', render: (row) => row.address || '—' },
    { key: 'phone', title: 'SĐT', render: (row) => row.phone || '—' },
    {
      key: 'gps',
      title: 'Tọa độ GPS',
      render: (row) => (
        row.latitude != null && row.longitude != null ? (
          <span className="flex items-center gap-1 text-xs font-mono">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            {Number(row.latitude).toFixed(6)}, {Number(row.longitude).toFixed(6)}
          </span>
        ) : '—'
      ),
    },
    {
      key: 'radius',
      title: 'Bán kính (m)',
      render: (row) => row.allowedRadiusMeters != null ? `${row.allowedRadiusMeters}m` : '—',
    },
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
          <Button size="sm" variant="ghost" onClick={() => setDeleteDialog(row)}>
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
        title="Danh sách chi nhánh"
        subtitle={`${branches.length} chi nhánh`}
        action={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Thêm chi nhánh
            </Button>
          )
        }
      >
        {branches.length === 0 ? (
          <EmptyState
            title="Chưa có chi nhánh"
            actionLabel={isAdmin ? 'Thêm chi nhánh' : undefined}
            onAction={isAdmin ? openCreate : undefined}
          />
        ) : (
          <Table columns={columns} data={branches} />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>Hủy</Button>
            <Button onClick={handleSubmit} loading={submitting}>Lưu</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Tên chi nhánh" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="SĐT" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Địa chỉ" required containerClassName="sm:col-span-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="Vĩ độ (Latitude)" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} hint="Tọa độ GPS" />
          <Input label="Kinh độ (Longitude)" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} hint="Tọa độ GPS" />
          <Input label="Bán kính cho phép (m)" type="number" value={form.allowedRadiusMeters} onChange={(e) => setForm({ ...form, allowedRadiusMeters: e.target.value })} hint="Phạm vi chấm công hợp lệ" />
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">Đang hoạt động</label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Xóa chi nhánh"
        message={`Bạn có chắc muốn xóa chi nhánh "${deleteDialog?.name}"?`}
        loading={submitting}
      />
    </div>
  );
}
