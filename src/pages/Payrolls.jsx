import { useEffect, useState, useMemo } from 'react';
import {
  Calculator,
  Eye,
  CheckCircle2,
  Banknote,
  Trash2,
  Edit,
  Filter,
  Plus,
  Wallet,
  PiggyBank,
  MinusCircle,
  Gift,
  Users,
  FileCheck,
  CircleDollarSign,
  MessageSquare,
  SlidersHorizontal,
  Clock,
  CalendarDays,
  RotateCcw,
  AlertCircle,
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
import Badge, {
  getPayrollStatusLabel,
  getPayrollStatusBadgeVariant,
  getAdjustmentTypeLabel,
} from '../components/Badge';
import payrollService from '../services/payrollService';
import payrollAdjustmentService from '../services/payrollAdjustmentService';
import branchService from '../services/branchService';
import employeeService from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  canManagePayroll,
  canManagePayrollAdjustments,
  filterByBranch,
  getUserBranchId,
  ROLES,
} from '../utils/rolePermissions';
import { formatDate, getCurrentMonthYear } from '../utils/formatDate';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { getApiMessage } from '../utils/parseApiData';
import { getEntityId, getBranchId, getEmployeeProfileId, hasValidId, devLog } from '../utils/getEntityId';

const defaultSummary = {
  totalBaseSalary: 0,
  totalPayable: 0,
  totalHeld: 0,
  totalDeductions: 0,
  totalBonus: 0,
  totalEmployees: 0,
  confirmedCount: 0,
  paidCount: 0,
  draftCount: 0,
};

const CALCULATE_SCOPE = {
  ALL: 'all',
  BRANCH: 'branch',
  EMPLOYEE: 'employee',
};

const emptyCalculateForm = {
  month: '',
  year: '',
  scope: CALCULATE_SCOPE.ALL,
  branchId: '',
  employeeId: '',
  filterBranchId: '',
  recalculate: false,
};

const emptyAdjustmentForm = {
  employeeId: '',
  month: '',
  year: '',
  type: '',
  amount: '',
  reason: '',
  note: '',
};

const ADJUSTMENT_TYPES = [
  { value: 'penalty', label: 'Phạt' },
  { value: 'fixed_deduction', label: 'Khoản trừ cố định' },
  { value: 'other_deduction', label: 'Khấu trừ khác' },
  { value: 'bonus', label: 'Thưởng' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Nháp' },
  { value: 'confirmed', label: 'Đã chốt' },
  { value: 'paid', label: 'Đã thanh toán' },
];

function buildCalculatePayload(form) {
  const payload = {
    month: Number(form.month),
    year: Number(form.year),
    recalculate: Boolean(form.recalculate),
  };
  if (form.scope === CALCULATE_SCOPE.BRANCH && form.branchId) {
    payload.branchId = form.branchId;
  } else if (form.scope === CALCULATE_SCOPE.EMPLOYEE && form.employeeId) {
    payload.employeeId = form.employeeId;
  }
  return payload;
}

function buildRecalculatePayload(filters) {
  const payload = {
    month: Number(filters.month),
    year: Number(filters.year),
    recalculate: true,
  };
  if (filters.employeeId) {
    payload.employeeId = filters.employeeId;
  } else if (filters.branchId) {
    payload.branchId = filters.branchId;
  }
  return payload;
}

function resolveAdjustmentEmployeeId(row) {
  const emp = row?.employee || row?.employeeId;
  if (typeof emp === 'string' && emp.trim()) return emp;
  return getEmployeeProfileId(emp);
}

function getPayrollEmployeeId(row) {
  return resolveAdjustmentEmployeeId(row);
}

function getEmployeeHourlyRate(emp) {
  return emp?.hourlyRate ?? emp?.salaryPerHour ?? 0;
}

function buildAdjustmentPayload(form) {
  const payload = {
    employeeId: String(form.employeeId).trim(),
    month: Number(form.month),
    year: Number(form.year),
    type: form.type,
    amount: Number(form.amount),
    reason: form.reason.trim(),
  };
  if (form.note?.trim()) payload.note = form.note.trim();
  return payload;
}

function getEmployeeName(row) {
  const emp = row.employee || row.employeeId;
  if (typeof emp === 'object' && emp) {
    return emp.fullName || emp.name || '—';
  }
  return row.employeeName || row.fullName || '—';
}

function getEmployeeCode(row) {
  const emp = row.employee || row.employeeId;
  if (typeof emp === 'object' && emp) {
    return emp.employeeCode || emp.code || '—';
  }
  return row.employeeCode || row.code || '—';
}

function getPosition(row) {
  const emp = row.employee || row.employeeId;
  if (typeof emp === 'object' && emp) {
    return emp.position || emp.jobTitle || '—';
  }
  return row.position || row.jobTitle || '—';
}

function getPayable(row) {
  return row.netPay ?? row.payable ?? row.totalPayable ?? row.actualPay ?? 0;
}

function PayslipRow({ label, value, highlight = false, negative = false }) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 ${highlight ? 'bg-brand-50/50 -mx-4 px-4 rounded-lg border-0 mt-1' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-sm font-medium tabular-nums ${highlight ? 'text-lg font-bold text-brand-700' : negative ? 'text-rose-600' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}

function PayslipSection({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        {Icon && <Icon className="w-4 h-4 text-brand-600" />}
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{title}</h4>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

export default function Payrolls() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = canManagePayroll(user?.role);
  const canAdjust = canManagePayrollAdjustments(user?.role);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  const [activeTab, setActiveTab] = useState('payrolls');
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState('');
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
    branchId: user?.role === ROLES.BRANCH_MANAGER ? getUserBranchId(user) || '' : '',
    status: '',
    employeeId: '',
  });

  const [calculateOpen, setCalculateOpen] = useState(false);
  const [calculateForm, setCalculateForm] = useState(emptyCalculateForm);
  const [calculateErrors, setCalculateErrors] = useState({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailAdjustments, setDetailAdjustments] = useState([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ id: '', note: '' });
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [payDialog, setPayDialog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [adjLoading, setAdjLoading] = useState(true);
  const [adjError, setAdjError] = useState('');
  const [adjustments, setAdjustments] = useState([]);
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjModalBranchFilter, setAdjModalBranchFilter] = useState('');
  const [editingAdj, setEditingAdj] = useState(null);
  const [adjForm, setAdjForm] = useState(emptyAdjustmentForm);
  const [adjFormErrors, setAdjFormErrors] = useState({});
  const [deleteAdjDialog, setDeleteAdjDialog] = useState(null);
  const [recalculatePromptOpen, setRecalculatePromptOpen] = useState(false);
  const [pendingRecalculatePayload, setPendingRecalculatePayload] = useState(null);
  const [showPendingRecalculateBanner, setShowPendingRecalculateBanner] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const branchOptions = useMemo(() => {
    if (user?.role === ROLES.BRANCH_MANAGER) {
      const branchId = getUserBranchId(user);
      return branches.filter((b) => String(getEntityId(b)) === String(branchId));
    }
    return branches;
  }, [branches, user]);

  const getEmployeeBranchName = (emp) => {
    const branch = emp?.branch || emp?.branchId;
    if (typeof branch === 'object' && branch?.name) return branch.name;
    const id = getBranchId(emp);
    return branches.find((b) => String(getEntityId(b)) === String(id))?.name || '—';
  };

  const employeeOptionsForFilter = useMemo(() => {
    let list = employees;
    if (user?.role === ROLES.BRANCH_MANAGER) {
      list = filterByBranch(list, user);
    }
    if (filters.branchId) {
      list = list.filter((e) => String(getBranchId(e)) === String(filters.branchId));
    }
    return list;
  }, [employees, user, filters.branchId]);

  const employeeOptionsForAdjModal = useMemo(() => {
    let list = employees;
    if (user?.role === ROLES.BRANCH_MANAGER) {
      list = filterByBranch(list, user);
    }
    if (adjModalBranchFilter) {
      list = list.filter((e) => String(getBranchId(e)) === String(adjModalBranchFilter));
    }
    return list;
  }, [employees, user, adjModalBranchFilter]);

  const employeeOptionsForCalculate = useMemo(() => {
    let list = employees;
    if (calculateForm.filterBranchId) {
      list = list.filter((e) => String(getBranchId(e)) === String(calculateForm.filterBranchId));
    }
    return list;
  }, [employees, calculateForm.filterBranchId]);

  const employeeSelectOptions = (list, { includeHourlyRate = false } = {}) =>
    list.map((e) => {
      const id = getEmployeeProfileId(e);
      const name = e.fullName || e.name || getEmployeeCode(e);
      const branch = getEmployeeBranchName(e);
      const label = includeHourlyRate
        ? `${name} · ${branch} · ${formatCurrency(getEmployeeHourlyRate(e))}/giờ`
        : `${name} · ${branch}`;
      return { value: id, label };
    }).filter((opt) => hasValidId(opt.value));

  const getBranchName = (row) => {
    const branch = row.branch || row.branchId;
    if (typeof branch === 'object' && branch?.name) return branch.name;
    const id = getBranchId(row);
    return branches.find((b) => String(getEntityId(b)) === String(id))?.name || '—';
  };

  const fetchBranches = async () => {
    try {
      const list = await branchService.getAll();
      setBranches(list);
    } catch {
      /* silent */
    }
  };

  const fetchEmployees = async () => {
    try {
      let list = await employeeService.getAll();
      if (user?.role === ROLES.BRANCH_MANAGER) {
        list = filterByBranch(list, user);
      }
      setEmployees(list);
    } catch {
      /* silent */
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const params = { month: filters.month, year: filters.year };
      if (filters.branchId) params.branchId = filters.branchId;
      const data = await payrollService.getMonthlyPayrollSummary(params);
      setSummary({ ...defaultSummary, ...(data || {}) });
    } catch (err) {
      if (err?.response?.status === 403) {
        showToast(getApiMessage(err), 'error');
      }
      setSummary(defaultSummary);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { month: filters.month, year: filters.year };
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.status) params.status = filters.status;

      let list = await payrollService.getPayrolls(params);
      if (user?.role === ROLES.BRANCH_MANAGER) {
        list = filterByBranch(list, user);
      }
      if (filters.employeeId) {
        list = list.filter((row) => String(getPayrollEmployeeId(row)) === String(filters.employeeId));
      }
      setPayrolls(list);
    } catch (err) {
      if (err?.response?.status === 403) {
        showToast(getApiMessage(err), 'error');
        setPayrolls([]);
      } else {
        setError(getApiMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustments = async () => {
    setAdjLoading(true);
    setAdjError('');
    try {
      const params = { month: filters.month, year: filters.year };
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.employeeId) params.employeeId = filters.employeeId;

      let list = await payrollAdjustmentService.getAdjustments(params);
      if (user?.role === ROLES.BRANCH_MANAGER) {
        list = filterByBranch(list, user, 'employee');
      }
      setAdjustments(list);
    } catch (err) {
      if (err?.response?.status === 403) {
        showToast(getApiMessage(err), 'error');
        setAdjustments([]);
      } else {
        setAdjError(getApiMessage(err));
      }
    } finally {
      setAdjLoading(false);
    }
  };

  const refreshPayrollData = async () => {
    await Promise.all([fetchPayrolls(), fetchSummary()]);
  };

  const handleRecalculatePayroll = async (overridePayload = null) => {
    if (!isAdmin) return;
    setRecalculating(true);
    try {
      const payload = overridePayload || pendingRecalculatePayload || buildRecalculatePayload(filters);
      devLog('Recalculate payroll payload:', payload);
      await payrollService.calculatePayroll(payload);
      showToast('Đã tính lại bảng lương', 'success');
      setShowPendingRecalculateBanner(false);
      setRecalculatePromptOpen(false);
      setPendingRecalculatePayload(null);
      await refreshPayrollData();
      await fetchAdjustments();
    } catch (err) {
      devLog('Recalculate payroll error:', err?.response?.data || err);
      showToast(getApiMessage(err), 'error');
    } finally {
      setRecalculating(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchPayrolls();
    fetchSummary();
  }, [filters.month, filters.year, filters.branchId, filters.status, filters.employeeId, user]);

  useEffect(() => {
    if (activeTab === 'adjustments') {
      fetchAdjustments();
    }
  }, [activeTab, filters.month, filters.year, filters.branchId, filters.employeeId, user]);

  const openCalculate = () => {
    setCalculateForm({
      ...emptyCalculateForm,
      month: filters.month,
      year: filters.year,
      scope: CALCULATE_SCOPE.ALL,
    });
    setCalculateErrors({});
    setCalculateOpen(true);
  };

  const validateCalculate = () => {
    const errors = {};
    if (!calculateForm.month) errors.month = 'Vui lòng chọn tháng';
    if (!calculateForm.year) errors.year = 'Vui lòng chọn năm';
    if (calculateForm.scope === CALCULATE_SCOPE.BRANCH && !calculateForm.branchId) {
      errors.branchId = 'Vui lòng chọn chi nhánh';
    }
    if (calculateForm.scope === CALCULATE_SCOPE.EMPLOYEE && !calculateForm.employeeId) {
      errors.employeeId = 'Vui lòng chọn nhân viên';
    }
    setCalculateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCalculate = async () => {
    if (!validateCalculate()) return;
    setSubmitting(true);
    try {
      const payload = buildCalculatePayload(calculateForm);
      devLog('Calculate payroll payload:', payload);
      await payrollService.calculatePayroll(payload);
      showToast('Tính lương thành công', 'success');
      setCalculateOpen(false);
      await refreshPayrollData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (row) => {
    const id = getEntityId(row);
    if (!hasValidId(id)) {
      showToast('Không tìm thấy ID bảng lương', 'error');
      return;
    }
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await payrollService.getPayrollById(id);
      setDetailData(data);
    } catch (err) {
      showToast(getApiMessage(err), 'error');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openNoteEdit = (row) => {
    setNoteForm({ id: getEntityId(row), note: row.note || '' });
    setNoteOpen(true);
  };

  const handleNoteSave = async () => {
    if (!hasValidId(noteForm.id)) return;
    setSubmitting(true);
    try {
      await payrollService.updatePayroll(noteForm.id, { note: noteForm.note.trim() });
      showToast('Cập nhật ghi chú thành công', 'success');
      setNoteOpen(false);
      await refreshPayrollData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    const id = getEntityId(confirmDialog);
    setSubmitting(true);
    try {
      await payrollService.confirmPayroll(id);
      showToast('Chốt lương thành công', 'success');
      setConfirmDialog(null);
      await refreshPayrollData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!payDialog) return;
    const id = getEntityId(payDialog);
    setSubmitting(true);
    try {
      await payrollService.payPayroll(id, {});
      showToast('Đánh dấu đã thanh toán thành công', 'success');
      setPayDialog(null);
      await refreshPayrollData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const id = getEntityId(deleteDialog);
    setSubmitting(true);
    try {
      await payrollService.deletePayroll(id);
      showToast('Xóa bảng lương thành công', 'success');
      setDeleteDialog(null);
      await refreshPayrollData();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateAdj = () => {
    setEditingAdj(null);
    setAdjModalBranchFilter(filters.branchId || '');
    setAdjForm({
      ...emptyAdjustmentForm,
      month: filters.month,
      year: filters.year,
    });
    setAdjFormErrors({});
    setAdjModalOpen(true);
  };

  const openEditAdj = (row) => {
    setEditingAdj(row);
    const empId = resolveAdjustmentEmployeeId(row);
    setAdjModalBranchFilter('');
    setAdjForm({
      employeeId: empId,
      month: row.month ?? filters.month,
      year: row.year ?? filters.year,
      type: row.type || '',
      amount: row.amount ?? '',
      reason: row.reason || '',
      note: row.note || '',
    });
    setAdjFormErrors({});
    setAdjModalOpen(true);
  };

  const validateAdjForm = () => {
    const errors = {};
    if (!adjForm.employeeId || !hasValidId(String(adjForm.employeeId))) {
      errors.employeeId = 'Vui lòng chọn nhân viên';
      showToast('Vui lòng chọn nhân viên', 'error');
    }
    if (!adjForm.month) errors.month = 'Vui lòng chọn tháng';
    if (!adjForm.year) errors.year = 'Vui lòng chọn năm';
    if (!adjForm.type) errors.type = 'Vui lòng chọn loại điều chỉnh';
    if (adjForm.amount === '' || Number.isNaN(Number(adjForm.amount))) {
      errors.amount = 'Số tiền phải là số hợp lệ';
    } else if (Number(adjForm.amount) < 0) {
      errors.amount = 'Số tiền không được âm';
    }
    if (!adjForm.reason?.trim()) {
      errors.reason = 'Lý do là bắt buộc';
      showToast('Vui lòng nhập lý do điều chỉnh', 'error');
    }
    setAdjFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdjSubmit = async () => {
    if (!validateAdjForm()) return;
    setSubmitting(true);
    try {
      const payload = buildAdjustmentPayload(adjForm);
      const selectedEmployee = employees.find(
        (e) => String(getEmployeeProfileId(e)) === String(adjForm.employeeId),
      );
      devLog('Create adjustment payload:', payload);
      devLog('Selected employee:', selectedEmployee);

      const recalcPayload = buildRecalculatePayload(filters);

      if (editingAdj) {
        const id = getEntityId(editingAdj);
        await payrollAdjustmentService.updateAdjustment(id, payload);
        showToast('Cập nhật điều chỉnh lương thành công', 'success');
        setPendingRecalculatePayload(recalcPayload);
        setShowPendingRecalculateBanner(true);
      } else {
        await payrollAdjustmentService.createAdjustment(payload);
        showToast('Thêm điều chỉnh lương thành công', 'success');
        setPendingRecalculatePayload(recalcPayload);
        setShowPendingRecalculateBanner(true);
        setRecalculatePromptOpen(true);
      }
      setAdjModalOpen(false);
      await fetchAdjustments();
    } catch (err) {
      devLog('Adjustment API error:', err?.response?.data || err);
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdj = async () => {
    if (!deleteAdjDialog) return;
    const id = getEntityId(deleteAdjDialog);
    setSubmitting(true);
    try {
      await payrollAdjustmentService.deleteAdjustment(id);
      showToast('Xóa điều chỉnh lương thành công', 'success');
      setDeleteAdjDialog(null);
      await fetchAdjustments();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const payrollColumns = [
    {
      key: 'employee',
      title: 'Nhân viên',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{getEmployeeName(row)}</div>
          <div className="text-[11px] text-slate-400">{getEmployeeCode(row)}</div>
        </div>
      ),
    },
    {
      key: 'branch',
      title: 'Chi nhánh',
      render: (row) => getBranchName(row),
    },
    {
      key: 'position',
      title: 'Chức vụ',
      render: (row) => getPosition(row),
    },
    {
      key: 'totalHours',
      title: 'Tổng giờ',
      render: (row) => formatNumber(row.totalHours ?? row.workHours ?? 0),
    },
    {
      key: 'workDays',
      title: 'Ngày làm',
      render: (row) => formatNumber(row.workDays ?? row.totalWorkDays ?? 0),
    },
    {
      key: 'baseSalary',
      title: 'Lương cơ bản',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.baseSalary ?? 0)}</span>,
    },
    {
      key: 'heldThisMonth',
      title: 'Giữ tháng này',
      render: (row) => <span className="tabular-nums text-slate-500">{formatCurrency(row.heldThisMonth ?? row.holdThisMonth ?? 0)}</span>,
    },
    {
      key: 'heldFromPrevious',
      title: 'Giữ từ tháng trước',
      render: (row) => <span className="tabular-nums text-slate-500">{formatCurrency(row.heldFromPrevious ?? row.holdFromPrevious ?? 0)}</span>,
    },
    {
      key: 'deductions',
      title: 'Khấu trừ',
      render: (row) => <span className="tabular-nums text-rose-600">{formatCurrency(row.totalDeductions ?? row.deductions ?? 0)}</span>,
    },
    {
      key: 'bonus',
      title: 'Thưởng',
      render: (row) => <span className="tabular-nums text-emerald-600">{formatCurrency(row.bonus ?? row.totalBonus ?? 0)}</span>,
    },
    {
      key: 'payable',
      title: 'Thực trả',
      render: (row) => (
        <span className="tabular-nums font-bold text-brand-700">{formatCurrency(getPayable(row))}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <Badge variant={getPayrollStatusBadgeVariant(row.status)}>
          {getPayrollStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openDetail(row)} title="Xem chi tiết">
            <Eye className="w-4 h-4" />
          </Button>
          {isAdmin && row.status === 'draft' && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmDialog(row)} title="Chốt lương">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </Button>
          )}
          {isAdmin && row.status === 'confirmed' && (
            <Button size="sm" variant="ghost" onClick={() => setPayDialog(row)} title="Đánh dấu đã thanh toán">
              <Banknote className="w-4 h-4 text-brand-600" />
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" variant="ghost" onClick={() => openNoteEdit(row)} title="Sửa ghi chú">
              <MessageSquare className="w-4 h-4 text-slate-500" />
            </Button>
          )}
          {isAdmin && row.status === 'draft' && (
            <Button size="sm" variant="ghost" onClick={() => setDeleteDialog(row)} title="Xóa">
              <Trash2 className="w-4 h-4 text-rose-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const adjustmentColumns = [
    {
      key: 'employee',
      title: 'Nhân viên',
      render: (row) => getEmployeeName(row),
    },
    {
      key: 'branch',
      title: 'Chi nhánh',
      render: (row) => getBranchName(row),
    },
    {
      key: 'period',
      title: 'Kỳ lương',
      render: (row) => `${row.month}/${row.year}`,
    },
    {
      key: 'type',
      title: 'Loại',
      render: (row) => (
        <Badge variant={row.type === 'bonus' ? 'success' : row.type === 'penalty' ? 'danger' : 'warning'}>
          {getAdjustmentTypeLabel(row.type)}
        </Badge>
      ),
    },
    {
      key: 'amount',
      title: 'Số tiền',
      render: (row) => (
        <span className={`tabular-nums font-medium ${row.type === 'bonus' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'reason',
      title: 'Lý do',
      render: (row) => (
        <span className="text-slate-600 text-xs max-w-[180px] truncate block" title={row.reason}>
          {row.reason || '—'}
        </span>
      ),
    },
    {
      key: 'note',
      title: 'Ghi chú',
      render: (row) => (
        <span className="text-slate-400 text-xs max-w-[120px] truncate block" title={row.note}>
          {row.note || '—'}
        </span>
      ),
    },
    {
      key: 'createdBy',
      title: 'Người tạo',
      render: (row) => {
        const creator = row.createdBy || row.createdByUser;
        if (typeof creator === 'object' && creator) {
          return creator.fullName || creator.name || creator.email || '—';
        }
        return row.createdByName || '—';
      },
    },
    ...(canAdjust ? [{
      key: 'actions',
      title: 'Thao tác',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEditAdj(row)} title="Sửa">
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteAdjDialog(row)} title="Xóa">
            <Trash2 className="w-4 h-4 text-rose-600" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  const d = detailData;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveTab('payrolls')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'payrolls'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-brand-600 hover:bg-brand-50/50'
            }`}
          >
            Bảng lương
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjustments')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'adjustments'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-brand-600 hover:bg-brand-50/50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Điều chỉnh lương
          </button>
        </div>

        {isAdmin && activeTab === 'payrolls' && (
          <Button onClick={openCalculate}>
            <Calculator className="w-4 h-4" />
            Tính lương
          </Button>
        )}
        {activeTab === 'adjustments' && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleRecalculatePayroll()}
                loading={recalculating}
              >
                <RotateCcw className="w-4 h-4" />
                Tính lương lại
              </Button>
            )}
            {canAdjust && (
              <Button onClick={openCreateAdj}>
                <Plus className="w-4 h-4" />
                Thêm điều chỉnh
              </Button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'payrolls' && (
        <>
          <Card title="Bộ lọc" subtitle="Lọc theo tháng, chi nhánh, nhân viên, trạng thái">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  onChange={(e) => setFilters({ ...filters, branchId: e.target.value, employeeId: '' })}
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
                label="Nhân viên"
                value={filters.employeeId}
                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                options={employeeSelectOptions(employeeOptionsForFilter)}
                placeholder="Tất cả"
              />
              <Select
                label="Trạng thái"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                options={STATUS_OPTIONS}
                placeholder="Tất cả"
              />
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={refreshPayrollData}>
                <Filter className="w-4 h-4" />
                Áp dụng bộ lọc
              </Button>
            </div>
          </Card>

          {summaryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Tổng lương cơ bản"
                value={formatCurrency(summary.totalBaseSalary)}
                icon={Wallet}
                color="brand"
                subtitle={`Tháng ${filters.month}/${filters.year}`}
              />
              <StatCard
                label="Tổng thực trả"
                value={formatCurrency(summary.totalPayable)}
                icon={CircleDollarSign}
                color="green"
                subtitle="Số tiền thanh toán thực tế"
              />
              <StatCard
                label="Tổng giữ lại"
                value={formatCurrency(summary.totalHeld)}
                icon={PiggyBank}
                color="amber"
                subtitle="Giữ lại từ lương"
              />
              <StatCard
                label="Tổng khấu trừ"
                value={formatCurrency(summary.totalDeductions)}
                icon={MinusCircle}
                color="rose"
                subtitle="Phạt & khấu trừ"
              />
              <StatCard
                label="Tổng thưởng"
                value={formatCurrency(summary.totalBonus)}
                icon={Gift}
                color="green"
                subtitle="Thưởng trong kỳ"
              />
              <StatCard
                label="Số nhân viên"
                value={formatNumber(summary.totalEmployees)}
                icon={Users}
                color="blue"
                subtitle="Có bảng lương trong kỳ"
              />
              <StatCard
                label="Đã chốt"
                value={formatNumber(summary.confirmedCount)}
                icon={FileCheck}
                color="brand"
                subtitle={`${summary.draftCount || 0} nháp · ${summary.paidCount || 0} đã trả`}
              />
              <StatCard
                label="Đã thanh toán"
                value={formatNumber(summary.paidCount)}
                icon={Banknote}
                color="green"
                subtitle="Bảng lương đã trả"
              />
            </div>
          )}

          <Card
            title="Danh sách bảng lương"
            subtitle={`${payrolls.length} bản ghi · Tháng ${filters.month}/${filters.year}`}
          >
            {loading ? (
              <Loading />
            ) : error ? (
              <ErrorState message={error} onRetry={refreshPayrollData} />
            ) : payrolls.length === 0 ? (
              <EmptyState
                title="Chưa có bảng lương"
                description={isAdmin ? 'Bấm "Tính lương" để tạo bảng lương cho kỳ này.' : 'Chưa có dữ liệu bảng lương cho bộ lọc hiện tại.'}
              />
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <Table columns={payrollColumns} data={payrolls} />
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'adjustments' && (
        <>
          {isAdmin && showPendingRecalculateBanner && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  Có điều chỉnh lương mới chưa được áp dụng vào bảng lương.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleRecalculatePayroll()}
                loading={recalculating}
                className="shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Tính lương lại ngay
              </Button>
            </div>
          )}

          <Card title="Bộ lọc" subtitle={`Dùng chung kỳ lương với tab Bảng lương · Tháng ${filters.month}/${filters.year}`}>
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
                  onChange={(e) => setFilters({ ...filters, branchId: e.target.value, employeeId: '' })}
                  options={branchOptions.map((b) => ({ value: getEntityId(b), label: b.name }))}
                  placeholder="Tất cả"
                />
              ) : null}
              <Select
                label="Nhân viên"
                value={filters.employeeId}
                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                options={employeeSelectOptions(employeeOptionsForFilter)}
                placeholder="Tất cả"
              />
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={fetchAdjustments}>
                <Filter className="w-4 h-4" />
                Áp dụng bộ lọc
              </Button>
            </div>
          </Card>

          <Card
            title="Danh sách điều chỉnh lương"
            subtitle={`${adjustments.length} bản ghi · Tháng ${filters.month}/${filters.year}`}
          >
            {adjLoading ? (
              <Loading />
            ) : adjError ? (
              <ErrorState message={adjError} onRetry={fetchAdjustments} />
            ) : adjustments.length === 0 ? (
              <EmptyState
                title="Chưa có điều chỉnh lương"
                description={canAdjust ? 'Thêm điều chỉnh phạt, thưởng hoặc khấu trừ cho nhân viên.' : 'Chưa có dữ liệu điều chỉnh cho bộ lọc hiện tại.'}
              />
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <Table columns={adjustmentColumns} data={adjustments} />
              </div>
            )}
          </Card>
        </>
      )}

      {calculateOpen && (
        <Modal
          open={calculateOpen}
          onClose={() => setCalculateOpen(false)}
          title="Tính lương"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCalculateOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={handleCalculate} loading={submitting}>
                <Calculator className="w-4 h-4" />
                Tính lương
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed rounded-xl bg-brand-50/60 border border-brand-100 px-4 py-3">
              Bạn chỉ cần chọn tháng/năm để tính toàn bộ nhân viên. Chi nhánh và nhân viên chỉ cần khi muốn giới hạn phạm vi.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tháng"
                value={calculateForm.month}
                onChange={(e) => {
                  setCalculateForm({ ...calculateForm, month: Number(e.target.value) });
                  if (calculateErrors.month) setCalculateErrors({ ...calculateErrors, month: '' });
                }}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i + 1,
                  label: `Tháng ${i + 1}`,
                }))}
                error={calculateErrors.month}
                required
              />
              <Select
                label="Năm"
                value={calculateForm.year}
                onChange={(e) => {
                  setCalculateForm({ ...calculateForm, year: Number(e.target.value) });
                  if (calculateErrors.year) setCalculateErrors({ ...calculateErrors, year: '' });
                }}
                options={[
                  { value: currentYear - 1, label: String(currentYear - 1) },
                  { value: currentYear, label: String(currentYear) },
                  { value: currentYear + 1, label: String(currentYear + 1) },
                ]}
                error={calculateErrors.year}
                required
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Phạm vi tính lương</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: CALCULATE_SCOPE.ALL, label: 'Tất cả nhân viên', hint: 'Tính lương cho toàn bộ nhân viên trong hệ thống' },
                  { value: CALCULATE_SCOPE.BRANCH, label: 'Theo chi nhánh', hint: 'Chỉ tính cho nhân viên thuộc một chi nhánh' },
                  { value: CALCULATE_SCOPE.EMPLOYEE, label: 'Theo một nhân viên', hint: 'Tính cho một nhân viên cụ thể' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      calculateForm.scope === opt.value
                        ? 'border-brand-500 bg-brand-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="calculateScope"
                      value={opt.value}
                      checked={calculateForm.scope === opt.value}
                      onChange={() => {
                        setCalculateForm({
                          ...calculateForm,
                          scope: opt.value,
                          branchId: '',
                          employeeId: '',
                          filterBranchId: '',
                        });
                        setCalculateErrors({});
                      }}
                      className="mt-0.5 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{opt.label}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {calculateForm.scope === CALCULATE_SCOPE.BRANCH && (
              <Select
                label="Chi nhánh"
                value={calculateForm.branchId}
                onChange={(e) => {
                  setCalculateForm({ ...calculateForm, branchId: e.target.value });
                  if (calculateErrors.branchId) setCalculateErrors({ ...calculateErrors, branchId: '' });
                }}
                options={branches.map((b) => ({ value: getEntityId(b), label: b.name }))}
                placeholder="Chọn chi nhánh"
                error={calculateErrors.branchId}
                required
              />
            )}

            {calculateForm.scope === CALCULATE_SCOPE.EMPLOYEE && (
              <>
                <Select
                  label="Lọc theo chi nhánh (tuỳ chọn)"
                  value={calculateForm.filterBranchId}
                  onChange={(e) => {
                    setCalculateForm({
                      ...calculateForm,
                      filterBranchId: e.target.value,
                      employeeId: '',
                    });
                  }}
                  options={branches.map((b) => ({ value: getEntityId(b), label: b.name }))}
                  placeholder="Tất cả chi nhánh"
                />
                <p className="text-xs text-slate-500 -mt-2">Chỉ để thu hẹp danh sách nhân viên, không gửi lên server.</p>
                <Select
                  label="Nhân viên"
                  value={calculateForm.employeeId}
                  onChange={(e) => {
                    setCalculateForm({ ...calculateForm, employeeId: e.target.value });
                    if (calculateErrors.employeeId) setCalculateErrors({ ...calculateErrors, employeeId: '' });
                  }}
                  options={employeeSelectOptions(employeeOptionsForCalculate)}
                  placeholder="Chọn nhân viên"
                  error={calculateErrors.employeeId}
                  required
                />
                <p className="text-xs text-slate-500 -mt-2">
                  Hiển thị kèm chi nhánh để bạn không cần nhớ nhân viên thuộc đâu.
                </p>
              </>
            )}

            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={calculateForm.recalculate}
                onChange={(e) => setCalculateForm({ ...calculateForm, recalculate: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-600">Tính lại (ghi đè bảng lương nháp hiện có)</span>
            </label>
          </div>
        </Modal>
      )}

      {detailOpen && (
        <Modal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          title="Chi tiết bảng lương"
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setDetailOpen(false)}>Đóng</Button>
          }
        >
          {detailLoading ? (
            <Loading />
          ) : d ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-brand-100 text-xs font-medium uppercase tracking-wider">Phiếu lương</p>
                    <h3 className="text-xl font-bold mt-1">{getEmployeeName(d)}</h3>
                    <p className="text-brand-100 text-sm mt-0.5">{getEmployeeCode(d)} · {getBranchName(d)}</p>
                  </div>
                  <Badge variant={getPayrollStatusBadgeVariant(d.status)} className="!bg-white/20 !text-white">
                    {getPayrollStatusLabel(d.status)}
                  </Badge>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex items-end justify-between">
                  <div>
                    <p className="text-brand-100 text-xs">Thực trả</p>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(getPayable(d))}</p>
                  </div>
                  <p className="text-brand-100 text-sm">Kỳ {d.month}/{d.year}</p>
                </div>
              </div>

              <PayslipSection title="Thông tin nhân viên" icon={Users}>
                <PayslipRow label="Họ tên" value={getEmployeeName(d)} />
                <PayslipRow label="Mã nhân viên" value={getEmployeeCode(d)} />
                <PayslipRow label="Chi nhánh" value={getBranchName(d)} />
                <PayslipRow label="Chức vụ" value={getPosition(d)} />
                <PayslipRow label="Lương/giờ" value={formatCurrency(d.hourlyRate ?? d.salaryPerHour ?? 0)} />
                <PayslipRow label="Tháng/năm" value={`${d.month}/${d.year}`} />
              </PayslipSection>

              <PayslipSection title="Công" icon={Clock}>
                <PayslipRow label="Tổng giờ" value={formatNumber(d.totalHours ?? d.workHours ?? 0)} />
                <PayslipRow label="Ngày làm" value={formatNumber(d.workDays ?? d.totalWorkDays ?? 0)} />
                <PayslipRow label="Số ngày hoàn tất" value={formatNumber(d.completedDays ?? d.completedWorkDays ?? 0)} />
                <PayslipRow label="Số lần đi trễ" value={formatNumber(d.lateCount ?? d.lateTimes ?? 0)} />
                <PayslipRow label="Tổng phút đi trễ" value={formatNumber(d.totalLateMinutes ?? d.lateMinutes ?? 0)} />
                <PayslipRow label="Thiếu chấm ra" value={formatNumber(d.missingCheckOut ?? d.missingCheckOutCount ?? 0)} />
              </PayslipSection>

              {detailAdjustments.length > 0 && (
                <PayslipSection title="Điều chỉnh lương" icon={SlidersHorizontal}>
                  {detailAdjustments.map((adj) => (
                    <div
                      key={getEntityId(adj) || `${adj.type}-${adj.amount}-${adj.reason}`}
                      className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                    >
                      <div className="min-w-0 pr-3">
                        <Badge
                          variant={
                            adj.type === 'bonus'
                              ? 'success'
                              : adj.type === 'penalty'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {getAdjustmentTypeLabel(adj.type)}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1 truncate" title={adj.reason}>
                          {adj.reason || '—'}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold tabular-nums shrink-0 ${
                          adj.type === 'bonus' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(adj.amount)}
                      </span>
                    </div>
                  ))}
                </PayslipSection>
              )}

              <PayslipSection title="Lương" icon={Wallet}>
                <PayslipRow label="Lương cơ bản" value={formatCurrency(d.baseSalary ?? 0)} />
                <PayslipRow label="Giữ lại tháng này" value={formatCurrency(d.heldThisMonth ?? d.holdThisMonth ?? 0)} />
                <PayslipRow label="Giữ từ tháng trước" value={formatCurrency(d.heldFromPrevious ?? d.holdFromPrevious ?? 0)} />
                <PayslipRow label="Phạt" value={formatCurrency(d.penalty ?? 0)} negative />
                <PayslipRow label="Khấu trừ cố định" value={formatCurrency(d.fixedDeduction ?? 0)} negative />
                <PayslipRow label="Khấu trừ khác" value={formatCurrency(d.otherDeduction ?? 0)} negative />
                <PayslipRow label="Thưởng" value={formatCurrency(d.bonus ?? d.totalBonus ?? 0)} />
                <PayslipRow label="Tổng khấu trừ" value={formatCurrency(d.totalDeductions ?? d.deductions ?? 0)} negative />
                <PayslipRow label="Thực trả" value={formatCurrency(getPayable(d))} highlight />
              </PayslipSection>

              <PayslipSection title="Trạng thái" icon={CalendarDays}>
                <PayslipRow label="Trạng thái" value={getPayrollStatusLabel(d.status)} />
                <PayslipRow label="Ngày trả dự kiến" value={formatDate(d.expectedPayDate ?? d.scheduledPayDate)} />
                <PayslipRow label="Ngày đã trả" value={formatDate(d.paidDate ?? d.paidAt)} />
              </PayslipSection>

              {d.note && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ghi chú</p>
                  <p className="text-sm text-slate-700">{d.note}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState title="Không tìm thấy dữ liệu" />
          )}
        </Modal>
      )}

      {noteOpen && (
        <Modal
          open={noteOpen}
          onClose={() => setNoteOpen(false)}
          title="Sửa ghi chú"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setNoteOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={handleNoteSave} loading={submitting}>Lưu</Button>
            </>
          }
        >
          <textarea
            value={noteForm.note}
            onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
            placeholder="Ghi chú bổ sung"
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all resize-none"
          />
        </Modal>
      )}

      {adjModalOpen && (
        <Modal
          open={adjModalOpen}
          onClose={() => setAdjModalOpen(false)}
          title={editingAdj ? 'Cập nhật điều chỉnh lương' : 'Thêm điều chỉnh lương'}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setAdjModalOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={handleAdjSubmit} loading={submitting}>Lưu</Button>
            </>
          }
        >
          <div className="space-y-4">
            {user?.role === ROLES.ADMIN && (
              <Select
                label="Lọc theo chi nhánh (tuỳ chọn)"
                value={adjModalBranchFilter}
                onChange={(e) => {
                  setAdjModalBranchFilter(e.target.value);
                  setAdjForm({ ...adjForm, employeeId: '' });
                }}
                options={branches.map((b) => ({ value: getEntityId(b), label: b.name }))}
                placeholder="Tất cả chi nhánh"
              />
            )}
            <Select
              label="Nhân viên"
              value={adjForm.employeeId}
              onChange={(e) => {
                setAdjForm({ ...adjForm, employeeId: e.target.value });
                if (adjFormErrors.employeeId) setAdjFormErrors({ ...adjFormErrors, employeeId: '' });
              }}
              options={employeeSelectOptions(employeeOptionsForAdjModal, { includeHourlyRate: true })}
              placeholder="Chọn nhân viên"
              error={adjFormErrors.employeeId}
              required
            />
            <p className="text-xs text-slate-500 -mt-2">
              Chọn đúng hồ sơ nhân viên (employee profile). Hiển thị: tên · chi nhánh · lương/giờ.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tháng"
                value={adjForm.month}
                onChange={(e) => {
                  setAdjForm({ ...adjForm, month: Number(e.target.value) });
                  if (adjFormErrors.month) setAdjFormErrors({ ...adjFormErrors, month: '' });
                }}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i + 1,
                  label: `Tháng ${i + 1}`,
                }))}
                error={adjFormErrors.month}
                required
              />
              <Select
                label="Năm"
                value={adjForm.year}
                onChange={(e) => {
                  setAdjForm({ ...adjForm, year: Number(e.target.value) });
                  if (adjFormErrors.year) setAdjFormErrors({ ...adjFormErrors, year: '' });
                }}
                options={[
                  { value: currentYear - 1, label: String(currentYear - 1) },
                  { value: currentYear, label: String(currentYear) },
                  { value: currentYear + 1, label: String(currentYear + 1) },
                ]}
                error={adjFormErrors.year}
                required
              />
            </div>
            <Select
              label="Loại điều chỉnh"
              value={adjForm.type}
              onChange={(e) => {
                setAdjForm({ ...adjForm, type: e.target.value });
                if (adjFormErrors.type) setAdjFormErrors({ ...adjFormErrors, type: '' });
              }}
              options={ADJUSTMENT_TYPES}
              placeholder="Chọn loại"
              error={adjFormErrors.type}
              required
            />
            <Input
              label="Số tiền"
              type="number"
              min="0"
              value={adjForm.amount}
              onChange={(e) => {
                setAdjForm({ ...adjForm, amount: e.target.value });
                if (adjFormErrors.amount) setAdjFormErrors({ ...adjFormErrors, amount: '' });
              }}
              error={adjFormErrors.amount}
              placeholder="0"
              required
            />
            <Input
              label="Lý do"
              value={adjForm.reason}
              onChange={(e) => {
                setAdjForm({ ...adjForm, reason: e.target.value });
                if (adjFormErrors.reason) setAdjFormErrors({ ...adjFormErrors, reason: '' });
              }}
              error={adjFormErrors.reason}
              placeholder="Mô tả lý do điều chỉnh"
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Ghi chú</label>
              <textarea
                value={adjForm.note}
                onChange={(e) => setAdjForm({ ...adjForm, note: e.target.value })}
                placeholder="Ghi chú bổ sung (tuỳ chọn)"
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={handleConfirm}
        title="Chốt lương"
        message={`Chốt lương cho ${getEmployeeName(confirmDialog || {})}? Sau khi chốt, bảng lương không thể chỉnh sửa số liệu.`}
        confirmText="Chốt lương"
        variant="primary"
        loading={submitting}
      />

      <ConfirmDialog
        open={!!payDialog}
        onClose={() => setPayDialog(null)}
        onConfirm={handlePay}
        title="Đánh dấu đã thanh toán"
        message={`Xác nhận đã thanh toán lương cho ${getEmployeeName(payDialog || {})}?`}
        confirmText="Xác nhận thanh toán"
        variant="primary"
        loading={submitting}
      />

      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Xóa bảng lương"
        message="Bạn có chắc muốn xóa bảng lương nháp này? Thao tác không thể hoàn tác."
        confirmText="Xóa"
        variant="danger"
        loading={submitting}
      />

      <ConfirmDialog
        open={!!deleteAdjDialog}
        onClose={() => setDeleteAdjDialog(null)}
        onConfirm={handleDeleteAdj}
        title="Xóa điều chỉnh lương"
        message="Bạn có chắc muốn xóa điều chỉnh lương này?"
        confirmText="Xóa"
        variant="danger"
        loading={submitting}
      />

      <ConfirmDialog
        open={recalculatePromptOpen}
        onClose={() => {
          setRecalculatePromptOpen(false);
          showToast(
            'Đã thêm điều chỉnh. Bấm “Tính lương lại ngay” để cập nhật số tiền thực trả.',
            'info',
          );
        }}
        onConfirm={async () => {
          await handleRecalculatePayroll(pendingRecalculatePayload);
        }}
        title="Tính lương lại?"
        message="Bạn có muốn tính lương lại ngay không? Điều chỉnh mới sẽ được áp dụng vào bảng lương nháp."
        confirmText="Tính lại ngay"
        cancelText="Để sau"
        variant="primary"
        loading={recalculating}
      />
    </div>
  );
}
