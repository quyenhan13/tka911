import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

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

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      try { CapacitorUpdater.notifyAppReady(); } catch {}

      const initOTA = async () => {
        try {
          const res = await fetch('https://vteen.shop/api/update.php');
          const info = await res.json();
          if (info.status === 'success' && info.url) {
            const last = localStorage.getItem('vteen_ota_version');
            if (last !== info.version) {
              const bundle = await CapacitorUpdater.download({ url: info.url, version: info.version });
              localStorage.setItem('vteen_ota_version', info.version);
              await CapacitorUpdater.set({ id: bundle.id });
            }
          }
        } catch {}
      };

      setTimeout(initOTA, 5000);
    }

    const t = setTimeout(() => setShowSplash(false), 1200); // HIG: launch quickly, no long splash
    return () => clearTimeout(t);
  }, []);

  const handleLoginSuccess = (userData: unknown) => {
    if (!isUser(userData)) { localStorage.removeItem('vteen_user'); return; }
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
    <div className="h-[100dvh] text-white relative overflow-hidden bg-[#05070a]">
      {/* UniverseBackground chỉ render 1 lần duy nhất - không duplicate trong Splash nữa */}
      <UniverseBackground />

      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#05070a]"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center"
            >
              <Logo size="xl" layout="vertical" />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500/70"
              >
                By Chin
              </motion.p>
              <div className="mx-auto mt-6 h-0.5 w-24 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
                  className="h-full w-1/2 rounded-full bg-cyan-500"
                />
              </div>
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
                  transition={{ duration: 0.15 }}
                  className="h-full overflow-y-auto overscroll-none pb-32"
                >
                  {activeTab === 'home' && <HomeScreen onWatch={(slug: string) => setWatchingSlug(slug)} />}
                  {activeTab === 'driver' && (
                    <ErrorBoundary><DriverScreen user={user} /></ErrorBoundary>
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
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
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

export default App;
