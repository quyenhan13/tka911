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

const buildEmbedSrc = (embedUrl?: string | null, host?: string | null) => {
  const value = embedUrl?.trim();
  if (!value) return null;

  // 1. Xử lý link YouTube để dùng qua proxy (cần thiết cho một số phim trên server 1)
  const hasYTKeyword = value.includes('youtube.com') || value.includes('youtu.be') || value.includes('youtube-nocookie.com');
  const isYTId = /^[a-zA-Z0-9_-]{11}$/.test(value);
  const isYouTube = isYTId || hasYTKeyword || Boolean(host?.toLowerCase()?.includes('youtube'));

  if (isYouTube) {
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
      const params = new URLSearchParams({
        autoplay: '1',
        playsinline: '1',
        controls: '1',
        rel: '0',
        modestbranding: '1'
      });
      return `https://www.youtube.com/embed/${id}?${params.toString()}`;
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

  // Đảm bảo luôn dùng https cho vteen.shop
  if (src.includes('vteen.shop')) {
    src = src.replace('http://', 'https://');
  }

  if (import.meta.env.DEV) {
    try {
      const url = new URL(src);
      if (url.origin === CONFIG.SITE_BASE_URL) {
        return `/__vteen${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      return src;
    }
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

const buildWebWatchPath = (slug: string, episode: string) => {
  const params = new URLSearchParams({ slug, ep: episode });
  return `/xem.php?${params.toString()}`;
};

const fetchVteenText = async (pathOrUrl: string) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${CONFIG.SITE_BASE_URL}${pathOrUrl}`;

  if (import.meta.env.DEV) {
    const parsed = new URL(url);
    const devPath = parsed.origin === CONFIG.SITE_BASE_URL
      ? `/__vteen${parsed.pathname}${parsed.search}${parsed.hash}`
      : url;
    const response = await fetch(devPath, { credentials: 'include' });
    if (!response.ok) throw new Error(`Web player HTTP ${response.status}`);
    return response.text();
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

const parseWebServers = (html: string) => {
  const match = html.match(/const\s+SERVERS\s*=\s*(\{[\s\S]*?\});/);
  if (!match?.[1]) return {};

  try {
    const parsed = JSON.parse(match[1]) as Record<string, string>;
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === 'string' && value.trim()));
  } catch {
    return {};
  }
};

const toVteenPath = (value: string) => {
  if (value.startsWith('http')) {
    const url = new URL(value);
    return url.origin === CONFIG.SITE_BASE_URL ? `${url.pathname}${url.search}${url.hash}` : value;
  }

  return `/${value.replace(/^\/+/, '')}`;
};

const prepareEmbedHtml = (html: string) => {
  if (!html || !html.trim()) return '<html><body style="background:#000;display:flex;align-items:center;justify-content:center;color:#666;font-family:sans-serif">Khong co noi dung trinh phat</body></html>';
  
  let cleaned = html
    .replace(/<script\b[^>]*static\.cloudflareinsights\.com[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*googletagmanager\.com[\s\S]*?<\/script>/gi, '');

  const baseTag = `<base href="${CONFIG.SITE_BASE_URL}/">`;
  const extraStyle = `
    <style>
      body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
      iframe, video { width: 100% !important; height: 100% !important; border: none !important; }
    </style>
  `;

  if (cleaned.includes('<base')) {
    cleaned = cleaned.replace(/<base\b[^>]*>/i, baseTag);
  } else if (cleaned.includes('<head')) {
    cleaned = cleaned.replace(/<head[^>]*>/i, (head) => `${head}${baseTag}${extraStyle}`);
  } else {
    cleaned = `${baseTag}${extraStyle}${cleaned}`;
  }
  
  return cleaned;
};

const prepareServerOneHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Tìm iframe có chứa link video (thường là ok.ru, youtube, hoặc stream)
  const iframe = doc.querySelector('iframe[src*="ok.ru"], iframe[src*="youtube"], iframe[src*="video"], iframe[src*="embed"]');
  const fallbackIframe = doc.querySelector('iframe');
  const target = iframe || fallbackIframe;
  
  const iframeSrc = target?.getAttribute('src');
  if (!iframeSrc) return null;
  
  // Nối link nếu là link tương đối
  let finalSrc = iframeSrc;
  if (iframeSrc.startsWith('//')) {
    finalSrc = 'https:' + iframeSrc;
  } else if (!iframeSrc.startsWith('http')) {
    finalSrc = new URL(iframeSrc, CONFIG.SITE_BASE_URL).toString();
  }
  
  return finalSrc;
};

const extractVideoSource = (html: string) => {
  const match = html.match(/const\s+source\s*=\s*("(?:(?:\\.)|[^"\\])*")/);
  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]) as string;
  } catch {
    return null;
  }
};

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

  useEffect(() => {
    if (!currentEp) return;

    let cancelled = false;

    const loadWebPlayer = async () => {
      setPlayerLoading(true);
      setPlayerError(null);
      setWebPlayer({ html: null, src: null, videoSrc: null });

      try {
        const watchHtml = await fetchVteenText(buildWebWatchPath(slug, currentEp.episode));
        const servers = parseWebServers(watchHtml);
        const selectedKey = servers[String(activeServer)]
          ? String(activeServer)
          : servers['1']
            ? '1'
            : servers['2']
              ? '2'
            : Object.keys(servers)[0];

        if (!selectedKey || !servers[selectedKey]) {
          throw new Error('Khong tim thay server web');
        }

        const embedHtml = await fetchVteenText(toVteenPath(servers[selectedKey]));

        if (cancelled) return;
        setWebServers(servers);
        if (selectedKey === '1') {
          const vipSrc = prepareServerOneHtml(embedHtml);
          if (vipSrc) {
            setWebPlayer({ html: null, src: vipSrc, videoSrc: null });
          } else if (currentEmbedSrc) {
            // Fallback ngay lập tức nếu không tìm thấy iframe nhưng có link API
            setWebPlayer({ html: null, src: null, videoSrc: null });
          } else {
            throw new Error('Khong tim thay iframe server VIP');
          }
        } else {
          const videoSrc = extractVideoSource(embedHtml);
          setWebPlayer({ html: videoSrc ? null : prepareEmbedHtml(embedHtml), src: null, videoSrc });
        }

        const selectedServer = Number(selectedKey);
        if (Number.isFinite(selectedServer) && selectedServer !== activeServer) {
          setActiveServer(selectedServer);
        }
      } catch (err) {
        if (!cancelled) {
          setWebServers({});
          setWebPlayer({ html: null, src: null, videoSrc: null });
          // Chỉ hiện lỗi nếu KHÔNG có link API dự phòng
          if (!currentEmbedSrc) {
            setPlayerError(err instanceof Error ? err.message : 'Khong tai duoc player web VTEEN');
          }
        }
      } finally {
        if (!cancelled) setPlayerLoading(false);
      }
    };

    loadWebPlayer();

    return () => {
      cancelled = true;
    };
  }, [activeServer, currentEp, slug]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center">
        <UniverseBackground />
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-10 text-center">
        <UniverseBackground />
        <p className="text-text-dim mb-4">{error || 'Không tìm thấy phim'}</p>
        <button onClick={onBack} className="bg-primary px-6 py-2 rounded-full font-bold">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden overscroll-none">
      <UniverseBackground />
      {/* Header Bar */}
      <div 
        className="shrink-0 px-4 pb-4 flex items-center gap-3 border-b border-white/10 bg-background/10 backdrop-blur-xl"
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
      <div className="relative z-50 w-full shrink-0 aspect-video max-h-[42vh] bg-[#0a0a0a] shadow-2xl border-b border-white/5 flex flex-col items-center justify-center overflow-hidden">
        {currentEp && (webPlayer.videoSrc || webPlayer.html || webPlayer.src || currentEmbedSrc || playerLoading || playerError) ? (
          <>
            {webPlayer.videoSrc ? (
              <video
                key={`${currentEp.episode}-${activeServer}-${webPlayer.videoSrc}`}
                src={webPlayer.videoSrc}
                className="absolute inset-0 h-full w-full bg-black"
                controls
                autoPlay
                playsInline
                preload="auto"
              />
            ) : webPlayer.src ? (
              <iframe 
                key={`${currentEp.episode}-${activeServer}-${webPlayer.src}`}
                src={webPlayer.src}
                className="absolute inset-0 w-full h-full border-0 bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                title="Player"
              />
            ) : webPlayer.html ? (
              <iframe 
                key={`${currentEp.episode}-${activeServer}-${webServers[String(activeServer)] || 'web'}`}
                srcDoc={webPlayer.html}
                className="absolute inset-0 w-full h-full border-0 bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                title="Player"
              />
            ) : currentEmbedSrc && !playerLoading ? (
              <iframe 
                key={`${currentEp.episode}-${activeServer}-api`}
                src={currentEmbedSrc}
                className="absolute inset-0 w-full h-full border-0 bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title="Player"
              />
            ) : null}

            {(playerLoading || playerError) && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#05070a] px-6 text-center">
                {playerLoading ? (
                  <div className="h-9 w-9 rounded-full border-3 border-primary/25 border-t-primary animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-9 w-9 text-primary">
                    <path d="M12 9v4M12 17h.01M10.3 4.3L2.8 17.2A2 2 0 004.5 20h15a2 2 0 001.7-2.8L13.7 4.3a2 2 0 00-3.4 0z" />
                  </svg>
                )}
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                  {playerLoading ? 'Dang lay player VTEEN...' : playerError}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-text-dim uppercase tracking-widest">Đang kết nối trình phát...</span>
          </div>
        )}
      </div>

      {/* Server Selector Buttons */}
      <div className="shrink-0 px-6 py-4 flex gap-3 border-b border-white/5">
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
      <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-6">
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


