import React, { useEffect, useState } from 'react';
import { getFavorites } from '../storage/favorites';
import { getHistory } from '../storage/watchHistory';

interface ProfileScreenProps {
  user: any;
  onLogout: () => void;
  onWatch: (slug: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onWatch }) => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('favorites');

  useEffect(() => {
    setFavorites(getFavorites());
    setHistory(getHistory());
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header User */}
      <div 
        className="px-6 flex items-center gap-5 pb-6 border-b border-white/10 bg-background/95 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2.5rem)', minHeight: 'calc(env(safe-area-inset-top) + 6rem)' }}
      >
        <div className="w-20 h-20 rounded-full bg-linear-to-tr from-primary to-violet-600 p-1 shadow-xl shadow-primary/20">
          <img 
            src={`https://ui-avatars.com/api/?name=${user.display_name}&background=111&color=fff&size=128`} 
            className="w-full h-full rounded-full object-cover border-2 border-background"
          />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">{user.display_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black bg-vip text-black px-2 py-0.5 rounded-sm uppercase tracking-widest">VIP Member</span>
            <span className="text-text-dim text-[10px] font-bold uppercase tracking-widest">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Yêu thích', value: favorites.length },
          { label: 'Đã xem', value: history.length },
          { label: 'Gói cước', value: 'Pro' }
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-lg font-black text-white">{stat.value}</p>
            <p className="text-[8px] font-bold text-text-dim uppercase tracking-tighter mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Content Switcher */}
      <div className="px-6">
        <div className="flex bg-card p-1.5 rounded-3xl border border-white/5">
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'favorites' ? 'bg-white/10 text-white shadow-inner' : 'text-text-dim'}`}
          >
            YÊU THÍCH
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${activeTab === 'history' ? 'bg-white/10 text-white shadow-inner' : 'text-text-dim'}`}
          >
            LỊCH SỬ
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {(activeTab === 'favorites' ? favorites : history).length === 0 ? (
            <div className="col-span-3 py-10 text-center text-text-dim text-xs opacity-50 font-bold uppercase tracking-widest italic">
              Trống không...
            </div>
          ) : (
            (activeTab === 'favorites' ? favorites : history).map(item => (
              <div 
                key={item.slug} 
                onClick={() => onWatch(item.slug)}
                className="group cursor-pointer"
              >
                <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-card">
                  <img src={item.poster} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <p className="text-[9px] font-bold mt-2 truncate text-white/70 px-1">{item.title}</p>
                {activeTab === 'history' && item.lastEpisode && (
                  <p className="text-[8px] font-bold text-primary px-1 mt-0.5">Tap {item.lastEpisode}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-6 mt-4">
        <button 
          onClick={onLogout}
          className="w-full py-4 rounded-2xl border border-red-500/20 text-red-500 font-black text-xs uppercase tracking-[0.2em] active:bg-red-500/10 transition-all"
        >
          Đăng xuất tài khoản
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
