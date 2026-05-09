import React from 'react';

interface MovieCardProps {
  title: string;
  poster: string;
  latestEp?: string;
  totalEps?: number;
  isSeries?: boolean;
  onClick?: () => void;
}

const fallbackPoster = 'https://placehold.co/300x450/0b0f17/64748b?text=VTeen';

const MovieCard: React.FC<MovieCardProps> = ({
  title,
  poster,
  latestEp,
  totalEps,
  isSeries,
  onClick
}) => {
  return (
    <button
      type="button"
      className="group block w-full cursor-pointer text-left active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
        <img
          src={poster || fallbackPoster}
          alt={title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = fallbackPoster;
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/15 opacity-90" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {isSeries && (
            <span className="rounded-md border border-white/10 bg-black/55 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-md">
              Series
            </span>
          )}
          {latestEp && (
            <span className="rounded-md bg-primary px-2 py-1 text-[8px] font-black uppercase tracking-widest text-black shadow-lg shadow-primary/20">
              EP {latestEp}
            </span>
          )}
        </div>

        <div className="absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid h-13 w-13 place-items-center rounded-full bg-white text-black shadow-2xl">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-6 w-6">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white/75 backdrop-blur-md">
              {totalEps ? `${totalEps} tap` : 'Phim le'}
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 backdrop-blur-md transition group-hover:bg-white group-hover:text-black">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="px-1 pt-2.5">
        <h3 className="line-clamp-2 min-h-[2.35rem] text-[13px] font-bold leading-snug text-white/90 transition group-hover:text-primary">
          {title}
        </h3>
      </div>
    </button>
  );
};

export default React.memo(MovieCard);
