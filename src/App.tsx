import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomTabs from './components/BottomTabs'
import HomeScreen from './screens/HomeScreen'
import WatchScreen from './screens/WatchScreen'
import LoginScreen from './screens/LoginScreen'
import HubScreen from './screens/HubScreen'
import ProfileScreen from './screens/ProfileScreen'
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

  if (loading) return null;

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-[100dvh] bg-background text-white relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.main 
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="h-full overflow-y-auto overscroll-none pb-32"
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
