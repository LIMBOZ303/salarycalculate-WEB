import {
  LayoutDashboard,
  UserCheck,
  Users,
  Store,
  Clock,
  CalendarClock,
  Shield,
  Wallet,
  X,
  CreditCard,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMenuItems, getUserDisplayName, ROLE_LABELS } from '../utils/rolePermissions';

const iconMap = {
  LayoutDashboard,
  UserCheck,
  Users,
  Store,
  Clock,
  CalendarClock,
  Shield,
  Wallet,
};

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  const menuItems = getMenuItems(user?.role);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 bg-white text-slate-800 w-72 z-50 flex flex-col border-r border-slate-200 transition-all duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-600 rounded-xl text-white shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-800 uppercase leading-none">
                HR Manager
              </h1>
              <p className="text-[10px] text-brand-600 font-bold mt-1 tracking-wider uppercase">
                Dashboard v1.0
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `w-full group py-3 px-6 flex items-center gap-3.5 text-left transition-all relative ${
                    isActive
                      ? 'bg-brand-50/70 text-brand-600 font-semibold border-r-[3px] border-brand-600'
                      : 'text-slate-500 hover:text-brand-600 hover:bg-brand-50/30'
                  }`
                }
              >
                {Icon && (
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                )}
                <div>
                  <div className="text-xs leading-none">{item.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-normal hidden sm:block">
                    {item.desc}
                  </div>
                </div>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/50">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
              {getUserDisplayName(user)?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-800 truncate">
                {getUserDisplayName(user)}
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
