import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface BottomTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

const BottomTabs: React.FC<BottomTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: Tab[] = [
    { 
      id: 'home', 
      label: 'Trang chủ', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg> 
    },
    { 
      id: 'tube', 
      label: 'Tube', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg> 
    },
    { 
      id: 'profile', 
      label: 'Tôi', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg> 
    },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 pt-1 bg-linear-to-t from-black/20 to-transparent pointer-events-none"
      style={{ bottom: 0 }}
    >
      <nav className="glass flex items-center justify-around h-11 rounded-2xl px-3 shadow-2xl pointer-events-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 ${
              activeTab === tab.id ? 'text-primary scale-110' : 'text-white/30 hover:text-white/60'
            }`}
          >
            <div className={`p-2 rounded-2xl transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-primary/20 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-primary/50' 
                : 'bg-transparent'
            }`}>
              {tab.icon}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none transition-all ${
              activeTab === tab.id ? 'opacity-100' : 'opacity-0'
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BottomTabs;
