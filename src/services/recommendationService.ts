import { Movie } from '../types';

export interface StoryMotif {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface SimilarMovieResult {
  movie: Movie;
  similarityScore: number; // 0 - 100 percentage
  matchReason: string;
  matchedGenres: string[];
  matchedThemes: string[];
  matchedMotifs: StoryMotif[];
  matchedCast: string[];
  isSameDirector: boolean;
}

// Deep Storyline Motifs & Environmental Elements Dictionary
export const STORYLINE_MOTIFS: Record<string, { name: string; icon: string; description: string; keywords: string[] }> = {
  'robot_ai': {
    name: 'ربات و هوش مصنوعی',
    icon: '🤖',
    description: 'فناوری‌های خودآگاه، رباتیک، سایبورگ‌ها و سایبرپانک',
    keywords: ['ربات', 'هوش مصنوعی', 'اندروید', 'سایبورگ', 'ماشین', 'سایبرپانک', 'هک', 'کدنویسی', 'الگوریتم', 'سیستم خودکار', 'robot', 'ai', 'cyborg', 'android', 'cyberpunk', 'synthetic', 'matrix']
  },
  'zombie_apocalypse': {
    name: 'زامبی و آخرالزمان',
    icon: '🧟‍♂️',
    description: 'همه‌گیری ویروس، مردگان متحرک، جهش‌یافته‌ها و بقا در جهان پسا‌آخرالزمانی',
    keywords: ['زامبی', 'ویروس', 'همه‌گیری', 'مردگان متحرک', 'آخرالزمان', 'عفونت', 'جهش‌یافته', 'مردگان', 'شیوع', 'zombie', 'virus', 'infection', 'outbreak', 'apocalypse', 'undead', 'mutant', 'evil dead']
  },
  'jungle_wilderness': {
    name: 'جنگل و طبیعت وحشی',
    icon: '🌲',
    description: 'ماجراجویی در جنگل‌های بارانی، بیشه‌های انبوه و دل طبیعت بکر',
    keywords: ['جنگل', 'درختان', 'بیشه', 'آمازون', 'بارانی', 'طبیعت وحشی', 'درخت', 'حیات وحش', 'طبیعت', 'jungle', 'forest', 'rainforest', 'wilderness', 'woods', 'nature']
  },
  'mountain_snow': {
    name: 'کوهستان، برف و یخبندان',
    icon: '🏔️',
    description: 'کوهنوردی، قله‌های سرسخت، کولاک، یخبندان و صخره‌های صعب‌العبور',
    keywords: ['کوه', 'کوهستان', 'قله', 'برف', 'یخ', 'یخبندان', 'کولاک', 'صخره', 'هیمالیا', 'اورست', 'صخره‌نوردی', 'mountain', 'snow', 'ice', 'glacier', 'peak', 'everest', 'blizzard', 'cliff']
  },
  'manhunt_survival': {
    name: 'شکار انسان و بازی مرگبار',
    icon: '🎯',
    description: 'تعقیب و گریز مرگبار، بازی بقا، طعمه انسانی و مسابقات مرگ',
    keywords: ['شکار انسان', 'مان‌هانت', 'تعقیب و گریز', 'شکارچی انسان', 'بازی بقا', 'قربانی', 'فرار مرگبار', 'طعمه', 'تله مرگ', 'دوئل بقا', 'manhunt', 'human hunt', 'battle royale', 'predator', 'survival game', 'hunted', 'squid game']
  },
  'animal_wildlife_hunt': {
    name: 'شکار حیوان و جانوران درنده',
    icon: '🦁',
    description: 'نبرد با درندگان وحشی، کوسه‌ها، خرس‌ها، هیولاهای ماقبل تاریخ و حیات وحش',
    keywords: ['شکار حیوان', 'حیوانات درنده', 'شکار', 'خرس', 'گرگ', 'کوسه', 'دایناسور', 'شیر', 'پلنگ', 'هیولای دریا', 'پاندا', 'حیات وحش', 'animal hunt', 'predator', 'wild beast', 'shark', 'bear', 'wolf', 'monster', 'jurassic', 'safari']
  },
  'sea_ocean_island': {
    name: 'دریا، اقیانوس و جزیره',
    icon: '🌊',
    description: 'دریانوردی، اعماق اقیانوس، زیردریایی، جزایر متروکه و طوفان‌های دریایی',
    keywords: ['دریا', 'اقیانوس', 'ساحل', 'کشتی', 'قایق', 'زیردریایی', 'غرق', 'اعماق آب', 'جزیره', 'موج', 'غواصی', 'دریانورد', 'sea', 'ocean', 'deep sea', 'submarine', 'island', 'shipwreck', 'water', 'beach', 'sailor', 'castaway']
  },
  'desert_wasteland': {
    name: 'بیابان و سرزمین برهوت',
    icon: '🏜️',
    description: 'کویرهای بی‌پایان، طوفان‌های شن، بیابان‌های سوزان و بقا در خشکسالی',
    keywords: ['بیابان', 'صحرا', 'کویر', 'شن', 'طوفان شن', 'برهوت', 'خشکسالی', 'آراکیس', 'تلماسه', 'desert', 'dune', 'wasteland', 'sandstorm', 'arid', 'sahara']
  },
  'space_cosmic': {
    name: 'فضا، کهکشان و سیاره‌ها',
    icon: '🪐',
    description: 'سفرهای کیهانی، سفینه‌ها، سیاه‌چاله‌ها و کشف سیارات ناشناخته',
    keywords: ['فضا', 'کهکشان', 'سیاره', 'سفینه', 'ستاره', 'سیاه‌چاله', 'کرمچاله', 'فرازمینی', 'بیگانه', 'مدار', 'کیهان', 'space', 'galaxy', 'planet', 'spaceship', 'alien', 'black hole', 'interstellar', 'cosmic', 'orbit']
  },
  'time_travel_loop': {
    name: 'سفر در زمان و حلقه‌های زمانی',
    icon: '⏳',
    description: 'دستکاری زمان، حلقه‌های تکرارشونده زمانی، پارادوکس و جهان‌های موازی',
    keywords: ['زمان', 'سفر در زمان', 'حلقه زمانی', 'آینده', 'گذشته', 'پارادوکس', 'جهان‌های موازی', 'نسبیت', 'تکرار زمان', 'time travel', 'time loop', 'multiverse', 'paradox', 'timeline']
  },
  'medieval_samurai': {
    name: 'نبرد باستانی، شمشیر و سامورایی',
    icon: '⚔️',
    description: 'شمشیرزنی، شوگونات، سامورایی‌ها، نبردهای گلادیاتوری و امپراتوری‌های کهن',
    keywords: ['شمشیر', 'سامورایی', 'شوگان', 'گلادیاتور', 'امپراتوری', 'قرون وسطی', 'شوالیه', 'قلعه', 'اساطیری', 'نبرد باستانی', 'بوشیدو', 'samurai', 'sword', 'gladiator', 'medieval', 'knight', 'empire', 'feudal', 'warrior', 'shogun']
  },
  'detective_crime': {
    name: 'کارآگاهی، جنایت و قاتل زنجیره‌ای',
    icon: '🕵️‍♂️',
    description: 'تحقیقات پلیسی، بازجویی، قاتلان زنجیره‌ای و معماهای جنایی پیچیده',
    keywords: ['کارآگاه', 'پلیس', 'قاتل زنجیره‌ای', 'قتل', 'معما', 'جنایت', 'پرونده', 'نوآر', 'تحقیق', 'تجسس', 'بازپرس', 'detective', 'serial killer', 'murder', 'crime', 'investigation', 'noir', 'police', 'inspector']
  },
  'heist_mafia': {
    name: 'سرقت، دزدی و مافیا',
    icon: '💰',
    description: 'سرقت‌های بزرگ بانکی، باندهای خلافکار، مافیا و گانگسترها',
    keywords: ['سرقت', 'دزدی', 'بانک', 'مافیا', 'گانگستر', 'پدرخوانده', 'قاچاق', 'کارتل', 'دستبرد', 'گروه تبهکاری', 'heist', 'robbery', 'mafia', 'gangster', 'bank', 'cartel', 'thief']
  },
  'prison_break': {
    name: 'زندان، اسارت و فرار',
    icon: '🏢',
    description: 'نقشه‌های فرار از زندان، اسارت در سلول‌های امنیتی و گروگان‌گیری',
    keywords: ['زندان', 'سلول', 'فرار از زندان', 'اسیر', 'گروگان', 'حبس', 'زندانی', 'امنیت بالا', 'prison', 'jail', 'escape', 'hostage', 'captive', 'captivity']
  },
  'revenge_vengeance': {
    name: 'انتقام و خون‌خواهی',
    icon: '🔥',
    description: 'داستان‌های کینه‌توزی، دوئل‌های شخصی و تسویه‌حساب‌های خونین',
    keywords: ['انتقام', 'خون‌خواهی', 'کینه', 'انتقام‌جویی', 'عدالت شخصی', 'دوئل', 'خونین', 'revenge', 'vengeance', 'retribution', 'vendetta', 'payback']
  },
  'psychological_mind': {
    name: 'پیچش ذهنی و روان‌شناختی',
    icon: '🧠',
    description: 'کاووش در روان، توهم، رویا در رویا، ترومای سرکوب‌شده و پایان‌های غافلگیرکننده',
    keywords: ['روان‌شناختی', 'روانشناختی', 'جنون', 'وسواس', 'ناخودآگاه', 'رویا', 'توهم', 'فراموشی', 'هویت', 'پیچش داستانی', 'psychological', 'obsession', 'dream', 'hallucination', 'identity', 'twist']
  },
  'supernatural_horror': {
    name: 'ماوراءالطبیعه و وحشت',
    icon: '👻',
    description: 'جن‌گیری، خانه‌های تسخیرشده، شیاطین، ارواح و نیروهای ناشناخته',
    keywords: ['جن‌گیری', 'ماوراءالطبیعه', 'ارواح', 'تسخیر', 'خانه جن‌زده', 'شیطان', 'طلسم', 'ترسناک', 'وحشت', 'خبیث', 'haunted', 'exorcism', 'ghost', 'demon', 'supernatural', 'curse', 'horror']
  },
  'love_family': {
    name: 'عاشقانه و عاطفه خانوادگی',
    icon: '❤️',
    description: 'روابط عمیق انسانی، پیوندهای عاشقانه، مهر پدر و فرزندی و فداکاری',
    keywords: ['عاشقانه', 'عشق', 'رمانتیک', 'خانواده', 'پدر و دختر', 'پدر و پسر', 'مادر', 'جدایی', 'ازدواج', 'احساسی', 'love', 'romance', 'emotional', 'family', 'relationship']
  }
};

/**
 * Normalizes text for keyword extraction
 */
function cleanText(text?: string): string {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[.,،!?؛:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract matched story motifs from description, title, and genre
 */
export function extractStoryMotifs(movie: Movie): StoryMotif[] {
  const corpus = cleanText(`${movie.title} ${movie.english_title || ''} ${movie.genre || ''} ${movie.description || ''} ${movie.director || ''} ${movie.actors || ''}`);
  const motifs: StoryMotif[] = [];

  for (const [id, data] of Object.entries(STORYLINE_MOTIFS)) {
    const isMatched = data.keywords.some(kw => {
      const cleanKw = kw.toLowerCase().trim();
      return corpus.includes(cleanKw);
    });

    if (isMatched) {
      motifs.push({
        id,
        name: data.name,
        icon: data.icon,
        description: data.description
      });
    }
  }

  return motifs;
}

/**
 * Extract simple tag names for legacy or lightweight components
 */
export function extractThematicTags(movie: Movie): string[] {
  const motifs = extractStoryMotifs(movie);
  if (motifs.length > 0) {
    return motifs.map(m => `${m.icon} ${m.name}`);
  }

  // Fallback to genre-based tags
  if (movie.genre) {
    return movie.genre.split(/[,،/]+/).map(g => g.trim()).filter(Boolean).slice(0, 3);
  }

  return ['سینمایی'];
}

/**
 * Parses comma or slash separated list of tokens
 */
function parseList(str?: string): string[] {
  if (!str) return [];
  return str
    .split(/[,،/|]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 1);
}

/**
 * Calculates a multi-dimensional cinematic similarity score between two movies
 */
export function calculateMovieSimilarity(target: Movie, candidate: Movie): SimilarMovieResult | null {
  if (target.message_id === candidate.message_id) return null;

  let totalScore = 0;

  // 1. Deep Story Motifs & Environmental Elements Matching (Weight: 40%)
  const targetMotifs = extractStoryMotifs(target);
  const candidateMotifs = extractStoryMotifs(candidate);
  
  const commonMotifs = targetMotifs.filter(tm => 
    candidateMotifs.some(cm => cm.id === tm.id)
  );

  if (commonMotifs.length > 0) {
    totalScore += Math.min(40, commonMotifs.length * 15);
  }

  // 2. Genre Overlap (Weight: 30%)
  const targetGenres = parseList(target.genre);
  const candidateGenres = parseList(candidate.genre);
  const commonGenres: string[] = [];

  for (const tg of targetGenres) {
    if (candidateGenres.some(cg => cg.includes(tg) || tg.includes(cg))) {
      commonGenres.push(tg);
    }
  }

  if (targetGenres.length > 0 && commonGenres.length > 0) {
    const genreRatio = commonGenres.length / Math.max(targetGenres.length, candidateGenres.length);
    totalScore += Math.min(30, Math.round(genreRatio * 25 + commonGenres.length * 5));
  }

  // 3. Director Match (Weight: 15%)
  const targetDirector = cleanText(target.director);
  const candidateDirector = cleanText(candidate.director);
  let isSameDirector = false;

  if (targetDirector && candidateDirector && (
    targetDirector.includes(candidateDirector) || 
    candidateDirector.includes(targetDirector)
  )) {
    isSameDirector = true;
    totalScore += 15;
  }

  // 4. Cast / Actors Overlap (Weight: 10%)
  const targetActors = parseList(target.actors);
  const candidateActors = parseList(candidate.actors);
  const commonActors = targetActors.filter(act => candidateActors.some(cAct => cAct.includes(act) || act.includes(cAct)));

  if (commonActors.length > 0) {
    totalScore += Math.min(10, commonActors.length * 5);
  }

  // 5. Category Synergy (Weight: 5%)
  if (target.category && candidate.category && target.category === candidate.category) {
    totalScore += 5;
  }

  // Baseline score if same universe/style
  const normalizedScore = Math.min(99, Math.max(12, Math.round(totalScore)));

  // Generate clear Persian match explanation mentioning specific story motifs
  const reasons: string[] = [];
  if (commonMotifs.length > 0) {
    const motifLabels = commonMotifs.slice(0, 2).map(m => `${m.icon} ${m.name}`).join(' و ');
    reasons.push(`المان‌های داستانی: ${motifLabels}`);
  }
  if (isSameDirector && target.director) {
    reasons.push(`کارگردان مشترک (${target.director})`);
  }
  if (commonGenres.length > 0) {
    reasons.push(`هم‌ژانر (${commonGenres.slice(0, 2).join('، ')})`);
  }
  if (commonActors.length > 0) {
    reasons.push(`هنرنمایی مشترک بازیگران`);
  }

  const matchReason = reasons.length > 0 
    ? reasons.join(' • ') 
    : 'شباهت ساختاری در فضاسازی و پیرنگ روایی';

  return {
    movie: candidate,
    similarityScore: normalizedScore,
    matchReason,
    matchedGenres: commonGenres,
    matchedThemes: commonMotifs.map(m => m.name),
    matchedMotifs: commonMotifs,
    matchedCast: commonActors,
    isSameDirector
  };
}

/**
 * Finds top similar movies for a given movie from the library
 */
export function getSimilarMovies(
  targetMovie: Movie, 
  allMovies: Movie[], 
  limit: number = 8,
  filterType: 'all' | 'story' | 'genre' | 'creator' | string = 'all'
): SimilarMovieResult[] {
  const scored = allMovies
    .map(candidate => calculateMovieSimilarity(targetMovie, candidate))
    .filter((res): res is SimilarMovieResult => res !== null);

  // Apply sub-filters
  let filtered = scored;
  if (filterType === 'story') {
    filtered = scored.filter(s => s.matchedMotifs.length > 0);
  } else if (filterType === 'genre') {
    filtered = scored.filter(s => s.matchedGenres.length > 0);
  } else if (filterType === 'creator') {
    filtered = scored.filter(s => s.isSameDirector || s.matchedCast.length > 0);
  } else if (filterType !== 'all') {
    // specific motif filter ID like 'robot_ai', 'sea_ocean_island', 'jungle_wilderness', etc.
    filtered = scored.filter(s => 
      s.matchedMotifs.some(m => m.id === filterType) || 
      extractStoryMotifs(s.movie).some(m => m.id === filterType)
    );
  }

  // Sort by similarity score descending
  filtered.sort((a, b) => b.similarityScore - a.similarityScore);

  // If filtered subset is too small and not all, provide fallback top scored movies
  if (filtered.length < 2 && filterType !== 'all') {
    return scored.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit);
  }

  return filtered.slice(0, limit);
}
