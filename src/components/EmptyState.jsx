import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Chưa có bản ghi nào để hiển thị.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 mb-4">
        <Inbox className="w-10 h-10" />
      </div>
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
