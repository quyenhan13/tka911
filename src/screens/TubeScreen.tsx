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
      {/* Header */}
      <header 
        className="sticky top-0 z-50 px-6 bg-[#05070a]/30 backdrop-blur-3xl border-b border-white/10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)', paddingBottom: '1rem' }}
      >
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            placeholder="Tìm nhạc trên Tube..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#27272a] border border-white/5 rounded-full py-3.5 pl-12 pr-6 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary transition-all shadow-inner"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            )}
          </div>
        </form>
      </header>

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
