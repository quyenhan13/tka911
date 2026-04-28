import React from 'react';

interface MovieCardProps {
  title: string;
  poster: string;
  latestEp?: string;
  totalEps?: number;
  isSeries?: boolean;
  onClick?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ 
  title, 
  poster, 
  latestEp, 
  totalEps, 
  isSeries,
  onClick 
}) => {
  return (
    <div 
      className="group relative flex flex-col gap-2 cursor-pointer transition-transform duration-300 active:scale-95"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-card border border-border-glass shadow-lg">
        <img 
          src={poster} 
          alt={title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/300x450/111/444?text=VTeen';
          }}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isSeries && (
            <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded text-white border border-white/10 uppercase">
              Series
            </span>
          )}
          {latestEp && (
            <span className="bg-primary/80 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded text-white border border-white/10">
              EP {latestEp}
            </span>
          )}
        </div>

        {/* Overlay Play Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white shadow-xl">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="px-1">
        <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-[10px] text-text-dim mt-1">
          {totalEps ? `${totalEps} tập phim` : 'Phim lẻ'}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
