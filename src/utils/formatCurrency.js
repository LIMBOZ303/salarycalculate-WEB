export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(num) {
  if (num === null || num === undefined || num === '') return '—';
  const n = Number(num);
  if (Number.isNaN(n)) return String(num);
  return new Intl.NumberFormat('vi-VN').format(n);
}
