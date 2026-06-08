import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Clock, History, Wallet, User } from 'lucide-react';
import { getUserDisplayName } from '../utils/rolePermissions';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/employee/home', label: 'Trang chủ', icon: Home },
  { path: '/employee/attendance', label: 'Chấm công', icon: Clock },
  { path: '/employee/history', label: 'Giờ làm', icon: History },
  { path: '/employee/payroll', label: 'Lương', icon: Wallet },
  { path: '/employee/profile', label: 'Cá nhân', icon: User },
];

const pageTitles = {
  '/employee/home': 'Trang chủ',
  '/employee/attendance': 'Chấm công',
  '/employee/history': 'Giờ làm',
  '/employee/payroll': 'Bảng lương',
  '/employee/profile': 'Cá nhân',
};

export default function EmployeeMobileLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Nhân viên';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
            TT
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-slate-800 truncate">{title}</h1>
            <p className="text-xs text-slate-400 truncate">{getUserDisplayName(user)}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 animate-fade-in">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-100 pb-safe">
        <div className="flex items-stretch justify-around px-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-0 flex-1 transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      isActive ? 'bg-brand-50' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] font-semibold leading-tight text-center">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
