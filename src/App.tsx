import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomTabs from './components/BottomTabs'
import HomeScreen from './screens/HomeScreen'
import WatchScreen from './screens/WatchScreen'
import LoginScreen from './screens/LoginScreen'
import HubScreen from './screens/HubScreen'
import ProfileScreen from './screens/ProfileScreen'
import { CONFIG } from './config'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('vteen_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.api_token) setUser(parsed);
      } catch (e) {
        localStorage.removeItem('vteen_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData: any) => {
    if (!userData?.api_token) {
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

  const handleWatch = (slug: string) => {
    setWatchingSlug(slug);
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-500">
        <div className="flex flex-col items-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-linear-to-tr from-primary to-violet-600 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-primary/40 mb-6">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white -rotate-12">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">VTEEN</h1>
          <div className="w-12 h-1 bg-primary mt-2 rounded-full animate-shimmer" />
        </div>
      </div>
    );
  }

  if (loading) return null;

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen bg-background text-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.main 
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 overflow-y-auto overscroll-none"
          >
            {activeTab === 'home' && <HomeScreen onWatch={handleWatch} />}
            {activeTab === 'hub' && <HubScreen />}
            {activeTab === 'profile' && (
              <ProfileScreen 
                user={user} 
                onLogout={handleLogout} 
                onWatch={handleWatch} 
              />
            )}
          </motion.main>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {watchingSlug && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000]"
          >
            <WatchScreen 
              slug={watchingSlug} 
              onBack={() => setWatchingSlug(null)} 
              onUnauthorized={handleLogout}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!watchingSlug && (
        <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  )
}

export default App
