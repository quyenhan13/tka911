import { useState, useEffect } from 'react'
import BottomTabs from './components/BottomTabs'
import HomeScreen from './screens/HomeScreen'
import WatchScreen from './screens/WatchScreen'
import LoginScreen from './screens/LoginScreen'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSplash, setShowSplash] = useState(true);
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Kiểm tra session đã lưu trong máy
    const savedUser = localStorage.getItem('vteen_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    localStorage.setItem('vteen_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vteen_user');
    setActiveTab('home');
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

  // Nếu chưa đăng nhập, hiện màn hình Login
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      {/* Main Content Area */}
      <main className="animate-in fade-in duration-500">
        {activeTab === 'home' && <HomeScreen onWatch={handleWatch} />}
        {activeTab === 'movies' && (
          <div className="p-10 text-center text-text-dim pt-32">
            <h2 className="text-xl font-bold mb-2">Kho Phim</h2>
            <p>Tính năng đang được phát triển...</p>
          </div>
        )}
        {activeTab === 'vip' && (
          <div className="p-10 text-center text-text-dim pt-32">
            <h2 className="text-xl font-bold mb-2 text-vip">Gói VIP</h2>
            <p>Trải nghiệm xem phim không giới hạn.</p>
          </div>
        )}
        {activeTab === 'hub' && (
          <div className="p-10 text-center text-text-dim pt-32">
            <h2 className="text-xl font-bold mb-2">Private Hub</h2>
            <p>Lưu trữ nội dung cá nhân của bạn.</p>
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="p-10 text-center flex flex-col items-center pt-32">
            <div className="w-24 h-24 rounded-full bg-linear-to-r from-primary to-violet-600 p-1 mb-4 shadow-xl shadow-primary/20">
              <img 
                src={`https://ui-avatars.com/api/?name=${user.display_name}&background=111&color=fff`} 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-black text-white">{user.display_name}</h2>
            <p className="text-text-dim text-xs uppercase tracking-widest mt-1">{user.role}</p>
            
            <button 
              onClick={handleLogout}
              className="mt-10 text-red-400 font-bold text-sm bg-red-400/10 px-8 py-3 rounded-2xl active:scale-95 transition-all"
            >
              ĐĂNG XUẤT
            </button>
          </div>
        )}
      </main>

      {/* Watch Screen Overlay */}
      {watchingSlug && (
        <WatchScreen 
          slug={watchingSlug} 
          onBack={() => setWatchingSlug(null)} 
        />
      )}

      {/* Navigation (Ẩn khi đang xem phim) */}
      {!watchingSlug && (
        <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  )
}

export default App
