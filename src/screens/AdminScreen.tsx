import React, { useState } from 'react';
import { CONFIG } from '../config';

const adminTools = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'movies', label: 'Quan ly phim', path: '/suaphim' },
  { id: 'add', label: 'Them phim', path: '/vippro' },
  { id: 'links', label: 'Get link', path: '/getlink' },
  { id: 'uploads', label: 'Upload', path: '/admin_upload' },
];

const AdminScreen: React.FC = () => {
  const [activePath, setActivePath] = useState(adminTools[0].path);
  const src = `${CONFIG.ADMIN_BASE_URL}${activePath}`;

  return (
    <div className="fixed inset-0 bg-background z-40 flex flex-col pb-24">
      <header className="px-5 pt-8 pb-3 border-b border-white/5 bg-background/95">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Admin</p>
            <h1 className="text-xl font-black text-white">Quan tri he thong</h1>
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-black text-primary uppercase">
            Full Access
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-4">
          {adminTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActivePath(tool.path)}
              className={`shrink-0 px-4 h-10 rounded-xl text-[11px] font-black uppercase tracking-wide border transition-all ${
                activePath === tool.path
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-card text-text-dim border-white/5'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </header>

      <iframe
        key={activePath}
        src={src}
        title="Admin Panel"
        className="flex-1 w-full bg-black"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
};

export default AdminScreen;
