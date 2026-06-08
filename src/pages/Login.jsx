import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Mail, Lock, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { getApiMessage } from '../utils/parseApiData';
import { getHomeRouteForRole, getPostLoginRoute } from '../utils/rolePermissions';

export default function Login() {
  const { login, isAuthenticated, loading: authLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname;

  if (authLoading) return null;

  if (isAuthenticated && user) {
    return <Navigate to={getHomeRouteForRole(user.role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(email, password);
      navigate(getPostLoginRoute(userData.role, from), { replace: true });
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-brand-600 rounded-2xl text-white shadow-lg mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Quản Lý Nhân Sự</h1>
          <p className="text-sm text-slate-500 mt-1">Đăng nhập quản lý hoặc nhân viên</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="relative">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                required
              />
              <Mail className="absolute right-3 top-[34px] w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <Input
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Lock className="absolute right-3 top-[34px] w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Đăng nhập
            </Button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-6">
          <Smartphone className="w-3.5 h-3.5" />
          <p>Nhân viên iPhone: đăng nhập và thêm vào Màn hình chính</p>
        </div>
      </div>
    </div>
  );
}
