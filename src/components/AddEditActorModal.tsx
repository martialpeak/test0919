import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Sparkles, 
  Image as ImageIcon, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Award, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  Globe, 
  FileText,
  Search,
  ShieldCheck,
  Film,
  Check,
  RefreshCw
} from 'lucide-react';
import { ActorAward, ActorKnownWork } from '../types';
import { ActorStorageService, CustomActorData } from '../services/actorStorageService';
import { DetailedActorProfile } from '../utils/actorHelper';
import { resolveActorPhoto } from '../services/actorPhotoService';
import { apiFetch } from '../services/apiFetch';

export interface CandidatePhoto {
  url: string;
  title?: string;
  source?: string;
}

interface AddEditActorModalProps {
  isOpen: boolean;
  onClose: () => void;
  actorToEdit?: DetailedActorProfile | null;
  onSuccess?: (savedActor: CustomActorData) => void;
}

export const AddEditActorModal: React.FC<AddEditActorModalProps> = ({
  isOpen,
  onClose,
  actorToEdit,
  onSuccess
}) => {
  const isEditing = !!actorToEdit;

  const [name, setName] = useState<string>('');
  const [englishName, setEnglishName] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');
  const [job, setJob] = useState<string>('بازیگر');
  const [character, setCharacter] = useState<string>('');
  const [biography, setBiography] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [birthPlace, setBirthPlace] = useState<string>('');
  const [nationality, setNationality] = useState<string>('');
  const [category, setCategory] = useState<'iranian' | 'foreign' | 'director' | 'winner'>('foreign');
  const [isDirector, setIsDirector] = useState<boolean>(false);
  const [awards, setAwards] = useState<ActorAward[]>([]);
  const [knownFor, setKnownFor] = useState<ActorKnownWork[]>([]);

  // Candidate photos gallery state
  const [candidatePhotos, setCandidatePhotos] = useState<CandidatePhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState<boolean>(false);

  // Award sub-form
  const [awardTitle, setAwardTitle] = useState('');
  const [awardYear, setAwardYear] = useState('');
  const [awardMovie, setAwardMovie] = useState('');
  const [awardIsWinner, setAwardIsWinner] = useState(true);

  // Known work sub-form
  const [workTitle, setWorkTitle] = useState('');
  const [workYear, setWorkYear] = useState('');
  const [workCharacter, setWorkCharacter] = useState('');

  const [activeTab, setActiveTab] = useState<'info' | 'bio' | 'awards' | 'works'>('info');
  const [isLoadingOnline, setIsLoadingOnline] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Smart Search state
  const [smartSearchQuery, setSmartSearchQuery] = useState<string>('');
  const [isSearchingCandidates, setIsSearchingCandidates] = useState<boolean>(false);
  const [searchCandidates, setSearchCandidates] = useState<Array<{
    name: string;
    english_name?: string;
    photo?: string;
    job?: string;
    birth_date?: string;
    birth_place?: string;
    nationality?: string;
    description?: string;
    source?: string;
    source_label?: string;
  }>>([]);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState<boolean>(false);

  const appendCandidatePhotos = (newPhotos: Array<{ url: string; title?: string; source?: string }>) => {
    setCandidatePhotos(prev => {
      const existing = new Set(prev.map(p => p.url));
      const toAdd: CandidatePhoto[] = [];
      for (const p of newPhotos) {
        if (p.url && !existing.has(p.url)) {
          existing.add(p.url);
          toAdd.push(p);
        }
      }
      return [...prev, ...toAdd];
    });
  };

  useEffect(() => {
    if (isOpen) {
      setFeedbackMessage(null);
      setSmartSearchQuery('');
      setSearchCandidates([]);
      setShowCandidateDropdown(false);
      if (actorToEdit) {
        setName(actorToEdit.name || '');
        setEnglishName(actorToEdit.english_name || '');
        setPhoto(actorToEdit.photo || '');
        setJob(actorToEdit.job || 'بازیگر');
        setCharacter(actorToEdit.character || '');
        setBiography(actorToEdit.biography || '');
        setBirthDate(actorToEdit.birth_date || '');
        setBirthPlace(actorToEdit.birth_place || '');
        setNationality(actorToEdit.nationality || '');
        setCategory(actorToEdit.category || 'foreign');
        setIsDirector(actorToEdit.isDirector || false);
        setAwards(actorToEdit.awards ? [...actorToEdit.awards] : []);
        setKnownFor(actorToEdit.known_for ? [...actorToEdit.known_for] : []);
        if (actorToEdit.photo) {
          setCandidatePhotos([{ url: actorToEdit.photo, title: actorToEdit.name, source: 'current' }]);
        } else {
          setCandidatePhotos([]);
        }
      } else {
        setName('');
        setEnglishName('');
        setPhoto('');
        setJob('بازیگر');
        setCharacter('');
        setBiography('');
        setBirthDate('');
        setBirthPlace('');
        setNationality('');
        setCategory('foreign');
        setIsDirector(false);
        setAwards([]);
        setKnownFor([]);
        setCandidatePhotos([]);
      }
    }
  }, [isOpen, actorToEdit]);

  // Debounced auto-search for candidates as the user types
  useEffect(() => {
    const q = smartSearchQuery.trim();
    if (q.length < 2) {
      setSearchCandidates([]);
      setIsSearchingCandidates(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCandidates(true);
      try {
        const res = await apiFetch(`/api/actors/smart-search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.results)) {
            setSearchCandidates(data.results);
            setShowCandidateDropdown(true);

            // Also proactively gather any candidate photos from search results
            const photosFromSearch = data.results
              .filter((r: any) => r.photo)
              .map((r: any) => ({
                url: r.photo,
                title: r.name,
                source: r.source || 'search'
              }));
            if (photosFromSearch.length > 0) {
              appendCandidatePhotos(photosFromSearch);
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setIsSearchingCandidates(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [smartSearchQuery]);

  if (!isOpen) return null;

  const handleAddAward = () => {
    if (!awardTitle.trim()) return;
    setAwards(prev => [
      ...prev,
      {
        title: awardTitle.trim(),
        year: awardYear ? String(awardYear) : new Date().getFullYear().toString(),
        movie_name: awardMovie.trim() || undefined,
        is_winner: awardIsWinner
      }
    ]);
    setAwardTitle('');
    setAwardYear('');
    setAwardMovie('');
    setAwardIsWinner(true);
  };

  const handleRemoveAward = (index: number) => {
    setAwards(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddKnownWork = () => {
    if (!workTitle.trim()) return;
    setKnownFor(prev => [
      ...prev,
      {
        title: workTitle.trim(),
        year: workYear ? String(workYear) : undefined,
        role: workCharacter.trim() || undefined
      }
    ]);
    setWorkTitle('');
    setWorkYear('');
    setWorkCharacter('');
  };

  const handleRemoveKnownWork = (index: number) => {
    setKnownFor(prev => prev.filter((_, i) => i !== index));
  };

  // Handler for direct photo input (with automatic IMDb URL resolution)
  const handlePhotoInputChange = async (val: string) => {
    setPhoto(val);
    const trimmed = val.trim();
    if (trimmed.includes('imdb.com/name/nm') || /^nm\d{6,8}$/i.test(trimmed)) {
      try {
        const res = await apiFetch(`/api/actors/photos?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.photos) && data.photos.length > 0) {
            const firstImdb = data.photos.find((p: any) => p.source === 'imdb') || data.photos[0];
            if (firstImdb?.url) {
              setPhoto(firstImdb.url);
              appendCandidatePhotos(data.photos);
              setFeedbackMessage({ text: 'عکس پرتره رسمی هنرمند از IMDb استخراج و جایگزین شد.', type: 'success' });
            }
          }
        }
      } catch {
        // ignore
      }
    }
  };

  // Handler to fetch additional candidate photos from multiple sources
  const handleFetchMorePhotos = async () => {
    const q = name.trim() || englishName.trim() || smartSearchQuery.trim();
    if (!q) {
      setFeedbackMessage({ text: 'لطفاً ابتدا نام یا نام انگلیسی را وارد کنید.', type: 'error' });
      return;
    }
    setIsLoadingPhotos(true);
    try {
      const res = await apiFetch(`/api/actors/photos?q=${encodeURIComponent(q)}&name=${encodeURIComponent(name || '')}&english_name=${encodeURIComponent(englishName || '')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.photos) && data.photos.length > 0) {
          appendCandidatePhotos(data.photos);
          setFeedbackMessage({ text: `${data.photos.length} تصویر برای انتخاب و بررسی اضافه شد.`, type: 'info' });
          return;
        }
      }
      setFeedbackMessage({ text: 'تصویر جدید دیگری یافت نشد. می‌توانید لینک دلخواه خود را مستقیماً وارد کنید.', type: 'info' });
    } catch {
      setFeedbackMessage({ text: 'خطا در جستجوی تصاویر بیشتر.', type: 'error' });
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Perform full Smart Enrich & Auto-Fill for a given query or candidate
  const handleSelectCandidateAndEnrich = async (candidateName: string, candidateEnglish?: string) => {
    const q = candidateName || candidateEnglish || smartSearchQuery.trim();
    if (!q) return;

    setShowCandidateDropdown(false);
    setIsLoadingOnline(true);
    setFeedbackMessage({ text: `در حال دریافت مشخصات، عکس و بیوگرافی هوشمند «${q}»...`, type: 'info' });

    try {
      const res = await apiFetch(`/api/actors/smart-enrich?q=${encodeURIComponent(q)}&name=${encodeURIComponent(candidateName || '')}&english_name=${encodeURIComponent(candidateEnglish || '')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          if (data.name) setName(data.name);
          if (data.english_name) setEnglishName(data.english_name);
          if (data.photo) setPhoto(data.photo);
          if (data.job) setJob(data.job);
          if (data.character) setCharacter(data.character);
          if (data.biography) setBiography(data.biography);
          if (data.birth_date) setBirthDate(data.birth_date);
          if (data.birth_place) setBirthPlace(data.birth_place);
          if (data.nationality) setNationality(data.nationality);
          if (data.category) setCategory(data.category);
          if (typeof data.isDirector === 'boolean') setIsDirector(data.isDirector);
          if (Array.isArray(data.awards) && data.awards.length > 0) {
            setAwards(data.awards);
          }
          if (Array.isArray(data.known_for) && data.known_for.length > 0) {
            setKnownFor(data.known_for);
          }

          // Populate candidate photos gallery
          const collected: CandidatePhoto[] = [];
          if (data.photo) {
            collected.push({ url: data.photo, title: data.name || q, source: 'default' });
          }
          if (Array.isArray(data.candidate_photos)) {
            collected.push(...data.candidate_photos);
          }
          if (collected.length > 0) {
            appendCandidatePhotos(collected);
          }

          // Fetch even more photo options in the background for convenience
          apiFetch(`/api/actors/photos?q=${encodeURIComponent(q)}&name=${encodeURIComponent(data.name || candidateName || '')}&english_name=${encodeURIComponent(data.english_name || candidateEnglish || '')}`)
            .then(r => r.json())
            .then(photoData => {
              if (photoData.ok && Array.isArray(photoData.photos)) {
                appendCandidatePhotos(photoData.photos);
              }
            })
            .catch(() => {});

          setFeedbackMessage({
            text: `اطلاعات «${data.name || q}» همراه با بیوگرافی و افتخارات با موفقیت استخراج شد! می‌توانید بین عکس‌های یافت‌شده در زیر، عکس مناسب را انتخاب نمایید.`,
            type: 'success'
          });
          return;
        }
      }
      setFeedbackMessage({ text: 'اطلاعات از دانشنامه دریافت شد. می‌توانید فیلدها را بررسی نمایید.', type: 'info' });
    } catch {
      setFeedbackMessage({ text: 'خطا در برقراری ارتباط با سرویس جستجوی هوشمند.', type: 'error' });
    } finally {
      setIsLoadingOnline(false);
    }
  };

  // Auto fetch bio & photo & full details from online AI / Wikipedia / DB
  const handleAutoFetchDetails = async () => {
    const queryName = name.trim() || englishName.trim() || smartSearchQuery.trim();
    if (!queryName) {
      setFeedbackMessage({ text: 'لطفاً ابتدا نام یا نام انگلیسی را در کادر جستجو یا فرم وارد کنید.', type: 'error' });
      return;
    }
    await handleSelectCandidateAndEnrich(name, englishName);
  };

  // Specific Auto-Fetch for Awards Only
  const handleAutoFetchAwardsOnly = async () => {
    const q = name.trim() || englishName.trim() || smartSearchQuery.trim();
    if (!q) {
      setFeedbackMessage({ text: 'لطفاً ابتدا نام هنرمند را در تب اول وارد کنید.', type: 'error' });
      return;
    }
    setIsLoadingOnline(true);
    setFeedbackMessage({ text: `در حال استخراج خودکار جوایز و افتخارات «${q}» با هوش مصنوعی...`, type: 'info' });
    try {
      const res = await apiFetch(`/api/actors/smart-enrich?q=${encodeURIComponent(q)}&name=${encodeURIComponent(name || '')}&english_name=${encodeURIComponent(englishName || '')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.awards) && data.awards.length > 0) {
          setAwards(data.awards);
          setFeedbackMessage({ text: `${data.awards.length} جایزه و افتخار برای «${q}» با موفقیت دریافت و ثبت شد!`, type: 'success' });
          return;
        }
      }
      setFeedbackMessage({ text: 'جایزه ثبت‌شده‌ای در دانشنامه‌ها یافت نشد یا می‌توانید به صورت دستی اضافه نمایید.', type: 'info' });
    } catch {
      setFeedbackMessage({ text: 'خطا در دریافت خودکار جوایز.', type: 'error' });
    } finally {
      setIsLoadingOnline(false);
    }
  };

  // Specific Auto-Fetch for Known Works Only
  const handleAutoFetchWorksOnly = async () => {
    const q = name.trim() || englishName.trim() || smartSearchQuery.trim();
    if (!q) {
      setFeedbackMessage({ text: 'لطفاً ابتدا نام هنرمند را در تب اول وارد کنید.', type: 'error' });
      return;
    }
    setIsLoadingOnline(true);
    setFeedbackMessage({ text: `در حال استخراج خودکار فیلم‌ها و آثار شاخص «${q}» با هوش مصنوعی...`, type: 'info' });
    try {
      const res = await apiFetch(`/api/actors/smart-enrich?q=${encodeURIComponent(q)}&name=${encodeURIComponent(name || '')}&english_name=${encodeURIComponent(englishName || '')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.known_for) && data.known_for.length > 0) {
          setKnownFor(data.known_for);
          setFeedbackMessage({ text: `${data.known_for.length} اثر و فیلم شاخص برای «${q}» با موفقیت استخراج شد!`, type: 'success' });
          return;
        }
      }
      setFeedbackMessage({ text: 'فیلم‌های موجود در سایت به صورت خودکار متصل می‌شوند یا می‌توانید دستی اضافه کنید.', type: 'info' });
    } catch {
      setFeedbackMessage({ text: 'خطا در دریافت خودکار آثار شاخص.', type: 'error' });
    } finally {
      setIsLoadingOnline(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedbackMessage({ text: 'نام هنرمند اجباری است.', type: 'error' });
      return;
    }

    const payload: CustomActorData = {
      id: actorToEdit ? actorToEdit.id : `custom_${Date.now()}`,
      name: name.trim(),
      english_name: englishName.trim() || undefined,
      photo: photo.trim() || undefined,
      job: job.trim() || (isDirector ? 'کارگردان' : 'بازیگر'),
      character: character.trim() || undefined,
      biography: biography.trim() || undefined,
      birth_date: birthDate.trim() || undefined,
      birth_place: birthPlace.trim() || undefined,
      nationality: nationality.trim() || undefined,
      category,
      isDirector: isDirector || job.includes('کارگردان'),
      awards,
      known_for: knownFor,
      is_custom: !isEditing
    };

    if (isEditing) {
      // Save override for existing actor
      ActorStorageService.saveActorOverride(actorToEdit.id || actorToEdit.name, payload);
    } else {
      // Save brand new custom actor
      ActorStorageService.saveCustomActor(payload);
    }

    onSuccess?.(payload);
    onClose();
  };

  const handleResetToDefault = () => {
    if (actorToEdit) {
      ActorStorageService.resetActorOverride(actorToEdit.id || actorToEdit.name);
      onClose();
    }
  };

  const previewPhoto = photo.trim() || (name ? resolveActorPhoto(name, englishName) : '');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="add-edit-actor-modal"
        className="relative w-full max-w-2xl bg-[#141422] border border-[#2B2B42] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8B5CF6] via-[#E50914] to-[#00D4FF]" />

        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#26263C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#E50914] flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {isEditing ? `ویرایش بیوگرافی و اطلاعات: ${actorToEdit.name}` : 'افزودن بازیگر یا هنرمند جدید'}
              </h2>
              <p className="text-xs text-[#8E8EA8]">
                {isEditing ? 'تنظیم بیوگرافی، مشخصات و جوایز اختصاصی توسط مدیر سیستم' : 'با جستجوی هوشمند نام هنرمند، تمام اطلاعات، عکس و جوایز را خودکار تکمیل کنید'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7E7E98] hover:text-white hover:bg-[#202034] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Smart Search & Auto-Fill Banner */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-[#171728] border-b border-[#24243A]">
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="smart-actor-search-input"
                  type="text"
                  value={smartSearchQuery}
                  onChange={(e) => {
                    setSmartSearchQuery(e.target.value);
                    setShowCandidateDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchCandidates.length > 0) {
                        const first = searchCandidates[0];
                        handleSelectCandidateAndEnrich(first.name, first.english_name);
                      } else if (smartSearchQuery.trim()) {
                        handleSelectCandidateAndEnrich(smartSearchQuery.trim());
                      }
                    }
                  }}
                  placeholder="جستجوی نام یا لینک IMDb هنرمند (مثال: Çetin Tekindor، بوراک اوزچیویت، شاهرخ خان یا لینک imdb.com/name/nm...)..."
                  className="w-full bg-[#10101C] text-white text-xs sm:text-sm rounded-xl pl-9 pr-10 py-2.5 border border-[#343452] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] focus:outline-none transition-all placeholder:text-[#656580]"
                />
                <Search className="absolute right-3 top-3 w-4 h-4 text-[#8B5CF6]" />
                
                {isSearchingCandidates && (
                  <div className="absolute left-3 top-3">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                
                {smartSearchQuery && !isSearchingCandidates && (
                  <button
                    type="button"
                    onClick={() => {
                      setSmartSearchQuery('');
                      setSearchCandidates([]);
                      setShowCandidateDropdown(false);
                    }}
                    className="absolute left-3 top-2.5 text-[#656580] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                id="smart-enrich-action-button"
                onClick={() => {
                  if (smartSearchQuery.trim()) {
                    handleSelectCandidateAndEnrich(smartSearchQuery.trim());
                  } else if (name.trim() || englishName.trim()) {
                    handleSelectCandidateAndEnrich(name.trim(), englishName.trim());
                  } else {
                    setFeedbackMessage({ text: 'لطفاً نام هنرمند را در کادر جستجو تایپ کنید.', type: 'error' });
                  }
                }}
                disabled={isLoadingOnline}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#00D4FF] hover:from-[#7C3AED] hover:to-[#00B4D8] text-white text-xs font-black shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Sparkles className={`w-4 h-4 ${isLoadingOnline ? 'animate-spin' : ''}`} />
                <span>{isLoadingOnline ? 'در حال استخراج هوشمند...' : 'تکمیل خودکار با AI'}</span>
              </button>
            </div>

            {/* Smart Search Auto-complete Candidates Dropdown */}
            {showCandidateDropdown && searchCandidates.length > 0 && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-[#121220] border border-[#33334E] rounded-2xl shadow-2xl p-2 z-50 max-h-64 overflow-y-auto space-y-1.5 animate-fade-in">
                <div className="px-2 py-1 flex items-center justify-between text-[11px] text-[#A8A8C0] border-b border-[#252538]">
                  <span>نتایج پیشنهادی (برای تکمیل خودکار فرم کلیک کنید):</span>
                  <button
                    type="button"
                    onClick={() => setShowCandidateDropdown(false)}
                    className="text-[#757590] hover:text-white"
                  >
                    بستن
                  </button>
                </div>

                {searchCandidates.map((candidate, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectCandidateAndEnrich(candidate.name, candidate.english_name)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#18182A] hover:bg-[#25253E] border border-transparent hover:border-[#8B5CF6]/50 cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#10101C] border border-[#2D2D44] shrink-0">
                      {candidate.photo ? (
                        <img
                          src={candidate.photo}
                          alt={candidate.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#555570]">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-[#C4B5FD] transition-colors truncate">
                          {candidate.name}
                        </span>
                        {candidate.english_name && candidate.english_name !== candidate.name && (
                          <span className="text-[11px] text-[#80809C] truncate" dir="ltr">
                            ({candidate.english_name})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#7A7A96] mt-0.5">
                        {candidate.source_label && (
                          <span className="bg-purple-950/70 border border-purple-800/40 text-purple-300 px-1.5 py-0.2 rounded font-semibold">
                            {candidate.source_label}
                          </span>
                        )}
                        {candidate.job && <span className="bg-[#242438] px-1.5 py-0.5 rounded text-[#A0A0BA]">{candidate.job}</span>}
                        {candidate.nationality && <span>{candidate.nationality}</span>}
                        {candidate.birth_date && <span>متولد: {candidate.birth_date}</span>}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-cyan-400 group-hover:text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">انتخاب و پر کردن</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-1 border-b border-[#222238] bg-[#12121E] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'info' 
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20' 
                : 'text-[#8E8EA8] hover:text-white hover:bg-[#1C1C2E]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>مشخصات اصلی و پرتره</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bio')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'bio' 
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20' 
                : 'text-[#8E8EA8] hover:text-white hover:bg-[#1C1C2E]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>متن بیوگرافی کامل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('awards')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'awards' 
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20' 
                : 'text-[#8E8EA8] hover:text-white hover:bg-[#1C1C2E]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>جوایز و افتخارات ({awards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('works')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'works' 
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20' 
                : 'text-[#8E8EA8] hover:text-white hover:bg-[#1C1C2E]'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>آثار شاخص ({knownFor.length})</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className={`mx-5 mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            feedbackMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              : feedbackMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-blue-950/80 border-blue-500/40 text-blue-300'
          }`}>
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: MAIN INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              
              {/* Quick AI/Wikipedia Fetch Button */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs text-[#C4B5FD] font-medium">
                    تکمیل و به‌روزرسانی خودکار مشخصات و عکس از دیتابیس هوشمند
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFetchDetails}
                  disabled={isLoadingOnline}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className={`w-3.5 h-3.5 ${isLoadingOnline ? 'animate-spin' : ''}`} />
                  <span>{isLoadingOnline ? 'در حال جستجو...' : 'جستجوی هوشمند'}</span>
                </button>
              </div>

              {/* Photo Preview & URL input */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#1B1B2D] rounded-2xl border border-[#2A2A44]">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#12121E] border border-[#3A3A55] shrink-0 shadow-lg">
                  {previewPhoto ? (
                    <img 
                      src={previewPhoto} 
                      alt={name || 'پیش‌نمایش'} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-[center_18%]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%231E1E2F"/><text x="50%" y="55%" font-size="28" fill="%238E8EA8" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">هنرمند</text></svg>`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#5E5E78]">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#A8A8C0]">
                      لینک عکس / پرتره (Photo URL)
                    </label>
                    {photo && (
                      <button
                        type="button"
                        onClick={() => setPhoto('')}
                        className="text-[11px] text-[#8E8EA8] hover:text-rose-400 cursor-pointer"
                      >
                        حذف عکس
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      value={photo}
                      onChange={(e) => handlePhotoInputChange(e.target.value)}
                      placeholder="https://upload.wikimedia.org/... یا لینک مستقیم عکس یا لینک IMDb"
                      className="w-full bg-[#141422] text-white text-xs rounded-xl pl-4 pr-9 py-2.5 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none"
                    />
                    <ImageIcon className="absolute right-3 top-2.5 w-4 h-4 text-[#757590]" />
                  </div>
                  <p className="text-[11px] text-[#7A7A92]">
                    می‌توانید لینک مستقیم وارد کنید یا از گالری پیشنهادی زیر عکس مورد نظر را انتخاب نمایید.
                  </p>
                </div>
              </div>

              {/* Interactive Candidate Photos Gallery for Review & Selection */}
              <div className="p-3.5 rounded-2xl bg-[#141422] border border-[#28283C] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-xs font-bold text-white">انتخاب و بررسی بین عکس‌های پیشنهادی:</span>
                    {candidatePhotos.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 font-semibold">
                        {candidatePhotos.length} عکس یافت شد
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchMorePhotos}
                    disabled={isLoadingPhotos || (!name.trim() && !englishName.trim() && !smartSearchQuery.trim())}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPhotos ? 'animate-spin' : ''}`} />
                    <span>{isLoadingPhotos ? 'در حال دریافت...' : 'جستجوی عکس‌های بیشتر'}</span>
                  </button>
                </div>

                {candidatePhotos.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#8E8EA8] leading-relaxed">
                      روی هر یک از عکس‌های زیر کلیک کنید تا بلافاصله به عنوان عکس اصلی هنرمند انتخاب شود:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                      {candidatePhotos.map((cand, idx) => {
                        const isSelected = photo === cand.url;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setPhoto(cand.url);
                              setFeedbackMessage({ text: 'عکس هنرمند با موفقیت تغییر داده شد.', type: 'info' });
                            }}
                            className={`group relative rounded-xl overflow-hidden border-2 transition-all p-1.5 flex flex-col items-center bg-[#1B1B2D] cursor-pointer text-right ${
                              isSelected 
                                ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/30 shadow-lg shadow-emerald-950/50' 
                                : 'border-[#2E2E44] hover:border-purple-500/80 hover:bg-[#23233A]'
                            }`}
                          >
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#10101C]">
                              <img
                                src={cand.url}
                                alt={cand.title || 'گزینه عکس'}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover object-[center_18%] group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23181828"/><text x="50%" y="50%" font-size="16" fill="%23666" text-anchor="middle" dominant-baseline="middle">عکس</text></svg>`;
                                }}
                              />
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-md animate-in fade-in zoom-in-75">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>
                            <div className="w-full mt-1.5 px-0.5 flex items-center justify-between text-[10px]">
                              <span className={`truncate font-medium ${isSelected ? 'text-emerald-300 font-bold' : 'text-[#8E8EA8]'}`}>
                                {cand.source === 'imdb'
                                  ? 'IMDb پرتره رسمی'
                                  : cand.source === 'tvmaze' 
                                  ? 'TVMaze HD' 
                                  : cand.source === 'wikipedia_fa' 
                                  ? 'ویکی‌پدیا ایران' 
                                  : cand.source === 'wikipedia_tr'
                                  ? 'ویکی‌پدیا ترکیه'
                                  : cand.source === 'wikipedia_hi'
                                  ? 'ویکی‌پدیا بالیوود'
                                  : cand.source === 'wikipedia_en' 
                                  ? 'Wikipedia EN' 
                                  : cand.source === 'wikimedia' 
                                  ? 'Wikimedia' 
                                  : cand.source === 'database'
                                  ? 'آرشیو فیلم‌باره'
                                  : cand.source === 'current'
                                  ? 'عکس فعلی'
                                  : 'پیشنهادی'}
                              </span>
                              {isSelected && (
                                <span className="text-emerald-400 text-[9px] font-bold shrink-0 mr-1">✓ انتخاب</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl bg-[#181828] border border-dashed border-[#28283C] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-[#8E8EA8]">
                      اگر عکس انتخاب شده اشتباه است یا می‌خواهید بین چند عکس انتخاب کنید، روی دکمه زیر کلیک کنید.
                    </p>
                    <button
                      type="button"
                      onClick={handleFetchMorePhotos}
                      disabled={isLoadingPhotos || (!name.trim() && !englishName.trim() && !smartSearchQuery.trim())}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-md shadow-purple-900/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isLoadingPhotos ? 'در حال جستجو...' : 'یافتن عکس‌های پرتره'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Persian & English Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
                    نام فارسی هنرمند <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: کریستوفر نولان، شهاب حسینی"
                      className="w-full bg-[#1A1A2C] text-white text-sm rounded-xl pl-4 pr-9 py-2.5 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none"
                      required
                    />
                    <User className="absolute right-3 top-3 w-4 h-4 text-[#757590]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
                    نام انگلیسی (English Name)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={englishName}
                      onChange={(e) => setEnglishName(e.target.value)}
                      placeholder="مثال: Christopher Nolan"
                      className="w-full bg-[#1A1A2C] text-white text-sm rounded-xl pl-4 pr-9 py-2.5 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none"
                      dir="ltr"
                    />
                    <Globe className="absolute right-3 top-3 w-4 h-4 text-[#757590]" />
                  </div>
                </div>
              </div>

              {/* Role / Job & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
                    حرفه یا نقش اصلی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={job}
                      onChange={(e) => setJob(e.target.value)}
                      placeholder="بازیگر، کارگردان، نویسنده..."
                      className="w-full bg-[#1A1A2C] text-white text-xs rounded-xl pl-4 pr-9 py-2.5 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none"
                    />
                    <Briefcase className="absolute right-3 top-2.5 w-4 h-4 text-[#757590]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
                    نقش / کاراکتر پیش‌فرض
                  </label>
                  <input
                    type="text"
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                    placeholder="مثال: نقش اصلی یا کاراکتر برجسته"
                    className="w-full bg-[#1A1A2C] text-white text-xs rounded-xl px-4 py-2.5 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
                    دسته‌بندی در سایت
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#1A1A2C] text-white text-xs rounded-xl px-3 py-2.5 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none"
                  >
                    <option value="foreign">سینمای بین‌الملل (خارجی)</option>
                    <option value="iranian">سینمای ایران</option>
                    <option value="director">کارگردانان و مؤلفان</option>
                    <option value="winner">برندگان جوایز بزرگ</option>
                  </select>
                </div>
              </div>

              {/* Birth & Nationality Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
                    تاریخ تولد
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      placeholder="مثال: 30 July 1970 یا ۱۳۴۹"
                      className="w-full bg-[#1A1A2C] text-white text-xs rounded-xl pl-4 pr-9 py-2.5 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none"
                    />
                    <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-[#757590]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
                    زادگاه و محل تولد
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="مثال: لندن، بریتانیا یا تهران"
                      className="w-full bg-[#1A1A2C] text-white text-xs rounded-xl pl-4 pr-9 py-2.5 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none"
                    />
                    <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-[#757590]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A8A8C0] mb-1.5">
                    ملیت
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="مثال: بریتانیا / آمریکا / ایران"
                    className="w-full bg-[#1A1A2C] text-white text-xs rounded-xl px-4 py-2.5 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BIOGRAPHY */}
          {activeTab === 'bio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#A8A8C0]">
                  متن شرح حال و بیوگرافی کامل هنرمند
                </label>
                <button
                  type="button"
                  onClick={handleAutoFetchDetails}
                  disabled={isLoadingOnline}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>نگارش خودکار با هوش مصنوعی</span>
                </button>
              </div>

              <textarea
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                rows={10}
                placeholder="متن بیوگرافی، سبک کاری، دستاوردها و افتخارات هنرمند را اینجا وارد کنید..."
                className="w-full bg-[#18182A] text-white text-xs sm:text-sm rounded-2xl p-4 border border-[#2E2E48] focus:border-[#8B5CF6] focus:outline-none leading-relaxed resize-y"
              />
              <p className="text-[11px] text-[#7A7A92] leading-relaxed">
                این بیوگرافی در تمامی بخش‌های سایت، از جمله صفحه پرونده بازیگران و کارت عوامل فیلم‌ها، با اولویت بالا به نمایش درخواهد آمد.
              </p>
            </div>
          )}

          {/* TAB 3: AWARDS */}
          {activeTab === 'awards' && (
            <div className="space-y-5">
              {/* Quick AI Auto-Fetch Banner for Awards */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 to-yellow-950/30 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-200 font-medium">
                    استخراج خودکار جوایز معتبر (اسکار، گلدن‌گلوب، فجر و...) با هوش مصنوعی
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFetchAwardsOnly}
                  disabled={isLoadingOnline}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isLoadingOnline ? 'animate-spin' : ''}`} />
                  <span>{isLoadingOnline ? 'در حال دریافت...' : 'دریافت خودکار جوایز'}</span>
                </button>
              </div>

              {/* Add New Award Box */}
              <div className="p-4 rounded-2xl bg-[#1A1A2C] border border-[#2D2D46] space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>افزودن جایزه یا افتخار جدید (دستی)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={awardTitle}
                    onChange={(e) => setAwardTitle(e.target.value)}
                    placeholder="عنوان جایزه (مثال: برنده اسکار بهترین بازیگر)"
                    className="w-full bg-[#131320] text-white text-xs rounded-xl px-3 py-2 border border-[#2B2B42] focus:border-amber-400 focus:outline-none"
                  />

                  <input
                    type="text"
                    value={awardMovie}
                    onChange={(e) => setAwardMovie(e.target.value)}
                    placeholder="فیلم یا سریال مربوطه (مثال: Oppenheimer)"
                    className="w-full bg-[#131320] text-white text-xs rounded-xl px-3 py-2 border border-[#2B2B42] focus:border-amber-400 focus:outline-none"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={awardYear}
                      onChange={(e) => setAwardYear(e.target.value)}
                      placeholder="سال (2024)"
                      className="w-24 bg-[#131320] text-white text-xs rounded-xl px-3 py-2 border border-[#2B2B42] focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddAward}
                      className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ثبت جایزه</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Awards List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#A8A8C0]">لیست جوایز ثبت شده ({awards.length}):</h4>
                  {awards.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAwards([])}
                      className="text-[11px] text-[#8E8EA8] hover:text-rose-400 cursor-pointer"
                    >
                      پاک کردن همه
                    </button>
                  )}
                </div>

                {awards.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-[#141422] border border-dashed border-[#28283C] space-y-3">
                    <Award className="w-8 h-8 text-[#5E5E78] mx-auto opacity-60" />
                    <p className="text-xs text-[#8E8EA8]">
                      هنوز جایزه‌ای برای این هنرمند ثبت نشده است.
                    </p>
                    <button
                      type="button"
                      onClick={handleAutoFetchAwardsOnly}
                      disabled={isLoadingOnline}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>استخراج خودکار جوایز این هنرمند با هوش مصنوعی</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {awards.map((aw, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#18182A] border border-[#2A2A40]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Award className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-white block truncate">{aw.title}</span>
                            <span className="text-[10px] text-[#8E8EA8]">
                              {aw.movie_name ? `${aw.movie_name} ` : ''}{aw.year ? `(${aw.year})` : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAward(idx)}
                          className="p-1.5 text-[#7E7E98] hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: KNOWN WORKS */}
          {activeTab === 'works' && (
            <div className="space-y-5">
              {/* Quick AI Auto-Fetch Banner for Known Works */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-500/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs text-cyan-200 font-medium">
                    استخراج خودکار فیلم‌ها و سریال‌های شاخص این هنرمند با هوش مصنوعی
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFetchWorksOnly}
                  disabled={isLoadingOnline}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isLoadingOnline ? 'animate-spin' : ''}`} />
                  <span>{isLoadingOnline ? 'در حال دریافت...' : 'دریافت خودکار آثار'}</span>
                </button>
              </div>

              {/* Add Known Work Box */}
              <div className="p-4 rounded-2xl bg-[#1A1A2C] border border-[#2D2D46] space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span>افزودن اثر یا فیلم شاخص (دستی)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={workTitle}
                    onChange={(e) => setWorkTitle(e.target.value)}
                    placeholder="عنوان فیلم/سریال (مثال: Inception)"
                    className="w-full bg-[#131320] text-white text-xs rounded-xl px-3 py-2 border border-[#2B2B42] focus:border-cyan-400 focus:outline-none"
                  />

                  <input
                    type="text"
                    value={workCharacter}
                    onChange={(e) => setWorkCharacter(e.target.value)}
                    placeholder="نقش (مثال: Dom Cobb)"
                    className="w-full bg-[#131320] text-white text-xs rounded-xl px-3 py-2 border border-[#2B2B42] focus:border-cyan-400 focus:outline-none"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={workYear}
                      onChange={(e) => setWorkYear(e.target.value)}
                      placeholder="سال (2010)"
                      className="w-24 bg-[#131320] text-white text-xs rounded-xl px-3 py-2 border border-[#2B2B42] focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddKnownWork}
                      className="flex-1 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ثبت اثر</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Works List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#A8A8C0]">لیست آثار شاخص ({knownFor.length}):</h4>
                  {knownFor.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setKnownFor([])}
                      className="text-[11px] text-[#8E8EA8] hover:text-rose-400 cursor-pointer"
                    >
                      پاک کردن همه
                    </button>
                  )}
                </div>

                {knownFor.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-[#141422] border border-dashed border-[#28283C] space-y-3">
                    <Film className="w-8 h-8 text-[#5E5E78] mx-auto opacity-60" />
                    <p className="text-xs text-[#8E8EA8]">
                      هنوز اثر شاخصی ثبت نشده است. (فیلم‌های موجود در سایت نیز به طور خودکار به پروفایل متصل می‌شوند).
                    </p>
                    <button
                      type="button"
                      onClick={handleAutoFetchWorksOnly}
                      disabled={isLoadingOnline}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>استخراج خودکار فیلم‌ها و آثار این هنرمند با هوش مصنوعی</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {knownFor.map((wk, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#18182A] border border-[#2A2A40]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-white block truncate">{wk.title}</span>
                            <span className="text-[10px] text-[#8E8EA8]">
                              {wk.role ? `${wk.role} ` : ''}{wk.year ? `(${wk.year})` : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveKnownWork(idx)}
                          className="p-1.5 text-[#7E7E98] hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-[#26263C] flex items-center justify-between gap-3">
            {isEditing ? (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#232338] hover:bg-[#2F2F4C] text-[#A0A0B5] hover:text-white text-xs font-bold transition-all cursor-pointer"
                title="حذف تغییرات و بازگشت به مشخصات پیش‌فرض سیستم"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی به پیش‌فرض</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#1E1E30] hover:bg-[#282840] text-[#A0A0B5] hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#E50914] hover:from-[#7C3AED] hover:to-red-600 text-white text-xs font-black shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'ذخیره تغییرات بیوگرافی و مشخصات' : 'افزودن هنرمند جدید'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
