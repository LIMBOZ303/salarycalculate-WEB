import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Không thể tải dữ liệu',
  message = 'Đã xảy ra lỗi khi kết nối với máy chủ.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-rose-50 rounded-2xl text-rose-500 mb-4">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </Button>
      )}
    </div>
  );
}
