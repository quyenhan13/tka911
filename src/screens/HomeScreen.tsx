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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setHistory(getHistory());
    fetchMovies(1);
  }, []);

  const fetchMovies = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/movies.php?page=${pageNum}&limit=20`, { credentials: 'include' });
      const result = await response.json();
      if (result.status === 'success') {
        setMovies(result.data);
        setTotalPages(result.total_pages);
        setPage(result.page);
        
        // Cuộn lên đầu khi chuyển trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (p: number) => {
    if (p !== page && p >= 1 && p <= totalPages) {
      fetchMovies(p);
    }
  };

  const filteredMovies = movies.filter(m => 
    m.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const validSlugs = new Set(movies.map(m => m.slug));
  const validHistory = history.filter(item => validSlugs.has(item.slug));

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Top Bar giống phim.php */}
      <header 
        className="sticky top-0 z-50 px-6 pb-3 flex items-center justify-between border-b border-white/5 bg-background/10 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)', minHeight: 'calc(env(safe-area-inset-top) + 5rem)' }}
      >
        <h1 className="text-xl font-black text-primary tracking-widest uppercase">VTEEN.SHOP</h1>
        <Avatar size={36} isAdmin={true} />
      </header>

      {/* Search Input giống phim.php */}
      <div className="px-6">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Tìm tên phim..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card/50 border border-border-glass rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder:text-text-dim"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Tiếp tục xem (Nếu có) */}
      {validHistory.length > 0 && searchTerm === '' && (
        <section className="px-6 py-2">
          <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-4 opacity-50">Tiếp tục xem</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {validHistory.map((item) => (
              <div 
                key={item.slug} 
                className="flex-none w-28 group cursor-pointer"
                onClick={() => onWatch(item.slug)}
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                  <img 
                    src={item.poster} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/300x450/111/444?text=VTeen';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div className="h-full bg-primary w-2/3" />
                  </div>
                </div>
                <p className="text-[10px] font-bold mt-2 truncate text-white/80">{item.title}</p>
                <p className="text-[9px] font-bold text-primary mt-0.5">Tap {item.lastEpisode}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Danh sách phim chính */}
      <section className="px-6">
        <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-4 opacity-50">
          {searchTerm ? `Kết quả cho "${searchTerm}"` : 'Tất cả phim'}
        </h3>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-card/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {filteredMovies.map((movie) => (
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

            {totalPages > 1 && (
              <div className="mt-12 flex flex-wrap justify-center gap-2 px-6">
                {/* Nút Prev */}
                <button 
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white disabled:opacity-20"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
                </button>

                {/* Các số trang */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i-1] !== p - 1 && <span className="text-text-dim self-end pb-2">...</span>}
                      <button 
                        onClick={() => goToPage(p)}
                        className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${
                          page === p ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass text-text-dim'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))
                }

                {/* Nút Next */}
                <button 
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white disabled:opacity-20"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default HomeScreen;
