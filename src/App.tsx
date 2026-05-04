import { useState, useEffect, useRef, useCallback } from 'react'
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

// Format seconds → mm:ss
const fmt = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// Lấy origin hợp lệ cho WKWebView (iOS IPA)
const getSafeOrigin = () => {
  const origin = window.location.origin;
  if (!origin || origin === 'null' || origin.startsWith('file') || origin.startsWith('capacitor')) {
    return 'https://vteen.shop';
  }
  return origin;
};

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Music Player State
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const playlistRef = useRef<Video[]>([]);


  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);
  const pendingVideoRef = useRef<string | null>(null);

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

    // Load YouTube IFrame API
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // Lắng nghe message từ iframe (iOS cần cách này)
    // Đã xóa manual postMessage, sử dụng YT.Player API chuẩn.
  }, []);

  // Ref để tránh stale closure trong playNext
  const playNextRef = useRef<(() => void) | undefined>(undefined);

  const startProgressLoop = () => {
    stopProgressLoop();
    progressInterval.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const t = playerRef.current.getCurrentTime();
        const d = playerRef.current.getDuration();
        if (t > 0) setCurrentTime(t);
        if (d > 0) setDuration(d);
      }
    }, 500);
  };

  const stopProgressLoop = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  // Init YT Player object
  useEffect(() => {
    const tryInit = () => {
      if (playerRef.current || !(window as any).YT?.Player) return;
      const el = document.getElementById('yt-hidden-player');
      if (!el) return;
      try {
        playerRef.current = new (window as any).YT.Player('yt-hidden-player', {
          width: '200',
          height: '200',
          videoId: 'jfKfPfyJRdk', // Default video to ensure full initialization
          playerVars: {
            autoplay: 0,
            controls: 0,
            playsinline: 1,
            mute: 0,
            origin: getSafeOrigin()
          },
          events: {
            onReady: (e: any) => {
              e.target.unMute();
              e.target.setVolume(100);
              if (pendingVideoRef.current) {
                e.target.loadVideoById(pendingVideoRef.current);
                pendingVideoRef.current = null;
              }
            },
            onStateChange: (e: any) => {
              if (e.data === 1) {
                playerRef.current?.unMute?.();
                playerRef.current?.setVolume?.(100);
                setIsPlaying(true);
                setDuration(playerRef.current?.getDuration?.() || 0);
                startProgressLoop();
              } else if (e.data === 2) {
                setIsPlaying(false);
                stopProgressLoop();
              } else if (e.data === 0) {
                stopProgressLoop();
                playNextRef.current?.();
              }
            }
          }
        });
      } catch {}
    };

    (window as any).onYouTubeIframeAPIReady = tryInit;
    const iv = setInterval(() => {
      if ((window as any).YT?.Player) { tryInit(); clearInterval(iv); }
    }, 300);
    return () => clearInterval(iv);
  }, []);

  // Media Session (Lock Screen Controls)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentVideo) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentVideo.title,
      artist: currentVideo.channelTitle,
      artwork: [{ src: currentVideo.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
    });
    navigator.mediaSession.setActionHandler('play', () => {
      playerRef.current?.unMute?.();
      playerRef.current?.setVolume?.(100);
      playerRef.current?.playVideo?.();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      playerRef.current?.pauseVideo?.();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => playNextRef.current?.());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevRef.current?.());
  }, [currentVideo]);

  const playVideo = useCallback((video: Video, list?: Video[]) => {
    // iOS: Gọi API của YouTube TRƯỚC TIÊN, ngay lập tức trong call stack của sự kiện onClick
    if (playerRef.current?.loadVideoById) {
      try {
        playerRef.current.unMute?.();
        playerRef.current.setVolume?.(100);
        playerRef.current.loadVideoById(video.id);
        playerRef.current.playVideo?.();
      } catch (e) {}
    } else {
      // Player chưa sẵn sàng — lưu lại để phát sau
      pendingVideoRef.current = video.id;
    }

    if (list) playlistRef.current = list;
    setCurrentVideo(video);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pauseVideo?.();
      setIsPlaying(false);
    } else {
      // iOS: unMute trong user gesture
      playerRef.current?.unMute?.();
      playerRef.current?.setVolume?.(100);
      playerRef.current?.playVideo?.();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const playNext = useCallback(() => {
    const pl = playlistRef.current;
    setCurrentVideo(cv => {
      if (!cv || pl.length === 0) return cv;
      const idx = pl.findIndex(v => v.id === cv.id);
      const next = pl[(idx + 1) % pl.length];
      setTimeout(() => playVideo(next), 0);
      return cv;
    });
  }, [playVideo]);

  const playPrev = useCallback(() => {
    const pl = playlistRef.current;
    setCurrentVideo(cv => {
      if (!cv || pl.length === 0) return cv;
      const idx = pl.findIndex(v => v.id === cv.id);
      const prev = pl[(idx - 1 + pl.length) % pl.length];
      setTimeout(() => playVideo(prev), 0);
      return cv;
    });
  }, [playVideo]);

  // Refs để dùng trong closures
  const playPrevRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => { playPrevRef.current = playPrev; }, [playPrev]);
  useEffect(() => { playNextRef.current = playNext; }, [playNext]);

  const handleSeek = (val: number) => {
    setCurrentTime(val);
    playerRef.current?.seekTo?.(val, true);
  };

  const handleLoginSuccess = (userData: any) => {
    if (!userData?.api_token) { localStorage.removeItem('vteen_user'); return; }
    setUser(userData);
    localStorage.setItem('vteen_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vteen_user');
    setActiveTab('home');
    setWatchingSlug(null);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
              {activeTab === 'home' && <HomeScreen onWatch={(slug: string) => setWatchingSlug(slug)} />}
              {activeTab === 'tube' && (
                <ErrorBoundary>
                  <TubeScreen currentVideo={currentVideo} playVideo={playVideo} />
                </ErrorBoundary>
              )}
              {activeTab === 'profile' && (
                <ProfileScreen user={user} onLogout={handleLogout} onWatch={(slug: string) => setWatchingSlug(slug)} />
              )}
            </motion.main>
          </AnimatePresence>

          {/* Mini Player Bar */}
          <AnimatePresence>
            {currentVideo && !watchingSlug && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-[5.8rem] left-0 right-0 z-[60] px-3 pointer-events-none"
              >
                <div className="bg-[#0f141f] border border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.6)] overflow-hidden rounded-2xl pointer-events-auto relative">
                  {/* Thanh tiến độ clickable */}
                  <div
                    className="h-1 w-full bg-white/10 relative cursor-pointer group"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      handleSeek(ratio * (duration || 0));
                    }}
                  >
                    <div
                      className="absolute h-full bg-primary shadow-[0_0_8px_#06b6d4] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: `calc(${progress}% - 6px)` }}
                    />
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 gap-3">
                    {/* Thumbnail + Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative w-9 h-9 flex-shrink-0">
                        <img
                          src={currentVideo.thumbnail}
                          className={`w-full h-full rounded-lg object-cover border border-white/10 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}
                          style={{ borderRadius: '50%' }}
                        />
                        {isPlaying && (
                          <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] font-bold text-white truncate">{currentVideo.title}</h4>
                        <p className="text-[10px] text-primary/80 truncate">{currentVideo.channelTitle}</p>
                      </div>
                    </div>

                    {/* Time Display */}
                    <span className="text-[9px] text-white/40 font-mono flex-shrink-0">
                      {fmt(currentTime)}/{fmt(duration)}
                    </span>

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button onClick={playPrev} className="text-white/40 active:text-white transition-colors p-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                      </button>
                      <button
                        onClick={togglePlay}
                        className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                      >
                        {isPlaying ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </button>
                      <button onClick={playNext} className="text-white/40 active:text-white transition-colors p-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                      </button>
                    </div>
                  </div>
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
                <WatchScreen slug={watchingSlug} onBack={() => setWatchingSlug(null)} onUnauthorized={handleLogout} />
              </motion.div>
            )}
          </AnimatePresence>

          {!watchingSlug && <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />}
        </>
      )}

      {/*
        YouTube player container.
        iOS Safari yêu cầu player phải có kích thước thật và KHÔNG bị opacity/visibility hidden.
      */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 200,
          height: 200,
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        aria-hidden="true"
      >
        <div id="yt-hidden-player" style={{ width: '100%', height: '100%' }}></div>
      </div>
    </div>
  );
}

export default App
