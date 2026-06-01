import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Filter,
  Banknote,
  CreditCard,
  Coins,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Card, { StatCard } from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge, { getStatusBadgeVariant, getRevenueStatusLabel } from '../components/Badge';
import revenueService from '../services/revenueService';
import branchService from '../services/branchService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  canManageRevenue,
  canConfirmRevenue,
  canDeleteRevenue,
  filterByBranch,
  getUserBranchId,
  ROLES,
} from '../utils/rolePermissions';
import { formatDate, getCurrentMonthYear } from '../utils/formatDate';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { getApiMessage } from '../utils/parseApiData';
import { getEntityId, getBranchId, hasValidId, devLog } from '../utils/getEntityId';

const emptyForm = {
  date: '',
  branchId: '',
  cashAmount: '',
  transferAmount: '',
  otherAmount: '',
  orderCount: '',
  note: '',
};

const defaultSummary = {
  totalRevenue: 0,
  totalCash: 0,
  totalTransfer: 0,
  totalOther: 0,
  totalOrders: 0,
  averageDailyRevenue: 0,
  daysCount: 0,
};

function getMonthYearFromDateInput(dateStr) {
  if (!dateStr) return { month: null, year: null };
  // date input is "YYYY-MM-DD"
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { month: null, year: null };
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function parseNonNegative(value, fieldName) {
  if (value === '' || value === null || value === undefined) return { ok: true, value: 0 };
  const num = Number(value);
  if (Number.isNaN(num)) return { ok: false, message: `${fieldName} phải là số hợp lệ` };
  if (num < 0) return { ok: false, message: `${fieldName} không được âm` };
  return { ok: true, value: num };
}

function buildRevenuePayload(form, role) {
  const payload = {
    date: form.date,
    cashAmount: Number(form.cashAmount || 0),
    transferAmount: Number(form.transferAmount || 0),
    otherAmount: Number(form.otherAmount || 0),
    orderCount: Number(form.orderCount || 0),
    note: form.note?.trim() || '',
  };

  if (role === ROLES.ADMIN) {
    if (form.branchId) {
      payload.branchId = typeof form.branchId === 'object' ? form.branchId?._id : form.branchId;
    }
  }

  return payload;
}

function canEditRevenue(user, row) {
  if (!user || !row) return false;
  if (user.role === ROLES.OWNER) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.BRANCH_MANAGER) {
    return row.status !== 'confirmed';
  }
  return false;
}

export default function Revenues() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canCreate = canManageRevenue(user?.role);
  const canConfirm = canConfirmRevenue(user?.role);
  const canDelete = canDeleteRevenue(user?.role);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState('');
  const [revenues, setRevenues] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
    branchId: user?.role === ROLES.BRANCH_MANAGER ? getUserBranchId(user) || '' : '',
    status: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchBranches = async () => {
    try {
      const branchList = await branchService.getAll();
      setBranches(branchList);
    } catch (err) {
      devLog('Fetch branches error:', err?.response?.data || err?.message || err);
    }
  };

  const fetchMonthlySummary = async () => {
    setSummaryLoading(true);
    try {
      const params = {
        month: filters.month,
        year: filters.year,
      };
      if (filters.branchId) params.branchId = filters.branchId;

      const data = await revenueService.getMonthlySummary(params);
      setSummary({ ...defaultSummary, ...(data || {}) });
    } catch {
      setSummary(defaultSummary);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchRevenues = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        month: filters.month,
        year: filters.year,
      };
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.status) params.status = filters.status;

      const revenueList = await revenueService.getRevenues(params);

      let filtered = revenueList;
      if (user?.role === ROLES.BRANCH_MANAGER) {
        filtered = filterByBranch(revenueList, user);
      }

      setRevenues(filtered);
      devLog('Revenue list after refresh:', filtered);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const refreshRevenueData = async () => {
    devLog('Refresh revenue data with filters:', filters);
    await Promise.all([fetchRevenues(), fetchMonthlySummary()]);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchRevenues();
    fetchMonthlySummary();
  }, [filters.month, filters.year, filters.branchId, filters.status, user]);

  const getBranchName = (row) =>
    row.branch?.name || row.branchName || branches.find((b) => String(getEntityId(b)) === String(getBranchId(row)))?.name || '—';

  const computedTotal = useMemo(() => {
    const cash = Number(form.cashAmount) || 0;
    const transfer = Number(form.transferAmount) || 0;
    const other = Number(form.otherAmount) || 0;
    return cash + transfer + other;
  }, [form.cashAmount, form.transferAmount, form.otherAmount]);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10),
      branchId: user?.role === ROLES.BRANCH_MANAGER ? getUserBranchId(user) || '' : '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    if (!canEditRevenue(user, row)) return;
    devLog('Edit revenue item:', row);
    setEditing(row);
    setForm({
      date: row.date ? String(row.date).slice(0, 10) : '',
      branchId: row.branchId?._id || row.branchId || getBranchId(row) || '',
      cashAmount: row.cashAmount ?? 0,
      transferAmount: row.transferAmount ?? 0,
      otherAmount: row.otherAmount ?? 0,
      orderCount: row.orderCount ?? 0,
      note: row.note || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!form.date?.trim()) {
      errors.date = 'Ngày doanh thu là bắt buộc';
    }

    if (user?.role === ROLES.ADMIN && !form.branchId) {
      errors.branchId = 'Vui lòng chọn chi nhánh';
    }

    const fields = [
      { key: 'cashAmount', label: 'Tiền mặt' },
      { key: 'transferAmount', label: 'Chuyển khoản' },
      { key: 'otherAmount', label: 'Khác' },
      { key: 'orderCount', label: 'Số đơn' },
    ];

    for (const { key, label } of fields) {
      const result = parseNonNegative(form[key], label);
      if (!result.ok) errors[key] = result.message;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (editing && editing.status === 'confirmed' && user?.role !== ROLES.ADMIN) {
      showToast('Doanh thu đã xác nhận, không thể chỉnh sửa', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildRevenuePayload(form, user?.role);
      const isEditing = Boolean(editing);
      const revenueId = isEditing ? (getEntityId(editing) || editing?._id || editing?.id) : '';

      devLog('Submit revenue form:', { isEditing, editingRevenue: editing, revenueId, payload, filters });

      if (isEditing) {
        if (!hasValidId(revenueId)) {
          showToast('Không tìm thấy ID doanh thu', 'error');
          devLog('Invalid editing revenue:', editing, 'revenueId:', revenueId);
          return;
        }
        const response = await revenueService.updateRevenue(revenueId, payload);
        devLog('Revenue update response:', response);
        showToast('Cập nhật doanh thu thành công', 'success');
      } else {
        const response = await revenueService.createRevenue(payload);
        devLog('Revenue create response:', response);
        showToast('Nhập doanh thu thành công', 'success');
      }

      closeModal();
      await refreshRevenueData();

      // If date moved out of current filter month/year, explain why it disappears
      if (isEditing && form.date) {
        const { month, year } = getMonthYearFromDateInput(form.date);
        if (month && year && (month !== filters.month || year !== filters.year)) {
          showToast('Doanh thu đã được cập nhật. Bản ghi không còn nằm trong bộ lọc hiện tại.', 'info');
        }
      }
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const revenueId = getEntityId(deleteDialog);
    if (!hasValidId(revenueId)) {
      showToast('Không tìm thấy ID doanh thu', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await revenueService.deleteRevenue(revenueId);
      showToast('Xóa doanh thu thành công', 'success');
      setDeleteDialog(null);
      await refreshRevenueData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    const revenueId = getEntityId(confirmDialog);
    if (!hasValidId(revenueId)) {
      showToast('Không tìm thấy ID doanh thu', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await revenueService.confirmRevenue(revenueId);
      showToast('Xác nhận doanh thu thành công', 'success');
      setConfirmDialog(null);
      await refreshRevenueData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const showActions = canCreate || canConfirm || canDelete;

  const columns = [
    {
      key: 'date',
      title: 'Ngày',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'branch',
      title: 'Chi nhánh',
      render: (row) => getBranchName(row),
    },
    {
      key: 'cashAmount',
      title: 'Tiền mặt',
      render: (row) => formatCurrency(row.cashAmount),
    },
    {
      key: 'transferAmount',
      title: 'Chuyển khoản',
      render: (row) => formatCurrency(row.transferAmount),
    },
    {
      key: 'otherAmount',
      title: 'Khác',
      render: (row) => formatCurrency(row.otherAmount),
    },
    {
      key: 'amount',
      title: 'Tổng doanh thu',
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {formatCurrency(row.amount ?? (Number(row.cashAmount || 0) + Number(row.transferAmount || 0) + Number(row.otherAmount || 0)))}
        </span>
      ),
    },
    {
      key: 'orderCount',
      title: 'Số đơn',
      render: (row) => formatNumber(row.orderCount),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {getRevenueStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'note',
      title: 'Ghi chú',
      render: (row) => (
        <span className="text-slate-500 text-xs max-w-[160px] truncate block" title={row.note || ''}>
          {row.note || '—'}
        </span>
      ),
    },
    ...(showActions ? [{
      key: 'actions',
      title: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-1">
          {canEditRevenue(user, row) && (
            <Button size="sm" variant="ghost" onClick={() => openEdit(row)} title="Sửa">
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canConfirm && row.status !== 'confirmed' && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmDialog(row)} title="Xác nhận">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant="ghost" onClick={() => setDeleteDialog(row)} title="Xóa">
              <Trash2 className="w-4 h-4 text-rose-600" />
            </Button>
          )}
        </div>
      ),
    }] : []),
  ];

  const branchOptions = user?.role === ROLES.BRANCH_MANAGER
    ? branches.filter((b) => String(getEntityId(b)) === String(getUserBranchId(user)))
    : branches;

  return (
    <div className="space-y-5">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nhập doanh thu
          </Button>
        </div>
      )}

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
          {user?.role !== ROLES.BRANCH_MANAGER ? (
            <Select
              label="Chi nhánh"
              value={filters.branchId}
              onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
              options={branchOptions.map((b) => ({ value: getEntityId(b), label: b.name }))}
              placeholder="Tất cả"
            />
          ) : (
            branchOptions.length > 0 && (
              <Select
                label="Chi nhánh"
                value={getUserBranchId(user) || ''}
                onChange={() => {}}
                options={branchOptions.map((b) => ({ value: getEntityId(b), label: b.name }))}
                placeholder=""
                disabled
              />
            )
          )}
          <Select
            label="Trạng thái"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'draft', label: 'Nháp' },
              { value: 'submitted', label: 'Đã gửi' },
              { value: 'confirmed', label: 'Đã xác nhận' },
            ]}
            placeholder="Tất cả"
          />
        </div>
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={refreshRevenueData}>
            <Filter className="w-4 h-4" />
            Áp dụng bộ lọc
          </Button>
        </div>
      </Card>

      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Tổng doanh thu"
            value={formatCurrency(summary.totalRevenue)}
            icon={Wallet}
            color="brand"
            subtitle={`Tháng ${filters.month}/${filters.year}`}
          />
          <StatCard
            label="Tiền mặt"
            value={formatCurrency(summary.totalCash)}
            icon={Banknote}
            color="green"
            subtitle="Thu từ tiền mặt"
          />
          <StatCard
            label="Chuyển khoản"
            value={formatCurrency(summary.totalTransfer)}
            icon={CreditCard}
            color="blue"
            subtitle="Thu qua chuyển khoản"
          />
          <StatCard
            label="Khác"
            value={formatCurrency(summary.totalOther)}
            icon={Coins}
            color="amber"
            subtitle="Kênh thu khác"
          />
          <StatCard
            label="Tổng đơn"
            value={formatNumber(summary.totalOrders)}
            icon={ShoppingBag}
            color="slate"
            subtitle={`${summary.daysCount || 0} ngày có dữ liệu`}
          />
          <StatCard
            label="Trung bình / ngày"
            value={formatCurrency(summary.averageDailyRevenue)}
            icon={TrendingUp}
            color="brand"
            subtitle="Doanh thu trung bình mỗi ngày"
          />
        </div>
      )}

      <Card
        title="Danh sách doanh thu"
        subtitle={`${revenues.length} bản ghi · Tháng ${filters.month}/${filters.year}`}
      >
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={refreshRevenueData} />
        ) : revenues.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu doanh thu"
            description="Thử thay đổi bộ lọc hoặc nhập doanh thu mới cho chi nhánh."
          />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <Table columns={columns} data={revenues} />
          </div>
        )}
      </Card>

      {modalOpen && (
        <Modal
          open={modalOpen}
          onClose={closeModal}
          title={editing ? 'Cập nhật doanh thu' : 'Nhập doanh thu ngày'}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={closeModal} disabled={submitting}>Hủy</Button>
              <Button onClick={handleSubmit} loading={submitting}>Lưu</Button>
            </>
          }
        >
          <div className="space-y-5">
            <Input
              label="Ngày"
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm({ ...form, date: e.target.value });
                if (formErrors.date) setFormErrors({ ...formErrors, date: '' });
              }}
              error={formErrors.date}
              required
            />

            {user?.role === ROLES.ADMIN && (
              <Select
                label="Chi nhánh"
                value={form.branchId}
                onChange={(e) => {
                  setForm({ ...form, branchId: e.target.value });
                  if (formErrors.branchId) setFormErrors({ ...formErrors, branchId: '' });
                }}
                options={branches.map((b) => ({ value: getEntityId(b), label: b.name }))}
                placeholder="Chọn chi nhánh"
                error={formErrors.branchId}
                required
              />
            )}

            <div>
              <p className="text-xs font-semibold text-slate-600 mb-3">Phân loại doanh thu</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Tiền mặt"
                  type="number"
                  min="0"
                  value={form.cashAmount}
                  onChange={(e) => setForm({ ...form, cashAmount: e.target.value })}
                  error={formErrors.cashAmount}
                  placeholder="0"
                />
                <Input
                  label="Chuyển khoản"
                  type="number"
                  min="0"
                  value={form.transferAmount}
                  onChange={(e) => setForm({ ...form, transferAmount: e.target.value })}
                  error={formErrors.transferAmount}
                  placeholder="0"
                />
                <Input
                  label="Khác"
                  type="number"
                  min="0"
                  value={form.otherAmount}
                  onChange={(e) => setForm({ ...form, otherAmount: e.target.value })}
                  error={formErrors.otherAmount}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Tổng tạm tính</span>
              <span className="text-lg font-bold text-brand-700">{formatCurrency(computedTotal)}</span>
            </div>

            <Input
              label="Số đơn"
              type="number"
              min="0"
              value={form.orderCount}
              onChange={(e) => setForm({ ...form, orderCount: e.target.value })}
              error={formErrors.orderCount}
              placeholder="0"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Ghi chú</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Ghi chú bổ sung (tuỳ chọn)"
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Xóa doanh thu"
        message="Bạn có chắc muốn xóa bản ghi doanh thu này? Thao tác không thể hoàn tác."
        confirmText="Xóa"
        variant="danger"
        loading={submitting}
      />

      <ConfirmDialog
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={handleConfirm}
        title="Xác nhận doanh thu"
        message="Xác nhận doanh thu này? Sau khi xác nhận, quản lý chi nhánh sẽ không thể chỉnh sửa."
        confirmText="Xác nhận"
        variant="primary"
        loading={submitting}
      />
    </div>
  );
}
