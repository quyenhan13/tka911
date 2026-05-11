import React, { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import Logo from '../components/Logo';
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
  category: string;
}

interface HistoryItem {
  slug: string;
  title: string;
  poster: string;
  lastEpisode: string;
}

interface MoviesResponse {
  status: string;
  data?: Movie[];
  total_pages?: number;
  page?: number;
  categories?: string[];
  message?: string;
}

interface HomeProps {
  onWatch: (slug: string) => void;
}

const fallbackPoster = 'https://placehold.co/300x450/0b0f17/64748b?text=VTeen';

const scrollContentTop = () => {
  const main = document.querySelector('main');
  if (main) main.scrollTo({ top: 0 }); // Bỏ behavior smooth để đỡ lag khi chuyển trang
};

const HomeScreen: React.FC<HomeProps> = ({ onWatch }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [history] = useState<HistoryItem[]>(() => getHistory());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [categories, setCategories] = useState<string[]>(['Tất cả', 'Phim bộ', 'Phim lẻ']);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Sử dụng deferred value cho search để UI ko bị khựng khi gõ
  const deferredSearch = useDeferredValue(searchTerm);

  const fetchMovies = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);

    try {
      // Thêm nocache=1 để ép server dọn dẹp cache cũ bị lỗi localhost
      const url = `${CONFIG.API_BASE_URL}/movies.php?page=${pageNum}&limit=24&nocache=1`;
      const response = await fetch(url, { credentials: 'include' });
      const result: MoviesResponse = await response.json();

      if (result.status === 'success' && Array.isArray(result.data)) {
        setMovies(result.data);
        setTotalPages(Math.max(1, Number(result.total_pages) || 1));
        setPage(Math.max(1, Number(result.page) || pageNum));
        if (result.categories) {
          setCategories(['Tất cả', ...result.categories]);
        }
        if (pageNum === 1) scrollContentTop();
      } else {
        setError(result.message || 'Không tải được danh sách phim');
      }
    } catch (err) {
      console.error('Fetch movies error:', err);
      setError('Kết nối máy chủ thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies(1);
  }, [fetchMovies]);

  const filteredMovies = useMemo(() => {
    let result = movies;
    if (activeCategory !== 'Tất cả') {
      result = result.filter(m => m.category === activeCategory);
    }
    const keyword = deferredSearch.trim().toLowerCase();
    if (keyword) {
      result = result.filter((m) => m.display_name.toLowerCase().includes(keyword));
    }
    return result;
  }, [movies, deferredSearch, activeCategory]);

  const featuredMovies = deferredSearch.trim() || activeCategory !== 'Tất cả' ? [] : movies.slice(0, 5);
  const activeFeaturedIndex = featuredMovies.length ? featuredIndex % featuredMovies.length : 0;
  const featuredMovie = featuredMovies[activeFeaturedIndex] ?? null;

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header
        className="sticky top-0 z-50 border-b border-white/5 bg-[#05070a] px-5 pb-4" // Bỏ backdrop-blur để mượt hơn
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchMovies(1)}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 active:scale-90"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                <path d="M4 4v6h6M20 20v-6h-6M5 19a8 8 0 0013-3M19 5a8 8 0 00-13 3" />
              </svg>
            </button>
            <Avatar size={36} isAdmin />
          </div>
        </div>

        <div className="relative mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm phim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-white focus:outline-none focus:border-primary/20 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setFeaturedIndex(0); }}
              className={`whitespace-nowrap px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === cat ? 'bg-primary text-black' : 'bg-white/5 text-white/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Featured Slider - Chỉ render 1 cái hiện tại để nhẹ máy */}
      {featuredMovie && (
        <section className="px-5">
          <motion.button
            key={featuredMovie.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onWatch(featuredMovie.slug)}
            className="relative w-full h-[15rem] rounded-[2rem] overflow-hidden border border-white/5 bg-[#0a0f18] shadow-2xl active:scale-[0.98] transition-transform"
          >
            <img src={featuredMovie.poster_url || fallbackPoster} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/40 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="flex gap-2 mb-2">
                <span className="bg-vip text-black text-[8px] font-black px-2 py-0.5 rounded uppercase">HOT</span>
                <span className="bg-white/10 text-white/60 text-[8px] font-bold px-2 py-0.5 rounded uppercase">{featuredMovie.is_series ? 'PHIM BỘ' : 'PHIM LẺ'}</span>
              </div>
              <h2 className="text-xl font-black text-white line-clamp-2 leading-tight">{featuredMovie.display_name}</h2>
              <p className="text-primary text-[9px] font-black mt-2 uppercase tracking-widest">TẬP MỚI: {featuredMovie.latest_ep}</p>
            </div>
          </motion.button>
        </section>
      )}

      {/* History */}
      {history.length > 0 && !deferredSearch && activeCategory === 'Tất cả' && (
        <section className="px-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest">Tiếp tục xem</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {history.slice(0, 10).map((item) => (
              <button key={item.slug} onClick={() => onWatch(item.slug)} className="w-24 shrink-0 text-left active:scale-95 transition-transform">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5">
                  <img src={item.poster || fallbackPoster} className="w-full h-full object-cover opacity-80" alt="" />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <span className="text-primary text-[7px] font-black uppercase">Tập {item.lastEpisode}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main List - Bỏ motion ở ngoài để cuộn mượt hơn */}
      <section className="px-5">
        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">
          {deferredSearch ? 'Kết quả tìm kiếm' : 'Danh sách phim mới'}
        </h3>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="py-20 text-center bg-white/3 rounded-3xl border border-white/5">
            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Không tìm thấy phim</p>
          </div>
        ) : (
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
        )}

        {/* Pagination */}
        {totalPages > 1 && !deferredSearch && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button onClick={() => fetchMovies(page-1)} disabled={page === 1} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center disabled:opacity-10 active:scale-90">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4 text-white"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="text-[10px] font-black text-white/30 uppercase">{page} / {totalPages}</span>
            <button onClick={() => fetchMovies(page+1)} disabled={page === totalPages} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center disabled:opacity-10 active:scale-90">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4 text-white"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeScreen;
