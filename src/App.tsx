import { useState, useEffect } from 'react'
import BottomTabs from './components/BottomTabs'
import HomeScreen from './screens/HomeScreen'
import WatchScreen from './screens/WatchScreen'
import LoginScreen from './screens/LoginScreen'
import MoviesScreen from './screens/MoviesScreen'
import HubScreen from './screens/HubScreen'
import ProfileScreen from './screens/ProfileScreen'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSplash, setShowSplash] = useState(true);
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('vteen_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser?.api_token) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('vteen_user');
        }
      } catch {
        localStorage.removeItem('vteen_user');
      }
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
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

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen bg-background text-white flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto overscroll-none relative z-0 animate-in fade-in duration-500">
        {activeTab === 'home' && <HomeScreen onWatch={handleWatch} />}
        {activeTab === 'movies' && <MoviesScreen onWatch={handleWatch} />}
        {activeTab === 'hub' && <HubScreen />}
        {activeTab === 'profile' && (
          <ProfileScreen 
            user={user} 
            onLogout={handleLogout} 
            onWatch={handleWatch} 
          />
        )}
      </main>

      {watchingSlug && (
        <WatchScreen 
          slug={watchingSlug} 
          onBack={() => setWatchingSlug(null)} 
          onUnauthorized={handleLogout}
        />
      )}

      {!watchingSlug && (
        <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  )
}

export default App
