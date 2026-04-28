import React, { useEffect, useState } from 'react';
import { getHistory, removeFromHistory, saveToHistory } from '../storage/watchHistory';
import { toggleFavorite, isFavorite } from '../storage/favorites';
import { CONFIG } from '../config';

interface Episode {
  episode: string;
  embed_url: string;
  embed_url_2: string | null;
  embed_host: string;
  embed_host_2: string | null;
}

interface MovieDetails {
  title: string;
  description: string;
  poster: string;
  episodes: Episode[];
}

interface WatchScreenProps {
  slug: string;
  onBack: () => void;
  onUnauthorized?: () => void;
}

const WatchScreen: React.FC<WatchScreenProps> = ({ slug, onBack, onUnauthorized }) => {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [currentEp, setCurrentEp] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fav, setFav] = useState(false);
  const [activeServer, setActiveServer] = useState(1);

  const shouldPreferServer2 = (ep: Episode) => {
    const host = (ep.embed_host || '').toLowerCase();
    return Boolean(ep.embed_url_2 && (host === 'clbphimxua.com' || host.endsWith('.clbphimxua.com') || host === 'short.icu'));
  };

  const selectEpisode = (ep: Episode, movieDetails = details) => {
    setCurrentEp(ep);
    setActiveServer(shouldPreferServer2(ep) ? 2 : 1);
    if (movieDetails) {
      saveToHistory({
        slug,
        title: movieDetails.title,
        poster: movieDetails.poster,
        lastEpisode: ep.episode
      });
    }
  };

  useEffect(() => {
    setFav(isFavorite(slug));
    fetchDetails();
  }, [slug]);

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

  const fetchDetails = async () => {
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
      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(`API tra ve khong phai JSON (${response.status}): ${text.slice(0, 120)}`);
      }
      if (result.status === 'success') {
        setDetails(result.data);
        if (result.data.episodes.length > 0) {
          const saved = getHistory().find(item => item.slug === slug);
          const savedEp = saved ? result.data.episodes.find((ep: Episode) => ep.episode === saved.lastEpisode) : null;
          selectEpisode(savedEp || result.data.episodes[0], result.data);
          
          // Lưu vào lịch sử
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
  };

  const currentEmbedUrl = activeServer === 1 ? currentEp?.embed_url : currentEp?.embed_url_2;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-[1000] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 bg-background z-[1000] flex flex-col items-center justify-center p-10 text-center">
        <p className="text-text-dim mb-4">{error || 'Không tìm thấy phim'}</p>
        <button onClick={onBack} className="bg-primary px-6 py-2 rounded-full font-bold">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-[1000] flex flex-col overflow-hidden overscroll-none">
      {/* Header Bar */}
      <div 
        className="shrink-0 px-4 pb-4 flex items-center gap-3 border-b border-white/5 bg-background/80 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)', minHeight: 'calc(env(safe-area-inset-top) + 4.5rem)' }}
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
        {currentEp && currentEmbedUrl ? (
          <>
            <iframe 
              key={`${currentEp.episode}-${activeServer}`}
              src={`${CONFIG.SITE_BASE_URL}/${currentEmbedUrl}`}
              className="absolute inset-0 w-full h-full border-0 bg-black"
              allowFullScreen
              allow="autoplay; encrypted-media"
              title="Player"
            />
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
          onClick={() => setActiveServer(1)}
          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeServer === 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-text-dim border border-white/5'}`}
        >
          SERVER 1 (VTEEN)
        </button>
        <button 
          disabled={!currentEp?.embed_url_2}
          onClick={() => setActiveServer(2)}
          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!currentEp?.embed_url_2 ? 'opacity-20 grayscale' : (activeServer === 2 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card text-text-dim border border-white/5')}`}
        >
          SERVER 2 (BACKUP)
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
            {details.episodes.map((ep) => (
              <button
                key={ep.episode}
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
