import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  const ytSendPlayRef = useRef<(video: Video) => void>(() => {});
  const iframeLoadGenRef = useRef(0);

  const bootVideoId = 'jfKfPfyJRdk';
  const embedVideoId = currentVideo?.id ?? bootVideoId;
  
  const iframeSrc = useMemo(() => {
    const id = currentVideo?.id ?? bootVideoId;
    // Dùng Proxy Player trên server để lách luật YouTube Error 153.
    // Proxy này (yt_player.php) sẽ có Referrer là vteen.shop nên YouTube sẽ cho phép phát nhạc.
    return `https://vteen.shop/yt_player.php?id=${id}`;
  }, [currentVideo]);

  // Send postMessage to YouTube iframe
  const sendCommand = useCallback((func: string, args?: any[]) => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      // Gửi lệnh theo định dạng đơn giản cho Proxy nhận
      iframeRef.current.contentWindow.postMessage({ func, args: args || [] }, '*');
      
      // Vẫn gửi định dạng chuẩn của YouTube để phòng hờ
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
        // Xử lý bộ giao tiếp tùy chỉnh từ Proxy (VTEEN_PROGRESS)
        if (data.type === 'VTEEN_PROGRESS') {
          if (typeof data.currentTime === 'number') setCurrentTime(data.currentTime);
          if (typeof data.duration === 'number') setDuration(data.duration);
          
          // Cập nhật trạng thái chơi nhạc từ proxy
          if (data.state === 1) setIsPlaying(true);
          else if (data.state === 2) setIsPlaying(false);
          return;
        }

        if (data.type === 'VTEEN_STATE') {
          if (data.state === 1) setIsPlaying(true);
          else if (data.state === 2) setIsPlaying(false);
          else if (data.state === 0) playNextRef.current?.();
          return;
        }

        if (data.event === 'listening') {
          ytListeningRef.current = true;
          const pending = pendingPlayRef.current;
          if (pending) {
            pendingPlayRef.current = null;
            ytSendPlayRef.current(pending);
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
        
        // Bắt lỗi từ YouTube iframe
        if (data.event === 'onError') {
          console.warn('YouTube Player Error:', data.info);
          playNextRef.current?.();
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
      };

      // Chỉ gọi 1 lần duy nhất để tránh bị ngắt nhạc (vấp)
      perform();
    },
    [sendCommand]
  );

  useEffect(() => {
    ytSendPlayRef.current = ytSendPlay;
  }, [ytSendPlay]);

  const stopProgressLoop = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const playVideo = useCallback(
    (video: Video, list?: Video[]) => {
      if (list) playlistRef.current = list;
      pendingPlayRef.current = video;
      const sameTrack = currentVideo?.id === video.id;
      setCurrentVideo(video);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
      if (activeTab === 'tube') setTubeExpanded(true);
      if (sameTrack && ytListeningRef.current) {
        ytSendPlay(video);
        return;
      }
      ytListeningRef.current = false;
    },
    [ytSendPlay, activeTab, currentVideo?.id]
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
    const handlePlay = () => {
      sendCommand('unMute');
      sendCommand('setVolume', [100]);
      sendCommand('playVideo');
      setIsPlaying(true);
    };

    navigator.mediaSession.setActionHandler('play', handlePlay);
    navigator.mediaSession.setActionHandler('pause', () => {
      sendCommand('pauseVideo');
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => playNextRef.current?.());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevRef.current?.());
    
    // Đảm bảo trạng thái luôn được cập nhật lên hệ thống
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [currentVideo, isPlaying, sendCommand]);

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
    setCurrentVideo(null);
    setTubeExpanded(false);
    pendingPlayRef.current = null;
    ytListeningRef.current = false;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Mẹo giữ nhịp âm thanh cho iOS (Background Audio Hack)
  const silentAudioSrc = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

  return (
    <div className="h-[100dvh] text-white relative overflow-hidden bg-transparent">
      <UniverseBackground />
      
      {/* Hidden native audio to keep session alive on iOS */}
      <audio 
        src={silentAudioSrc} 
        autoPlay 
        loop 
        muted={!isPlaying}
        style={{ display: 'none' }} 
      />

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
                <div className="bg-[#0f141f]/80 backdrop-blur-xl border border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.6)] overflow-hidden rounded-2xl pointer-events-auto relative">
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

          {/* Full Screen Player Overlay (Music App Feel) */}
          <AnimatePresence>
            {tubeExpanded && currentVideo && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[900] bg-[#050510]/95 backdrop-blur-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
              >
                {/* Header */}
                <div className="flex shrink-0 justify-between items-center px-6 pt-4">
                  <button
                    onClick={() => setTubeExpanded(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 active:bg-white/10"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <span className="text-[10px] font-black tracking-widest text-primary/40 uppercase">VTEEN MUSIC</span>
                  <div className="w-10" />
                </div>

                {/* Main Content: Rotating CD */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-hidden">
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                      className="relative w-[75vw] aspect-square max-w-sm rounded-full shadow-[0_0_80px_rgba(0,0,0,0.8)] border-8 border-[#111]"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl" />
                      <img
                        src={currentVideo.thumbnail}
                        className="w-full h-full rounded-full object-cover shadow-2xl"
                        alt=""
                      />
                      {/* Inner CD Ring */}
                      <div className="absolute inset-0 rounded-full border-[20px] border-black/10 pointer-events-none" />
                      {/* Center Hole */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#050510] border-4 border-white/10 shadow-inner" />
                    </motion.div>
                    
                    {/* Visualizer Pulsing Effect */}
                    {isPlaying && (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="absolute inset-0 rounded-full border-2 border-primary/20 pointer-events-none"
                      />
                    )}
                  </div>

                  <div className="mt-12 text-center w-full max-w-sm">
                    <h2 className="text-xl font-bold text-white line-clamp-2 leading-tight">{currentVideo.title}</h2>
                    <p className="text-primary mt-2 font-medium tracking-wide">{currentVideo.channelTitle}</p>
                  </div>
                </div>

                {/* Controls Area */}
                <div className="px-8 pb-12 w-full max-w-lg mx-auto">
                  {/* Seekbar */}
                  <div className="space-y-3">
                    <div
                      className="h-1.5 w-full bg-white/10 rounded-full relative cursor-pointer group"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const ratio = (e.clientX - rect.left) / rect.width;
                        handleSeek(ratio * (duration || 0));
                      }}
                    >
                      <div
                        className="absolute h-full bg-primary rounded-full shadow-[0_0_15px_#06b6d4]"
                        style={{ width: `${progress}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
                        style={{ left: `calc(${progress}% - 8px)` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-white/30 tracking-tighter">
                      <span>{fmt(currentTime)}</span>
                      <span>{fmt(duration)}</span>
                    </div>
                  </div>

                  {/* Playback Buttons */}
                  <div className="flex items-center justify-between mt-8">
                    <button className="text-white/20 active:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7 7h2v10H7zm3 5 8 5V7z"/></svg>
                    </button>
                    <div className="flex items-center gap-8">
                      <button onClick={playPrev} className="text-white/60 active:text-white active:scale-90 transition-all">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                      </button>
                      <button
                        onClick={togglePlay}
                        className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all"
                      >
                        {isPlaying ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </button>
                      <button onClick={playNext} className="text-white/60 active:text-white active:scale-90 transition-all">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                      </button>
                    </div>
                    <button className="text-white/20 active:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h10v2H7z"/></svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden YouTube iframe (Luôn tồn tại để giữ nhạc chạy xuyên suốt) */}
          {currentVideo && (
            <iframe
              key={embedVideoId}
              ref={iframeRef}
              src={iframeSrc}
              allow="autoplay; encrypted-media; fullscreen"
              title="yt-player"
              className="fixed bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none z-[-1]"
              onLoad={() => {
                const gen = ++iframeLoadGenRef.current;
                window.setTimeout(() => {
                  if (gen !== iframeLoadGenRef.current) return;
                  ytListeningRef.current = true;
                  const pending = pendingPlayRef.current;
                  if (pending) {
                    pendingPlayRef.current = null;
                    ytSendPlayRef.current(pending);
                  }
                }, 400);
              }}
            />
          )}

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
    </div>
  );
}

export default App
