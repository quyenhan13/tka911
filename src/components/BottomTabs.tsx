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
      id: 'hub', 
      label: 'Hub', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> 
    },
    { 
      id: 'profile', 
      label: 'Tôi', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg> 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-10 pt-2 bg-linear-to-t from-background to-transparent pointer-events-none">
      <nav className="glass flex items-center justify-around h-20 rounded-[2rem] px-4 shadow-2xl pointer-events-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 ${
              activeTab === tab.id ? 'text-primary scale-110' : 'text-text-dim hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-primary/10' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[11px] font-black uppercase tracking-tighter ${activeTab === tab.id ? 'text-primary' : 'text-text-dim'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BottomTabs;
