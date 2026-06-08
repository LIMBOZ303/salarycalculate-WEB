import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDisplayName, ROLE_LABELS } from '../utils/rolePermissions';
import Button from '../components/Button';
import Avatar from '../components/Avatar';

export default function Topbar({ title, subtitle, setSidebarOpen }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-30 px-4 py-3 sm:px-6 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-800 leading-none truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold text-slate-800">{getUserDisplayName(user)}</div>
            <div className="text-xs text-slate-400">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
          <Avatar 
            src={user?.avatarUrl || user?.employee?.avatarUrl} 
            name={getUserDisplayName(user)} 
            size="md" 
          />
        </div>
        <Button variant="ghost" size="sm" onClick={logout} title="Đăng xuất">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Button>
      </div>
    </header>
  );
}
