import React, { useEffect, useState } from 'react';
import { saveToHistory } from '../storage/watchHistory';
import { toggleFavorite, isFavorite } from '../storage/favorites';
import { CONFIG } from '../config';

interface Episode {
  episode: string;
  embed_url: string;
  embed_url_2: string | null;
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
}

const WatchScreen: React.FC<WatchScreenProps> = ({ slug, onBack }) => {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [currentEp, setCurrentEp] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fav, setFav] = useState(false);

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
      const response = await fetch(`${CONFIG.API_BASE_URL}/movie_detail.php?slug=${slug}`);
      const result = await response.json();
      if (result.status === 'success') {
        setDetails(result.data);
        if (result.data.episodes.length > 0) {
          const firstEp = result.data.episodes[0];
          setCurrentEp(firstEp);
          
          // Lưu vào lịch sử
          saveToHistory({
            slug,
            title: result.data.title,
            poster: result.data.poster,
            lastEpisode: firstEp.episode
          });
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể tải thông tin phim');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 bg-background z-100 flex flex-col items-center justify-center p-10 text-center">
        <p className="text-text-dim mb-4">{error || 'Không tìm thấy phim'}</p>
        <button onClick={onBack} className="bg-primary px-6 py-2 rounded-full font-bold">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-100 flex flex-col overflow-y-auto">
      {/* Video Player Area */}
      <div className="sticky top-0 z-50 w-full aspect-video bg-[#0a0a0a] shadow-2xl border-b border-white/5 flex items-center justify-center">
        {currentEp ? (
          <iframe 
            src={`${CONFIG.SITE_BASE_URL}/${currentEp.embed_url}`}
            className="w-full h-full"
            style={{ minHeight: '210px' }}
            allowFullScreen
            allow="autoplay; encrypted-media"
            title="Player"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-text-dim uppercase tracking-widest">Đang kết nối trình phát...</span>
          </div>
        )}
        
        {/* Back Button Overlay */}
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-white active:scale-90 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      {/* Info Area */}
      <div className="flex-1 p-6 flex flex-col gap-6">
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
                onClick={() => setCurrentEp(ep)}
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
