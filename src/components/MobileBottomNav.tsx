import React from 'react';
import { ActiveTab } from '../types';
import { 
  Film, 
  Users, 
  Sparkles, 
  Tv, 
  Trophy, 
  Settings 
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    {
      id: 'home' as ActiveTab,
      label: 'فیلم‌ها',
      icon: Film,
      activeColor: 'text-[#E50914]',
      activeBg: 'bg-[#E50914]/15',
      activeIndicator: 'bg-[#E50914]',
    },
    {
      id: 'actors' as ActiveTab,
      label: 'بازیگران',
      icon: Users,
      activeColor: 'text-[#A78BFA]',
      activeBg: 'bg-[#8B5CF6]/15',
      activeIndicator: 'bg-[#8B5CF6]',
    },
    {
      id: 'ai_assistant' as ActiveTab,
      label: 'دستیار AI',
      icon: Sparkles,
      activeColor: 'text-rose-400',
      activeBg: 'bg-rose-500/15',
      activeIndicator: 'bg-rose-500',
      badge: true,
    },
    {
      id: 'tracking' as ActiveTab,
      label: 'پیگیری',
      icon: Tv,
      activeColor: 'text-indigo-400',
      activeBg: 'bg-indigo-500/15',
      activeIndicator: 'bg-indigo-500',
    },
    {
      id: 'boxoffice' as ActiveTab,
      label: 'باکس‌آفیس',
      icon: Trophy,
      activeColor: 'text-amber-400',
      activeBg: 'bg-amber-500/15',
      activeIndicator: 'bg-amber-400',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'تنظیمات',
      icon: Settings,
      activeColor: 'text-white',
      activeBg: 'bg-white/10',
      activeIndicator: 'bg-white',
    },
  ];

  return (
    <nav 
      aria-label="منوی ناوبری موبایل"
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#10101A]/95 backdrop-blur-xl border-t border-[#2A2A40]/80 shadow-[0_-8px_32px_rgba(0,0,0,0.65)] select-none"
      style={{
        paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))',
        paddingTop: '0.35rem'
      }}
    >
      <div className="max-w-md mx-auto px-1 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive 
                  ? `${tab.activeColor} ${tab.activeBg}` 
                  : 'text-[#82829D] hover:text-[#C5C5DA]'
              }`}
            >
              {/* Active top glow indicator dot */}
              {isActive && (
                <span 
                  className={`absolute -top-1 w-5 h-1 rounded-full ${tab.activeIndicator} shadow-[0_0_8px_currentColor] animate-pulse`} 
                />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </div>

              <span className={`text-[10.5px] mt-0.5 tracking-tight font-medium ${isActive ? 'font-black' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
