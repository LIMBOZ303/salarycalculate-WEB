const variants = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-sky-100 text-sky-700',
  brand: 'bg-brand-100 text-brand-700',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function getStatusBadgeVariant(status) {
  const map = {
    active: 'success',
    inactive: 'default',
    pending: 'warning',
    locked: 'danger',
    rejected: 'danger',
    resigned: 'default',
    late: 'warning',
    on_time: 'success',
    absent: 'danger',
    draft: 'default',
    submitted: 'info',
    confirmed: 'success',
  };
  return map[status] || 'default';
}

export function getRevenueStatusLabel(status) {
  const map = {
    draft: 'Nháp',
    submitted: 'Đã gửi',
    confirmed: 'Đã xác nhận',
  };
  return map[status] || status || '—';
}
