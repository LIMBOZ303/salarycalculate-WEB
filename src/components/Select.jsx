export default function Select({
  label,
  error,
  options = [],
  placeholder = 'Chọn...',
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-600">
          {label}
          {props.required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-all cursor-pointer ${
          error ? 'border-rose-400' : 'border-slate-200'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
