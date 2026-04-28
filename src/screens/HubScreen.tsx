import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONFIG } from '../config';

interface UploadItem {
  short_code: string;
  file_path: string;
  original_name: string;
}

const HubScreen: React.FC = () => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UploadItem | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    try {
      const response = await fetch(`${CONFIG.SITE_BASE_URL}/api/hub_data.php`, { credentials: 'include' });
      const result = await response.json();
      if (result.status === 'success') {
        setItems(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${CONFIG.SITE_BASE_URL}/api/upload.php`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const result = await response.json();
      if (result.status === 'success') {
        fetchHubData(); // Tải lại danh sách
      } else {
        alert(result.message || 'Lỗi khi tải lên');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến server');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isVideo = (path: string) => path.includes('vid_') || path.toLowerCase().match(/\.(mp4|mov|webm)$/);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header 
        className="px-6 flex justify-between items-end pb-4 border-b border-white/10 bg-background/95 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)', minHeight: 'calc(env(safe-area-inset-top) + 5rem)' }}
      >
        <div>
          <h2 className="text-3xl font-black text-white">Private Hub</h2>
          <p className="text-text-dim text-xs uppercase tracking-widest mt-1">Dữ liệu cá nhân của bạn</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 active:scale-90 transition-all ${uploading ? 'opacity-50 animate-pulse' : ''}`}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5 text-white">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          )}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleUpload} 
          accept="image/*,video/*" 
          hidden 
        />
      </header>

      <div 
        className="px-6 grid grid-cols-2 gap-3"
        style={{ paddingTop: '1rem' }}
      >
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="aspect-square bg-card rounded-3xl animate-pulse" />)
        ) : items.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-text-dim border-2 border-dashed border-white/5 rounded-[3rem]">
            <p className="text-sm font-bold">Chưa có dữ liệu upload</p>
            <p className="text-[10px] uppercase mt-2">Dữ liệu từ bảng images sẽ hiện ở đây</p>
          </div>
        ) : (
          items.map(item => (
            <div 
              key={item.short_code} 
              onClick={() => setSelectedItem(item)}
              className="group relative aspect-square rounded-3xl overflow-hidden bg-card border border-white/5 cursor-pointer active:scale-95 transition-all"
            >
              <img 
                src={`${CONFIG.SITE_BASE_URL}/stream.php?code=${item.short_code}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/111/444?text=Private';
                }}
              />
              {isVideo(item.file_path) && (
                <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 backdrop-blur-md">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-3 left-3 right-3 translate-y-2 group-hover:translate-y-0 transition-transform">
                <p className="text-[10px] font-bold text-white truncate">{item.original_name}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail View Overlay (Giống p.php) */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-background z-[2000] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div 
              className="px-6 flex items-center gap-5 pb-6 border-b border-white/10 bg-background/95 backdrop-blur-xl"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)', minHeight: 'calc(env(safe-area-inset-top) + 4.75rem)' }}
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2.5 rounded-xl bg-white/5 text-white active:scale-90 transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white truncate">{selectedItem.original_name}</h2>
                <p className="text-[10px] text-text-dim uppercase tracking-widest">Chi tiết tệp tin</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 overscroll-none">
              {/* Media Box */}
              <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border border-white/5 group">
                {isVideo(selectedItem.file_path) ? (
                  <video 
                    controls 
                    playsInline 
                    className="w-full h-full object-contain"
                    src={`${CONFIG.SITE_BASE_URL}/stream.php?code=${selectedItem.short_code}`}
                  />
                ) : (
                  <img 
                    src={`${CONFIG.SITE_BASE_URL}/stream.php?code=${selectedItem.short_code}`} 
                    className="w-full h-full object-contain"
                    alt={selectedItem.original_name}
                  />
                )}
              </div>

              {/* Share Link Box (Cyber Style) */}
              <div className="bg-card/50 border border-border-glass rounded-[2rem] p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-20 h-20">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Link chia sẻ trực tiếp
                </h4>

                <div className="flex flex-col gap-3">
                  <div className="bg-black/40 rounded-xl px-4 py-3 border border-white/5 break-all text-xs font-mono text-text-dim leading-relaxed">
                    {`${CONFIG.SITE_BASE_URL}/p.php?code=${selectedItem.short_code}`}
                  </div>
                  <button 
                    onClick={() => handleCopy(`${CONFIG.SITE_BASE_URL}/p.php?code=${selectedItem.short_code}`)}
                    className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${copied ? 'bg-success text-white' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}
                  >
                    {copied ? 'ĐÃ SAO CHÉP!' : 'SAO CHÉP LIÊN KẾT'}
                  </button>
                </div>
              </div>

              {/* Footer Info */}
              <div className="text-center py-4">
                  <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest opacity-40">
                    Hệ thống truyền tải bảo mật VTEEN CLOUD
                  </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HubScreen;
