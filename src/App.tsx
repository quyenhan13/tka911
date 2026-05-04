import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomTabs from './components/BottomTabs'
import HomeScreen from './screens/HomeScreen'
import WatchScreen from './screens/WatchScreen'
import LoginScreen from './screens/LoginScreen'
import ProfileScreen from './screens/ProfileScreen'
import TubeScreen from './screens/TubeScreen'
import UniverseBackground from './components/UniverseBackground'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Music Player State (Global)
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playlist, setPlaylist] = useState<Video[]>([]);
  
  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);

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

    // Load YouTube API
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    const checkInterval = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
        clearInterval(checkInterval);
      }
    }, 500);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      clearInterval(checkInterval);
    };
  }, []);

  const initPlayer = () => {
    if (playerRef.current) return;
    const container = document.getElementById('yt-player-container');
    if (!container || !(window as any).YT || !(window as any).YT.Player) return;

    try {
      playerRef.current = new (window as any).YT.Player('yt-player-container', {
        height: '1',
        width: '1',
        playerVars: { 
          'autoplay': 1, 
          'controls': 0, 
          'playsinline': 1,
          'origin': window.location.origin
        },
        events: {
          'onStateChange': (event: any) => {
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setDuration(playerRef.current.getDuration());
              startProgressLoop();
            } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === (window as any).YT.PlayerState.ENDED) {
              playNext();
            }
          }
        }
      });
    } catch (e) {
      console.error('YT Error:', e);
    }
  };

  const startProgressLoop = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  };

  const playVideo = (video: Video, list?: Video[]) => {
    if (list) setPlaylist(list);
    setCurrentVideo(video);
    setIsPlaying(true);
    setCurrentTime(0);
    
    if (playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(video.id);
    } else {
      const iframe = document.getElementById('yt-player-direct') as HTMLIFrameElement;
      if (iframe) iframe.src = `https://www.youtube.com/embed/${video.id}?autoplay=1`;
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const idx = playlist.findIndex(v => v.id === currentVideo?.id);
    playVideo(playlist[(idx + 1) % playlist.length]);
  };

  const playPrev = () => {
    if (playlist.length === 0) return;
    const idx = playlist.findIndex(v => v.id === currentVideo?.id);
    playVideo(playlist[(idx - 1 + playlist.length) % playlist.length]);
  };

  const handleSeek = (val: number) => {
    setCurrentTime(val);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(val, true);
    }
  };


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

  return (
    <div className="h-[100dvh] text-white relative overflow-hidden bg-transparent">
      <UniverseBackground />
      
      {!user ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.main 
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto overscroll-none pb-32"
            >
              {activeTab === 'home' && <HomeScreen onWatch={handleWatch} />}
              {activeTab === 'tube' && (
                <ErrorBoundary>
                  <TubeScreen 
                    currentVideo={currentVideo}
                    playVideo={playVideo}
                  />
                </ErrorBoundary>
              )}
              {activeTab === 'profile' && (
                <ProfileScreen 
                  user={user} 
                  onLogout={handleLogout} 
                  onWatch={handleWatch} 
                />
              )}
            </motion.main>
          </AnimatePresence>

          {/* SoundCloud-style Bottom Player */}
          <AnimatePresence>
            {currentVideo && !watchingSlug && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-[5.8rem] left-0 right-0 z-[60] px-3 pointer-events-none"
              >
                <div className="bg-[#0f141f] border border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.6)] overflow-hidden rounded-2xl pointer-events-auto">
                  {/* Progress Line at Top */}
                  <div className="h-0.5 w-full bg-white/5 relative">
                    <div 
                      className="absolute h-full bg-primary shadow-[0_0_8px_#06b6d4]" 
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <img 
                          src={currentVideo.thumbnail} 
                          className={`w-full h-full rounded-lg object-cover border border-white/10 ${isPlaying ? 'animate-pulse' : ''}`} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="overflow-hidden whitespace-nowrap">
                          <h4 className={`text-[13px] font-bold text-white truncate ${currentVideo.title.length > 30 ? 'animate-marquee' : ''}`}>
                            {currentVideo.title}
                          </h4>
                        </div>
                        <p className="text-[10px] text-primary/80 font-medium truncate">{currentVideo.channelTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 pr-2">
                      <button onClick={playPrev} className="text-white/40 hover:text-white transition-colors">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                      </button>
                      <button 
                        onClick={togglePlay} 
                        className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center active:scale-90 transition-transform"
                      >
                        {isPlaying ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </button>
                      <button onClick={playNext} className="text-white/40 hover:text-white transition-colors">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Hidden Seek Control Area */}
                  <input 
                    type="range" min="0" max={duration || 100} value={currentTime || 0}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="absolute top-0 left-0 w-full h-1 opacity-0 z-20 cursor-pointer"
                  />
                </div>
              </motion.div>
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
        </>
      )}

      {/* YouTube Player Containers (Stable Wrapper) */}
      <div className="fixed bottom-0 right-0 w-px h-px opacity-0 pointer-events-none z-[-1]">
        <div id="yt-player-container"></div>
        <iframe id="yt-player-direct" allow="autoplay"></iframe>
      </div>
    </div>
  )
}

export default App
