export function EmployeeCard({ children, className = '', padding = true }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E2E8F0] ${padding ? 'p-4' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function EmployeeSectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="text-sm font-semibold text-[#0F172A]">{children}</h3>
      {action}
    </div>
  );
}

export function EmployeeStat({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
      <p className="text-xs text-[#64748B]">{label}</p>
      <p className="text-xl font-semibold text-[#0F172A] tabular-nums mt-1">{value}</p>
      {sub && <p className="text-xs text-[#64748B] mt-0.5">{sub}</p>}
    </div>
  );
}

export function EmployeeRow({ label, value, highlight, danger }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
      <span className="text-sm text-[#64748B]">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          highlight ? 'text-[#2563EB] text-base' : danger ? 'text-[#DC2626]' : 'text-[#0F172A]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function EmployeeStatusBadge({ children, variant = 'default' }) {
  const styles = {
    default: 'bg-[#F1F5F9] text-[#64748B]',
    info: 'bg-[#EFF6FF] text-[#2563EB]',
    success: 'bg-[#F0FDF4] text-[#16A34A]',
    warning: 'bg-[#FFFBEB] text-[#F59E0B]',
    danger: 'bg-[#FEF2F2] text-[#DC2626]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${styles[variant] || styles.default}`}
    >
      {children}
    </span>
  );
}

export function EmployeeEmpty({ title, description }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] px-4 py-10 text-center">
      <p className="text-sm font-medium text-[#0F172A]">{title}</p>
      {description && <p className="text-xs text-[#64748B] mt-1">{description}</p>}
    </div>
  );
}

export function EmployeeError({ message, onRetry }) {
  return (
    <div className="bg-white rounded-2xl border border-[#FECACA] px-4 py-6 text-center">
      <p className="text-sm text-[#DC2626]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-[#2563EB]"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}));

export const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { value: String(y), label: String(y) };
});
