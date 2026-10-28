import { useState, useEffect } from 'react';
import { data, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  X,
  Clock,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { fetchAdminStats } from '../services/api.ts';
const menuItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin' },
  { icon: Users, label: 'Quản lý học viên', path: '/admin/QLhocvien' },
  { icon: BookOpen, label: 'Quản lý nội dung', path: '/admin/Qlnoidung' },
  { icon: Settings, label: 'Cấu hình hệ thống', path: '/admin/setting' },
];



interface AdminProps {
  onLogout: () => void;
}
interface AdminStatus {
  totalUsers: number;
  totalTime: number;
  completedLessons: number;
  growthRate: number;
}
export default function Admin({ onLogout }: AdminProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState('...');
  const [timeCount, setTimeCount] = useState('...');
  const [rateCount, setRateCount] = useState('...');
  const [growthCount, setGrowthCount] = useState('...');
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = (await fetchAdminStats()) as AdminStatus;
        setUserCount(statsData.totalUsers.toLocaleString());
        setTimeCount(`${statsData.totalTime.toLocaleString()} giờ`);
        setRateCount(`${statsData.completedLessons.toLocaleString()}%`);
        setGrowthCount(`+${statsData.growthRate}%`);
      } catch (error) {
        console.error('Error fetching admin status:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    onLogout();
  };

  const isOverviewPage = location.pathname === '/admin';
  const stats = [
    { label: 'Tổng học viên', value: userCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Thời gian học', value: timeCount, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Bài học hoàn thành', value: rateCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Tăng trưởng tháng', value: growthCount, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 264 : 84 }}
        className="flex shrink-0 flex-col border-r border-slate-200 bg-white"
      >
        <div className="flex h-20 items-center border-b border-slate-100 px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
            H
          </div>
          {isSidebarOpen && (
            <div className="ml-3 overflow-hidden whitespace-nowrap">
              <p className="font-bold tracking-tight text-slate-900">Học Tiếng Anh</p>
              <p className="mt-0.5 text-xs text-slate-400">Khu vực quản trị</p>
            </div>
          )}
        </div>

        <nav aria-label="Menu quản trị" className="flex-1 space-y-1.5 p-4">
          {isSidebarOpen && (
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Điều hướng
            </p>
          )}

          {menuItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                title={!isSidebarOpen ? item.label : undefined}
                className={`flex w-full items-center rounded-xl px-3 py-3 text-left transition-colors ${isActive
                  ? 'bg-indigo-50 font-semibold text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                />
                {isSidebarOpen && (
                  <span className="ml-3 truncate text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleLogout}
            title={!isSidebarOpen ? 'Đăng xuất' : undefined}
            className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span className="ml-3">Đăng xuất</span>}
          </button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
              aria-label={isSidebarOpen ? 'Thu gọn menu' : 'Mở rộng menu'}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Tìm kiếm..."
                aria-label="Tìm kiếm trong trang quản trị"
                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 lg:w-72"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Thông báo"
              className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <Bell size={19} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600" />
            </button>
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">Quản trị viên</p>
                <p className="text-xs text-slate-400">Quản lý hệ thống</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                QV
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-8">
          {isOverviewPage ? (
            <div className="mx-auto max-w-7xl space-y-8">
              <section>
                <p className="mb-2 text-sm font-medium text-indigo-600">Tổng quan hệ thống</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Chào mừng trở lại
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Theo dõi và quản lý nội dung học tiếng Anh từ một nơi.
                </p>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className={`rounded-xl p-2.5 ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-5 text-sm font-medium text-slate-500">{stat.label}</p>
                    {loading ? (
                      <div className="mt-1 text-2xl font-bold text-slate-900">...</div>
                    ) : (
                      <div className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</div>
                    )}
                  </div>
                ))}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <h2 className="font-semibold text-slate-900">Hoạt động gần đây</h2>
                </div>
                <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                  <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                    <LayoutDashboard className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-700">Chưa có hoạt động</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Kết nối API và cơ sở dữ liệu để hiển thị lịch sử hoạt động.
                  </p>
                </div>
              </section>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
