import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/dashboard': { title: 'Bàn làm việc', subtitle: 'Tổng quan hệ thống nhân sự & chấm công' },
  '/pending-employees': { title: 'Chờ duyệt', subtitle: 'Duyệt đăng ký nhân viên mới' },
  '/employees': { title: 'Quản lý nhân sự', subtitle: 'Danh sách nhân viên toàn hệ thống' },
  '/branches': { title: 'Quản lý chi nhánh', subtitle: 'Thông tin chi nhánh & GPS' },
  '/shifts': { title: 'Quản lý ca làm', subtitle: 'Cấu hình ca làm việc' },
  '/attendance': { title: 'Bảng công', subtitle: 'Theo dõi chấm công chi tiết' },
  '/revenues': { title: 'Doanh thu chi nhánh', subtitle: 'Quản lý và theo dõi doanh thu theo ngày, tháng, quý' },
  '/users': { title: 'Quản lý tài khoản', subtitle: 'Phân quyền & trạng thái người dùng' },
};

function getPageInfo(pathname) {
  if (pathname.startsWith('/employees/')) {
    return { title: 'Chi tiết nhân viên', subtitle: 'Thông tin hồ sơ nhân viên' };
  }
  return pageTitles[pathname] || { title: 'Dashboard', subtitle: '' };
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageInfo = getPageInfo(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        <Topbar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 p-4 sm:p-6 pb-20 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
