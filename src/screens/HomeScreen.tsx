import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
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

  const fetchMovies = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${CONFIG.API_BASE_URL}/movies.php?page=${pageNum}&limit=24`;
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
      setError('Kết nối máy chủ thất bại. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies(1);
  }, [fetchMovies]);

  // Lọc phim theo tìm kiếm VÀ thể loại
  const filteredMovies = useMemo(() => {
    let result = movies;
    
    // 1. Lọc theo thể loại
    if (activeCategory !== 'Tất cả') {
      result = result.filter(m => m.category === activeCategory);
    }
    
    // 2. Lọc theo từ khóa
    const keyword = searchTerm.trim().toLowerCase();
    if (keyword) {
      result = result.filter((m) => m.display_name.toLowerCase().includes(keyword));
    }
    
    return result;
  }, [movies, searchTerm, activeCategory]);

  const featuredMovies = searchTerm.trim() || activeCategory !== 'Tất cả' ? [] : movies.slice(0, 8);
  const activeFeaturedIndex = featuredMovies.length ? featuredIndex % featuredMovies.length : 0;
  const featuredMovie = featuredMovies[activeFeaturedIndex] ?? null;

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  return (
    <div className="flex flex-col gap-6 pb-20">
      <header
        className="sticky top-0 z-50 border-b border-white/5 bg-[#05070a]/60 px-5 pb-4 backdrop-blur-3xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchMovies(1)}
              disabled={loading}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 active:scale-90 disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                <path d="M4 4v6h6M20 20v-6h-6M5 19a8 8 0 0013-3M19 5a8 8 0 00-13 3" />
              </svg>
            </button>
            <Avatar size={38} isAdmin />
          </div>
        </div>

        <div className="relative mt-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm tên phim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all"
          />
        </div>

        {/* 🏮 THANH CHỌN PHIM (CATEGORY TABS) */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setFeaturedIndex(0);
              }}
              className={`whitespace-nowrap px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === cat 
                  ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                  : 'bg-white/5 text-white/40 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Featured Movie */}
      <AnimatePresence mode="wait">
        {featuredMovie && (
          <motion.section 
            key={featuredMovie.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-5"
          >
            <button
              onClick={() => onWatch(featuredMovie.slug)}
              className="relative w-full h-[16rem] rounded-[2rem] overflow-hidden border border-white/10 group active:scale-[0.98] transition-transform shadow-2xl"
            >
              <img src={featuredMovie.poster_url || fallbackPoster} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/40 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 p-6 flex items-end gap-5">
                <div className="w-24 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0">
                  <img src={featuredMovie.poster_url || fallbackPoster} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 text-left pb-2">
                  <div className="flex gap-2 mb-3">
                    <span className="bg-vip text-black text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">NỔI BẬT</span>
                    <span className="bg-white/10 text-white/70 text-[8px] font-bold px-2 py-0.5 rounded uppercase backdrop-blur-md">
                      {featuredMovie.is_series ? `${featuredMovie.total_eps} TẬP` : 'PHIM LẺ'}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white line-clamp-2 leading-tight">{featuredMovie.display_name}</h2>
                  <p className="text-primary text-[10px] font-black mt-2 uppercase tracking-widest italic">Tập mới nhất: {featuredMovie.latest_ep}</p>
                  <div className="mt-4 inline-flex items-center gap-2 bg-primary px-4 py-2 rounded-xl text-[9px] font-black text-black uppercase tracking-widest shadow-lg shadow-primary/20">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M8 5v14l11-7z"/></svg>
                    XEM NGAY
                  </div>
                </div>
              </div>
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && !searchTerm && activeCategory === 'Tất cả' && (
        <section className="px-5">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Tiếp tục xem</h3>
            <span className="text-[9px] font-bold text-primary">{history.length} phim</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {history.map((item) => (
              <button 
                key={item.slug}
                onClick={() => onWatch(item.slug)}
                className="w-28 shrink-0 text-left group active:scale-95 transition-transform"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-white/3">
                  <img src={item.poster || fallbackPoster} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                    <span className="bg-primary text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Tập {item.lastEpisode}</span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] font-bold text-white/60 truncate px-1">{item.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main List */}
      <section className="px-5">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
            {searchTerm ? `Kết quả cho "${searchTerm}"` : `${activeCategory} mới cập nhật`}
          </h3>
          {!searchTerm && <span className="text-[9px] font-bold text-white/20">Trang {page}/{totalPages}</span>}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-[2/3] bg-white/3 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-400 mb-4 font-bold">{error}</p>
            <button onClick={() => fetchMovies(page)} className="bg-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white">Thử lại</button>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="py-20 text-center bg-white/2 rounded-3xl border border-dashed border-white/10">
            <p className="text-xs text-white/20 font-black uppercase tracking-widest">Không có dữ liệu</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredMovies.map((movie, idx) => (
              <motion.div
                key={movie.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3) }}
              >
                <MovieCard 
                  title={movie.display_name}
                  poster={movie.poster_url}
                  latestEp={movie.latest_ep}
                  totalEps={movie.total_eps}
                  isSeries={movie.is_series}
                  onClick={() => onWatch(movie.slug)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !searchTerm && (
          <div className="flex justify-center items-center gap-3 mt-12 mb-10">
            <button 
              onClick={() => { setPage(p => Math.max(1, p-1)); fetchMovies(page-1); }}
              disabled={page === 1}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 disabled:opacity-20"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="text-xs font-black text-white/30 uppercase tracking-widest">{page} / {totalPages}</span>
            <button 
              onClick={() => { setPage(p => Math.min(totalPages, p+1)); fetchMovies(page+1); }}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 disabled:opacity-20"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeScreen;
