import React, { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import MovieCard from '../components/MovieCard';
import { getHistory } from '../storage/watchHistory';
import { CONFIG } from '../config';

interface Movie {
  display_name: string;
  poster_url: string;
  slug: string;
  total_eps: number;
  latest_ep: string;
  is_series: boolean;
}

interface HomeProps {
  onWatch: (slug: string) => void;
}

const HomeScreen: React.FC<HomeProps> = ({ onWatch }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getHistory());
    
    // Kiểm tra cache trong session để tránh fetch liên tục
    const cached = sessionStorage.getItem('vteen_movies_cache');
    if (cached) {
      setMovies(JSON.parse(cached));
      setLoading(false);
    } else {
      fetchMovies();
    }
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/movies.php`);
      const result = await response.json();
      if (result.status === 'success') {
        setMovies(result.data);
        sessionStorage.setItem('vteen_movies_cache', JSON.stringify(result.data));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-32">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">VTEEN Movies</h2>
          <p className="text-text-dim text-sm">Chào mừng bạn trở lại!</p>
        </div>
        <Avatar size={44} isAdmin={true} online={true} />
      </header>

      {/* Hero Banner (Placeholder) */}
      <div className="px-6">
        <div className="relative aspect-video w-full rounded-3xl overflow-hidden glass group">
          <img 
            src="https://placehold.co/800x450/8B5CF6/ffffff?text=VTEEN+Exclusive" 
            alt="Hero"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className="bg-vip text-black text-[10px] font-extrabold px-2 py-1 rounded-sm uppercase tracking-widest">Featured</span>
            <h1 className="text-3xl font-black mt-2 text-white drop-shadow-lg">Phim Mới Nhất</h1>
            <button className="mt-4 bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm shadow-xl active:scale-95 transition-transform">
              Xem ngay
            </button>
          </div>
        </div>
      </div>

      {/* Continue Watching */}
      {history.length > 0 && (
        <section className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-secondary rounded-full" />
              Tiếp tục xem
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {history.map((item) => (
              <div 
                key={item.slug} 
                className="flex-none w-32 group cursor-pointer"
                onClick={() => onWatch(item.slug)}
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-border-glass shadow-md">
                  <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div className="h-full bg-secondary w-2/3" />
                  </div>
                </div>
                <p className="text-[10px] font-bold mt-2 truncate text-white">{item.title}</p>
                <p className="text-[8px] text-text-dim uppercase">Tập {item.lastEpisode}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Movie List */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <span className="w-1 h-6 bg-primary rounded-full" />
            Phim mới cập nhật
          </h3>
          <button className="text-primary text-xs font-semibold">Xem tất cả</button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="py-20 text-center text-text-dim bg-card rounded-2xl border border-border-glass">
            <p>{error}</p>
            <button 
              onClick={fetchMovies}
              className="mt-4 text-primary font-bold text-sm underline"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {movies.slice(0, 12).map((movie) => (
              <MovieCard 
                key={movie.slug}
                title={movie.display_name}
                poster={movie.poster_url}
                latestEp={movie.latest_ep}
                totalEps={movie.total_eps}
                isSeries={movie.is_series}
                onClick={() => onWatch(movie.slug)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeScreen;
