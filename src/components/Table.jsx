import { getEntityId } from '../utils/getEntityId';

export default function Table({ columns, data, keyField, onRowClick, emptyMessage = 'Không có dữ liệu' }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-400">{emptyMessage}</div>
    );
  }

  const getRowKey = (row, idx) => {
    if (keyField && row[keyField]) return row[keyField];
    return getEntityId(row) || idx;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, idx) => (
            <tr
              key={getRowKey(row, idx)}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-slate-50/70 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-slate-700 whitespace-nowrap ${col.className || ''}`}
                >
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
