export default function Card({ children, className = '', title, subtitle, action, padding = true }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      {(title || action) && (
        <div className={`flex items-start justify-between gap-4 ${padding ? 'px-5 pt-5' : 'p-0'}`}>
          <div>
            {title && <h3 className="text-sm font-bold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={padding ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, color = 'blue', subtitle }) {
  const colors = {
    blue: { bg: 'bg-sky-50', text: 'text-sky-600', sub: 'text-sky-600' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', sub: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', sub: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', sub: 'text-rose-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', sub: 'text-slate-500' },
    brand: { bg: 'bg-brand-50', text: 'text-brand-600', sub: 'text-brand-700' },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{label}</span>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
        </div>
        {Icon && (
          <div className={`p-2.5 ${c.bg} rounded-xl ${c.text}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {subtitle && (
        <div className={`text-xs ${c.sub} mt-3 font-medium`}>{subtitle}</div>
      )}
    </div>
  );
}
