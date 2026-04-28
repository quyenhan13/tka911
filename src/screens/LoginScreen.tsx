import React, { useState } from 'react';
import { CONFIG } from '../config';

interface LoginScreenProps {
  onLoginSuccess: (userData: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        onLoginSuccess(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-8 z-200">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-secondary/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm z-10">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-black text-primary tracking-tighter mb-2">VTEEN</h1>
          <p className="text-text-dim text-sm uppercase tracking-widest">Private Movie Hub</p>
        </header>

        <div className="glass border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-white text-center">Đăng nhập hệ thống</h2>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Tài khoản"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary transition-all"
                required
              />
            </div>
            
            <div className="space-y-1">
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center mt-2 animate-pulse">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-linear-to-r from-primary to-violet-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-text-dim text-xs">
          Ứng dụng nội bộ. Vui lòng không chia sẻ tài khoản.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
