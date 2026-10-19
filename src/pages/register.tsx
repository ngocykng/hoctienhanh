import React, { useState } from 'react';
import type { AuthUser } from './login.tsx';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onSuccess: (user: AuthUser) => void;
}

export default function RegisterPage({ onSwitchToLogin, onSuccess }: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Đăng ký thất bại.');
      }
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Tạo tài khoản mới</h2>
      <p className="text-sm text-gray-500 mb-6 text-center">Bắt đầu hành trình học từ vựng cùng DUOVOCAB.AI</p>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" required value={fullName} onChange={(event) => setFullName(event.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Họ và tên" />
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Email" />
        <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Mật khẩu (ít nhất 6 ký tự)" />
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50">
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-blue-600 font-semibold hover:underline">
          Đăng nhập ngay
        </button>
      </div>
    </div>
  );
}
