import { useState, useEffect } from 'react'
import BottomTabs from './components/BottomTabs'
import HomeScreen from './screens/HomeScreen'
import WatchScreen from './screens/WatchScreen'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSplash, setShowSplash] = useState(true);
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null);

  useEffect(() => {
    // Giả lập splash screen trong 2 giây
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Hàm để bắt đầu xem phim
  const handleWatch = (slug: string) => {
    setWatchingSlug(slug);
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-100">
        <div className="relative">
          <h1 className="text-6xl font-black text-primary tracking-tighter animate-pulse">VTEEN</h1>
          <div className="absolute -bottom-4 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent animate-shimmer" />
        </div>
        <p className="mt-8 text-text-dim text-sm tracking-widest uppercase animate-bounce">Private Movie Hub</p>
      </div>
    );
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
          <div className="p-10 text-center text-text-dim pt-32">
            <h2 className="text-xl font-bold mb-2">Cá nhân</h2>
            <p>Quản lý tài khoản và lịch sử xem.</p>
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
