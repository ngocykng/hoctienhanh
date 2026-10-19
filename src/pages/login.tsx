import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, BookOpenCheck, ShieldCheck } from 'lucide-react';

interface LoginProps {
    onSwitchToRegister: () => void;
    onSuccess: (user: AuthUser) => void;
}

export interface AuthUser {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'user';

}

export default function Login({ onSwitchToRegister, onSuccess }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Đăng nhập thất bại.');
            }
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_info', JSON.stringify(data.user));
            onSuccess(data.user);
        } catch (caughtError: unknown) {
            setError(caughtError instanceof Error ? caughtError.message : 'Đăng nhập thất bại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[90vh] w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Background Glow Orbs tạo chiều sâu */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-blue-400/25 to-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/15 rounded-full blur-3xl pointer-events-none" />

            {/* Main Glass Card */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative w-full max-w-md bg-white/85 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-blue-500/10 p-8 sm:p-10 z-10"
            >
                {/* Logo & Brand Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 mb-4"
                    >
                        <BookOpenCheck className="w-7 h-7" />
                    </motion.div>

                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">
                            DUOVOCAB<span className="text-blue-600">.AI</span>
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/60">
                            <Sparkles className="w-2.5 h-2.5" /> AI
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">
                        Học từ vựng đa ngôn ngữ thông minh cùng trợ lý AI
                    </p>
                </div>

                {/* Thông báo lỗi nếu có */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-5 p-3.5 bg-rose-50/90 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-start gap-2.5"
                    >
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}

                {/* Form Đăng nhập */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                            Email đăng nhập
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tenban@gmail.com"
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Mật khẩu
                            </label>
                            <button
                                type="button"
                                onClick={() => alert('Vui lòng liên hệ quản trị viên hoặc đăng ký tài khoản mới.')}
                                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-11 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-gray-900"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Ghi nhớ tài khoản */}
                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs text-gray-600">Ghi nhớ đăng nhập</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 cursor-pointer"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Đang xử lý đăng nhập...
                            </span>
                        ) : (
                            <>
                                <span>Đăng nhập ngay</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </form>

                {/* Chuyển sang đăng ký */}
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500">
                        Bạn chưa có tài khoản?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToRegister}
                            className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                        >
                            Đăng ký miễn phí
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
