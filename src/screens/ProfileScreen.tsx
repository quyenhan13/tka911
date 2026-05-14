import React, { useCallback, useEffect, useState } from 'react';
import { getFavorites } from '../storage/favorites';
import { getHistory } from '../storage/watchHistory';
import { CONFIG } from '../config';
import { fetchUpdateInfo, getCurrentOtaVersion, hasNewerVersion, installUpdate, reloadForUpdate } from '../ota';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

interface User {
  display_name?: string;
  role?: string;
}

interface SavedMovie {
  slug: string;
  title: string;
  poster: string;
  lastEpisode?: string;
}

interface ProfileScreenProps {
  user: User & { api_token: string };
  onLogout: () => void;
  onWatch: (slug: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onWatch }) => {
  const [favorites] = useState<SavedMovie[]>(() => getFavorites());
  const [history] = useState<SavedMovie[]>(() => getHistory());
  const [activeTab, setActiveTab] = useState('favorites');
  const activeItems = activeTab === 'favorites' ? favorites : history;

  const [currentVersion, setCurrentVersion] = useState<string>(() => getCurrentOtaVersion());
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Change Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const checkUpdates = useCallback(async (manual = false) => {
    setChecking(true);
    try {
      const data = await fetchUpdateInfo(manual);
      if (data && data.status === 'success' && data.version) {
        setLatestVersion(data.version);
        if (manual && !hasNewerVersion(data.version, currentVersion)) {
          alert('Ung dung da la ban moi nhat!');
        }
      }
    } catch (err) {
      console.error('Update check error:', err);
      setLatestVersion('Loi');
    } finally {
      setChecking(false);
    }
  }, [currentVersion]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkUpdates();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkUpdates]);

  const handleUpdate = async () => {
    if (!hasNewerVersion(latestVersion, currentVersion)) return;
    
    setUpdating(true);
    try {
      const data = await fetchUpdateInfo(true);
      if (data && data.status === 'success' && data.url) {
        await installUpdate(data);
        setCurrentVersion(data.version || CONFIG.VERSION);
        
        alert('Cap nhat thanh cong! App se khoi dong lai.');
        setTimeout(() => {
          reloadForUpdate();
        }, 1500);
      }
    } catch (err) {
      console.error('Update execution error:', err);
      alert('Cap nhat that bai, vui long thu lai sau.');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordForm.new.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      const url = `${CONFIG.API_BASE_URL}/change_password.php`;
      const body = { 
        current_password: passwordForm.current, 
        new_password: passwordForm.new 
      };
      
      let result;
      if (Capacitor.isNativePlatform()) {
        const response = await CapacitorHttp.post({
          url,
          data: body,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.api_token}`
          }
        });
        result = response.data;
      } else {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.api_token}`
          },
          body: JSON.stringify(body),
        });
        result = await response.json();
      }

      if (result.status === 'success') {
        alert('Đổi mật khẩu thành công!');
        setShowPasswordModal(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
      } else {
        setPasswordError(result.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError('Kết nối máy chủ thất bại');
    } finally {
      setPasswordLoading(false);
    }
  };

  const isUpToDate = latestVersion && !hasNewerVersion(latestVersion, currentVersion);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div
        className="relative overflow-hidden border-b border-white/10 bg-[#05070a]/35 px-6 pb-6 backdrop-blur-2xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)', minHeight: 'calc(env(safe-area-inset-top) + 5rem)' }}
      >
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative flex items-center gap-5">
          <div className="relative h-21 w-21 rounded-[1.65rem] bg-linear-to-br from-primary via-cyan-300 to-secondary p-[2px] shadow-[0_18px_48px_rgba(6,182,212,0.22)]">
            <img
              src={`https://ui-avatars.com/api/?name=${user.display_name || 'VTeen'}&background=111827&color=fff&size=128`}
              className="h-full w-full rounded-[1.55rem] border border-black/50 bg-background object-cover"
              alt=""
            />
            <span className="absolute -bottom-1 -right-1 rounded-lg border border-black/40 bg-vip px-2 py-1 text-[7px] font-black uppercase tracking-widest text-black">
              VIP
            </span>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.28em] text-primary/80">Tai khoan</p>
            <h2 className="truncate text-2xl font-black text-white">{user.display_name || 'VTeen'}</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-lg border border-white/10 bg-white/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/75 backdrop-blur-md">VIP Member</span>
              <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary">{user.role || 'User'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-6">
        {[
          { label: 'Yeu thich', value: favorites.length },
          { label: 'Da xem', value: history.length },
          { label: 'Goi cuoc', value: 'Pro' }
        ].map((stat) => (
          <div key={stat.label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
            <p className="text-lg font-black text-white">{stat.value}</p>
            <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-text-dim">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="px-6">
        <div className="flex rounded-[1.35rem] border border-white/10 bg-black/24 p-1.5 shadow-inner backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 rounded-2xl py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'favorites' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-dim'}`}
          >
            Yeu thich
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 rounded-2xl py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-dim'}`}
          >
            Lich su
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {activeItems.length === 0 ? (
            <div className="col-span-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-12 text-center text-xs font-black uppercase tracking-widest text-text-dim/70">
              Trong
            </div>
          ) : (
            activeItems.map((item: SavedMovie) => (
              <button
                type="button"
                key={item.slug}
                onClick={() => onWatch(item.slug)}
                className="group cursor-pointer text-left active:scale-95"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-[1rem] border border-white/10 bg-card shadow-xl">
                  <img src={item.poster} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                  {activeTab === 'history' && item.lastEpisode && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-primary px-1.5 py-0.5 text-[8px] font-black uppercase text-black">Tap {item.lastEpisode}</span>
                  )}
                </div>
                <p className="mt-2 truncate px-1 text-[9px] font-bold text-white/75">{item.title}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 px-6 flex flex-col gap-3">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full rounded-2xl border border-primary/25 bg-primary/8 py-4 text-xs font-black uppercase tracking-[0.2em] text-primary transition-all active:bg-primary/15"
        >
          Đổi mật khẩu
        </button>
        <button
          onClick={onLogout}
          className="w-full rounded-2xl border border-red-500/25 bg-red-500/8 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-400 transition-all active:bg-red-500/15"
        >
          Dang xuat tai khoan
        </button>
      </div>

      {/* VERSION DISPLAY & UPDATE */}
      <div className="px-6 pb-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Phiên bản hiện tại</p>
              <p className="text-sm font-black text-white font-mono">{currentVersion}</p>
            </div>
            <button 
              onClick={() => checkUpdates(true)}
              disabled={checking}
              className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-primary transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`}>
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {!isUpToDate && latestVersion && latestVersion !== 'Loi' && (
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-yellow-500/80 mb-1">Bản cập nhật mới</p>
                  <p className="text-sm font-black text-white font-mono">{latestVersion}</p>
                </div>
                <div className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-lg text-[8px] font-black uppercase border border-yellow-500/20">
                  RECOMENDED
                </div>
              </div>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full bg-primary py-3 rounded-xl text-[10px] font-black text-black uppercase tracking-[0.2em] shadow-[0_8px_20px_rgba(6,182,212,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ĐANG CẬP NHẬT...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M7 16l5 5m0 0l5-5m-5 5V3" /></svg>
                    CẬP NHẬT NGAY
                  </>
                )}
              </button>
            </div>
          )}

          {isUpToDate && (
            <div className="flex items-center gap-2 text-green-400/50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><path d="M5 13l4 4L19 7" /></svg>
              <span className="text-[9px] font-black uppercase tracking-widest">Bạn đang sử dụng phiên bản mới nhất</span>
            </div>
          )}
        </div>
      </div>
    </div>

      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center px-4 pb-10 sm:items-center sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0c10] p-8 shadow-2xl sm:m-4"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              
              <div className="relative mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6 text-primary">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white">Đổi mật khẩu</h3>
                <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-text-dim">Cập nhật bảo mật tài khoản</p>
              </div>

              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="ml-4 text-[9px] font-black uppercase tracking-widest text-white/40">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-sm text-white placeholder:text-white/20 focus:border-primary/30 focus:bg-white/10 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="ml-4 text-[9px] font-black uppercase tracking-widest text-white/40">Mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-sm text-white placeholder:text-white/20 focus:border-primary/30 focus:bg-white/10 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="ml-4 text-[9px] font-black uppercase tracking-widest text-white/40">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-sm text-white placeholder:text-white/20 focus:border-primary/30 focus:bg-white/10 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                {passwordError && (
                  <p className="mt-2 text-center text-[10px] font-bold text-red-400">{passwordError}</p>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 text-[10px] font-black uppercase tracking-widest text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-[2] rounded-2xl bg-primary py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {passwordLoading ? 'Đang xử lý...' : 'Xác nhận đổi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
};

export default ProfileScreen;
