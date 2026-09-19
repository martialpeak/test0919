import React from 'react';
import { ActiveTab } from '../types';
import { UserAccountButton } from './UserAccountButton';
import { 
  Film, 
  Tv, 
  Trophy, 
  Settings, 
  Heart, 
  Search, 
  RefreshCw,
  X,
  PlusCircle,
  FileCode,
  ShieldCheck,
  LogOut,
  KeyRound,
  Users
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
  favoritesCount: number;
  isSyncing: boolean;
  onRefresh: () => void;
  onAddMovie: () => void;
  onUploadHtml?: () => void;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onAdminLogout?: () => void;
  onChangePassword?: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  showFavoritesOnly,
  setShowFavoritesOnly,
  favoritesCount,
  isSyncing,
  onRefresh,
  onAddMovie,
  onUploadHtml,
  isAdmin = false,
  onOpenAdminLogin,
  onAdminLogout,
  onChangePassword,
  onOpenAuthModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#141420]/95 backdrop-blur-md border-b border-[#2A2A40] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 md:py-0">
        
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-14 md:h-16 gap-2 sm:gap-3">
          
          {/* Brand Logo & Title */}
          <div 
            id="brand-logo-button"
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-red-500/20 font-black text-lg sm:text-xl text-white transition-all duration-500 hover:rotate-[10deg] hover:shadow-red-500/40 hover:shadow-xl">
              ف
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg text-white tracking-wide block leading-tight">
                فیلم بره
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#A0A0B5] font-medium tracking-tight block">
                MovieBrowser
              </span>
            </div>
          </div>

          {/* Desktop Search Input (Hidden on Mobile, Rendered in dedicated row below) */}
          <div className="hidden md:block flex-1 max-w-xs lg:max-w-sm xl:max-w-md mx-2">
            <div className="relative">
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی فیلم، سریال، بازیگر..."
                className="w-full bg-[#1C1C2E] text-white text-xs lg:text-sm rounded-xl pl-8 pr-9 py-2 border border-[#2A2A40] focus:border-[#E50914] focus:outline-none focus:ring-1 focus:ring-[#E50914] transition-all placeholder:text-[#5A5A72]"
              />
              <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#5A5A72]" />
              {searchQuery && (
                <button
                  id="clear-search-button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-[#5A5A72] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            <button
              id="nav-tab-home"
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-[#E50914] text-white shadow-md shadow-red-600/20'
                  : 'text-[#A0A0B5] hover:text-white hover:bg-[#1C1C2E]'
              }`}
            >
              <Film className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>فیلم‌ها و سریال‌ها</span>
            </button>

            <button
              id="nav-tab-actors"
              onClick={() => setActiveTab('actors')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-medium transition-all ${
                activeTab === 'actors'
                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-[#A0A0B5] hover:text-white hover:bg-[#1C1C2E]'
              }`}
            >
              <Users className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#A78BFA]" />
              <span>بازیگران</span>
            </button>

            <button
              id="nav-tab-ai-assistant"
              onClick={() => setActiveTab('ai_assistant')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-medium transition-all ${
                activeTab === 'ai_assistant'
                  ? 'bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-[#A0A0B5] hover:text-white hover:bg-[#1C1C2E]'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span>دستیار هوشمند</span>
            </button>

            <button
              id="nav-tab-tracking"
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-medium transition-all ${
                activeTab === 'tracking'
                  ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-600/20'
                  : 'text-[#A0A0B5] hover:text-white hover:bg-[#1C1C2E]'
              }`}
            >
              <Tv className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>پیگیری</span>
            </button>

            <button
              id="nav-tab-boxoffice"
              onClick={() => setActiveTab('boxoffice')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-medium transition-all ${
                activeTab === 'boxoffice'
                  ? 'bg-[#FFB800] text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-[#A0A0B5] hover:text-white hover:bg-[#1C1C2E]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>باکس آفیس</span>
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl text-xs xl:text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#242438] text-white border border-[#3A3A55]'
                  : 'text-[#A0A0B5] hover:text-white hover:bg-[#1C1C2E]'
              }`}
            >
              <Settings className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>تنظیمات</span>
            </button>
          </nav>

          {/* Action Buttons: Admin tools, Login/Logout, Favorites filter & Refresh Sync */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Admin Controls (Only visible when logged in as admin) */}
            {isAdmin ? (
              <>
                {/* Add Movie Button */}
                <button
                  id="nav-add-movie-button"
                  onClick={onAddMovie}
                  title="افزودن فیلم یا سریال جدید (مدیریت)"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#E50914] to-red-600 hover:from-red-600 hover:to-[#E50914] text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">افزودن اثر</span>
                </button>

                {/* Upload HTML Auto-Fill Button */}
                {onUploadHtml && (
                  <button
                    id="nav-upload-html-button"
                    onClick={onUploadHtml}
                    title="آپلود فایل HTML برای تکمیل خودکار اثر"
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                    <span className="hidden md:inline">آپلود HTML</span>
                  </button>
                )}

                {/* Active Admin Badge, Change Password & Logout Button */}
                <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs text-emerald-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                  <span className="hidden lg:inline text-[11px]">ادمین</span>
                  
                  {onChangePassword && (
                    <button
                      id="nav-change-pwd-btn"
                      onClick={onChangePassword}
                      title="تغییر رمز عبور مدیریت"
                      className="mr-0.5 sm:mr-1 p-1 rounded-lg hover:bg-emerald-800/50 text-cyan-300 hover:text-white transition-colors"
                    >
                      <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}

                  {onAdminLogout && (
                    <button
                      id="nav-admin-logout-btn"
                      onClick={onAdminLogout}
                      title="خروج از حساب مدیریت"
                      className="p-1 rounded-lg hover:bg-emerald-800/40 text-emerald-400 hover:text-white transition-colors"
                    >
                      <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>
              </>
            ) : null}

            {/* User Profile / Auth Account Button (Single Unified Entry Point) */}
            <UserAccountButton 
              onOpenAuthModal={onOpenAuthModal}
              onOpenTracking={() => setActiveTab('tracking')}
              isAdmin={isAdmin}
              onOpenAdminLogin={onOpenAdminLogin}
            />

            {/* Favorites Toggle */}
            <button
              id="toggle-favorites-button"
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                if (activeTab !== 'home') setActiveTab('home');
              }}
              title="علاقه‌مندی‌ها"
              className={`relative p-1.5 sm:p-2 rounded-xl border transition-all ${
                showFavoritesOnly
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-[#1C1C2E] border-[#2A2A40] text-[#A0A0B5] hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Sync Refresh Button */}
            <button
              id="sync-refresh-button"
              onClick={onRefresh}
              disabled={isSyncing}
              title="بروزرسانی داده‌ها از سرور"
              className="p-1.5 sm:p-2 rounded-xl bg-[#1C1C2E] border border-[#2A2A40] text-[#A0A0B5] hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isSyncing ? 'animate-spin text-[#E50914]' : ''}`} />
            </button>
          </div>

        </div>

        {/* Mobile Search Row (Clean, dedicated row below brand on small screens) */}
        <div className="block md:hidden pb-2 pt-0.5">
          <div className="relative">
            <input
              id="mobile-global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی فیلم، سریال، بازیگر..."
              className="w-full bg-[#1C1C2E] text-white text-xs rounded-xl pl-8 pr-8 py-2 border border-[#2A2A40] focus:border-[#E50914] focus:outline-none focus:ring-1 focus:ring-[#E50914] transition-all placeholder:text-[#5A5A72]"
            />
            <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-[#5A5A72]" />
            {searchQuery && (
              <button
                id="mobile-clear-search-button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2.5 text-[#5A5A72] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
