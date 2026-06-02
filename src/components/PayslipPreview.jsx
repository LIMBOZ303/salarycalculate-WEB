import { forwardRef } from 'react';
import {
  Clock,
  Wallet,
  Users,
  CalendarDays,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';
import Badge, {
  getPayrollStatusLabel,
  getPayrollStatusBadgeVariant,
  getAdjustmentTypeLabel,
} from './Badge';
import { formatDate } from '../utils/formatDate';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import {
  getEmployeeName,
  getEmployeeCode,
  getPosition,
  getPayable,
  getHourlyRate,
  getPayrollPeriodLabel,
} from '../utils/payrollDisplay';
import { getEntityId } from '../utils/getEntityId';

function PayslipRow({ label, value, highlight = false, negative = false, positive = false }) {
  const valueClass = highlight
    ? 'text-base font-bold text-brand-700'
    : negative
      ? 'text-rose-600 font-semibold'
      : positive
        ? 'text-emerald-600 font-semibold'
        : 'text-slate-800 font-semibold';

  if (highlight) {
    return (
      <tr>
        <td colSpan={2} className="p-0 border-0">
          <div className="flex items-center justify-between bg-brand-50 rounded-lg px-3 py-2.5 mt-1 mx-1 mb-1">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className={`text-sm tabular-nums ${valueClass}`}>{value}</span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2.5 pr-3 text-slate-500 text-sm">{label}</td>
      <td className={`py-2.5 text-right text-sm tabular-nums ${valueClass}`}>{value}</td>
    </tr>
  );
}

function PayslipBlock({ title, icon: Icon, children, className = '' }) {
  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-brand-600 shrink-0" strokeWidth={2} />}
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden px-3 py-1">
        <table className="w-full text-sm">
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}

const PayslipPreview = forwardRef(function PayslipPreview(
  { payroll, branchName = '—', adjustments = [] },
  ref,
) {
  if (!payroll) return null;

  const name = getEmployeeName(payroll);
  const code = getEmployeeCode(payroll);
  const period = getPayrollPeriodLabel(payroll);
  const payable = getPayable(payroll);
  const title = `Phiếu lương - ${name} - ${payroll.month}/${payroll.year}`;

  const totalDeduction =
    payroll.totalDeductions ??
    payroll.deductions ??
    (Number(payroll.penalty ?? 0) +
      Number(payroll.fixedDeduction ?? 0) +
      Number(payroll.otherDeduction ?? 0));

  return (
    <div
      ref={ref}
      data-payslip-print
      data-payslip-title={title}
      className="payslip-preview text-slate-800"
    >
      <header className="payslip-doc-header border-b-[3px] border-brand-600 pb-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
              Phiếu lương
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">{name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {code} · {branchName}
            </p>
          </div>
          <Badge variant={getPayrollStatusBadgeVariant(payroll.status)} className="self-start shrink-0">
            {getPayrollStatusLabel(payroll.status)}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Kỳ lương</p>
            <p className="font-semibold text-slate-800 mt-0.5">{period}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ngày trả dự kiến</p>
            <p className="font-semibold text-slate-800 mt-0.5">
              {formatDate(payroll.expectedPayDate ?? payroll.scheduledPayDate)}
            </p>
          </div>
        </div>

        <div className="payslip-doc-net mt-4 flex items-end justify-between gap-4 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3.5">
          <div>
            <p className="payslip-doc-net-label text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Thực trả
            </p>
            <p className="payslip-doc-net-value text-2xl sm:text-3xl font-bold text-brand-700 tabular-nums mt-0.5">
              {formatCurrency(payable)}
            </p>
          </div>
          {payroll.status === 'paid' && (
            <div className="text-right text-xs text-slate-500">
              <p className="font-medium text-slate-600">Đã thanh toán</p>
              <p className="tabular-nums">{formatDate(payroll.paidDate ?? payroll.paidAt)}</p>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 payslip-grid-2">
        <PayslipBlock title="Thông tin nhân viên" icon={Users}>
          <PayslipRow label="Họ tên" value={name} />
          <PayslipRow label="Mã nhân viên" value={code} />
          <PayslipRow label="Chi nhánh" value={branchName} />
          <PayslipRow label="Chức vụ" value={getPosition(payroll)} />
          <PayslipRow label="Lương/giờ" value={formatCurrency(getHourlyRate(payroll))} />
        </PayslipBlock>

        <PayslipBlock title="Công" icon={Clock}>
          <PayslipRow
            label="Tổng giờ"
            value={formatNumber(payroll.totalHours ?? payroll.workHours ?? 0)}
          />
          <PayslipRow
            label="Ngày làm"
            value={formatNumber(payroll.workDays ?? payroll.totalWorkDays ?? 0)}
          />
          <PayslipRow
            label="Đi trễ (lần)"
            value={formatNumber(payroll.lateCount ?? payroll.lateTimes ?? 0)}
          />
          <PayslipRow
            label="Thiếu chấm ra"
            value={formatNumber(payroll.missingCheckOut ?? payroll.missingCheckOutCount ?? 0)}
          />
        </PayslipBlock>
      </div>

      <div className="mt-5">
        <PayslipBlock title="Lương" icon={Wallet}>
          <PayslipRow label="Lương cơ bản" value={formatCurrency(payroll.baseSalary ?? 0)} />
          <PayslipRow
            label="Giữ lại tháng này"
            value={formatCurrency(payroll.heldThisMonth ?? payroll.holdThisMonth ?? 0)}
          />
          <PayslipRow
            label="Giữ từ tháng trước"
            value={formatCurrency(payroll.heldFromPrevious ?? payroll.holdFromPrevious ?? 0)}
          />
          <PayslipRow label="Phạt" value={formatCurrency(payroll.penalty ?? 0)} negative />
          <PayslipRow
            label="Khấu trừ cố định"
            value={formatCurrency(payroll.fixedDeduction ?? 0)}
            negative
          />
          <PayslipRow
            label="Khấu trừ khác"
            value={formatCurrency(payroll.otherDeduction ?? 0)}
            negative
          />
          {totalDeduction > 0 && (
            <PayslipRow label="Tổng khấu trừ" value={formatCurrency(totalDeduction)} negative />
          )}
          <PayslipRow
            label="Thưởng"
            value={formatCurrency(payroll.bonus ?? payroll.totalBonus ?? 0)}
            positive
          />
          <PayslipRow label="Thực trả" value={formatCurrency(payable)} highlight />
        </PayslipBlock>
      </div>

      {adjustments.length > 0 && (
        <section className="mt-5">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="w-4 h-4 text-brand-600" strokeWidth={2} />
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Điều chỉnh lương
            </h2>
          </div>
          <div className="rounded-xl border border-slate-200/80 divide-y divide-slate-100">
            {adjustments.map((adj) => (
              <div
                key={getEntityId(adj) || `${adj.type}-${adj.amount}-${adj.reason}`}
                className="payslip-adj flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <Badge
                    variant={
                      adj.type === 'bonus' ? 'success' : adj.type === 'penalty' ? 'danger' : 'warning'
                    }
                  >
                    {getAdjustmentTypeLabel(adj.type)}
                  </Badge>
                  {adj.reason && (
                    <p className="payslip-adj-reason text-xs text-slate-500 mt-1 truncate" title={adj.reason}>
                      {adj.reason}
                    </p>
                  )}
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
          </div>
        </section>
      )}

      <section className="mt-5">
        <PayslipBlock title="Trạng thái" icon={CalendarDays}>
          <PayslipRow label="Trạng thái" value={getPayrollStatusLabel(payroll.status)} />
          <PayslipRow
            label="Ngày trả dự kiến"
            value={formatDate(payroll.expectedPayDate ?? payroll.scheduledPayDate)}
          />
          <PayslipRow label="Ngày đã trả" value={formatDate(payroll.paidDate ?? payroll.paidAt)} />
        </PayslipBlock>
      </section>

      {payroll.note?.trim() && (
        <section className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" strokeWidth={2} />
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ghi chú</h2>
          </div>
          <div className="payslip-note rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
            {payroll.note.trim()}
          </div>
        </section>
      )}

      <p className="payslip-footer mt-6 pt-4 border-t border-dashed border-slate-200 text-[10px] text-slate-400 text-center">
        Phiếu lương được tạo từ hệ thống tính lương · {period}
      </p>
    </div>
  );
});

export default PayslipPreview;
