import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2400);
    return () => clearTimeout(timer);
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
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity }}
                  className="h-full w-1/2 rounded-full bg-primary shadow-[0_0_18px_rgba(6,182,212,0.85)]"
                />
              </motion.div>
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
