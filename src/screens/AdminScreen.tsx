import React from 'react';
import { CONFIG } from '../config';

const AdminScreen: React.FC = () => {
  const src = `${CONFIG.ADMIN_BASE_URL}/admin_upload.php`;

  return (
    <div className="fixed inset-0 bg-background z-40 flex flex-col pb-24">
      <header className="px-5 pt-8 pb-3 border-b border-white/5 bg-background/95">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Admin</p>
            <h1 className="text-xl font-black text-white">Upload</h1>
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-black text-primary uppercase">
            Admin
          </div>
        </div>
      </header>

      <iframe
        src={src}
        title="Upload"
        className="flex-1 w-full bg-black"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
};

export default AdminScreen;
