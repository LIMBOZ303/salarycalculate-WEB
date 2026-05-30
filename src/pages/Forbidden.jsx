import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center animate-fade-in max-w-md">
        <div className="inline-flex p-4 bg-rose-50 rounded-2xl text-rose-500 mb-6">
          <ShieldOff className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Không có quyền truy cập</h1>
        <p className="text-sm text-slate-500 mt-2">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
        </p>
        <Link to="/dashboard" className="inline-block mt-6">
          <Button>Về bàn làm việc</Button>
        </Link>
      </div>
    </div>
  );
}
