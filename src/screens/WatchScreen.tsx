import React, { useCallback, useEffect, useState } from 'react';
import { ScreenOrientation as OrientationPlugin } from '@capacitor/screen-orientation';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { getHistory, removeFromHistory, saveToHistory } from '../storage/watchHistory';
import { toggleFavorite, isFavorite } from '../storage/favorites';
import UniverseBackground from '../components/UniverseBackground';
import { CONFIG } from '../config';

interface Episode {
  episode: string;
  embed_url: string | null;
  embed_url_2: string | null;
  embed_host: string | null;
  embed_host_2: string | null;
}

interface MovieDetails {
  title: string;
  description: string;
  poster: string;
  episodes: Episode[];
}

interface MovieDetailsResponse {
  status: string;
  data?: Partial<MovieDetails> & { episodes?: unknown };
  message?: string;
}

interface WebPlayerState {
  html: string | null;
  src: string | null;
  videoSrc: string | null;
}

interface WatchScreenProps {
  slug: string;
  onBack: () => void;
  onUnauthorized?: () => void;
}

const getYouTubeId = (value: string) => {
  let id = value.trim();
  try {
    if (value.includes('v=')) {
      id = new URL(value).searchParams.get('v') || value;
    } else if (value.includes('embed/')) {
      id = value.split('embed/')[1].split('?')[0];
    } else if (value.includes('shorts/')) {
      id = value.split('shorts/')[1].split('?')[0];
    } else if (value.includes('youtu.be/')) {
      id = value.split('youtu.be/')[1].split('?')[0];
    }
  } catch {
    id = value;
  }

  return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
};

const buildYouTubeEmbedUrl = (id: string) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(CONFIG.SITE_BASE_URL)}&widget_referrer=${encodeURIComponent(CONFIG.SITE_BASE_URL)}`;

const buildEmbedSrc = (embedUrl?: string | null, host?: string | null) => {
  const value = embedUrl?.trim();
  if (!value) return null;

  // 1. Xử lý link YouTube để dùng qua proxy (cần thiết cho một số phim trên server 1)
  const hasYTKeyword = value.includes('youtube.com') || value.includes('youtu.be') || value.includes('youtube-nocookie.com');
  const isYTId = /^[a-zA-Z0-9_-]{11}$/.test(value);
  const isYouTube = isYTId || hasYTKeyword || Boolean(host?.toLowerCase()?.includes('youtube'));

  if (isYouTube) {
    const youtubeId = getYouTubeId(value);
    if (youtubeId) return buildYouTubeEmbedUrl(youtubeId);

    let id = value;
    try {
      if (value.includes('v=')) {
        id = new URL(value).searchParams.get('v') || value;
      } else if (value.includes('embed/')) {
        id = value.split('embed/')[1].split('?')[0];
      } else if (value.includes('shorts/')) {
        id = value.split('shorts/')[1].split('?')[0];
      } else if (value.includes('youtu.be/')) {
        id = value.split('youtu.be/')[1].split('?')[0];
      }
    } catch {
      id = value;
    }
    
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      // Trả về mã HTML trực tiếp để nhúng (srcDoc), tránh lỗi SAMEORIGIN và 153
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>body,html{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center}</style>
        </head>
        <body>
          <iframe 
            width="100%" height="100%" 
            src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&origin=https://vteen.shop&playsinline=1&rel=0&modestbranding=1" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen>
          </iframe>
        </body>
        </html>
      `;
    }
  }

  // 2. Xử lý các link khác, đảm bảo HTTPS và đúng root domain
  const rawDriveId = /^[a-zA-Z0-9_-]{20,}$/.test(value) ? value : null;
  const looksLikeDrive = Boolean(rawDriveId) || value.includes('drive.google.com') || value.includes('docs.google.com') || host?.toLowerCase()?.includes('drive');
  if (looksLikeDrive) {
    try {
      const driveUrl = value.startsWith('http') ? new URL(value) : null;
      const queryId = driveUrl?.searchParams.get('id');
      const pathId = driveUrl?.pathname.match(/\/d\/([^/]+)/)?.[1];
      const driveId = queryId || pathId || rawDriveId;
      if (driveId) {
        return `https://drive.google.com/file/d/${driveId}/preview`;
      }
    } catch {
      const driveId = value.match(/\/d\/([^/]+)/)?.[1];
      if (driveId) {
        return `https://drive.google.com/file/d/${driveId}/preview`;
      }
    }
  }

  let src = value;
  if (value.startsWith('//')) {
    src = `https:${value}`;
  } else if (!value.startsWith('http')) {
    // Nếu là link tương đối (vd: embed.php...), nối với SITE_BASE_URL
    src = new URL(value, `${CONFIG.SITE_BASE_URL}/`).toString();
  }

  // 3. Đảm bảo luôn dùng https và không dùng proxy cho video trên thiết bị thật
  if (src.includes('vteen.shop')) {
    src = src.replace('http://', 'https://');
  }

  return src;
};

const toText = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value) : '');

const normalizeEpisodes = (value: unknown): Episode[] => {
  const rawList = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.values(value)
      : [];

  return rawList
    .map((raw, index): Episode | null => {
      if (!raw || typeof raw !== 'object') return null;
      const item = raw as Record<string, unknown>;
      const embedUrl = toText(item.embed_url || item.url || item.link || item.src).trim() || null;
      const embedUrl2 = toText(item.embed_url_2 || item.backup_url || item.url_2 || item.link_2).trim() || null;
      if (!embedUrl && !embedUrl2) return null;

      return {
        episode: toText(item.episode || item.ep || item.name || index + 1).trim() || String(index + 1),
        embed_url: embedUrl,
        embed_url_2: embedUrl2,
        embed_host: toText(item.embed_host || item.host).trim() || null,
        embed_host_2: toText(item.embed_host_2 || item.host_2).trim() || null
      };
    })
    .filter((episode): episode is Episode => Boolean(episode));
};

const normalizeMovieDetails = (data: MovieDetailsResponse['data']): MovieDetails | null => {
  if (!data) return null;
  return {
    title: toText(data.title).trim() || 'Phim VTEEN',
    description: toText(data.description).trim(),
    poster: toText(data.poster).trim(),
    episodes: normalizeEpisodes(data.episodes)
  };
};

// Đã chuyển sang watch_api.php


const fetchVteenText = async (pathOrUrl: string) => {
  // Đảm bảo pathOrUrl bắt đầu bằng / nếu là path
  const cleanPath = pathOrUrl.startsWith('http') ? pathOrUrl : (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
  const url = cleanPath.startsWith('http') ? cleanPath : `${CONFIG.SITE_BASE_URL}${cleanPath}`;
  
  if (import.meta.env.DEV) {
    const parsed = new URL(url);
    // Luôn dùng /__vteen làm tiền tố duy nhất, loại bỏ mọi tiền tố folder khác nếu có
    const devPath = `/__vteen${parsed.pathname}${parsed.search}${parsed.hash}`;
    
    try {
      const response = await fetch(devPath, { credentials: 'include' });
      if (!response.ok) throw new Error(`Web player HTTP ${response.status}`);
      return response.text();
    } catch (err) {
      console.error('Fetch error:', err);
      // Fallback gọi thẳng
      const directUrl = url.replace('http://', 'https://');
      const response = await fetch(directUrl, { credentials: 'include' });
      return response.text();
    }
  }

  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({ url, responseType: 'text' });
    if (response.status < 200 || response.status >= 300) throw new Error(`Web player HTTP ${response.status}`);
    return typeof response.data === 'string' ? response.data : String(response.data ?? '');
  }

  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(`Web player HTTP ${response.status}`);
  return response.text();
};

// Đã chuyển sang watch_api.php


const toVteenPath = (value: string) => {
  if (value.startsWith('http')) {
    const url = new URL(value);
    return url.origin === CONFIG.SITE_BASE_URL ? `${url.pathname}${url.search}${url.hash}` : value;
  }

  return `/${value.replace(/^\/+/, '')}`;
};

// Đã chuyển sang watch_api.php


// Đã chuyển sang watch_api.php


const prepareEmbedHtml = (html: string) => {
  if (!html || !html.trim()) return '<html><body style="background:#000;color:#666;display:flex;align-items:center;justify-content:center">Loading...</body></html>';
  
  const extraStyle = `
    <style>
      body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000 !important; overflow: hidden; }
      iframe, video { width: 100% !important; height: 100% !important; border: none !important; background: #000 !important; }
    </style>
  `;

  // Thêm base tag tuyệt đối để các link tương đối trong HTML luôn trỏ về server chính
  const baseTag = `<base href="https://vteen.shop/">`;
  
  return `<!DOCTYPE html><html><head>${baseTag}${extraStyle}</head><body style="background:#000">${html}</body></html>`;
};


// Đã chuyển sang watch_api.php


// Đã chuyển sang watch_api.php


const WatchScreen: React.FC<WatchScreenProps> = ({ slug, onBack, onUnauthorized }) => {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [currentEp, setCurrentEp] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fav, setFav] = useState(false);
  const [activeServer, setActiveServer] = useState(1);
  const [webServers, setWebServers] = useState<Record<string, string>>({});
  const [webPlayer, setWebPlayer] = useState<WebPlayerState>({ html: null, src: null, videoSrc: null });
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  useEffect(() => {
    // Cho phép xoay màn hình khi xem phim
    const enableRotation = async () => {
      try {
        await OrientationPlugin.unlock();
      } catch (e) {
        console.warn('Orientation lock not supported', e);
      }
    };
    
    enableRotation();

    return () => {
      // Khóa lại màn hình đứng khi thoát
      OrientationPlugin.lock({ orientation: 'portrait' }).catch(() => {});
    };
  }, []);

  const selectEpisode = (ep: Episode, movieDetails = details) => {
    setCurrentEp(ep);
    setActiveServer(1);
    if (movieDetails) {
      saveToHistory({
        slug,
        title: movieDetails.title,
        poster: movieDetails.poster,
        lastEpisode: ep.episode
      });
    }
  };

  const handleToggleFav = () => {
    if (details) {
      const added = toggleFavorite({
        slug,
        title: details.title,
        poster: details.poster
      });
      setFav(added);
    }
  };

  const fetchDetails = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem('vteen_user');
      const apiToken = savedUser ? JSON.parse(savedUser)?.api_token : null;
      if (!apiToken) {
        onUnauthorized?.();
        return;
      }
      const url = `${CONFIG.API_BASE_URL}/movie_detail.php?slug=${encodeURIComponent(slug)}&api_token=${encodeURIComponent(apiToken)}`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      const text = await response.text();
      let result: MovieDetailsResponse;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(`API tra ve khong phai JSON (${response.status}): ${text.slice(0, 120)}`);
      }
      const movieDetails = normalizeMovieDetails(result.data);
      if (result.status === 'success' && movieDetails) {
        setDetails(movieDetails);
        if (movieDetails.episodes.length > 0) {
          const saved = getHistory().find(item => item.slug === slug);
          const savedEp = saved ? movieDetails.episodes.find((ep: Episode) => ep.episode === saved.lastEpisode) : null;
          const nextEp = savedEp || movieDetails.episodes[0];
          setCurrentEp(nextEp);
          setActiveServer(1);
          saveToHistory({
            slug,
            title: movieDetails.title,
            poster: movieDetails.poster,
            lastEpisode: nextEp.episode
          });
          
          // Lưu vào lịch sử
        } else {
          setError('Phim nay chua co link tap hop le');
        }
      } else {
        if (response.status === 401) {
          onUnauthorized?.();
          return;
        }
        removeFromHistory(slug);
        setError(result.message || `Khong tai duoc phim (${response.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong the tai thong tin phim');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFav(isFavorite(slug));
      fetchDetails();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchDetails, slug]);

  const currentEmbedUrl = activeServer === 1 ? currentEp?.embed_url : currentEp?.embed_url_2;
  const currentHost = activeServer === 1 ? currentEp?.embed_host : currentEp?.embed_host_2;
  const currentEmbedSrc = buildEmbedSrc(currentEmbedUrl, currentHost);

  const loadWebPlayer = useCallback(async (isCancelled?: () => boolean) => {
    if (!currentEp) return;
    setPlayerLoading(true);
    setPlayerError(null);
    setWebPlayer({ html: null, src: null, videoSrc: null });

    const checkCancelled = () => isCancelled ? isCancelled() : false;

    try {
      const savedUser = localStorage.getItem('vteen_user');
      const apiToken = savedUser ? JSON.parse(savedUser)?.api_token : null;

      // 🏮 SỬ DỤNG WATCH API (JSON) - Tự chọn transport theo môi trường
      const url = `${CONFIG.API_BASE_URL}/watch_api.php?slug=${encodeURIComponent(slug)}&ep=${currentEp.episode}&api_token=${encodeURIComponent(apiToken)}`;
      
      let data: Record<string, unknown>;
      if (Capacitor.isNativePlatform()) {
        const response = await CapacitorHttp.get({ url });
        if (response.status !== 200 || !response.data || response.data.status !== 'success') {
          throw new Error(response.data?.message || 'Không thể lấy dữ liệu máy chủ');
        }
        data = response.data;
      } else {
        // Trên web/local: dùng fetch thường
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
        if (data.status !== 'success') throw new Error((data.message as string) || 'Không thể lấy dữ liệu máy chủ');
      }

      const servers = (data.servers as Record<string, string>) || {};
      const sources = (data.sources as Record<string, { type: string; url: string }>) || {};

      if (checkCancelled()) return;
      setWebServers(servers);

      const selectedKey = servers[String(activeServer)]
        ? String(activeServer)
        : Object.keys(servers)[0];

      if (!selectedKey || !servers[selectedKey]) {
        throw new Error('Không tìm thấy link máy chủ');
      }

      // Kiểm tra xem có nguồn trực tiếp (YouTube/MP4) không
      const directSource = sources[selectedKey];

      if (directSource) {
        if (directSource.type === 'youtube') {
          const ytId = getYouTubeId(directSource.url);
          if (ytId) {
            setWebPlayer({ html: null, src: buildYouTubeEmbedUrl(ytId), videoSrc: null });
          } else {
            setWebPlayer({ html: null, src: directSource.url, videoSrc: null });
          }
        } else if (directSource.type === 'video' || directSource.type === 'hls') {
          setWebPlayer({ html: null, src: null, videoSrc: directSource.url });
        }
      } else {
        // Fallback: Dùng iframe embed qua srcDoc
        const embedPath = toVteenPath(servers[selectedKey]);
        const embedHtml = await fetchVteenText(embedPath);
        setWebPlayer({ html: prepareEmbedHtml(embedHtml), src: null, videoSrc: null });
      }

      const selectedServerNum = Number(selectedKey);
      if (Number.isFinite(selectedServerNum) && selectedServerNum !== activeServer) {
        setActiveServer(selectedServerNum);
      }
    } catch (err) {
      if (!checkCancelled()) {
        const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
        console.error('Watch API error:', errMsg);
        
        if (currentEmbedSrc) {
          const isHtml = currentEmbedSrc.trim().startsWith('<!DOCTYPE') || currentEmbedSrc.trim().startsWith('<html');
          setWebPlayer({ 
            html: isHtml ? currentEmbedSrc : null, 
            src: isHtml ? null : currentEmbedSrc, 
            videoSrc: null 
          });
        } else {
          setPlayerError(`Lỗi trình phát: ${errMsg}`);
        }
      }
    } finally {
      if (!checkCancelled()) setPlayerLoading(false);
    }
  }, [activeServer, currentEmbedSrc, currentEp, slug]);


  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    
    loadWebPlayer(isCancelled);

    return () => {
      cancelled = true;
    };
  }, [loadWebPlayer]);


  if (loading) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#05070a]">
        <UniverseBackground />
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-10 text-center bg-[#05070a]">
        <UniverseBackground />
        <p className="text-text-dim mb-4">{error || 'Không tìm thấy phim'}</p>
        <button onClick={onBack} className="bg-primary px-6 py-2 rounded-full font-bold">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden overscroll-none bg-transparent">
      {/* Lớp nền đen đặc để che trang chủ */}
      <div className="absolute inset-0 z-[-2] bg-[#05070a]" />
      <UniverseBackground />
      {/* Header Bar */}
      <div 
        className="relative z-10 shrink-0 px-4 pb-4 flex items-center gap-3 border-b border-white/10 bg-background/10 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2.5rem)', minHeight: 'calc(env(safe-area-inset-top) + 6rem)' }}
      >
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-white/5 text-white active:scale-90 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{details.title}</h2>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Đang xem • Tập {currentEp?.episode}</p>
        </div>
      </div>

      {/* Video Player Area */}
      <div className="relative z-50 h-[32vh] min-h-[240px] max-h-[58vh] w-full shrink-0 bg-[#0a0a0a] shadow-2xl border-b border-white/5 flex flex-col items-center justify-center overflow-hidden">
        {playerLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-primary/60 font-medium uppercase tracking-tighter">Đang kết nối server...</p>
          </div>
        ) : playerError ? (
          <div className="p-6 text-center">
            <p className="text-xs text-red-500 mb-4">{playerError}</p>
            <button onClick={() => loadWebPlayer()} className="text-[10px] font-bold text-white bg-white/10 px-4 py-2 rounded-full active:scale-95 transition-all">THỬ LẠI</button>
          </div>
        ) : webPlayer.videoSrc ? (
          <div className="w-full h-full bg-black">
            <video 
              src={webPlayer.videoSrc} 
              className="w-full h-full" 
              controls 
              autoPlay 
              playsInline
            />
          </div>
        ) : webPlayer.src ? (
          <iframe 
            key={`${currentEp?.episode}-${activeServer}-${webPlayer.src}`}
            src={webPlayer.src}
            className="absolute inset-0 w-full h-full border-0"
            style={{ backgroundColor: 'black', zIndex: 1 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title="Player"
          />
        ) : webPlayer.html ? (
          <iframe 
            key={`${currentEp?.episode}-${activeServer}-html`}
            srcDoc={webPlayer.html}
            className="absolute inset-0 w-full h-full border-0"
            style={{ backgroundColor: 'black', zIndex: 1 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title="Player"
          />
        ) : currentEmbedSrc ? (
          <iframe 
            key={`${currentEp?.episode}-${activeServer}-api`}
            src={currentEmbedSrc.startsWith('<!DOCTYPE') ? undefined : currentEmbedSrc}
            srcDoc={currentEmbedSrc.startsWith('<!DOCTYPE') ? currentEmbedSrc : undefined}
            className="absolute inset-0 w-full h-full border-0"
            style={{ backgroundColor: 'black', zIndex: 1 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title="Player"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-text-dim uppercase tracking-widest">Đang kết nối trình phát...</span>
          </div>
        )}
      </div>


      {/* Server Selector Buttons */}
      <div className="relative z-10 shrink-0 px-6 py-4 flex gap-3 border-b border-white/5 bg-[#05070a]/20 backdrop-blur-sm">
        <button 
          disabled={playerLoading}
          onClick={() => setActiveServer(1)}
          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${playerLoading ? 'opacity-30 grayscale' : activeServer === 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-text-dim border border-white/5'}`}
        >
          SERVER VIP
        </button>
        <button 
          disabled={playerLoading || (!webServers['2'] && !currentEp?.embed_url_2)}
          onClick={() => setActiveServer(2)}
          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${playerLoading || (!webServers['2'] && !currentEp?.embed_url_2) ? 'opacity-30 grayscale' : (activeServer === 2 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-text-dim border border-white/5')}`}
        >
          SERVER 2
        </button>
      </div>

      {/* Info Area */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white leading-tight">{details.title}</h1>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-text-dim border border-white/5 uppercase">Full HD</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-text-dim border border-white/5 uppercase">Vietsub</span>
            </div>
          </div>
          
          <button 
            onClick={handleToggleFav}
            className={`p-3 rounded-2xl transition-all active:scale-90 ${fav ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-text-dim border border-border-glass'}`}
          >
            <svg viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>
        </div>

        {/* Episode Selection */}
        <div>
          <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-3">Chọn tập phim</h3>
          <div className="grid grid-cols-5 gap-2">
            {details.episodes.map((ep, index) => (
              <button
                key={`${ep.episode}-${index}`}
                onClick={() => selectEpisode(ep)}
                className={`h-10 rounded-lg font-bold text-sm transition-all active:scale-90 ${
                  currentEp?.episode === ep.episode 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-card text-text-dim border border-border-glass'
                }`}
              >
                {ep.episode}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mt-2">
          <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-3">Nội dung</h3>
          <p className="text-sm text-text-dim leading-relaxed">
            {details.description || 'Đang cập nhật nội dung cho bộ phim này...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WatchScreen;


