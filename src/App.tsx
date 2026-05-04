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

const fmt = (s: number) => {
  if (typeof s !== 'number' || !Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [watchingSlug, setWatchingSlug] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [tubeExpanded, setTubeExpanded] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressInterval = useRef<any>(null);
  const playlistRef = useRef<Video[]>([]);
  const ytListeningRef = useRef(false);
  const pendingPlayRef = useRef<Video | null>(null);
  const playRetryTimersRef = useRef<number[]>([]);
  const embedOrigin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const iframeSrc =
    `https://www.youtube.com/embed/jfKfPfyJRdk?enablejsapi=1&playsinline=1&controls=0&autoplay=0&mute=0` +
    (embedOrigin ? `&origin=${encodeURIComponent(embedOrigin)}` : '');

  // Send postMessage to YouTube iframe
  const sendCommand = useCallback((func: string, args?: any[]) => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args: args || [] }),
        '*'
      );
    } catch (e) {}
  }, []);

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

    const onMessage = (e: MessageEvent) => {
      try {
        // YT sends JSON string or object
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data || !data.event) return;

        if (data.event === 'listening') {
          ytListeningRef.current = true;
          const pending = pendingPlayRef.current;
          if (pending) {
            pendingPlayRef.current = null;
            ytSendPlay(pending);
          }
        }

        if (data.event === 'onStateChange') {
          const state = data.info; // 1=PLAYING, 2=PAUSED, 0=ENDED
          if (state === 1) {
            setIsPlaying(true);
          } else if (state === 2) {
            setIsPlaying(false);
          } else if (state === 0) {
            playNextRef.current?.();
          }
        }
        if (data.event === 'infoDelivery' && data.info) {
          const ct = data.info.currentTime;
          if (typeof ct === 'number' && Number.isFinite(ct) && ct >= 0) {
            setCurrentTime(ct);
          }
          const dur = data.info.duration;
          if (typeof dur === 'number' && Number.isFinite(dur) && dur > 0) {
            setDuration(dur);
          }
        }
      } catch (err) {}
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      stopProgressLoop();
      playRetryTimersRef.current.forEach((t) => window.clearTimeout(t));
      playRetryTimersRef.current = [];
    };
  }, []);

  const playNextRef = useRef<(() => void) | undefined>(undefined);

  const ytSendPlay = useCallback(
    (video: Video) => {
      playRetryTimersRef.current.forEach((t) => window.clearTimeout(t));
      playRetryTimersRef.current = [];

      const perform = () => {
        sendCommand('unMute');
        sendCommand('setVolume', [100]);
        sendCommand('loadVideoById', [video.id]);
        sendCommand('playVideo');
        sendCommand('getDuration');
        sendCommand('getCurrentTime');
      };

      // iOS/WKWebView có thể nuốt lệnh đầu; gửi lại theo nhiều nhịp để đảm bảo phát.
      perform();
      [120, 380, 850, 1600].forEach((ms) => {
        const timer = window.setTimeout(perform, ms);
        playRetryTimersRef.current.push(timer);
      });
    },
    [sendCommand]
  );

  const stopProgressLoop = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const playVideo = useCallback(
    (video: Video, list?: Video[]) => {
      if (list) playlistRef.current = list;
      setCurrentVideo(video);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
      if (activeTab === 'tube') setTubeExpanded(true);
      if (!ytListeningRef.current) {
        pendingPlayRef.current = video;
        return;
      }
      ytSendPlay(video);
    },
    [ytSendPlay, activeTab]
  );

  useEffect(() => {
    if (!currentVideo) {
      setTubeExpanded(false);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      return;
    }
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      sendCommand('getCurrentTime');
      sendCommand('getDuration');
    }, 500);
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [currentVideo?.id, sendCommand]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      sendCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      sendCommand('unMute');
      sendCommand('setVolume', [100]);
      sendCommand('playVideo');
      setIsPlaying(true);
    }
  }, [isPlaying, sendCommand]);

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

  const playPrevRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => { playPrevRef.current = playPrev; }, [playPrev]);
  useEffect(() => { playNextRef.current = playNext; }, [playNext]);

  const handleSeek = (val: number) => {
    setCurrentTime(val);
    sendCommand('seekTo', [val, true]);
  };

  // Media Session
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentVideo) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentVideo.title,
      artist: currentVideo.channelTitle,
      artwork: [{ src: currentVideo.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
    });
    navigator.mediaSession.setActionHandler('play', togglePlay);
    navigator.mediaSession.setActionHandler('pause', togglePlay);
    navigator.mediaSession.setActionHandler('nexttrack', () => playNextRef.current?.());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevRef.current?.());
  }, [currentVideo, togglePlay]);

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

          <AnimatePresence>
            {currentVideo && !watchingSlug && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-[5.8rem] left-0 right-0 z-[60] px-3 pointer-events-none"
              >
                <div className="bg-[#0f141f] border border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.6)] overflow-hidden rounded-2xl pointer-events-auto relative">
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
                    <button
                      type="button"
                      className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-80"
                      onClick={() => setTubeExpanded(true)}
                    >
                      <div className="relative w-9 h-9 flex-shrink-0">
                        <img
                          src={currentVideo.thumbnail}
                          alt=""
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
                    </button>

                    <span className="text-[9px] text-white/40 font-mono flex-shrink-0">
                      {fmt(currentTime)}/{fmt(duration)}
                    </span>

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
            {tubeExpanded && currentVideo && !watchingSlug && (
              <motion.div
                key="tube-expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[900] flex flex-col bg-[#050510]/95 backdrop-blur-xl"
                style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
              >
                <button
                  type="button"
                  aria-label="Đóng trình phát"
                  className="absolute top-3 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/20"
                  style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
                  onClick={() => setTubeExpanded(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex-1 flex flex-col justify-center px-6 pt-14 pb-8 min-h-0">
                  <div className="w-full max-w-sm mx-auto aspect-square max-h-[45vh] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 mb-8">
                    <img
                      src={currentVideo.thumbnail}
                      alt=""
                      className={`w-full h-full object-cover ${isPlaying ? 'scale-[1.02]' : ''}`}
                    />
                  </div>
                  <div className="text-center mb-6 px-2">
                    <h2 className="text-lg font-bold text-white leading-snug line-clamp-2">{currentVideo.title}</h2>
                    <p className="text-sm text-primary mt-2">{currentVideo.channelTitle}</p>
                  </div>
                  <div
                    className="h-1.5 w-full bg-white/10 rounded-full relative cursor-pointer mb-2"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      handleSeek(ratio * (duration || 0));
                    }}
                  >
                    <div
                      className="absolute h-full bg-primary rounded-full shadow-[0_0_12px_#06b6d4]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-white/40 font-mono mb-8">
                    <span>{fmt(currentTime)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-10">
                    <button type="button" onClick={playPrev} className="text-white/50 active:text-white p-2">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                    </button>
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center active:scale-95 shadow-xl"
                    >
                      {isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 ml-1"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </button>
                    <button type="button" onClick={playNext} className="text-white/50 active:text-white p-2">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
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
        Trực tiếp nhúng iframe để vượt mặt WebView iOS.
        ID jfKfPfyJRdk (Lofi Girl) làm video mồi để YouTube load JS nội bộ.
      */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 50,
          height: 50,
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <iframe
          ref={iframeRef}
          width="1"
          height="1"
          src={iframeSrc}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen={false}
          style={{ border: 'none', position: 'absolute', width: 1, height: 1, opacity: 0.01 }}
          title="yt-player"
          onLoad={() => {
            if (ytListeningRef.current) return;
            window.setTimeout(() => {
              if (!ytListeningRef.current) ytListeningRef.current = true;
              const pending = pendingPlayRef.current;
              if (pending) {
                pendingPlayRef.current = null;
                ytSendPlay(pending);
              }
            }, 800);
          }}
        />
      </div>
    </div>
  );
}

export default App
