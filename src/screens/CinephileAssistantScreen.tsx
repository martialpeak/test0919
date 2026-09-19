import React from 'react';
import { 
  VoiceSpeaker, 
  AIMessage, 
  MoodMovieRecommendation, 
  PhilosophicalAnalysisResult, 
  MovieBattleResult, 
  IranianCinemaAnalysisResult, 
  GuessGameQuestion 
} from '../types';
import { AICinephileService } from '../services/aiCinephileService';
import { MOOD_CATEGORIES } from '../data/aiCuratedData';
import { VoiceAudioController } from '../components/VoiceAudioController';
import { persianVoiceEngine } from '../utils/speechSynthesizer';
import { 
  Bot, 
  Sparkles, 
  Heart, 
  Zap, 
  CloudRain, 
  Compass, 
  Film, 
  Swords, 
  Trophy, 
  Gamepad2, 
  Send, 
  Volume2, 
  CheckCircle2, 
  HelpCircle, 
  RotateCw, 
  Flame, 
  Quote, 
  ChevronRight, 
  BookOpen,
  Camera
} from 'lucide-react';

type SubView = 'chat' | 'mood' | 'philosophy' | 'battle' | 'iranian_oscar' | 'guess_game';

export const CinephileAssistantScreen: React.FC = () => {
  const [activeSubView, setActiveSubView] = React.useState<SubView>('chat');
  const [activeSpeaker, setActiveSpeaker] = React.useState<VoiceSpeaker>('delara');

  // --- 1. Chat State ---
  const [messages, setMessages] = React.useState<AIMessage[]>([
    {
      id: 'm_intro',
      sender: 'assistant',
      text: `درود بر شما سینمافیل عزیز! من دستیار هوشمند، منتقد و همراه سینمایی شما هستم.\n\nمی‌توانید با من درباره هر شاهکار سینمایی گفتگو کنید، بر اساس حس و مود درونی‌تان فیلم‌های نایاب دریافت کنید، نبردهای جذاب فیلم‌ها را مقایسه کنید یا در بازی مهیج حدس فیلم دانسته‌های سینمایی خود را به چالش بکشید.\n\nهمچنین تمامی پاسخ‌ها با صدای طبیعی و اختصاصی «دل‌آرا» و «فرید» قابل شنیدن است!`,
      timestamp: Date.now(),
      suggestions: [
        'پیشنهاد فیلم‌های پایان غافلگیرکننده با بار فلسفی عمیق',
        'کالبدشکافی مفهوم زمان در شاهکارهای کریستوفر نولان',
        'راز موفقیت و درخشش اصغر فرهادی در تاریخ اسکار',
        'تحلیل نمادهای پنهان در فیلم طعم گیلاس کیارستمی'
      ]
    }
  ]);
  const [chatInput, setChatInput] = React.useState('');
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  // --- 2. Mood State ---
  const [selectedMoodId, setSelectedMoodId] = React.useState('melancholy_deep');
  const [moodRecommendations, setMoodRecommendations] = React.useState<MoodMovieRecommendation[]>([]);
  const [isMoodLoading, setIsMoodLoading] = React.useState(false);

  // --- 3. Philosophy State ---
  const [philosophyQuery, setPhilosophyQuery] = React.useState('Interstellar');
  const [philosophyResult, setPhilosophyResult] = React.useState<PhilosophicalAnalysisResult | null>(null);
  const [isPhilosophyLoading, setIsPhilosophyLoading] = React.useState(false);

  // --- 4. Battle State ---
  const [battleMovie1, setBattleMovie1] = React.useState('میان‌ستاره‌ای (Interstellar)');
  const [battleMovie2, setBattleMovie2] = React.useState('۲۰۰۱: ادیسه فضایی (2001: A Space Odyssey)');
  const [battleResult, setBattleResult] = React.useState<MovieBattleResult | null>(null);
  const [isBattleLoading, setIsBattleLoading] = React.useState(false);

  // --- 5. Iranian Cinema State ---
  const [iranianTopic, setIranianTopic] = React.useState('موج نو، اصغر فرهادی و درخشش در اسکار');
  const [iranianResult, setIranianResult] = React.useState<IranianCinemaAnalysisResult | null>(null);
  const [isIranianLoading, setIsIranianLoading] = React.useState(false);

  // --- 6. Guess Game State ---
  const [gameQuestion, setGameQuestion] = React.useState<GuessGameQuestion | null>(null);
  const [userGuessInput, setUserGuessInput] = React.useState('');
  const [revealedClues, setRevealedClues] = React.useState<number>(1);
  const [gameScore, setGameScore] = React.useState(0);
  const [gameStreak, setGameStreak] = React.useState(0);
  const [guessFeedback, setGuessFeedback] = React.useState<{ isCorrect: boolean; text: string } | null>(null);
  const [isGameLoading, setIsGameLoading] = React.useState(false);

  // Initial loads & cleanup when switching tabs
  React.useEffect(() => {
    handleLoadMood('melancholy_deep');
    handleLoadPhilosophy('Interstellar', 'میان‌ستاره‌ای');
    handleLoadIranianCinema('موج نو، اصغر فرهادی و درخشش در اسکار');
    handleNewGameQuestion();

    return () => {
      // Stop any speech synthesizer or active audio when leaving CinephileAssistant
      try {
        persianVoiceEngine.stop();
      } catch {}
    };
  }, []);

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Chat send
  const handleSendChat = async (textToSend?: string) => {
    const query = textToSend || chatInput.trim();
    if (!query || isChatLoading) return;

    const userMsg: AIMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await AICinephileService.sendChatMessage(query, messages, activeSpeaker);
      const assistantMsg: AIMessage = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: Date.now(),
        modelUsed: response.modelUsed
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Load Mood
  const handleLoadMood = async (moodId: string) => {
    setSelectedMoodId(moodId);
    setIsMoodLoading(true);
    try {
      const recs = await AICinephileService.getMoodRecommendations(moodId);
      setMoodRecommendations(recs);
    } finally {
      setIsMoodLoading(false);
    }
  };

  // Load Philosophy
  const handleLoadPhilosophy = async (title: string, englishTitle?: string) => {
    setIsPhilosophyLoading(true);
    try {
      const result = await AICinephileService.analyzeMasterpiece(title, englishTitle);
      setPhilosophyResult(result);
    } finally {
      setIsPhilosophyLoading(false);
    }
  };

  // Run Battle
  const handleRunBattle = async (m1?: string, m2?: string) => {
    const movie1 = m1 || battleMovie1;
    const movie2 = m2 || battleMovie2;
    if (!movie1 || !movie2) return;

    setIsBattleLoading(true);
    try {
      const result = await AICinephileService.compareMovies(movie1, movie2);
      setBattleResult(result);
    } finally {
      setIsBattleLoading(false);
    }
  };

  // Load Iranian Cinema
  const handleLoadIranianCinema = async (topic: string) => {
    setIranianTopic(topic);
    setIsIranianLoading(true);
    try {
      const res = await AICinephileService.getIranianCinemaAnalysis(topic);
      setIranianResult(res);
    } finally {
      setIsIranianLoading(false);
    }
  };

  // Game New Question
  const handleNewGameQuestion = async () => {
    setIsGameLoading(true);
    setGuessFeedback(null);
    setUserGuessInput('');
    setRevealedClues(1);
    try {
      const q = await AICinephileService.getGuessQuestion();
      setGameQuestion(q);
    } finally {
      setIsGameLoading(false);
    }
  };

  // Submit Guess
  const handleSubmitGuess = () => {
    if (!gameQuestion || !userGuessInput.trim()) return;
    const cleanGuess = userGuessInput.trim().toLowerCase();
    const cleanTitle = gameQuestion.title.toLowerCase();
    const cleanEng = gameQuestion.english_title.toLowerCase();

    const isMatch = 
      cleanGuess === cleanTitle || 
      cleanGuess === cleanEng ||
      cleanTitle.includes(cleanGuess) ||
      cleanEng.includes(cleanGuess);

    if (isMatch) {
      const earned = Math.max(20, gameQuestion.points - (revealedClues - 1) * 20);
      setGameScore(prev => prev + earned);
      setGameStreak(prev => prev + 1);
      setGuessFeedback({
        isCorrect: true,
        text: `آفرین! پاسخ کاملاً درست است: «${gameQuestion.title} (${gameQuestion.english_title})». +${earned} امتیاز کسب کردید!`
      });
      // Read victory with voice
      persianVoiceEngine.speak(`آفرین! حدس شما کاملاً درست است؛ اثر جاودانه ${gameQuestion.title}. ${gameQuestion.fun_fact}`, activeSpeaker);
    } else {
      setGameStreak(0);
      setGuessFeedback({
        isCorrect: false,
        text: 'متاسفانه حدس شما درست نبود! می‌توانید سرنخ بعدی را باز کنید یا دوباره تلاش کنید.'
      });
    }
  };

  const getMoodIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudRain': return <CloudRain className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Heart': return <Heart className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      default: return <Film className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E18] text-white pb-24 selection:bg-red-500 selection:text-white">
      {/* Top Voice & AI Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#18182C] via-[#121222] to-[#0E0E18] border-b border-[#2A2A40] pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-purple-500/20 border border-red-500/30 text-xs font-semibold text-red-300 mb-3 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>دستیار هوشمند و جامع سینمافیل‌ها • Cinephile AI Suite</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                مشاوره هوشمند، نقد شاهکارها و خوانش صوتی
              </h1>
              <p className="text-[#9A9AB5] text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                گفتگو با هوش مصنوعی منتقد سینما، پیشنهاد فیلم بر اساس حس و مود، تحلیل فلسفی، نبرد آثار، سینمای ایران و اسکار با گویندگی اختصاصی <strong className="text-rose-400">«دل‌آرا»</strong> و <strong className="text-amber-400">«فرید»</strong>.
              </p>
            </div>

            {/* Top Voice Synth Floating Widget */}
            <div className="w-full lg:w-auto">
              <VoiceAudioController 
                defaultSpeaker={activeSpeaker}
                onSpeakerChange={(sp) => setActiveSpeaker(sp)}
              />
            </div>
          </div>

          {/* Sub-Navigation Categories / Tabs (Responsive Grid for Mobile & Desktop) */}
          <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-6 gap-2 pt-5 border-t border-[#232338] mt-6">
            <button
              onClick={() => setActiveSubView('chat')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeSubView === 'chat'
                  ? 'bg-gradient-to-r from-[#E50914] to-red-700 text-white shadow-lg shadow-red-600/30 ring-1 ring-red-400/40'
                  : 'bg-[#181828] text-[#9A9AB5] hover:text-white hover:bg-[#202034] border border-[#2A2A40]'
              }`}
            >
              <Bot className="w-4 h-4 shrink-0" />
              <span className="truncate">گفتگو و مشاوره</span>
            </button>

            <button
              onClick={() => setActiveSubView('mood')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeSubView === 'mood'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400/40'
                  : 'bg-[#181828] text-[#9A9AB5] hover:text-white hover:bg-[#202034] border border-[#2A2A40]'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="truncate">حس و مود</span>
            </button>

            <button
              onClick={() => setActiveSubView('philosophy')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeSubView === 'philosophy'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-cyan-400/40'
                  : 'bg-[#181828] text-[#9A9AB5] hover:text-white hover:bg-[#202034] border border-[#2A2A40]'
              }`}
            >
              <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">نقد و فلسفه</span>
            </button>

            <button
              onClick={() => setActiveSubView('battle')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeSubView === 'battle'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40'
                  : 'bg-[#181828] text-[#9A9AB5] hover:text-white hover:bg-[#202034] border border-[#2A2A40]'
              }`}
            >
              <Swords className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">نبرد آثار</span>
            </button>

            <button
              onClick={() => setActiveSubView('iranian_oscar')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeSubView === 'iranian_oscar'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                  : 'bg-[#181828] text-[#9A9AB5] hover:text-white hover:bg-[#202034] border border-[#2A2A40]'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
              <span className="truncate">ایران و اسکار</span>
            </button>

            <button
              onClick={() => setActiveSubView('guess_game')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center ${
                activeSubView === 'guess_game'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30 ring-1 ring-pink-400/40'
                  : 'bg-[#181828] text-[#9A9AB5] hover:text-white hover:bg-[#202034] border border-[#2A2A40]'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-pink-400 shrink-0" />
              <span className="truncate">حدس فیلم</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ======================================================== */}
        {/* SUBVIEW 1: CHAT & ADVISOR                                */}
        {/* ======================================================== */}
        {activeSubView === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Box */}
            <div className="lg:col-span-2 flex flex-col bg-[#141424] border border-[#26263C] rounded-3xl overflow-hidden shadow-2xl h-[650px]">
              
              {/* Header */}
              <div className="p-4 bg-[#1A1A2E] border-b border-[#2A2A40] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-red-500/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      همراه هوشمند سینمافیل
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h3>
                    <span className="text-[11px] text-[#A0A0B5]">
                      پاسخ‌های عمیق، منتقدانه و آماده خوانش صوتی
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8E8EA8]">گوینده:</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    activeSpeaker === 'delara' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {activeSpeaker === 'delara' ? 'دل‌آرا (لحن صمیمی)' : 'فرید (لحن رادیویی)'}
                  </span>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed shadow-lg ${
                        m.sender === 'user'
                          ? 'bg-[#E50914] text-white rounded-br-none shadow-red-600/20'
                          : 'bg-[#1D1D30] border border-[#2D2D46] text-gray-200 rounded-bl-none shadow-black/40'
                      }`}
                    >
                      <div className="whitespace-pre-line">{m.text}</div>

                      {/* Read Voice Button for Assistant Messages */}
                      {m.sender === 'assistant' && (
                        <div className="mt-4 pt-3 border-t border-[#2A2A44] flex items-center justify-between flex-wrap gap-2">
                          <button
                            onClick={() => persianVoiceEngine.speak(m.text, activeSpeaker)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#26263E] hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>خوانش صوتی پاسخ</span>
                          </button>

                          <span className="text-[10px] text-[#6F6F8E] font-mono">
                            {new Date(m.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Suggestion Chips */}
                    {m.suggestions && m.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 max-w-[85%]">
                        {m.suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendChat(s)}
                            className="text-xs bg-[#1A1A2C] hover:bg-[#25253E] text-[#B0B0CC] hover:text-white border border-[#2F2F48] rounded-xl px-3 py-1.5 transition-all text-right"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex items-center gap-3 text-xs text-[#8E8EA8] bg-[#1A1A2E] border border-[#2A2A40] rounded-2xl p-4 w-max animate-pulse">
                    <Sparkles className="w-4 h-4 text-red-400 animate-spin" />
                    <span>در حال تحلیل ژرف و نگارش پاسخ منتقدانه...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 bg-[#1A1A2E] border-t border-[#2A2A40]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="پرسش درباره فیلم، نقد، کارگردان یا درخواست پیشنهاد..."
                    className="flex-1 bg-[#141422] text-white text-sm rounded-xl px-4 py-3 border border-[#2A2A40] focus:border-[#E50914] focus:outline-none transition-all placeholder:text-[#5A5A72]"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="p-3 bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-red-600/30 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Inspiration & Topics Sidebar */}
            <div className="space-y-4">
              <div className="bg-[#141424] border border-[#26263C] rounded-3xl p-5 shadow-xl">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-orange-400" />
                  موضوعات داغ و پیشنهادی گفتگو
                </h3>
                <div className="space-y-2">
                  {[
                    'بهترین فیلم‌های با پلات توییست و شوک پایان‌بندی',
                    'مقایسه سبک کارگردانی کریستوفر نولان و استنلی کوبریک',
                    'تحلیل روانشناختی شخصیت جوکر در برابر راننده تاکسی',
                    'تاثیر سینمای تارکوفسکی و مالیک بر درک هستی',
                    'نگاهی به زیباشناسی قاب‌های داریوش مهرجویی در فیلم هامون'
                  ].map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChat(topic)}
                      className="w-full text-right p-3 rounded-2xl bg-[#1A1A2E] hover:bg-[#24243E] border border-[#2A2A40] text-xs text-[#A0A0B5] hover:text-white transition-all flex items-center justify-between group"
                    >
                      <span className="leading-relaxed">{topic}</span>
                      <ChevronRight className="w-4 h-4 text-[#5A5A72] group-hover:text-red-400 transition-colors shrink-0 rotate-180" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Feature Card */}
              <div className="bg-gradient-to-br from-[#1C172E] to-[#141422] border border-[#342A4E] rounded-3xl p-5 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">درباره گویندگان هوشمند</h4>
                    <span className="text-[11px] text-[#A0A0B5]">طراحی‌شده برای متون تخصصی فارسی</span>
                  </div>
                </div>
                <p className="text-xs text-[#8E8EA8] leading-relaxed">
                  سیستم خوانش سینمایی مجهز به واکاوهای دقیق، اصلاح اکسان‌های فارسی، مکث‌های تنفسی و هماهنگی با اصطلاحات پیچیده دراماتیک است.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBVIEW 2: MOOD & VIBE MATCHER                           */}
        {/* ======================================================== */}
        {activeSubView === 'mood' && (
          <div className="space-y-8">
            {/* Mood Category Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    حس و مود روحی خود را انتخاب کنید
                  </h2>
                  <p className="text-xs sm:text-sm text-[#A0A0B5] mt-1">
                    هوش مصنوعی با درک روانشناختی از درام، دقیق‌ترین فیلم‌ها را برای این لحظه پیشنهاد می‌دهد.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOOD_CATEGORIES.map((m) => {
                  const isSelected = selectedMoodId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleLoadMood(m.id)}
                      className={`relative p-5 rounded-3xl border cursor-pointer transition-all duration-300 overflow-hidden shadow-xl ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#241E38] to-[#181828] border-red-500 ring-2 ring-red-500/30'
                          : 'bg-[#141424] border-[#26263C] hover:border-[#3B3B56] hover:bg-[#1A1A2E]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                          isSelected ? 'bg-gradient-to-br from-red-500 to-purple-600' : 'bg-[#1E1E32]'
                        }`}>
                          {getMoodIcon(m.iconName)}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                            انتخاب‌شده
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-base text-white mb-1">
                        {m.title}
                      </h3>
                      <p className="text-xs text-[#8E8EA8] mb-3 leading-relaxed">
                        {m.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {m.vibeTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-[#1E1E34] text-[#A0A0C5] px-2 py-0.5 rounded-lg border border-[#2B2B44]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations Result */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  پیشنهادهای شاهکار برای این حس و حال
                </h3>
              </div>

              {isMoodLoading ? (
                <div className="py-16 text-center text-[#8E8EA8] bg-[#141424] border border-[#26263C] rounded-3xl animate-pulse">
                  <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-bold text-white">در حال استخراج هماهنگ‌ترین آثار سینمایی با وضعیت روحی شما...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {moodRecommendations.map((movie, idx) => (
                    <div
                      key={idx}
                      className="bg-[#141424] border border-[#26263C] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-[#3E3E5C] transition-all"
                    >
                      <div>
                        {/* Poster or Header */}
                        {movie.poster_url && (
                          <div className="relative h-48 w-full overflow-hidden bg-black">
                            <img
                              src={movie.poster_url}
                              alt={movie.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141424] via-transparent to-transparent" />
                            <div className="absolute top-3 right-3 bg-red-600/90 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-lg">
                              {movie.match_percentage}% تطابق روحی
                            </div>
                          </div>
                        )}

                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-extrabold text-base text-white">
                              {movie.title}
                            </h4>
                            <span className="text-xs text-yellow-400 font-mono bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/20">
                              ★ {movie.rating || '8.2'}
                            </span>
                          </div>

                          <p className="text-xs text-[#8E8EA8] font-mono">
                            {movie.english_title} • {movie.year} • کارگردان: {movie.director}
                          </p>

                          <div className="p-3 bg-[#1A1A2E] rounded-2xl border border-[#2A2A44] text-xs text-[#C0C0DC] leading-relaxed">
                            <span className="font-bold text-white block mb-1">علت تطابق با مود:</span>
                            {movie.why_it_matches}
                          </div>

                          {movie.iconic_quote && (
                            <div className="p-3 bg-gradient-to-r from-red-950/30 to-purple-950/30 rounded-2xl border border-red-500/20 text-xs text-red-200 flex items-start gap-2">
                              <Quote className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <span className="italic">«{movie.iconic_quote}»</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer with Voice Reading */}
                      <div className="p-4 bg-[#18182A] border-t border-[#232338] flex items-center justify-between">
                        <button
                          onClick={() => persianVoiceEngine.speak(`${movie.title}. ساخته ${movie.director}. ${movie.why_it_matches}. دیالوگ ماندگار: ${movie.iconic_quote || ''}`, activeSpeaker)}
                          className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-600 px-3 py-1.5 rounded-xl font-bold transition-all"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>شنیدن معرفی</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBVIEW 3: PHILOSOPHY OF MASTERPIECES                    */}
        {/* ======================================================== */}
        {activeSubView === 'philosophy' && (
          <div className="space-y-6">
            {/* Search / Preset Selector */}
            <div className="bg-[#141424] border border-[#26263C] rounded-3xl p-6 shadow-xl">
              <h3 className="font-extrabold text-base text-white mb-2">
                کالبدشکافی اندیشگی و فلسفه شاهکارهای سینمایی
              </h3>
              <p className="text-xs text-[#8E8EA8] mb-4">
                یک فیلم را انتخاب کرده یا نام اثر مورد نظر خود را وارد کنید تا تز فلسفی، موتیف‌های پنهان و معنای پایان‌بندی آن بازگشایی شود.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: 'میان‌ستاره‌ای (Interstellar)', title: 'Interstellar' },
                  { label: 'اوپنهایمر (Oppenheimer)', title: 'Oppenheimer' },
                  { label: 'تلقین (Inception)', title: 'Inception' },
                  { label: 'جدایی نادر از سیمین', title: 'A Separation' },
                  { label: 'طعم گیلاس', title: 'Taste of Cherry' },
                  { label: 'شوالیه تاریکی (The Dark Knight)', title: 'The Dark Knight' },
                  { label: 'فایت کلاب (Fight Club)', title: 'Fight Club' },
                  { label: 'ماتریکس (The Matrix)', title: 'The Matrix' },
                  { label: 'تلماسه (Dune)', title: 'Dune' },
                  { label: 'پدرخوانده (The Godfather)', title: 'The Godfather' },
                  { label: 'انگل (Parasite)', title: 'Parasite' },
                  { label: 'جزیره شاتر (Shutter Island)', title: 'Shutter Island' }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleLoadPhilosophy(item.title, item.label)}
                    className="px-3.5 py-1.5 bg-[#1C1C2E] hover:bg-[#2A2A44] border border-[#2C2C44] text-xs text-[#B0B0CC] hover:text-white rounded-xl font-medium transition-all"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (philosophyQuery.trim()) {
                    handleLoadPhilosophy(philosophyQuery);
                  }
                }}
                className="flex items-center gap-2 max-w-xl"
              >
                <input
                  type="text"
                  value={philosophyQuery}
                  onChange={(e) => setPhilosophyQuery(e.target.value)}
                  placeholder="نام هر فیلم دیگر (مثلاً: Matrix, Fight Club, Taxi Driver)..."
                  className="flex-1 bg-[#1A1A2C] text-white text-xs sm:text-sm rounded-xl px-4 py-2.5 border border-[#2A2A40] focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isPhilosophyLoading}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                >
                  تحلیل فلسفی
                </button>
              </form>
            </div>

            {/* Analysis Result Card */}
            {isPhilosophyLoading ? (
              <div className="py-20 text-center text-[#8E8EA8] bg-[#141424] border border-[#26263C] rounded-3xl animate-pulse">
                <Compass className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
                <p className="text-sm font-bold text-white">در حال واکاوی لایه‌های فلسفی و نشانه‌شناسی اثر...</p>
              </div>
            ) : philosophyResult ? (
              <div className="bg-[#141424] border border-[#26263C] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#232338]">
                  <div>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30 font-bold">
                      {philosophyResult.philosophical_school}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                      {philosophyResult.title}
                      {philosophyResult.english_title && (
                        <span className="text-lg font-medium text-[#8E8EA8] mr-2">
                          ({philosophyResult.english_title})
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-[#8E8EA8] mt-1">
                      کارگردان: <strong className="text-gray-200">{philosophyResult.director}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const fullText = `${philosophyResult.title}. تز اصلی: ${philosophyResult.core_thesis}. تحلیل عمیق: ${philosophyResult.deep_analysis}. پایان‌بندی: ${philosophyResult.ending_interpretation}`;
                      persianVoiceEngine.speak(fullText, activeSpeaker);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>خوانش صوتی کامل تحلیل</span>
                  </button>
                </div>

                {/* Core Thesis */}
                <div className="p-5 bg-gradient-to-r from-blue-950/40 via-[#18182C] to-purple-950/40 rounded-2xl border border-blue-500/30 text-blue-100 text-sm leading-relaxed">
                  <span className="font-extrabold text-blue-300 block mb-1 text-xs">تز بنیادین و مانیفست اثر:</span>
                  «{philosophyResult.core_thesis}»
                </div>

                {/* Deep Analysis */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    تحلیل دراماتیک و جریان اندیشگی
                  </h4>
                  <p className="text-sm text-[#C0C0DC] leading-relaxed whitespace-pre-line bg-[#18182A] p-5 rounded-2xl border border-[#24243C]">
                    {philosophyResult.deep_analysis}
                  </p>
                </div>

                {/* Hidden Symbolism Cards */}
                {philosophyResult.hidden_symbolism && philosophyResult.hidden_symbolism.length > 0 && (
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      رمزگشایی نمادها و استعاره‌های بصری
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {philosophyResult.hidden_symbolism.map((sym, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-[#1A1A2E] rounded-2xl border border-[#2A2A44] space-y-1"
                        >
                          <span className="font-extrabold text-xs text-yellow-300 block">
                            ✦ {sym.symbol}
                          </span>
                          <p className="text-xs text-[#A0A0C0] leading-relaxed">
                            {sym.meaning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ending Interpretation */}
                <div className="p-5 bg-[#18182C] rounded-2xl border border-purple-500/30 space-y-2">
                  <h4 className="font-extrabold text-xs text-purple-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    تفسیر و رمزگشایی پایان‌بندی (Ending Breakdown)
                  </h4>
                  <p className="text-xs sm:text-sm text-[#D0D0E8] leading-relaxed">
                    {philosophyResult.ending_interpretation}
                  </p>
                </div>

                {/* Cinematography & Visual Design */}
                {philosophyResult.cinematography_and_color && (
                  <div className="p-5 bg-[#1A1A2E] rounded-2xl border border-cyan-500/30 space-y-2">
                    <h4 className="font-extrabold text-xs text-cyan-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      میزانسن، فیلم‌برداری و پالت رنگی
                    </h4>
                    <p className="text-xs sm:text-sm text-[#D0D0E8] leading-relaxed">
                      {philosophyResult.cinematography_and_color}
                    </p>
                  </div>
                )}

                {/* Key Iconic Quote */}
                {philosophyResult.key_quote && (
                  <div className="p-4 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 rounded-2xl border border-blue-500/30 flex items-start gap-3">
                    <Quote className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-blue-300 block mb-1">دیالوگ و مانیفست ماندگار:</span>
                      <p className="text-xs sm:text-sm font-serif italic text-white leading-relaxed">
                        «{philosophyResult.key_quote}»
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBVIEW 4: MOVIE BATTLE ARENA                            */}
        {/* ======================================================== */}
        {activeSubView === 'battle' && (
          <div className="space-y-6">
            {/* Battle Setup Arena */}
            <div className="bg-[#141424] border border-[#26263C] rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="text-center max-w-2xl mx-auto mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-2">
                  <Swords className="w-3.5 h-3.5" />
                  رینگ نبرد سینمایی • Face-Off Battle
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  مقایسه رو در روی شاهکارها و کارگردانان
                </h2>
                <p className="text-xs text-[#8E8EA8] mt-1">
                  دو اثر را وارد کنید تا هوش مصنوعی در ۵ بعد هنری آن‌ها را کالبدشکافی و رای نهایی را صادر کند.
                </p>
              </div>

              {/* Preset Battles */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {[
                  { m1: 'Interstellar (میان‌ستاره‌ای)', m2: '2001: A Space Odyssey (۲۰۰۱: ادیسه فضایی)' },
                  { m1: 'The Godfather (پدرخوانده ۱)', m2: 'The Godfather Part II (پدرخوانده ۲)' },
                  { m1: 'جدایی نادر از سیمین', m2: 'درباره الی' },
                  { m1: 'Oppenheimer (اوپنهایمر)', m2: 'Interstellar (میان‌ستاره‌ای)' },
                  { m1: 'Fight Club (فایت کلاب)', m2: 'The Matrix (ماتریکس)' },
                  { m1: 'Taxi Driver (راننده تاکسی)', m2: 'Joker (جوکر)' }
                ].map((b, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setBattleMovie1(b.m1);
                      setBattleMovie2(b.m2);
                      handleRunBattle(b.m1, b.m2);
                    }}
                    className="px-3 py-1.5 bg-[#1C1C2E] hover:bg-[#282840] border border-[#2A2A40] text-xs text-[#A0A0B5] hover:text-white rounded-xl transition-all"
                  >
                    {b.m1} ⚔️ {b.m2}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center max-w-4xl mx-auto">
                <div className="lg:col-span-2">
                  <label className="text-[11px] text-[#8E8EA8] block mb-1">اثر اول (گوشه سرخ):</label>
                  <input
                    type="text"
                    value={battleMovie1}
                    onChange={(e) => setBattleMovie1(e.target.value)}
                    className="w-full bg-[#181828] text-white text-xs sm:text-sm rounded-xl px-4 py-2.5 border border-[#2A2A40] focus:border-red-500 focus:outline-none"
                    placeholder="نام فیلم اول..."
                  />
                </div>

                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-amber-600 flex items-center justify-center font-black text-white text-xs shadow-lg">
                    VS
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-[11px] text-[#8E8EA8] block mb-1">اثر دوم (گوشه آبی):</label>
                  <input
                    type="text"
                    value={battleMovie2}
                    onChange={(e) => setBattleMovie2(e.target.value)}
                    className="w-full bg-[#181828] text-white text-xs sm:text-sm rounded-xl px-4 py-2.5 border border-[#2A2A40] focus:border-blue-500 focus:outline-none"
                    placeholder="نام فیلم دوم..."
                  />
                </div>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => handleRunBattle()}
                  disabled={isBattleLoading}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 hover:opacity-90 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-600/25 transition-all cursor-pointer"
                >
                  {isBattleLoading ? 'در حال برگزاری نبرد و داوری هوش مصنوعی...' : '🔥 آغاز نبرد و داوری نهایی'}
                </button>
              </div>
            </div>

            {/* Battle Result Presentation */}
            {battleResult && (
              <div className="bg-[#141424] border border-[#26263C] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                {/* Winner Card */}
                <div className="p-6 bg-gradient-to-r from-amber-950/40 via-[#1F1B2C] to-red-950/40 rounded-3xl border border-amber-500/40 text-center space-y-3">
                  <div className="inline-flex items-center gap-2 bg-amber-500 text-black font-extrabold text-xs px-3 py-1 rounded-full">
                    <Trophy className="w-3.5 h-3.5" />
                    رای نهایی و قهرمان نبرد
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-300">
                    {battleResult.overall_winner}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#E0E0F0] max-w-2xl mx-auto leading-relaxed">
                    {battleResult.verdict_summary}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => persianVoiceEngine.speak(`نتیجه نبرد میان ${battleResult.movie1_title} و ${battleResult.movie2_title}. رای نهایی منتقدان: ${battleResult.verdict_summary}`, 'farid')}
                      className="inline-flex items-center gap-1.5 text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      <Volume2 className="w-4 h-4" />
                      خوانش رای با صدای پرطنین فرید
                    </button>
                  </div>
                </div>

                {/* 5-Dimension Categories Comparison */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-white">
                    امتیازات و کالبدشکافی ابعاد پنج‌گانه:
                  </h4>

                  <div className="space-y-3">
                    {battleResult.categories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#18182A] rounded-2xl border border-[#24243C] space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-red-400">{battleResult.movie1_title}: {cat.score1}/10</span>
                          <span className="text-white text-sm">{cat.name}</span>
                          <span className="text-blue-400">{battleResult.movie2_title}: {cat.score2}/10</span>
                        </div>

                        {/* Dual Score Bar */}
                        <div className="w-full bg-[#12121E] h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-red-500 h-full"
                            style={{ width: `${(cat.score1 / (cat.score1 + cat.score2)) * 100}%` }}
                          />
                          <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${(cat.score2 / (cat.score1 + cat.score2)) * 100}%` }}
                          />
                        </div>

                        <p className="text-xs text-[#A0A0C0] leading-relaxed pt-1">
                          {cat.comparison_text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Recommendation */}
                <div className="p-4 bg-[#181828] rounded-2xl border border-[#2C2C44] text-xs text-[#C0C0DC] leading-relaxed">
                  <strong className="text-white block mb-1">توصیه پایانی برای تماشا:</strong>
                  {battleResult.final_recommendation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBVIEW 5: IRANIAN CINEMA & OSCARS                       */}
        {/* ======================================================== */}
        {activeSubView === 'iranian_oscar' && (
          <div className="space-y-6">
            <div className="bg-[#141424] border border-[#26263C] rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    تاریخچه درخشش سینمای ایران در اسکار و جهان
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    تبارشناسی موج نو، کیارستمی، فرهادی و بیضایی
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (iranianResult) {
                        const readText = `${iranianResult.topic_title}. ${iranianResult.historical_context}. دستاوردهای جهانی: ${iranianResult.oscar_and_international_impact}`;
                        persianVoiceEngine.speak(readText, activeSpeaker);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>شنیدن تاریخچه</span>
                  </button>
                </div>
              </div>

              {/* Era Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  'موج نو و درخشش در اسکار و فستیوال‌های الف جهانی',
                  'میراث عباس کیارستمی و فلسفه هایکویی در سینما',
                  'مهندسی فیلم‌نامه و چالش‌های اخلاقی اصغر فرهادی',
                  'بهرام بیضایی و ستایش هویت و زبان نمادین ایرانی'
                ].map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLoadIranianCinema(t)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      iranianTopic === t
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-[#1C1C2E] text-[#9A9AB5] hover:text-white border border-[#2A2A40]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Analysis Result */}
              {isIranianLoading ? (
                <div className="py-16 text-center text-[#8E8EA8] animate-pulse">
                  <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-bold text-white">در حال استخراج اسناد تاریخی و نقد آکادمیک...</p>
                </div>
              ) : iranianResult ? (
                <div className="space-y-6">
                  {/* Historical Context */}
                  <div className="p-5 bg-[#18182A] rounded-2xl border border-[#282840] text-sm text-[#D0D0E8] leading-relaxed">
                    <span className="font-extrabold text-emerald-400 block mb-1 text-xs">خاستگاه تاریخی و زمینه اجتماعی:</span>
                    {iranianResult.historical_context}
                  </div>

                  {/* Innovations */}
                  <div>
                    <h4 className="font-bold text-sm text-white mb-3">نوآوری‌های فرمی و زیباشناختی:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {iranianResult.aesthetic_innovations.map((inn, i) => (
                        <div key={i} className="p-4 bg-[#1A1A2E] rounded-2xl border border-emerald-500/20 text-xs text-[#B0B0CC] leading-relaxed flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{inn}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Masterpiece Showcase */}
                  <div>
                    <h4 className="font-bold text-sm text-white mb-3">شاهکارهای بنیادین این دوره:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {iranianResult.essential_masterpieces.map((film, i) => (
                        <div key={i} className="p-4 bg-[#1C1C30] rounded-2xl border border-[#2E2E4A] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h5 className="font-extrabold text-sm text-white">{film.title}</h5>
                            <span className="text-xs text-yellow-400 font-mono">{film.year}</span>
                          </div>
                          <p className="text-xs text-[#8E8EA8]">کارگردان: {film.director}</p>
                          <p className="text-xs text-[#C0C0DC] pt-1 leading-relaxed">
                            {film.significance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBVIEW 6: GUESS THE MOVIE QUIZ GAME                     */}
        {/* ======================================================== */}
        {activeSubView === 'guess_game' && (
          <div className="space-y-6">
            <div className="bg-[#141424] border border-[#26263C] rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto">
              
              {/* Score & Streak Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[#232338]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg shadow-pink-500/20">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-white">بازی حدس فیلم • Movie Quiz</h2>
                    <span className="text-xs text-[#8E8EA8]">سرنخ‌های مرحله‌ای را باز کنید و نام فیلم را حدس بزنید!</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-[#8E8EA8] block">امتیاز کل:</span>
                    <span className="font-extrabold text-base text-yellow-400 font-mono">{gameScore}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8E8EA8] block">رکورد (Streak):</span>
                    <span className="font-extrabold text-base text-rose-400 font-mono">🔥 {gameStreak}</span>
                  </div>
                </div>
              </div>

              {isGameLoading ? (
                <div className="py-20 text-center text-[#8E8EA8] animate-pulse">
                  <Gamepad2 className="w-8 h-8 text-pink-400 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-bold text-white">در حال طراحی معمای جدید سینمایی...</p>
                </div>
              ) : gameQuestion ? (
                <div className="space-y-6 pt-6">
                  {/* Emoji Clues */}
                  <div className="p-6 bg-gradient-to-br from-[#1C172E] to-[#141424] rounded-3xl border border-pink-500/30 text-center space-y-3">
                    <span className="text-xs text-pink-300 font-bold block">سرنخ اول: ایموجی‌های نمادین اثر</span>
                    <div className="flex items-center justify-center gap-3 text-3xl sm:text-4xl">
                      {gameQuestion.emoji_clues.map((emoji, idx) => (
                        <span key={idx} className="p-2 bg-[#121220] rounded-2xl border border-[#2A2A44] shadow-md">
                          {emoji}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Progressive Clues */}
                  <div className="space-y-3">
                    {/* Clue 1: Dialogue */}
                    <div className="p-4 bg-[#18182A] rounded-2xl border border-[#282840] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-yellow-400">دیالوگ ماندگار و کلیدی:</span>
                        <button
                          onClick={() => persianVoiceEngine.speak(`دیالوگ ماندگار: ${gameQuestion.iconic_dialogue}`, activeSpeaker)}
                          className="text-[11px] text-[#8E8EA8] hover:text-white flex items-center gap-1"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          شنیدن
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200 italic">
                        «{gameQuestion.iconic_dialogue}»
                      </p>
                    </div>

                    {/* Clue 2: Cryptic Premise (Unlocked with button) */}
                    {revealedClues >= 2 ? (
                      <div className="p-4 bg-[#18182A] rounded-2xl border border-[#282840] space-y-1">
                        <span className="text-xs font-bold text-cyan-400">خلاصه معمایی داستان:</span>
                        <p className="text-xs text-[#C0C0DC] leading-relaxed">
                          {gameQuestion.cryptic_premise}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRevealedClues(2)}
                        className="w-full py-2.5 bg-[#1C1C30] hover:bg-[#252542] text-xs text-[#8E8EA8] hover:text-white rounded-2xl border border-dashed border-[#343450] transition-all flex items-center justify-center gap-2"
                      >
                        <HelpCircle className="w-4 h-4 text-cyan-400" />
                        باز کردن سرنخ دوم (خلاصه معمایی داستان)
                      </button>
                    )}

                    {/* Clue 3: Genre & Year & Cast */}
                    {revealedClues >= 3 ? (
                      <div className="p-4 bg-[#18182A] rounded-2xl border border-[#282840] text-xs text-[#B0B0CC] space-y-1">
                        <p><strong className="text-white">ژانر:</strong> {gameQuestion.genre_hint}</p>
                        <p><strong className="text-white">سال ساخت:</strong> {gameQuestion.year}</p>
                        <p><strong className="text-white">بازیگران:</strong> {gameQuestion.cast_hint}</p>
                      </div>
                    ) : (
                      revealedClues >= 2 && (
                        <button
                          onClick={() => setRevealedClues(3)}
                          className="w-full py-2.5 bg-[#1C1C30] hover:bg-[#252542] text-xs text-[#8E8EA8] hover:text-white rounded-2xl border border-dashed border-[#343450] transition-all flex items-center justify-center gap-2"
                        >
                          <HelpCircle className="w-4 h-4 text-amber-400" />
                          باز کردن سرنخ سوم (سال ساخت و بازیگران)
                        </button>
                      )
                    )}
                  </div>

                  {/* Guess Input Form */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={userGuessInput}
                        onChange={(e) => setUserGuessInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSubmitGuess();
                        }}
                        placeholder="نام فارسی یا انگلیسی فیلم را اینجا بنویسید..."
                        className="flex-1 bg-[#181828] text-white text-sm rounded-xl px-4 py-3 border border-[#2A2A40] focus:border-pink-500 focus:outline-none"
                      />
                      <button
                        onClick={handleSubmitGuess}
                        className="px-5 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-90 text-white rounded-xl font-bold text-sm shadow-md shadow-pink-600/30 transition-all cursor-pointer"
                      >
                        ثبت حدس
                      </button>
                    </div>

                    {guessFeedback && (
                      <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        guessFeedback.isCorrect
                          ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/50 border border-rose-500/40 text-rose-200'
                      }`}>
                        {guessFeedback.text}
                      </div>
                    )}
                  </div>

                  {/* Next Question / Surrender */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#232338]">
                    <button
                      onClick={() => {
                        setGuessFeedback({
                          isCorrect: false,
                          text: `پاسخ این معما «${gameQuestion.title} (${gameQuestion.english_title})» ساخته ${gameQuestion.director} بود.`
                        });
                      }}
                      className="text-xs text-[#8E8EA8] hover:text-white"
                    >
                      تسلیم شدن و مشاهده پاسخ
                    </button>

                    <button
                      onClick={handleNewGameQuestion}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#1E1E34] hover:bg-[#282848] text-white rounded-xl text-xs font-bold border border-[#2E2E4C] transition-all"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      معمای بعدی
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
