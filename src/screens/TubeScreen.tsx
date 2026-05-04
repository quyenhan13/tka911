import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CONFIG } from '../config';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface TubeProps {
  currentVideo: Video | null;
  playVideo: (video: Video, list: Video[]) => void;
}

const TubeScreen: React.FC<TubeProps> = ({ currentVideo, playVideo }) => {
  const [videos, setVideos] = useState<Video[]>([
    { id: 'jfKfPfyJRdk', title: 'Lofi Girl - chill beats', thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg', channelTitle: 'Lofi Girl' },
    { id: '5qap5aO4i9A', title: 'Beats to relax/study to', thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg', channelTitle: 'Lofi Girl' },
    { id: 'DWcJFNfaw9c', title: 'Lofi hip hop mix', thumbnail: 'https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg', channelTitle: 'Lofi Girl' }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVideos('nhạc việt hot nhất');
  }, []);

  const fetchVideos = async (q: string) => {
    setLoading(true);
    try {
      const savedUser = localStorage.getItem('vteen_user');
      if (!savedUser) return;
      const apiToken = JSON.parse(savedUser)?.api_token;
      if (!apiToken) return;
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/tube_search.php?q=${encodeURIComponent(q)}&api_token=${apiToken}`);
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        setVideos(result.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchVideos(searchQuery);
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-transparent">
      {/* Header đồng bộ với Trang chủ */}
      <header 
        className="sticky top-0 z-50 px-6 pb-3 flex items-center justify-between border-b border-white/5 bg-background/10 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)', minHeight: 'calc(env(safe-area-inset-top) + 5rem)' }}
      >
        <h1 className="text-xl font-black text-primary tracking-widest uppercase">VTEEN.SHOP</h1>
        <div className="flex items-center gap-3">
          {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            <img 
              src="https://vteen.shop/assets/images/logo.png" 
              className="w-full h-full object-cover" 
              onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=VT')} 
            />
          </div>
        </div>
      </header>

      {/* Thanh tìm kiếm lùi xuống dưới Header y hệt Trang chủ */}
      <div className="px-6 mt-6">
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            placeholder="Tìm nhạc trên Tube..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card/50 border border-border-glass rounded-2xl py-4 px-12 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary transition-all"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-40 no-scrollbar">
        {videos.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 opacity-20">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
            <p className="text-sm font-medium">Không tìm thấy kết quả</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {videos.map((video) => (
              <motion.div 
                key={video.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => playVideo(video, videos)}
                className={`p-2 rounded-2xl border transition-all ${
                  currentVideo?.id === video.id 
                    ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                    : 'bg-card border-white/5'
                }`}
              >
                <img src={video.thumbnail} className="w-full aspect-video rounded-xl object-cover mb-2" />
                <h4 className="text-[11px] font-bold text-white/90 line-clamp-2 h-8 leading-tight">{video.title}</h4>
                <p className="text-[9px] text-white/40 mt-1">{video.channelTitle}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TubeScreen;
