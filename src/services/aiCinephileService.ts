import { 
  AIMessage, 
  MoodMovieRecommendation, 
  PhilosophicalAnalysisResult, 
  MovieBattleResult, 
  IranianCinemaAnalysisResult, 
  GuessGameQuestion,
  VoiceSpeaker 
} from '../types';
import { 
  CURATED_MOOD_RECOMMENDATIONS, 
  MASTERPIECE_PHILOSOPHY_DATABASE, 
  CURATED_BATTLES, 
  GUESS_GAME_QUESTIONS,
  generateAccuratePhilosophicalAnalysis,
  generateAccurateMovieBattle
} from '../data/aiCuratedData';
import { apiFetch } from './apiFetch';

export class AICinephileService {
  // 1. Chat
  static async sendChatMessage(
    message: string, 
    history: AIMessage[], 
    activeSpeaker: VoiceSpeaker
  ): Promise<{ text: string; modelUsed?: string }> {
    try {
      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_history: history.slice(-6),
          active_speaker: activeSpeaker
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.text) {
          return { text: data.text, modelUsed: data.model_used };
        }
      }
    } catch (e) {
      console.warn('AI Chat server request error, utilizing intelligent local fallback:', e);
    }

    // Local smart conversational fallback
    const lower = message.toLowerCase();
    if (lower.includes('اسکار') || lower.includes('فرهادی') || lower.includes('کیارستمی')) {
      return {
        text: `سینمای ایران با آثاری چون «طعم گیلاس» عباس کیارستمی (نخل طلای کن ۱۹۹۷) و دو اسکار تاریخی «جدایی نادر از سیمین» (۲۰۱۲) و «فروشنده» (۲۰۱۷) اصغر فرهادی، جایگاهی ماندگار در تاریخ هنر هفتم دارد.\n\nویژگی شاخص این سینما، پرهیز از زرق‌وبرق کاذب، تمرکز بر بحران‌های اخلاقی جهان‌شمول و به چالش کشیدن قطعیت قضاوت انسانی است.`,
        modelUsed: 'local_cinephile_knowledge'
      };
    }

    if (lower.includes('نولان') || lower.includes('تلقین') || lower.includes('میان‌ستاره‌ای') || lower.includes('اینترستلار') || lower.includes('اوپنهایمر')) {
      return {
        text: `کریستوفر نولان استاد مهندسی زمان و درام‌های ساختارشکن است. او در «میان‌ستاره‌ای» فیزیک کوانتوم را با عشق والدینی گره می‌زند و در «اوپنهایمر» تراژدی پرومتئوسی علم بدون اخلاق را کالبدشکافی می‌کند.\n\nبهترین راه تماشای آثار نولان، دقت در لایه‌بندی صدا، موتیف‌های ساعت و پالت رنگی میزانسن‌هاست.`,
        modelUsed: 'local_cinephile_knowledge'
      };
    }

    return {
      text: `سینما تنها سرگرمی نیست؛ زبانی برای کشف رازهای وجود، تنهایی و پیوند ارواح انسانی است. من آماده‌ام تا در هر بخش از کشف مودهای روحی، تحلیل فلسفی پایان‌بندی‌ها، نبرد شاهکارها و بازی حدس فیلم در کنارتان باشم.\n\nدرباره کدام فیلم یا کارگردان مایل به گفتگو هستید؟`,
      modelUsed: 'local_cinephile_knowledge'
    };
  }

  // 2. Mood Recommendations
  static async getMoodRecommendations(moodId: string, customVibe?: string): Promise<MoodMovieRecommendation[]> {
    try {
      const res = await apiFetch('/api/ai/mood-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood_id: moodId, custom_vibe: customVibe })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          return data.recommendations;
        }
      }
    } catch {
      // ignore
    }

    return CURATED_MOOD_RECOMMENDATIONS[moodId] || CURATED_MOOD_RECOMMENDATIONS.melancholy_deep;
  }

  // 3. Philosophical Analysis
  static async analyzeMasterpiece(title: string, englishTitle?: string, director?: string): Promise<PhilosophicalAnalysisResult> {
    const cleanTitle = (englishTitle || title || '').trim();
    const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check local high-precision curated database first
    for (const key of Object.keys(MASTERPIECE_PHILOSOPHY_DATABASE)) {
      if (slug.includes(key) || key.includes(slug)) {
        return MASTERPIECE_PHILOSOPHY_DATABASE[key];
      }
    }

    try {
      const res = await apiFetch('/api/ai/philosophical-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, english_title: englishTitle, director })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.analysis && data.analysis.core_thesis) {
          return data.analysis;
        }
      }
    } catch {
      // ignore
    }

    // Dynamic, accurate contextual fallback for ANY movie
    return generateAccuratePhilosophicalAnalysis(title, englishTitle, director);
  }

  // 4. Movie Battle
  static async compareMovies(movie1: string, movie2: string): Promise<MovieBattleResult> {
    const key = `${movie1}___${movie2}`.toLowerCase();
    
    for (const [bKey, val] of Object.entries(CURATED_BATTLES)) {
      if (key.includes(bKey) || bKey.includes(key)) {
        return val;
      }
    }

    try {
      const res = await apiFetch('/api/ai/movie-battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie1, movie2 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.battle && data.battle.categories) {
          return data.battle;
        }
      }
    } catch {
      // ignore
    }

    return generateAccurateMovieBattle(movie1, movie2);
  }

  // 5. Iranian Cinema Analysis
  static async getIranianCinemaAnalysis(topic: string): Promise<IranianCinemaAnalysisResult> {
    try {
      const res = await apiFetch('/api/ai/iranian-cinema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.result) {
          return data.result;
        }
      }
    } catch {
      // ignore
    }

    return {
      topic_title: topic || 'موج نو و درخشش در اسکار و فستیوال‌های الف جهانی',
      era_or_movement: 'سینمای مدرن، مؤلف و واقع‌گرای ایران (از دهه ۴۰ تا عصر حاضر)',
      historical_context: 'سینمای ایران با خیزش نسل کارگردانان جریان‌ساز چون داریوش مهرجویی (گاو)، سهراب شهیدثالث (یک اتفاق ساده)، بهرام بیضایی (باشو غریبه کوچک) و مسعود کیمیایی در اواخر دهه چهل پی‌ریزی شد و بعدها توسط عباس کیارستمی، اصغر فرهادی و جعفر پناهی به قله‌های اعتباری جهان رسید.',
      aesthetic_innovations: [
        'درهم‌آمیزی مرز واقعیت و مستندنمایی با استفاده از نابازیگران و لوکیشن‌های طبیعی',
        'پایان‌های باز که مخاطب را در مقام قاضی اخلاقی اثر قرار می‌دهد',
        'ایجاز و شعرگونگی در قاب‌بندی‌ها با الهام از شعر کهن پارسی و خیام'
      ],
      oscar_and_international_impact: 'کسب نخل طلای فستیوال کن برای «طعم گیلاس»، شیر طلای ونیز برای «دایره»، خرس طلای برلین برای «جدایی نادر از سیمین» و دو جایزه اسکار بهترین فیلم بین‌المللی برای «جدایی نادر از سیمین» (۲۰۱۲) و «فروشنده» (۲۰۱۷).',
      essential_masterpieces: [
        { title: 'طعم گیلاس', year: '1997', director: 'عباس کیارستمی', significance: 'برنده نخل طلای کن؛ تبارشناسی میل به زیستن و اگزیستانسیالیسم بومی' },
        { title: 'جدایی نادر از سیمین', year: '2011', director: 'اصغر فرهادی', significance: 'برنده اسکار و خرس طلای برلین؛ کالبدشکافی عدالت و نسبیت اخلاق' },
        { title: 'باشو غریبه کوچک', year: '1986', director: 'بهرام بیضایی', significance: 'شاهکار ضدجنگ و ستایش زبان مشترک مادری و انسانیت' },
        { title: 'گاو', year: '1969', director: 'داریوش مهرجویی', significance: 'سنگ‌بنای موج نو سینمای ایران و اقتباس از داستان عزاداران بیل غلامحسین ساعدی' }
      ],
      philosophical_undercurrent: 'بازتاب اگزیستانسیالیسم شرقی، ریشه‌کنی از خاک، حسرت اصالت، بازگشت به خویشتن و پایداری شرافتمندانه در برابر جبرهای پیرامونی.'
    };
  }

  // 6. Guess Game Question
  static async getGuessQuestion(difficulty: string = 'medium'): Promise<GuessGameQuestion> {
    try {
      const res = await apiFetch(`/api/ai/guess-game/generate?difficulty=${difficulty}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.question && data.question.title) {
          return data.question;
        }
      }
    } catch {
      // ignore
    }

    const randomIndex = Math.floor(Math.random() * GUESS_GAME_QUESTIONS.length);
    return GUESS_GAME_QUESTIONS[randomIndex] || GUESS_GAME_QUESTIONS[0];
  }
}
