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
    }, 1500);
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
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-[#05070a]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <h1 className="text-4xl font-black tracking-tighter mb-2">VTEEN</h1>
              <p className="text-primary text-xs font-bold uppercase tracking-[0.4em] opacity-80">By Chin</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
  );
}

export default App
