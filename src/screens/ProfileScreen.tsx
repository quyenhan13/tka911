import React, { useState } from 'react';
import { getFavorites } from '../storage/favorites';
import { getHistory } from '../storage/watchHistory';

interface User {
  display_name?: string;
  role?: string;
}

interface SavedMovie {
  slug: string;
  title: string;
  poster: string;
  lastEpisode?: string;
}

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onWatch: (slug: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onWatch }) => {
  const [favorites] = useState<SavedMovie[]>(() => getFavorites());
  const [history] = useState<SavedMovie[]>(() => getHistory());
  const [activeTab, setActiveTab] = useState('favorites');
  const activeItems = activeTab === 'favorites' ? favorites : history;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div
        className="relative overflow-hidden border-b border-white/10 bg-[#05070a]/35 px-6 pb-6 backdrop-blur-2xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)', minHeight: 'calc(env(safe-area-inset-top) + 5rem)' }}
      >
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative flex items-center gap-5">
          <div className="relative h-21 w-21 rounded-[1.65rem] bg-linear-to-br from-primary via-cyan-300 to-secondary p-[2px] shadow-[0_18px_48px_rgba(6,182,212,0.22)]">
            <img
              src={`https://ui-avatars.com/api/?name=${user.display_name || 'VTeen'}&background=111827&color=fff&size=128`}
              className="h-full w-full rounded-[1.55rem] border border-black/50 bg-background object-cover"
              alt=""
            />
            <span className="absolute -bottom-1 -right-1 rounded-lg border border-black/40 bg-vip px-2 py-1 text-[7px] font-black uppercase tracking-widest text-black">
              VIP
            </span>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.28em] text-primary/80">Tai khoan</p>
            <h2 className="truncate text-2xl font-black text-white">{user.display_name || 'VTeen'}</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-lg border border-white/10 bg-white/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/75 backdrop-blur-md">VIP Member</span>
              <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary">{user.role || 'User'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-6">
        {[
          { label: 'Yeu thich', value: favorites.length },
          { label: 'Da xem', value: history.length },
          { label: 'Goi cuoc', value: 'Pro' }
        ].map((stat) => (
          <div key={stat.label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
            <p className="text-lg font-black text-white">{stat.value}</p>
            <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-text-dim">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="px-6">
        <div className="flex rounded-[1.35rem] border border-white/10 bg-black/24 p-1.5 shadow-inner backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 rounded-2xl py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'favorites' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-dim'}`}
          >
            Yeu thich
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 rounded-2xl py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-dim'}`}
          >
            Lich su
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {activeItems.length === 0 ? (
            <div className="col-span-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] px-4 py-12 text-center text-xs font-black uppercase tracking-widest text-text-dim/70">
              Trong
            </div>
          ) : (
            activeItems.map((item) => (
              <button
                type="button"
                key={item.slug}
                onClick={() => onWatch(item.slug)}
                className="group cursor-pointer text-left active:scale-95"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-[1rem] border border-white/10 bg-card shadow-xl">
                  <img src={item.poster} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                  {activeTab === 'history' && item.lastEpisode && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-primary px-1.5 py-0.5 text-[8px] font-black uppercase text-black">Tap {item.lastEpisode}</span>
                  )}
                </div>
                <p className="mt-2 truncate px-1 text-[9px] font-bold text-white/75">{item.title}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 px-6">
        <button
          onClick={onLogout}
          className="w-full rounded-2xl border border-red-500/25 bg-red-500/8 py-4 text-xs font-black uppercase tracking-[0.2em] text-red-400 transition-all active:bg-red-500/15"
        >
          Dang xuat tai khoan
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
