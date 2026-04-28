import React, { useEffect, useState } from 'react';
import { CONFIG } from '../config';

interface UploadItem {
  short_code: string;
  file_path: string;
  original_name: string;
}

const HubScreen: React.FC = () => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    try {
      // Giả định chúng ta có một API để lấy dữ liệu từ bảng images
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

  return (
    <div className="flex flex-col gap-6 pb-32 pt-10">
      <header className="px-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white">Private Hub</h2>
          <p className="text-text-dim text-xs uppercase tracking-widest mt-1">Dữ liệu cá nhân của bạn</p>
        </div>
        <button className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 active:scale-90 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5 text-white">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </header>

      <div className="px-6 grid grid-cols-2 gap-3">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="aspect-square bg-card rounded-3xl animate-pulse" />)
        ) : items.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-text-dim border-2 border-dashed border-white/5 rounded-[3rem]">
            <p className="text-sm font-bold">Chưa có dữ liệu upload</p>
            <p className="text-[10px] uppercase mt-2">Dữ liệu từ bảng images sẽ hiện ở đây</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.short_code} className="group relative aspect-square rounded-3xl overflow-hidden bg-card border border-white/5">
              <img 
                src={`${CONFIG.SITE_BASE_URL}/${item.file_path}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-3 left-3 right-3 translate-y-2 group-hover:translate-y-0 transition-transform">
                <p className="text-[10px] font-bold text-white truncate">{item.original_name}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HubScreen;
