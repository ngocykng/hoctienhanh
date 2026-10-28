import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    LayoutDashboard,
    LogOut,
    Settings,
    Users,
    ArrowLeft, Search, UserPlus, Edit2, Trash2
} from 'lucide-react';
import { fetchAllUsers } from '../../services/api.ts';
const menuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin' },
    { icon: Users, label: 'Quản lý học viên', path: '/admin/QLhocvien' },
    { icon: BookOpen, label: 'Quản lý nội dung', path: '/admin/Qlnoidung' },
    { icon: Settings, label: 'Cấu hình hệ thống', path: '/admin/setting' },
];
// interface AdminStatus {
//   totalid: number;
//   totalemail: string;
//   gmail: string;
//   role: string;
// }

export default function QLHocVienPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isactive, setIsActive] = useState(false);
    const [students, setStudents] = useState<any[]>([]); // Khởi tạo students là một mảng rỗng
    useEffect(() => {
        loadStudents();
    }, []);
    // const [students, setStudents] = useState([]);
    const loadStudents = async () => {
        try {
            const allUsers = await fetchAllUsers();

            setStudents(allUsers);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }
    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        navigate('/login');
    };
    // const students = [
    //     {label: id, value: id}

    // ]

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            {/* Sidebar - Exact Layout from Admin.tsx */}
            <aside className="flex shrink-0 flex-col border-r border-slate-200 bg-white w-64">
                <div className="flex h-20 items-center border-b border-slate-100 px-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
                        H
                    </div>
                    <div className="ml-3 overflow-hidden whitespace-nowrap">
                        <p className="font-bold tracking-tight text-slate-900">Học Tiếng Anh</p>
                        <p className="mt-0.5 text-xs text-slate-400">Khu vực quản trị</p>
                    </div>
                </div>

                <nav aria-label="Menu quản trị" className="flex-1 space-y-1.5 p-4">
                    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Điều hướng
                    </p>

                    {menuItems.map((item) => {
                        const isActive = item.path === '/admin/QLhocvien';

                        return (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => navigate(item.path)}
                                className={`flex w-full items-center rounded-xl px-3 py-3 text-left transition-colors ${isActive
                                    ? 'bg-indigo-50 font-semibold text-indigo-700'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon
                                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'
                                        }`}
                                />
                                <span className="ml-3 truncate text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-100 p-4">
                    <button
                        type="button"
                        onClick={() => navigate('/topics')}
                        className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span className="ml-3">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Tìm kiếm..."
                                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 lg:w-72"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-semibold text-slate-800">Quản trị viên</p>
                                <p className="text-xs text-slate-400">Quản lý học viên</p>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                                QV
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-50">
                    <div className="mx-auto max-w-7xl">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="flex items-center text-gray-500 hover:text-blue-600 transition-colors mb-2 text-sm"
                                >
                                    <ArrowLeft size={16} className="mr-1" /> Quay lại Dashboard
                                </button>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                    Quản lý học viên
                                </h1>
                                <p className="text-gray-500">Quản lý thông tin, quyền hạn và trạng thái của người học.</p>
                            </div>

                            <button className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm gap-2">
                                <UserPlus size={18} /> Thêm học viên
                            </button>
                        </div>

                        {/* Toolbar: Search & Filter */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên, email..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option>Tất cả trạng thái</option>
                                    <option>Đang hoạt động</option>
                                    <option>Đã khóa</option>
                                </select>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="student-table">
                                <thead>
                                    <tr>
                                        <th>Học viên</th>
                                        <th>Email</th>
                                        <th>Vai trò</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tham gia</th>
                                        <th className="text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td className="font-medium text-gray-900">{student.full_name}</td>
                                            <td>{student.email}</td>
                                            <td>
                                                <span className="text-gray-500">{student.role}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${student.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                                    {student.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                                                </span>
                                            </td>
                                            <td className="text-gray-500">{student.created_at}</td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="btn-action btn-edit" title="Sửa">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="btn-action btn-delete" title="Xóa">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                                <p>Hiển thị 3 trên tổng số 3 học viên</p>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Trước</button>
                                    <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Sau</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
