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
    // 🏮 EMERGENCY: TẮT TOÀN BỘ OTA ĐỂ CỨU APP KHỎI LOOP
    console.log('🏮 OTA: EMERGENCY DISABLE. Entering App...');
    
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);

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
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, 0, -1, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Logo size="xl" layout="vertical" />
                </motion.div>
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute -bottom-10 left-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                />
              </div>

              <div className="mt-20 flex flex-col items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-cyan-400 font-bold tracking-[0.2em] text-sm uppercase"
                >
                  Premium Private Hub
                </motion.div>
                
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ 
                        duration: 1.2, 
                        repeat: Infinity, 
                        delay: i * 0.2 
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-cyan-500"
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
