import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
  message?: string;
}

interface HomeProps {
  onWatch: (slug: string) => void;
}

const fallbackPoster = 'https://placehold.co/300x450/0b0f17/64748b?text=VTeen';

const scrollContentTop = () => {
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
};

const HomeScreen: React.FC<HomeProps> = ({ onWatch }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [history] = useState<HistoryItem[]>(() => getHistory());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovies = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${CONFIG.API_BASE_URL}/movies.php?page=${pageNum}&limit=20`;
      const response = await fetch(url, { credentials: 'include' });
      const result: MoviesResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      if (result.status === 'success' && Array.isArray(result.data)) {
        setMovies(result.data);
        setTotalPages(Math.max(1, Number(result.total_pages) || 1));
        setPage(Math.max(1, Number(result.page) || pageNum));
        scrollContentTop();
      } else {
        setError(result.message || 'Khong tai duoc danh sach phim');
      }
    } catch {
      setError('Ket noi may chu that bai. Thu lai sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies(1);
  }, [fetchMovies]);

  const filteredMovies = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return movies;
    return movies.filter((movie) => movie.display_name.toLowerCase().includes(keyword));
  }, [movies, searchTerm]);

  const validHistory = useMemo(() => {
    const validSlugs = new Set(movies.map((movie) => movie.slug));
    return history.filter((item) => validSlugs.has(item.slug));
  }, [history, movies]);

  const featuredMovie = searchTerm.trim() ? null : movies[0] ?? null;
  const paginationPages = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1)
      .filter((item) => item === 1 || item === totalPages || (item >= page - 1 && item <= page + 1)),
    [page, totalPages]
  );

  const goToPage = (nextPage: number) => {
    if (nextPage !== page && nextPage >= 1 && nextPage <= totalPages) {
      fetchMovies(nextPage);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <header
        className="sticky top-0 z-50 px-5 pb-3 border-b border-white/5 bg-background/70 backdrop-blur-2xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.32em] text-white/30">Premium Hub</p>
            <h1 className="mt-1 text-2xl font-black tracking-[0.14em] text-white">
              VTEEN<span className="text-primary">.SHOP</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchMovies(page)}
              disabled={loading}
              className="tap-target grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition active:scale-95 disabled:opacity-40"
              aria-label="Lam moi"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}>
                <path d="M4 4v6h6M20 20v-6h-6M5 19a8 8 0 0013-3M19 5a8 8 0 00-13 3" />
              </svg>
            </button>
            <Avatar size={38} isAdmin />
          </div>
        </div>

        <div className="relative mt-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tim ten phim..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.05] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-primary/60 focus:bg-white/[0.08]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="tap-target absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-white/40 transition active:scale-95"
              aria-label="Xoa tim kiem"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {error && movies.length > 0 && (
        <div className="mx-5 flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-100">
          <span>{error}</span>
          <button type="button" onClick={() => fetchMovies(page)} className="font-black uppercase tracking-widest text-red-200">
            Thu lai
          </button>
        </div>
      )}

      {featuredMovie && (
        <section className="px-5">
          <motion.button
            type="button"
            onClick={() => onWatch(featuredMovie.slug)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative h-[15.5rem] w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0b0f17] text-left shadow-2xl active:scale-[0.99]"
          >
            <img src={featuredMovie.poster_url || fallbackPoster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 blur-[2px] scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05070a] via-[#05070a]/85 to-[#05070a]/35" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

            <div className="relative z-10 flex h-full items-end gap-4 p-4">
              <div className="w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl">
                <img
                  src={featuredMovie.poster_url || fallbackPoster}
                  alt=""
                  className="aspect-[2/3] w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = fallbackPoster;
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-md bg-vip px-2 py-1 text-[9px] font-black uppercase tracking-widest text-black">Noi bat</span>
                  <span className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/80">
                    {featuredMovie.is_series ? `${featuredMovie.total_eps || '?'} tap` : 'Phim le'}
                  </span>
                </div>
                <h2 className="line-clamp-2 text-xl font-black leading-tight text-white">{featuredMovie.display_name}</h2>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-primary/90">
                  Tap moi {featuredMovie.latest_ep || 'Full'}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Xem ngay
                </div>
              </div>
            </div>
          </motion.button>
        </section>
      )}

      {validHistory.length > 0 && !searchTerm && (
        <section className="px-5">
          <div className="mb-3 flex items-end justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Tiep tuc xem</h3>
            <span className="text-[10px] font-bold text-primary/70">{validHistory.length} phim</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {validHistory.map((item) => (
              <button
                type="button"
                key={item.slug}
                className="group w-28 shrink-0 text-left active:scale-95"
                onClick={() => onWatch(item.slug)}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-card shadow-xl">
                  <img
                    src={item.poster || fallbackPoster}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-active:scale-105"
                    onError={(event) => {
                      event.currentTarget.src = fallbackPoster;
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-2 pt-8">
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[8px] font-black uppercase text-black">Tap {item.lastEpisode}</span>
                  </div>
                </div>
                <p className="mt-2 truncate px-0.5 text-[10px] font-bold text-white/80">{item.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="px-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
              {searchTerm ? 'Ket qua tim kiem' : 'Tat ca phim'}
            </h3>
            <p className="mt-1 text-xs text-white/35">
              {searchTerm ? `${filteredMovies.length} ket qua cho "${searchTerm}"` : `Trang ${page}/${totalPages}`}
            </p>
          </div>
          {!searchTerm && movies.length > 0 && (
            <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-white/45">
              {movies.length} phim
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-[2/3] rounded-2xl border border-white/5 bg-white/[0.05] skeleton-shimmer" />
                <div className="h-3 w-4/5 rounded bg-white/[0.06] skeleton-shimmer" />
                <div className="h-2 w-2/5 rounded bg-white/[0.04] skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : error && movies.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7">
                <path d="M12 9v4M12 17h.01M10.3 4.3L2.8 17.2A2 2 0 004.5 20h15a2 2 0 001.7-2.8L13.7 4.3a2 2 0 00-3.4 0z" />
              </svg>
            </div>
            <h4 className="mt-5 text-base font-black text-white">Khong tai duoc phim</h4>
            <p className="mt-2 text-sm text-white/45">{error}</p>
            <button
              type="button"
              onClick={() => fetchMovies(page)}
              className="mt-6 rounded-xl bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black active:scale-95"
            >
              Thu lai
            </button>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <h4 className="text-base font-black text-white">Khong co ket qua</h4>
            <p className="mt-2 text-sm text-white/45">Thu tu khoa ngan hon hoac doi sang trang khac.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {filteredMovies.map((movie, index) => (
                <motion.div
                  key={movie.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.025, 0.18) }}
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

            {totalPages > 1 && !searchTerm && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1 || loading}
                  className="tap-target grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white transition disabled:opacity-25"
                  aria-label="Trang truoc"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                {paginationPages.map((item, index, array) => (
                  <React.Fragment key={item}>
                    {index > 0 && array[index - 1] !== item - 1 && (
                      <span className="px-1 text-xs font-black text-white/25">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => goToPage(item)}
                      disabled={loading}
                      className={`h-11 min-w-11 rounded-xl px-3 text-xs font-black transition disabled:opacity-40 ${
                        page === item
                          ? 'bg-primary text-black shadow-lg shadow-primary/20'
                          : 'border border-white/10 bg-white/[0.05] text-white/45'
                      }`}
                    >
                      {item}
                    </button>
                  </React.Fragment>
                ))}

                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages || loading}
                  className="tap-target grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white transition disabled:opacity-25"
                  aria-label="Trang sau"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
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
