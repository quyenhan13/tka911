import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { CONFIG } from './config'




import BottomTabs from './components/BottomTabs'
import HomeScreen from './screens/HomeScreen'
import WatchScreen from './screens/WatchScreen'
import LoginScreen from './screens/LoginScreen'
import ProfileScreen from './screens/ProfileScreen'
import DriverScreen from './screens/DriverScreen'
import UniverseBackground from './components/UniverseBackground'
import ErrorBoundary from './components/ErrorBoundary'
import Logo from './components/Logo'
import './index.css'

interface User {
  api_token: string;
  display_name?: string;
  role?: string;
  [key: string]: unknown;
}

const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as { api_token?: unknown }).api_token === 'string';
};

const getSavedUser = () => {
  const savedUser = localStorage.getItem('vteen_user');
  if (!savedUser) return null;

  try {
    const parsed = JSON.parse(savedUser);
    if (isUser(parsed)) return parsed;
  } catch {
    localStorage.removeItem('vteen_user');
  }

  return null;
};

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => getSavedUser());
  const [showSplash, setShowSplash] = useState(true);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('');

  // 🏮 BIẾN CHỐT CHẶN - Tránh nháy màn hình
  const lastCheckTime = useRef<number>(0);
  const isChecking = useRef<boolean>(false);

  useEffect(() => {
    // 🏮 TIỂU CHIN ANTI-LOOP ENGINE PRO MAX
    const checkOTA = async (force = false) => {
      // 🏮 CẤM TRIỆT ĐỂ: Chỉ chạy đúng 1 lần duy nhất mỗi phiên mở App
      const sessionDone = sessionStorage.getItem('vteen_ota_session_done');
      if (!force && sessionDone === 'true') {
        console.log('🏮 OTA: Session already checked. BANNED.');
        setShowSplash(false);
        return;
      }

      if (isChecking.current) return;
      isChecking.current = true;

      try {
        const now = Date.now();
        
        // 1. KIỂM TRA KHÓA THỜI GIAN (Dự phòng)
        const otaLock = localStorage.getItem('vteen_ota_lock');
        if (!force && otaLock) {
          const lockTime = parseInt(otaLock);
          if (!isNaN(lockTime) && (now < lockTime || (now - lockTime) < 900000)) {
            console.log('🏮 OTA: System Locked (15m). Skipping.');
            setShowSplash(false);
            isChecking.current = false;
            // Đánh dấu session xong luôn để khỏi check lại
            sessionStorage.setItem('vteen_ota_session_done', 'true');
            return;
          }
        }

        if (!Capacitor.isNativePlatform()) {
          setShowSplash(false);
          isChecking.current = false;
          return;
        }

        const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

        // 2. LẤY PHIÊN BẢN HIỆN TẠI
        const currentBundle = await CapacitorUpdater.current();
        const currentVersion = (currentBundle.bundle.id || localStorage.getItem('vteen_last_ota_version') || '0.0.0').replace(/^v/, '');
        console.log('🏮 OTA Check: Current v' + currentVersion);

        const response = await CapacitorHttp.get({
          url: `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/releases/latest`,
        });

        if (response.status === 200 && response.data) {
          const latestVersion = (response.data.tag_name || '0.0.0').replace(/^v/, '');
          console.log('🏮 OTA Check: Latest v' + latestVersion);

          if (latestVersion !== currentVersion && latestVersion !== '0.0.0') {
            const asset = response.data.assets.find((a: any) => a.name === 'update.zip');
            if (asset) {
              setUpdateStatus(`Đang tải bản cập nhật ${latestVersion}...`);
              
              const bundle = await CapacitorUpdater.download({
                url: asset.browser_download_url,
                version: latestVersion,
              });

              setUpdateStatus('Đang cài đặt...');
              
              // KHÓA CỨNG TRƯỚC KHI RELOAD
              localStorage.setItem('vteen_ota_lock', (Date.now() + 1800000).toString());
              localStorage.setItem('vteen_last_ota_version', latestVersion);
              sessionStorage.setItem('vteen_ota_session_done', 'true');
              
              console.log('🏮 OTA: Reloading in 3s...');
              await new Promise(r => setTimeout(r, 3000));
              await CapacitorUpdater.set(bundle);
              return; 
            }
          }
        }
      } catch (err) {
        console.error('🏮 OTA Fatal Error:', err);
      } finally {
        isChecking.current = false;
        setUpdateStatus('');
        setShowSplash(false);
        // Đánh dấu đã check xong cho session này
        sessionStorage.setItem('vteen_ota_session_done', 'true');
      }
    };

    // CHỈ GỌI 1 LẦN DUY NHẤT KHI VÀO APP
    checkOTA(false);



    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);







  const handleLoginSuccess = (userData: unknown) => {
    if (!isUser(userData)) {
      localStorage.removeItem('vteen_user');
      return;
    }
    setUser(userData);
    localStorage.setItem('vteen_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vteen_user');
    setActiveTab('home');
    setWatchingSlug(null);
  };

  return (
    <div className="h-[100dvh] text-white relative overflow-hidden bg-transparent">
      <UniverseBackground />

      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
            className="fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden bg-[#05070a]"
          >
            <UniverseBackground />
            <motion.div
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 0.95, scale: 1 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="absolute h-72 w-72 rounded-full border border-primary/18 shadow-[0_0_80px_rgba(6,182,212,0.22),inset_0_0_70px_rgba(124,58,237,0.16)]"
            />
            <motion.div
              initial={{ opacity: 0, rotate: 0, scale: 0.92 }}
              animate={{ opacity: 1, rotate: 360, scale: 1 }}
              transition={{ opacity: { duration: 0.7 }, rotate: { duration: 9, ease: 'linear', repeat: Infinity }, scale: { duration: 0.9 } }}
              className="absolute h-56 w-56 rounded-full border border-dashed border-white/12"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute h-36 w-36 rounded-full bg-primary/18 blur-3xl"
            />
            <motion.div
              initial={{ scale: 0.78, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              className="relative z-10 text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.18, duration: 0.68, ease: 'easeOut' }}
                className="mb-4 drop-shadow-[0_0_34px_rgba(6,182,212,0.34)]"
              >
                <Logo size="xl" layout="vertical" />
              </motion.div>
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.55 }}
                className="mx-auto mb-4 h-px w-36 origin-center bg-linear-to-r from-transparent via-primary to-transparent"
              />
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.72, duration: 0.5 }}
                className="text-xs font-black uppercase tracking-[0.55em] text-primary/90"
              >
                By Chin
              </motion.p>
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 112, opacity: 1 }}
                transition={{ delay: 1.05, duration: 0.7, ease: 'easeOut' }}
                className="mx-auto mt-8 h-1 overflow-hidden rounded-full bg-white/10"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: updateStatus ? `${updateProgress - 100}%` : '100%' }}
                  transition={{ 
                    duration: updateStatus ? 0.3 : 1.1, 
                    ease: updateStatus ? 'linear' : 'easeInOut', 
                    repeat: updateStatus ? 0 : Infinity 
                  }}
                  className="h-full w-full rounded-full bg-primary shadow-[0_0_18px_rgba(6,182,212,0.85)]"
                />
              </motion.div>
              {updateStatus && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex flex-col items-center gap-1"
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/80">
                    {updateStatus}
                  </span>
                  {updateProgress > 0 && (
                    <span className="text-[14px] font-black text-white/90">
                      {updateProgress}%
                    </span>
                  )}
                </motion.div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 h-full">
        {!user ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
          <AnimatePresence mode="wait">
            {!watchingSlug && (
              <motion.main
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto overscroll-none pb-32"
              >
                {activeTab === 'home' && <HomeScreen onWatch={(slug: string) => setWatchingSlug(slug)} />}
                {activeTab === 'driver' && (
                  <ErrorBoundary>
                    <DriverScreen user={user} />
                  </ErrorBoundary>
                )}
                {activeTab === 'profile' && (
                  <ProfileScreen user={user} onLogout={handleLogout} onWatch={(slug: string) => setWatchingSlug(slug)} />
                )}
              </motion.main>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {watchingSlug && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[1000]"
              >
                <ErrorBoundary>
                  <WatchScreen slug={watchingSlug} onBack={() => setWatchingSlug(null)} onUnauthorized={handleLogout} />
                </ErrorBoundary>
              </motion.div>
            )}
          </AnimatePresence>

          {!watchingSlug && <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />}
          </>
        )}
      </div>
    </div>
  );
}

export default App
