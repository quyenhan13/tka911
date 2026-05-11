import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { App as CapApp } from '@capacitor/app'

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
    // 🏮 THÔNG BÁO APP ĐÃ SẴN SÀNG (CHỐNG LOOP)
    CapacitorUpdater.notifyAppReady();

    const initOTA = async () => {
      try {
        console.log('🏮 OTA: Checking for stable updates...');
        // Kiểm tra phiên bản mới nhất từ Github Release (qua Capgo/update.php)
        const update = await CapacitorUpdater.download({
          url: 'https://vteen.shop/api/update.php' // Endpoint điều hướng OTA
        });

        if (update.version) {
          console.log('🏮 OTA: Found new version:', update.version);
          
          // Lưu vết phiên bản để tránh update đè liên tục
          const lastVersion = localStorage.getItem('vteen_ota_version');
          if (lastVersion !== update.version) {
            console.log('🏮 OTA: Applying update and rebooting...');
            localStorage.setItem('vteen_ota_version', update.version);
            await CapacitorUpdater.set({ id: update.id });
          }
        }
      } catch (err) {
        console.warn('🏮 OTA Check failed (Normal if offline):', err);
      }
    };

    // Chạy OTA sau khi Splash đã hiện xong để ko bị lag
    const otaTimer = setTimeout(initOTA, 3000);

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => {
      clearTimeout(otaTimer);
      clearTimeout(splashTimer);
    };
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
  };

  const renderScreen = () => {
    if (!user) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;

    switch (activeTab) {
      case 'home':
        return <HomeScreen onWatch={(slug) => {
          setWatchingSlug(slug);
          setActiveTab('watch');
        }} />;
      case 'watch':
        return <WatchScreen slug={watchingSlug || ''} onBack={() => setActiveTab('home')} />;
      case 'profile':
        return (
          <ProfileScreen 
            user={user} 
            onLogout={handleLogout} 
            onWatch={(slug) => {
              setWatchingSlug(slug);
              setActiveTab('watch');
            }} 
          />
        );
      case 'driver':
        return <DriverScreen user={user} />;
      default:
        return <HomeScreen onWatch={(slug) => {
          setWatchingSlug(slug);
          setActiveTab('watch');
        }} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-purple-500/30">
        <UniverseBackground />
        
        <AnimatePresence mode="wait">
          {showSplash ? (
            <motion.div
              key="splash"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.6 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
            >
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Logo size="xl" layout="vertical" />
              </motion.div>
              
              <div className="mt-16 flex flex-col items-center gap-4">
                <div className="text-cyan-400/60 font-bold tracking-[0.3em] text-[10px] uppercase">
                  Initializing Premium Hub
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1 h-1 rounded-full bg-cyan-500"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.main
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 pb-20 safe-area-bottom"
            >
              {renderScreen()}
              <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

export default App;
