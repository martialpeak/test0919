/**
 * Persian Cinematic Phonetic & Prosody Normalization Database
 * Comprehensive database for Persian TTS to guarantee natural, human-grade cinema pronunciation.
 */

// 1. Numbers to Persian Spoken Words Converter
const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];

export function numberToPersianWords(num: number): string {
  if (num === 0) return 'صفر';
  if (num < 0) return `منفی ${numberToPersianWords(-num)}`;
  if (num >= 1000000) return num.toString(); // Fallback for massive numbers

  const parts: string[] = [];

  // Thousands
  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('هزار');
    } else {
      parts.push(`${numberToPersianWords(thousands)} هزار`);
    }
  }

  const remainder = num % 1000;
  if (remainder > 0) {
    const h = Math.floor(remainder / 100);
    const t = Math.floor((remainder % 100) / 10);
    const o = remainder % 10;

    if (h > 0) parts.push(HUNDREDS[h]);

    const teenOrTen = remainder % 100;
    if (teenOrTen >= 10 && teenOrTen <= 19) {
      parts.push(TEENS[teenOrTen - 10]);
    } else {
      if (t > 0) parts.push(TENS[t]);
      if (o > 0) parts.push(ONES[o]);
    }
  }

  return parts.join(' و ');
}

// 2. High-Impact Phonetic Replacements for Cinema Terms, Celebrities & Titles
export const CINEMA_PHONETIC_DATABASE: [RegExp, string][] = [
  // Formatting & Markdown Cleansing
  [/\*\*(.*?)\*\*/g, '$1'],
  [/\*(.*?)\*/g, '$1'],
  [/###?\s*/g, ' . '],
  [/`[^`]*`/g, ''],
  [/\[\d+\]/g, ''],
  [/[-—_]{2,}/g, ' . '],

  // Rating & Scores Normalization (e.g. 8.5/10 -> هشت و نیم از ده)
  [/(\d+)\.5\s*\/\s*10/g, '$1 و نیم از دَه'],
  [/(\d+)\.(\d+)\s*\/\s*10/g, '$1 ممیز $2 از دَه'],
  [/(\d+)\s*\/\s*10/g, '$1 از دَه'],
  [/(\d+)\s*\/\s*100/g, '$1 از صد'],
  [/IMDb\s*:\s*(\d+)\.(\d+)/gi, 'امتیاز آی‌اِم‌دی‌بی: $1 ممیز $2'],
  [/IMDb\s*:\s*(\d+)/gi, 'امتیاز آی‌اِم‌دی‌بی: $1'],

  // Year Conversion (e.g. (2024) -> محصول سال دو هزار و بیست و چهار)
  [/\((19\d\d)\)/g, 'محصول سال $1'],
  [/\((20\d\d)\)/g, 'محصول سال $1'],
  [/\b2026\b/g, 'دو هزار و بیست و شش'],
  [/\b2025\b/g, 'دو هزار و بیست و پنج'],
  [/\b2024\b/g, 'دو هزار و بیست و چهار'],
  [/\b2023\b/g, 'دو هزار و بیست و سه'],
  [/\b2022\b/g, 'دو هزار و بیست و دو'],
  [/\b2021\b/g, 'دو هزار و بیست و یک'],
  [/\b2020\b/g, 'دو هزار و بیست'],
  [/\b2019\b/g, 'دو هزار و نوزده'],
  [/\b2018\b/g, 'دو هزار و هجده'],
  [/\b2017\b/g, 'دو هزار و هفده'],
  [/\b2016\b/g, 'دو هزار و شانزده'],
  [/\b2015\b/g, 'دو هزار و پانزده'],
  [/\b2014\b/g, 'دو هزار و چهارده'],
  [/\b2010\b/g, 'دو هزار و ده'],
  [/\b2008\b/g, 'دو هزار و هشت'],
  [/\b1994\b/g, 'هزار و نهصد و نود و چهار'],
  [/\b1972\b/g, 'هزار و نهصد و هفتاد و دو'],

  // Technical Audio & Visual Badges
  [/\b4K\b|\b4k\b/gi, 'فور کِی'],
  [/\bUHD\b/gi, 'الترا اچ دی'],
  [/\bHDR10\+?\b/gi, 'اِچ دی آر'],
  [/\b1080p\b/gi, 'کیفیت فول اِچ دی'],
  [/\b720p\b/gi, 'کیفیت اِچ دی'],
  [/\bDolby Atmos\b/gi, 'دالبی اَتموس'],
  [/\bDolby Vision\b/gi, 'دالبی ویژن'],
  [/\bIMAX\b/gi, 'آی‌مَکس'],
  [/\bCGI\b/gi, 'جلوه‌های ویژه رایانه‌ای سی جی آی'],
  [/\bVFX\b/gi, 'جلوه‌های بصری'],

  // Platforms, Studios & Festivals
  [/IMDb|imdb/gi, 'آی اِم دی بی'],
  [/Rotten Tomatoes|راتن تومیتوز/gi, 'راتِن تومِیتوز'],
  [/Metacritic|متاکریتیک/gi, 'مِتاکریتیک'],
  [/Letterboxd|لترباکسد/gi, 'لِتِرباکسْد'],
  [/Netflix|نتفلیکس/gi, 'نِتفِلیکس'],
  [/HBO|اچ بی او/gi, 'اِچ بی او'],
  [/Disney\+|دیزنی پلاس/gi, 'دیزنی پلاس'],
  [/Apple TV\+|اپل تی وی پلاس/gi, 'اَپِل تی وی پلاس'],
  [/Warner Bros|وارنر برادرز/gi, 'وارنِر برادِرز'],
  [/Universal Pictures/gi, 'یونیوِرسال پیکچِرز'],
  [/Paramount/gi, 'پارامونت'],
  [/A24/gi, 'ای بیست و چهار'],
  [/Oscar|Oscars|اسکار/gi, 'جایزه اُسکار'],
  [/Cannes|جشنواره کن/gi, 'جشنواره فیلم کَن'],
  [/Venice Film Festival|جشنواره ونیز/gi, 'جشنواره بین‌المللی ونیز'],
  [/Berlinale|برلیناله/gi, 'جشنواره فیلم برلیناله'],
  [/BAFTA|بفتا/gi, 'جوایز بَفتا'],
  [/Golden Globe|گلدن گلوب/gi, 'جوایز گُلدِن گلوب'],
  [/Sundance|ساندنس/gi, 'جشنواره فیلم ساندَنس'],

  // Cinema & Technical Genre Terms
  [/Sci-Fi|ساینس فیکشن|علمی تخیلی/gi, 'علمی-تخیلی'],
  [/Neo-Noir|نئو نوآر/gi, 'نئو-نوآر'],
  [/Film Noir|فیلم نوآر/gi, 'فیلم نوآر'],
  [/Cyberpunk|سایبرپانک/gi, 'سایبِرپانک'],
  [/Post-Apocalyptic|پست آپوکالیپتیک/gi, 'پسا-آخرالزمانی'],
  [/Psychological Thriller|تریلر روانشناختی/gi, 'تریلِر و دلهره‌آور روان‌شناختی'],
  [/Mind-Bending|مایند بندینگ/gi, 'پیچیده و چالش‌برانگیز ذهنی'],
  [/Plot Twist|پلات توییست/gi, 'چرخش داستانی غافلگیرکننده'],
  [/Cinematography|سینماتوگرافی/gi, 'فیلم‌برداری و سینماتوگرافی'],
  [/Soundtrack|ساندترک/gi, 'موسیقی متن و ساندتِرَک'],
  [/Mise-en-scène|میزانسن/gi, 'میزانْسِن'],
  [/Catharsis|کاتارسیس/gi, 'کاتارسیس و پالایش حسی'],
  [/Cliffhanger|کلیف هنگر/gi, 'پایان تعلیق‌آمیز و کلیف‌هَنگِر'],
  [/Spinoff|اسپین آف/gi, 'اسپین‌آف و اثر فرعی'],
  [/Prequel|پری کوئل/gi, 'پیش‌درآمد داستانی'],
  [/Sequel|سیکوئل/gi, 'دنباله سینمایی'],
  [/Blockbuster|بلاک باستر/gi, 'بلاک‌باستِر پرفروش'],
  [/Box Office|باکس آفیس/gi, 'گیشهٔ باکس‌آفیس'],
  [/Masterpiece|شاهکار/gi, 'شاهکار سینمایی'],

  // Legendary Directors
  [/Christopher Nolan|کریستوفر نولان/gi, 'کریستوفِر نولان'],
  [/Quentin Tarantino|کوئنتین تارانتینو/gi, 'کوئنتین تارانتینو'],
  [/Martin Scorsese|مارتین اسکورسیزی/gi, 'مارتین اِسکورسیزی'],
  [/Stanley Kubrick|استنلی کوبریک/gi, 'اِستَنلی کوبریک'],
  [/Denis Villeneuve|دنیس ویلنوو/gi, 'دِنی ویلْنُو'],
  [/David Fincher|دیوید فینچر/gi, 'دیوید فینچِر'],
  [/Alfred Hitchcock|آلفرد هیچکاک/gi, 'آلفرد هیچْکاک'],
  [/Steven Spielberg|استیون اسپیلبرگ/gi, 'اِستیون اِسپیلبِرگ'],
  [/Francis Ford Coppola|فرانسیس فورد کوپولا/gi, 'فرانسیس فورد کاپولا'],
  [/Hayao Miyazaki|هایائو میازاکی/gi, 'هایائو میازاکی'],
  [/Ridley Scott|ریدلی اسکات/gi, 'ریدلی اِسکات'],
  [/James Cameron|جیمز کامرون/gi, 'جیمز کامِرون'],
  [/Wes Anderson|وس اندرسون/gi, 'وِس اَندِرسون'],
  [/Guillermo del Toro|گیرمو دل تورو/gi, 'گی‌یِرمو دِل تورو'],
  [/Bong Joon-ho|بونگ جون هو/gi, 'بونگ جون هو'],
  [/Abbas Kiarostami|عباس کیارستمی|کیارستمی/gi, 'عباس کیارُستَمی'],
  [/Asghar Farhadi|اصغر فرهادی|فرهادی/gi, 'اصغر فَرهادی'],
  [/Dariush Mehrjui|داریوش مهرجویی/gi, 'داریوش مِهرجویی'],
  [/Bahram Beyzai|بهرام بیضایی/gi, 'بهرام بیضایی'],

  // Celebrated Actors & Actresses
  [/Cillian Murphy|کیلین مورفی/gi, 'کیلیان مورفی'],
  [/Leonardo DiCaprio|لئوناردو دی کاپریو|دی‌کاپریو/gi, 'لئوناردو دی‌کاپریو'],
  [/Robert Downey Jr\.|رابرت داونی جونیور/gi, 'رابِرت داونی جونیور'],
  [/Robert De Niro|رابرت دنیرو/gi, 'رابِرت دِنیرو'],
  [/Al Pacino|آل پاچینو/gi, 'آل پاچینو'],
  [/Joaquin Phoenix|واکین فینیکس|خواکین فینیکس/gi, 'خواکین فینیکس'],
  [/Heath Ledger|هیث لجر/gi, 'هیث لِجِر'],
  [/Christian Bale|کریستین بیل/gi, 'کریستین بِیل'],
  [/Timothée Chalamet|تیموتی شالامی/gi, 'تیموتی شالامِی'],
  [/Emma Stone|اما استون/gi, 'اِما اِستون'],
  [/Margot Robbie|مارگو رابی/gi, 'مارگو رابی'],
  [/Brad Pitt|برد پیت/gi, 'بِرَد پیت'],
  [/Tom Hanks|تام هنکس/gi, 'تام هَنکس'],
  [/Morgan Freeman|مورگان فریمن/gi, 'مورگان فریمن'],
  [/Keanu Reeves|کیانو ریوز/gi, 'کیانو ریوز'],
  [/Hans Zimmer|هانس زیمر/gi, 'هانس زیمِر'],
  [/Ludwig Göransson|لودویگ گورانسون/gi, 'لودویگ گورانسون'],
  [/Ennio Morricone|انیو موریکونه/gi, 'اِنیو موریکونه'],
  [/John Williams|جان ویلیامز/gi, 'جان ویلیامز'],

  // Famous Landmark Movie Titles
  [/Oppenheimer|اوپنهایمر/gi, 'اُپِنهایمِر'],
  [/Inception|اینسپشن/gi, 'اینْسِپْشِن (تلقین)'],
  [/Interstellar|اینتراستلار|میان‌ستاره‌ای/gi, 'میان‌ستاره‌ای (اینتِراِستِلار)'],
  [/The Dark Knight|شوالیه تاریکی/gi, 'شوالیهٔ تاریکی'],
  [/The Godfather|پدرخوانده/gi, 'پدرخوانده'],
  [/The Shawshank Redemption|شائوشنگ|شاووشنگ/gi, 'رهایی از شائوشَنک'],
  [/Pulp Fiction|پالپ فیکشن/gi, 'پالپ فیکشن (داستان عامه‌پسند)'],
  [/Fight Club|فایت کلاب/gi, 'باشگاه مشت‌زنی'],
  [/Forrest Gump|فورست گامپ/gi, 'فارِست گامپ'],
  [/The Matrix|ماتریکس/gi, 'ماتریکس'],
  [/Blade Runner|بلید رانر/gi, 'بلِید رانِر'],
  [/Dune|تل‌ماسه|دون/gi, 'تل‌ماسه (دون)'],
  [/Gladiator|گلادیاتور/gi, 'گلادیاتور'],
  [/Parasite|انگل|پارازیت/gi, 'انگل (پارازیت)'],
  [/Spirited Away|شهر اشباح/gi, 'شهر اشباح'],
  [/Whiplash|ویپلش/gi, 'ویپلَش']
];

/**
 * Normalizes Persian cinematic text with accurate prosody, phonetics, and pauses.
 */
export function enrichPersianSpeechText(rawText: string): string {
  if (!rawText) return '';

  let processed = rawText.trim();

  // Apply Phonetic & Lexicon dictionary
  for (const [pattern, replacement] of CINEMA_PHONETIC_DATABASE) {
    processed = processed.replace(pattern, replacement);
  }

  // Prosody and Natural Breath Injections
  processed = processed
    .replace(/\s*:\s*/g, ' : ')
    .replace(/([.!?؛]+)\s+/g, '$1  .  ') // Distinct pause between sentences
    .replace(/([،,])\s+/g, ' ، ') // Breath pause at commas
    .replace(/\s+(که|و همچنین|با این حال|در حالی که|به طوری که|در نتیجه)\s+/g, ' ، $1 ')
    .replace(/\n\n+/g, '  .  ')
    .replace(/\n/g, ' ، ')
    .replace(/\s+/g, ' ')
    .trim();

  return processed;
}
