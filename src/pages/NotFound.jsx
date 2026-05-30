import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center animate-fade-in max-w-md">
        <div className="inline-flex p-4 bg-slate-100 rounded-2xl text-slate-400 mb-6">
          <FileQuestion className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">404 — Không tìm thấy trang</h1>
        <p className="text-sm text-slate-500 mt-2">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link to="/dashboard" className="inline-block mt-6">
          <Button>Về bàn làm việc</Button>
        </Link>
      </div>
    </div>
  );
}
