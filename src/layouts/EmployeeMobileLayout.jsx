import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Clock, History, Wallet, User } from 'lucide-react';
import { getUserDisplayName } from '../utils/rolePermissions';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';

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
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col overflow-x-hidden employee-shell">
      <div className="mx-auto w-full max-w-md flex flex-col min-h-[100dvh]">
        <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] pt-safe">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold text-[#0F172A] truncate">{title}</h1>
              <p className="text-xs text-[#64748B] truncate">{getUserDisplayName(user)}</p>
            </div>
            <Avatar 
              src={user?.avatarUrl || user?.employee?.avatarUrl} 
              name={getUserDisplayName(user)} 
              size="md" 
            />
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-24">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#E2E8F0] pb-safe">
          <div className="mx-auto max-w-md flex items-stretch">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 flex-1 transition-colors ${
                    isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
                    <span className="text-[10px] font-medium leading-none">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
