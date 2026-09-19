import React from 'react';
import { Movie, ActiveTab } from './types';
import { MovieService } from './services/api';
import { AuthService } from './services/authService';
import { INITIAL_MOVIES } from './data/initialMovies';
import { Navbar } from './components/Navbar';
// Route-based code splitting: each screen is its own chunk, loaded on first visit.
// Cuts the initial JS the phone must parse/download on first render.
const HomeScreen = React.lazy(() => import('./screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const MovieDetailScreen = React.lazy(() => import('./screens/MovieDetailScreen').then(m => ({ default: m.MovieDetailScreen })));
const BoxOfficeScreen = React.lazy(() => import('./screens/BoxOfficeScreen').then(m => ({ default: m.BoxOfficeScreen })));
const TrackingScreen = React.lazy(() => import('./screens/TrackingScreen').then(m => ({ default: m.TrackingScreen })));
const SettingsScreen = React.lazy(() => import('./screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const CinephileAssistantScreen = React.lazy(() => import('./screens/CinephileAssistantScreen').then(m => ({ default: m.CinephileAssistantScreen })));
const ActorsScreen = React.lazy(() => import('./screens/ActorsScreen').then(m => ({ default: m.ActorsScreen })));

// Spinner shown while a lazily-loaded screen chunk downloads.
const ScreenFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
  </div>
);
import { TrailerModal } from './components/TrailerModal';
import { AddEditMovieModal } from './components/AddEditMovieModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AuthModal } from './components/AuthModal';
import { DetailErrorBoundary } from './components/DetailErrorBoundary';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BulkHtmlImportModal } from './components/BulkHtmlImportModal';
import { ActorStorageService } from './services/actorStorageService';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [movies, setMovies] = React.useState<Movie[]>(() => MovieService.getLocalMovies());
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('home');
  const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
  const moviesRef = React.useRef<Movie[]>([]);
  moviesRef.current = movies;
  const [trailerMovie, setTrailerMovie] = React.useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState<boolean>(false);
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = React.useState<boolean>(false);
  const [movieToEdit, setMovieToEdit] = React.useState<Movie | null>(null);
  const [prefilledHtml, setPrefilledHtml] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState<boolean>(() => AuthService.isAdminAuthenticated());
  const [isAdminLoginOpen, setIsAdminLoginOpen] = React.useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = React.useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = React.useState<'signin' | 'signup' | 'admin' | 'forgot'>('signin');

  const openAuthModal = (mode: 'signin' | 'signup' | 'admin' | 'forgot' = 'signin') => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const globalFileInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    showToast('خوش آمدید! دسترسی مدیریت فعال شد', 'success');
  };

  const handleAdminLogout = () => {
    AuthService.logout();
    setIsAdmin(false);
    showToast('از حساب مدیریت خارج شدید', 'info');
  };

  // Handle global HTML file select — one file opens the editor, several go to bulk import
  const handleGlobalHtmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      showToast('برای افزودن فیلم از طریق فایل HTML، ابتدا وارد حساب مدیریت شوید', 'error');
      setIsAdminLoginOpen(true);
      return;
    }
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    if (files.length > 1) {
      setIsBulkImportOpen(true);
      showToast(`${files.length} فایل انتخاب شد — پنجره افزودن گروهی باز شد`, 'info');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setMovieToEdit(null);
        setPrefilledHtml(content);
        setIsAddEditOpen(true);
      }
    };
    reader.readAsText(files[0]);
  };

  // Trigger HTML file selector
  const triggerHtmlUpload = () => {
    if (!isAdmin) {
      showToast('دسترسی آپلود فایل مخصوص مدیر سیستم است', 'error');
      setIsAdminLoginOpen(true);
      return;
    }
    globalFileInputRef.current?.click();
  };

  // Sync with server on initial load
  const syncWithServer = React.useCallback(async (showToastNotice = false) => {
    setIsSyncing(true);
    try {
      const { movies: updated, isOnline, updatedCount } = await MovieService.fetchMovies();
      setMovies(updated);
      if (showToastNotice) {
        if (isOnline) {
          showToast(`بروزرسانی موفق: ${updatedCount} فیلم همگام‌سازی شد`, 'success');
        } else {
          showToast('بروزرسانی از مخزن محلی با موفقیت انجام شد', 'info');
        }
      }
    } catch (e) {
      console.error('Sync failed:', e);
      if (showToastNotice) {
        showToast('خطا در ارتباط با سرور، از حافظه آفلاین استفاده می‌شود', 'info');
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  React.useEffect(() => {
    // 1. Pull the full cached list out of IndexedDB so the UI is immediately responsive.
    MovieService.hydrateFromCache().then(cached => {
      if (cached && cached.length > 0) setMovies(cached);
    });

    // 2. Fetch fresh data from server; when done, update state so newly resolved URLs reflect.
    syncWithServer(false).then(() => {
      // Force refresh memoryMovies in case sync returned fresh proxy URLs
      const latest = MovieService.getLocalMovies();
      if (latest && latest.length > 0) setMovies([...latest]);
    });
  }, [syncWithServer]);

  // Verify admin session against the server on load; drop stale local flags
  React.useEffect(() => {
    if (!AuthService.isAdminAuthenticated()) return;
    AuthService.verifyWithServer().then(valid => {
      if (!valid) {
        AuthService.logout();
        setIsAdmin(false);
      }
    });
  }, []);

  // Load server-side actor bios so the actors screen shows real biographies
  React.useEffect(() => {
    ActorStorageService.fetchServerBiosAsOverrides();
  }, []);

  // Global window drop handler for HTML files
  React.useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || [])
        .filter(f => f.type.includes('html') || f.name.endsWith('.html') || f.name.endsWith('.htm'));
      if (files.length === 0) return;
      if (!AuthService.isAdminAuthenticated()) {
        showToast('برای افزودن فیلم، ابتدا وارد حساب مدیریت شوید', 'error');
        setIsAdminLoginOpen(true);
        return;
      }
      // Several files dropped at once → bulk import instead of the single-movie editor
      if (files.length > 1) {
        setIsBulkImportOpen(true);
        showToast(`${files.length} فایل رها شد — پنجره افزودن گروهی باز شد`, 'info');
        return;
      }
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setMovieToEdit(null);
          setPrefilledHtml(content);
          setIsAddEditOpen(true);
          showToast(`فایل «${file.name}» شناسایی و اطلاعات آن استخراج شد`, 'success');
        }
      };
      reader.readAsText(file);
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Toggle favorite
  const handleToggleFavorite = (messageId: number) => {
    const updated = MovieService.toggleFavorite(messageId);
    setMovies(updated);
    if (selectedMovie && selectedMovie.message_id === messageId) {
      setSelectedMovie(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
    }
  };

  // Add or Edit Movie save handler
  const handleSaveMovie = (movieData: Partial<Movie>) => {
    if (!isAdmin) {
      showToast('عملیات ذخیره‌سازی فقط توسط مدیر مجاز است', 'error');
      setIsAdminLoginOpen(true);
      return;
    }
    if (movieToEdit) {
      // Updating existing movie
      const updatedMovie: Movie = {
        ...movieToEdit,
        ...movieData,
      } as Movie;
      const updatedList = MovieService.updateMovie(updatedMovie);
      setMovies(updatedList);
      if (selectedMovie && selectedMovie.message_id === updatedMovie.message_id) {
        setSelectedMovie(updatedMovie);
      }
      showToast(`فیلم «${updatedMovie.title}» با موفقیت ویرایش شد`, 'success');
    } else {
      // Adding new movie
      const created = MovieService.addMovie(movieData as Partial<Movie> & { title: string });
      setMovies(prev => [created, ...prev]);
      showToast(`فیلم «${created.title}» با موفقیت به آرشیو اضافه شد`, 'success');
    }
  };

  // Delete Movie handler
  const handleDeleteMovie = (messageId: number) => {
    if (!isAdmin) {
      showToast('عملیات حذف فقط توسط مدیر مجاز است', 'error');
      setIsAdminLoginOpen(true);
      return;
    }
    const updated = MovieService.deleteMovie(messageId);
    setMovies(updated);
    if (selectedMovie && selectedMovie.message_id === messageId) {
      setSelectedMovie(null);
      setActiveTab('home');
    }
    showToast('اثر با موفقیت از آرشیو حذف شد', 'info');
  };

  // Open modal for new movie
  const handleOpenAddMovie = () => {
    if (!isAdmin) {
      showToast('برای افزودن فیلم یا سریال جدید، ابتدا وارد حساب مدیریت شوید', 'error');
      setIsAdminLoginOpen(true);
      return;
    }
    setMovieToEdit(null);
    setIsAddEditOpen(true);
  };

  // Open modal for editing movie
  const handleOpenEditMovie = (movie: Movie) => {
    if (!isAdmin) {
      showToast('برای ویرایش اطلاعات اثر، ابتدا وارد حساب مدیریت شوید', 'error');
      setIsAdminLoginOpen(true);
      return;
    }
    setMovieToEdit(movie);
    setIsAddEditOpen(true);
  };

  // Clear all data
  const handleClearData = () => {
    if (!isAdmin) {
      showToast('پاک کردن داده‌ها نیازمند دسترسی مدیریت است', 'error');
      setIsAdminLoginOpen(true);
      return;
    }
    MovieService.clearAllData();
    setMovies([]);
    setSelectedMovie(null);
    showToast('تمامی اطلاعات با موفقیت پاک شدند', 'info');
  };

  // Reset to default curated dataset
  const handleResetDefaultData = () => {
    if (!isAdmin) {
      showToast('بازنشانی داده‌ها نیازمند دسترسی مدیریت است', 'error');
      setIsAdminLoginOpen(true);
      return;
    }
    MovieService.saveLocalMovies(INITIAL_MOVIES);
    setMovies(INITIAL_MOVIES);
    showToast('داده‌های اولیه با موفقیت بازنشانی شدند', 'success');
  };

  // Handle movie click — go to detail WITHOUT destroying the home scroll position.
  // The saved position lives in sessionStorage (mb_home_scroll / mb_progressive_count)
  // and is restored by HomeScreen's mount effect when the user comes back.
  // Also update the hash so every movie has a deep-linkable URL (#/movie/<id>) — this is
  // what makes right-click -> open in new tab / middle-click work from cards.
  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setActiveTab('detail');
    try { if (location.hash !== '#/movie/' + movie.message_id) history.replaceState(null, '', '#/movie/' + movie.message_id); } catch {}
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  // Deep-link support: #/movie/<id> opens the detail screen directly (new tab / share).
  // On a fresh tab the list loads asynchronously, so capture the id now and (re)try the
  // lookup every time `movies` updates until the movie exists.
  const [deepLinkMovieId, setDeepLinkMovieId] = React.useState<number | null>(() => {
    const m = location.hash.match(/^#\/movie\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  });

  React.useEffect(() => {
    const onHashChange = () => {
      const m = location.hash.match(/^#\/movie\/(\d+)/);
      const newId = m ? parseInt(m[1], 10) : null;
      setDeepLinkMovieId(newId);
      if (!newId && activeTab === 'detail') {
        setActiveTab('home');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [activeTab]);

  React.useEffect(() => {
    if (!deepLinkMovieId) return;
    // Don't deselect or change if we already have the right movie selected
    if (selectedMovie && Number(selectedMovie.message_id) === Number(deepLinkMovieId)) {
      if (activeTab !== 'detail') setActiveTab('detail');
      return;
    }
    const mv = (movies || []).find(x => Number(x.message_id) === Number(deepLinkMovieId));
    if (mv) {
      setSelectedMovie(mv);
      if (activeTab !== 'detail') setActiveTab('detail');
    }
  }, [deepLinkMovieId, movies, activeTab, selectedMovie]);

  // Handle trailer click
  const handleTrailerClick = (movie: Movie) => {
    setTrailerMovie(movie);
  };

  // Detail hydration: MovieDetailScreen fetched the full record from
  // /api/movies/:id (the list sync only ships slim fields) — swap it into state.
  const handleHydrateMovie = React.useCallback((m: Movie) => {
    setMovies(prev => prev.map(x => Number(x.message_id) === Number(m.message_id) ? m : x));
    setSelectedMovie(prev =>
      prev && Number(prev.message_id) === Number(m.message_id) ? m : prev);
  }, []);

  const [trackingInitialMovieId, setTrackingInitialMovieId] = React.useState<number | null>(null);

  // Handle tracking link
  const handleOpenTracking = (messageId: number) => {
    setTrackingInitialMovieId(messageId);
    setActiveTab('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const favoritesCount = React.useMemo(() => {
    return movies.filter(m => m.is_favorite).length;
  }, [movies]);

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white flex flex-col font-sans selection:bg-[#E50914] selection:text-white" dir="rtl">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold border backdrop-blur-md ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-900/30' 
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-rose-900/30'
              : 'bg-[#1C1C2E]/95 text-white border-[#3A3A55] shadow-black/50'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#00D4FF]" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Hidden Global HTML File Input — multiple files route to the bulk importer */}
      <input
        type="file"
        ref={globalFileInputRef}
        onChange={handleGlobalHtmlUpload}
        accept=".html,.htm,text/html"
        multiple
        className="hidden"
      />

      {/* Bulk HTML Import */}
      {isBulkImportOpen && (
        <BulkHtmlImportModal
          onClose={() => setIsBulkImportOpen(false)}
          onImported={(count) => {
            showToast(`${count} فیلم از فایل‌های HTML افزوده شد`, 'success');
            syncWithServer(false);
          }}
        />
      )}

      {/* Main Top Navigation Header */}
      {activeTab !== 'detail' && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
          favoritesCount={favoritesCount}
          isSyncing={isSyncing}
          onRefresh={() => syncWithServer(true)}
          onAddMovie={handleOpenAddMovie}
          onUploadHtml={triggerHtmlUpload}
          isAdmin={isAdmin}
          onOpenAdminLogin={() => openAuthModal('admin')}
          onAdminLogout={handleAdminLogout}
          onChangePassword={() => setIsChangePasswordOpen(true)}
          onOpenAuthModal={() => openAuthModal('signin')}
        />
      )}

      {/* Main Content View Switcher — Suspense wraps the lazy screen chunks */}
      <main className="flex-1 pb-24 md:pb-8">
        <React.Suspense fallback={<ScreenFallback />}>
        {activeTab === 'home' && (
          <HomeScreen
            movies={movies}
            onMovieClick={handleMovieClick}
            onToggleFavorite={handleToggleFavorite}
            onTrailerClick={handleTrailerClick}
            onAddMovie={handleOpenAddMovie}
            onUploadHtml={triggerHtmlUpload}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'actors' && (
          <ActorsScreen
            movies={movies}
            onMovieClick={handleMovieClick}
            onTrailerClick={handleTrailerClick}
            onToggleFavorite={handleToggleFavorite}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'ai_assistant' && (
          <CinephileAssistantScreen />
        )}

        {activeTab === 'detail' && selectedMovie && (
          <DetailErrorBoundary onReset={() => { try { history.replaceState(null, '', location.pathname); } catch {} setActiveTab('home'); }}>
            <MovieDetailScreen
              movie={selectedMovie}
              allMovies={movies}
              onBack={() => { try { history.replaceState(null, '', location.pathname); } catch {} setActiveTab('home'); }}
              onToggleFavorite={handleToggleFavorite}
              onTrailerClick={handleTrailerClick}
              onOpenTracking={handleOpenTracking}
              onSelectMovie={handleMovieClick}
              onEditMovie={handleOpenEditMovie}
              onDeleteMovie={handleDeleteMovie}
              onHydrateMovie={handleHydrateMovie}
              isAdmin={isAdmin}
            />
          </DetailErrorBoundary>
        )}

        {activeTab === 'boxoffice' && (
          <BoxOfficeScreen
            onBack={() => { try { history.replaceState(null, '', location.pathname); } catch {} setActiveTab('home'); }}
            onMovieClick={handleMovieClick}
            allMovies={movies}
          />
        )}

        {activeTab === 'tracking' && (
          <TrackingScreen
            onBack={() => { try { history.replaceState(null, '', location.pathname); } catch {} setActiveTab('home'); }}
            onMovieClick={handleMovieClick}
            allMovies={movies}
            onOpenAuthModal={() => openAuthModal('signin')}
            initialMovieId={trackingInitialMovieId}
            onClearInitialMovieId={() => setTrackingInitialMovieId(null)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            onBack={() => { try { history.replaceState(null, '', location.pathname); } catch {} setActiveTab('home'); }}
            movieCount={movies.length}
            favoritesCount={favoritesCount}
            onClearData={handleClearData}
            onResetDefaultData={handleResetDefaultData}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => openAuthModal('admin')}
            onAdminLogout={handleAdminLogout}
            onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            showToast={showToast}
            onOpenAuthModal={() => openAuthModal('signin')}
          />
        )}
        </React.Suspense>
      </main>

      {/* Trailer Modal Player */}
      <TrailerModal
        movie={trailerMovie}
        onClose={() => setTrailerMovie(null)}
      />

      {/* Unified User & Admin Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalInitialMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => showToast('خوش آمدید! ورود به حساب با موفقیت انجام شد', 'success')}
        onAdminSuccess={handleAdminLoginSuccess}
      />

      {/* Add / Edit Movie Modal */}
      <AddEditMovieModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setMovieToEdit(null);
          setPrefilledHtml(null);
        }}
        onSave={handleSaveMovie}
        initialMovie={movieToEdit}
        prefilledHtml={prefilledHtml}
      />

      {/* Admin Authentication Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Admin Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={() => showToast('رمز عبور مدیریت با موفقیت تغییر یافت', 'success')}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

    </div>
  );
}

export default App;
