import React, { useEffect, useState } from 'react';
import MovieCard from '../components/MovieCard';
import { CONFIG } from '../config';

interface Movie {
  display_name: string;
  poster_url: string;
  slug: string;
  total_eps: number;
  latest_ep: string;
  is_series: boolean;
}

const MoviesScreen: React.FC<{ onWatch: (slug: string) => void }> = ({ onWatch }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const categories = ['Tất cả', 'Hành động', 'Tình cảm', 'Anime', 'Kinh dị', 'Viễn tưởng'];

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/movies.php`);
      const result = await response.json();
      if (result.status === 'success') {
        setMovies(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-32">
      <header className="px-6 pt-10">
        <h2 className="text-3xl font-black text-white">Kho Phim</h2>
        <p className="text-text-dim text-xs uppercase tracking-widest mt-1">Khám phá nội dung vô tận</p>
      </header>

      {/* Categories Scroller */}
      <div className="flex gap-3 overflow-x-auto px-6 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === cat 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                : 'bg-card border-white/5 text-text-dim'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Movies Grid */}
      <div className="px-6 grid grid-cols-2 gap-4">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="aspect-[2/3] bg-card rounded-2xl animate-pulse" />)
        ) : (
          movies.map(movie => (
            <MovieCard 
              key={movie.slug}
              title={movie.display_name}
              poster={movie.poster_url}
              latestEp={movie.latest_ep}
              totalEps={movie.total_eps}
              isSeries={movie.is_series}
              onClick={() => onWatch(movie.slug)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MoviesScreen;
