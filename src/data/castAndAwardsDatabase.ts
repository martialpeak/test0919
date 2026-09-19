import { CastMember, MovieAward } from '../types';

export interface MovieExtendedDetails {
  imdb_id: string;
  awards_summary: string;
  awards: MovieAward[];
  directors: CastMember[];
  crew: CastMember[];
  cast: CastMember[];
}

export const KNOWN_EXTENDED_MOVIE_DATA: Record<string, MovieExtendedDetails> = {
  // 1. اوپنهایمر (Oppenheimer)
  'tt15398776': {
    imdb_id: 'tt15398776',
    awards_summary: 'برنده ۷ جایزه اسکار، ۵ جایزه گلدن گلوب و ۷ جایزه بفتا از میان ۱۳ نامزدی اسکار',
    awards: [
      {
        id: 'opp-osc-1',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین فیلم سال (Best Picture)',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      },
      {
        id: 'opp-osc-2',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین کارگردانی (کریستوفر نولان)',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      },
      {
        id: 'opp-osc-3',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین بازیگر نقش اول مرد (کیلین مورفی)',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      },
      {
        id: 'opp-osc-4',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین بازیگر نقش مکمل مرد (رابرت داونی جونیور)',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      },
      {
        id: 'opp-osc-5',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین تدوین و بهترین فیلمبرداری',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      },
      {
        id: 'opp-osc-6',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین موسیقی متن اصلی (لودویگ گورانسون)',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      },
      {
        id: 'opp-gg-1',
        title: 'جایزه گلدن گلوب (Golden Globe)',
        category: 'بهترین فیلم درام، کارگردانی و موسیقی متن',
        year: '2024',
        is_winner: true,
        organization: 'انجمن مطبوعات خارجی هالیوود',
        icon: 'globe'
      },
      {
        id: 'opp-bafta-1',
        title: 'جایزه بفتا (BAFTA Awards)',
        category: 'بهترین فیلم، بهترین بازیگر مرد و ۵ شاخه فنی',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی فیلم بریتانیا',
        icon: 'bafta'
      }
    ],
    directors: [
      {
        name: 'کریستوفر نولان',
        english_name: 'Christopher Nolan',
        character: 'کارگردان و نویسنده',
        job: 'کارگردان، نویسنده و تهیه‌کننده',
        photo: 'https://image.tmdb.org/t/p/w500/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg',
        birth_date: '۳۰ ژوئیه ۱۹۷۰ (۵۴ سال)',
        birth_place: 'لندن، انگلستان',
        biography: 'کریستوفر نولان یکی از تحسین‌شده‌ترین و تاثیرگذارترین فیلم‌سازان قرن بیست و یکم است. او برای سبک متمایز کارگردانی، ساختارهای روایی غیرخطی، استفاده از فیلم‌های نگاتیو ۶۵ میلی‌متری و فرمت IMAX، و تکیه بر جلوه‌های ویژه کاربردی بدون اتکای صرف به CGI شهرت جهانی دارد. فیلم‌های او بیش از ۶ میلیارد دلار در سراسر جهان فروش داشته‌اند.',
        awards: [
          { title: 'جایزه اسکار بهترین کارگردانی', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'جایزه اسکار بهترین فیلم', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'جایزه گلدن گلوب بهترین کارگردانی', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'نامزد جایزه اسکار بهترین کارگردانی', year: '2018', movie_name: 'دانکرک', is_winner: false },
          { title: 'نامزد جایزه اسکار بهترین فیلمنامه غیراقتباسی', year: '2011', movie_name: 'تلقین (Inception)', is_winner: false },
          { title: 'نامزد جایزه اسکار بهترین فیلمنامه غیراقتباسی', year: '2002', movie_name: 'ممنتو (Memento)', is_winner: false },
        ],
        known_for: [
          { title: 'اوپنهایمر (Oppenheimer)', year: '2023', role: 'کارگردان و نویسنده', poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
          { title: 'میان‌ستاره‌ای (Interstellar)', year: '2014', role: 'کارگردان و نویسنده', poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
          { title: 'تلقین (Inception)', year: '2010', role: 'کارگردان و نویسنده', poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg' },
          { title: 'شوالیه تاریکی (The Dark Knight)', year: '2008', role: 'کارگردان و نویسنده', poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
          { title: 'حیثیت (The Prestige)', year: '2006', role: 'کارگردان و نویسنده', poster: 'https://image.tmdb.org/t/p/w500/bdN3gXu4z06f88iQ557vYl9K8y2.jpg' },
        ]
      }
    ],
    crew: [
      {
        name: 'لودویگ گورانسون',
        english_name: 'Ludwig Göransson',
        job: 'آهنگساز موسیقی متن',
        photo: 'https://image.tmdb.org/t/p/w500/77e1rJdCj9W5hY3j7fGZ8aLzZ4M.jpg',
        birth_date: '۱ سپتامبر ۱۹۸۴',
        birth_place: 'لینشوپینگ، سوئد',
        biography: 'آهنگساز و تهیه‌کننده برنده ۲ جایزه اسکار و چندین جایزه گرمی. او خالق موسیقی متن حماسی اوپنهایمر، پلنگ سیاه، تنت و سریال ماندالورین است.',
        awards: [
          { title: 'جایزه اسکار بهترین موسیقی متن', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'جایزه اسکار بهترین موسیقی متن', year: '2019', movie_name: 'پلنگ سیاه (Black Panther)', is_winner: true },
          { title: 'جایزه گلدن گلوب و گرمی', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
        ],
        known_for: [
          { title: 'Oppenheimer', year: '2023', role: 'آهنگساز' },
          { title: 'Black Panther', year: '2018', role: 'آهنگساز' },
          { title: 'The Mandalorian', year: '2019', role: 'آهنگساز' },
          { title: 'Tenet', year: '2020', role: 'آهنگساز' },
        ]
      },
      {
        name: 'هویته ون هویتما',
        english_name: 'Hoyte van Hoytema',
        job: 'مدیر فیلمبرداری',
        photo: 'https://image.tmdb.org/t/p/w500/mXp7A5PZ3D5f0s9a8F1w9M6k7Y1.jpg',
        birth_date: '۴ اکتبر ۱۹۷۱',
        birth_place: 'سوئیس / هلند',
        biography: 'مدیر فیلمبرداری مطرح هلندی-سوئیسی و همکار دائمی نولان در فیلم‌های میان‌ستاره‌ای، دانکرک، تنت و اوپنهایمر. او برای اوپنهایمر نخستین فیلم سیاه و سفید تاریخ با فرمت IMAX 65mm را ثبت کرد.',
        awards: [
          { title: 'جایزه اسکار بهترین فیلمبرداری', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'نامزد اسکار بهترین فیلمبرداری', year: '2018', movie_name: 'دانکرک', is_winner: false },
        ],
        known_for: [
          { title: 'Interstellar', year: '2014', role: 'مدیر فیلمبرداری' },
          { title: 'Dunkirk', year: '2017', role: 'مدیر فیلمبرداری' },
          { title: 'Her', year: '2013', role: 'مدیر فیلمبرداری' },
        ]
      }
    ],
    cast: [
      {
        name: 'کیلین مورفی',
        english_name: 'Cillian Murphy',
        character: 'جی. رابرت اوپنهایمر',
        photo: 'https://image.tmdb.org/t/p/w500/3E3rR3C4t1190r0W1dE1lX7pX5P.jpg',
        birth_date: '۲۵ مه ۱۹۷۶ (۴۸ سال)',
        birth_place: 'داگلاس، کورک، ایرلند',
        biography: 'کیلین مورفی بازیگر سرشناس ایرلندی است که برای چشمان خیره‌کننده، عمق احساسی بازی‌ها و بازی در نقش‌های روان‌شناختی پیچیده ستایش می‌شود. او با نقش‌آفرینی ماندگار در قامت توماس شلبی در سریال پرطرفدار «پیکی بلایندرز» و بازی به عنوان پدر بمب اتم در «اوپنهایمر» جایگاه خود را به عنوان یکی از بزرگترین بازیگران نسل حاضر تثبیت کرد.',
        awards: [
          { title: 'جایزه اسکار بهترین بازیگر نقش اول مرد', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'جایزه گلدن گلوب بهترین بازیگر مرد درام', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'جایزه بفتا بهترین بازیگر مرد', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'جایزه انجمن بازیگران فیلم (SAG)', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
        ],
        known_for: [
          { title: 'پیکی بلایندرز (Peaky Blinders)', year: '2013-2022', role: 'توماس شلبی', poster: 'https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg' },
          { title: 'اوپنهایمر (Oppenheimer)', year: '2023', role: 'جی. رابرت اوپنهایمر', poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
          { title: 'تلقین (Inception)', year: '2010', role: 'رابرت فیشر', poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg' },
          { title: 'دانکرک (Dunkirk)', year: '2017', role: 'سرباز نجات‌یافته', poster: 'https://image.tmdb.org/t/p/w500/ebSnODDg9lbsMIaWg2uAbjn7TO5.jpg' },
          { title: '۲۸ روز بعد (28 Days Later)', year: '2002', role: 'جیم', poster: 'https://image.tmdb.org/t/p/w500/sQ58yq2K97n8z4r5eG5Z.jpg' },
        ]
      },
      {
        name: 'امیلی بلانت',
        english_name: 'Emily Blunt',
        character: 'کاترین «کیتی» اوپنهایمر',
        photo: 'https://image.tmdb.org/t/p/w500/nPJXaRMVUYSvdy1Y49d1UbhfvPt.jpg',
        birth_date: '۲۳ فوریه ۱۹۸۳ (۴۱ سال)',
        birth_place: 'لندن، انگلستان',
        biography: 'امیلی بلانت بازیگر تحسین‌شده انگلیسی است که توانایی استثنایی در بازی در ژانرهای گوناگون از اکشن‌های پرتنش گرفته تا درام‌های روان‌شناختی و موزیکال دارد. او برنده یک جایزه گلدن گلوب، بفتا و جایزه انجمن بازیگران فیلم است.',
        awards: [
          { title: 'نامزد جایزه اسکار بهترین بازیگر نقش مکمل زن', year: '2024', movie_name: 'اوپنهایمر', is_winner: false },
          { title: 'جایزه گلدن گلوب بهترین بازیگر زن', year: '2007', movie_name: 'دختر گیدیون', is_winner: true },
          { title: 'جایزه انجمن بازیگران فیلم (SAG)', year: '2019', movie_name: 'یک مکان ساکت (A Quiet Place)', is_winner: true },
        ],
        known_for: [
          { title: 'یک مکان ساکت (A Quiet Place)', year: '2018', role: 'اولین ابوت' },
          { title: 'لبه فردا (Edge of Tomorrow)', year: '2014', role: 'ریتا وراتاسکی' },
          { title: 'سیکاریو (Sicario)', year: '2015', role: 'کیت میسر' },
          { title: 'اوپنهایمر (Oppenheimer)', year: '2023', role: 'کیتی اوپنهایمر' },
        ]
      },
      {
        name: 'رابرت داونی جونیور',
        english_name: 'Robert Downey Jr.',
        character: 'لوئیس استراوز',
        photo: 'https://image.tmdb.org/t/p/w500/5qHNjhtjMD4YWH3ju6g0aWn1N9y.jpg',
        birth_date: '۴ آوریل ۱۹۶۵ (۵۹ سال)',
        birth_place: 'نیویورک، ایالات متحده',
        biography: 'رابرت داونی جونیور یکی از پول‌سازترین و محبوب‌ترین ستارگان تاریخ هالیوود است. او پس از سال‌ها درخشش در نقش مرد آهنی (تونی استارک) در دنیای سینمایی مارول، با ایفای نقش پرتردید و کینه‌توز لوئیس استراوز در فیلم اوپنهایمر برنده نخستین جایزه اسکار کارنامه پربار خود شد.',
        awards: [
          { title: 'جایزه اسکار بهترین بازیگر نقش مکمل مرد', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'جایزه گلدن گلوب بهترین بازیگر نقش مکمل', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'جایزه بفتا بهترین بازیگر مکمل مرد', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
          { title: 'نامزد جایزه اسکار بهترین بازیگر نقش اول مرد', year: '1993', movie_name: 'چاپلین (Chaplin)', is_winner: false },
        ],
        known_for: [
          { title: 'مرد آهنی (Iron Man)', year: '2008', role: 'تونی استارک / مرد آهنی' },
          { title: 'انتقام‌جویان: پایان بازی (Avengers: Endgame)', year: '2019', role: 'تونی استارک' },
          { title: 'شرلوک هولمز (Sherlock Holmes)', year: '2009', role: 'شرلوک هولمز' },
          { title: 'چاپلین (Chaplin)', year: '1992', role: 'چارلی چاپلین' },
        ]
      },
      {
        name: 'مت دیمون',
        english_name: 'Matt Damon',
        character: 'ژنرال لزلی گرووز',
        photo: 'https://image.tmdb.org/t/p/w500/elSlNg0WFnfcmBq6Wb7P7fO8uH1.jpg',
        birth_date: '۸ اکتبر ۱۹۷۰ (۵۴ سال)',
        birth_place: 'کمبریج، ماساچوست، آمریکا',
        biography: 'مت دیمون یکی از بزرگترین بازیگران، فیلم‌نامه‌نویسان و تهیه‌کنندگان هالیوود است. او به همراه بن افلک برای فیلم‌نامه «ویل هانتینگ نابغه» برنده جایزه اسکار شد و سپس با مجموعه فیلم‌های بورن و مریخی به اوج شهرت رسید.',
        awards: [
          { title: 'جایزه اسکار بهترین فیلم‌نامه غیراقتباسی', year: '1998', movie_name: 'ویل هانتینگ نابغه', is_winner: true },
          { title: 'جایزه گلدن گلوب بهترین بازیگر مرد', year: '2016', movie_name: 'مریخی (The Martian)', is_winner: true },
          { title: 'نامزد جایزه اسکار بهترین بازیگر مرد', year: '2016', movie_name: 'مریخی', is_winner: false },
        ],
        known_for: [
          { title: 'هویت بورن (The Bourne Identity)', year: '2002', role: 'جیسون بورن' },
          { title: 'مریخی (The Martian)', year: '2015', role: 'مارک واتنی' },
          { title: 'ویل هانتینگ نابغه (Good Will Hunting)', year: '1997', role: 'ویل هانتینگ' },
          { title: 'فورد در برابر فراری (Ford v Ferrari)', year: '2019', role: 'کرول شلبی' },
        ]
      },
      {
        name: 'فلورنس پیو',
        english_name: 'Florence Pugh',
        character: 'جین تاتلاک',
        photo: 'https://image.tmdb.org/t/p/w500/75l9vJ6y26oUjH47oU1r5E5O1Q.jpg',
        birth_date: '۳ ژانویه ۱۹۹۶ (۲۸ سال)',
        birth_place: 'آکسفورد، انگلستان',
        biography: 'فلورنس پیو از درخشان‌ترین و بااستعدادترین بازیگران جوان زن سینمای جهان است که با بازی‌های شجاعانه و چندلایه در میدسامار، زنان کوچک و تل‌ماسه ۲ تحسین جهانی را برانگیخته است.',
        awards: [
          { title: 'نامزد جایزه اسکار بهترین بازیگر نقش مکمل زن', year: '2020', movie_name: 'زنان کوچک (Little Women)', is_winner: false },
          { title: 'نامزد جایزه بفتا بازیگر ستاره نوظهور', year: '2020', is_winner: false },
        ],
        known_for: [
          { title: 'میدسامار (Midsommar)', year: '2019', role: 'دنی' },
          { title: 'زنان کوچک (Little Women)', year: '2019', role: 'امی مارچ' },
          { title: 'تل‌ماسه: بخش دو (Dune 2)', year: '2024', role: 'پرنسس ایرولان' },
        ]
      }
    ]
  },

  // 2. تل‌ماسه: بخش دو (Dune: Part Two)
  'tt15239678': {
    imdb_id: 'tt15239678',
    awards_summary: 'نامزد و برنده بیش از ۵۰ جایزه بین‌المللی در رشته‌های جلوه‌های ویژه، صداگذاری، طراحی صحنه و کارگردانی',
    awards: [
      {
        id: 'dune2-1',
        title: 'جوایز انجمن منتقدان سینما (Critics Choice)',
        category: 'بهترین فیلم علمی‌تخیلی و بهترین جلوه‌های ویژه',
        year: '2024',
        is_winner: true,
        organization: 'Critics Choice Association',
        icon: 'trophy'
      },
      {
        id: 'dune2-2',
        title: 'جوایز جشنواره فیلم بین‌المللی',
        category: 'بهترین طراحی صدا، فیلمبرداری حماسی و موسیقی متن',
        year: '2024',
        is_winner: true,
        organization: 'World Soundtrack Awards',
        icon: 'bafta'
      }
    ],
    directors: [
      {
        name: 'دنی ویلنوو',
        english_name: 'Denis Villeneuve',
        character: 'کارگردان و نویسنده',
        job: 'کارگردان و فیلمنامه‌نویس',
        photo: 'https://image.tmdb.org/t/p/w500/tlA9sR0Fq7sU2hF6j1w2A4c8k1M.jpg',
        birth_date: '۳ اکتبر ۱۹۶۷ (۵۷ سال)',
        birth_place: 'ژانتی، کبک، کانادا',
        biography: 'دنی ویلنوو فیلمساز برجسته کانادایی است که به عنوان استاد سینمای علمی‌تخیلی مدرن و درام‌های فلسفی پرابهت شناخته می‌شود. او با آثاری چون ورود، بلید رانر ۲۰۴۹، زندانیان و سری تل‌ماسه زبان بصری تازه‌ای در هالیوود بنا نهاد.',
        awards: [
          { title: 'نامزد جایزه اسکار بهترین کارگردانی', year: '2017', movie_name: 'ورود (Arrival)', is_winner: false },
          { title: 'نامزد جایزه اسکار بهترین فیلم اقتباسی', year: '2022', movie_name: 'تل‌ماسه', is_winner: false },
        ],
        known_for: [
          { title: 'تل‌ماسه: بخش دو (Dune: Part Two)', year: '2024', role: 'کارگردان و نویسنده' },
          { title: 'بلید رانر ۲۰۴۹ (Blade Runner 2049)', year: '2017', role: 'کارگردان' },
          { title: 'ورود (Arrival)', year: '2016', role: 'کارگردان' },
          { title: 'زندانیان (Prisoners)', year: '2013', role: 'کارگردان' },
          { title: 'سیکاریو (Sicario)', year: '2015', role: 'کارگردان' },
        ]
      }
    ],
    crew: [
      {
        name: 'هانس زیمر',
        english_name: 'Hans Zimmer',
        job: 'آهنگساز موسیقی متن',
        photo: 'https://image.tmdb.org/t/p/w500/1x5M5fF0aA3r2rB2v7G8F9c3Y0P.jpg',
        birth_date: '۱۲ سپتامبر ۱۹۵۷ (۶۷ سال)',
        birth_place: 'فرانکفورت، آلمان',
        biography: 'هانس زیمر یکی از بزرگترین و تاثیرگذارترین آهنگسازان تاریخ سینماست که انقلابی در موسیقی فیلم و ترکیب ارکستر کلاسیک با سینث‌سایزرهای الکترونیک به وجود آورد. او برنده ۲ جایزه اسکار و ۴ جایزه گرمی است.',
        awards: [
          { title: 'جایزه اسکار بهترین موسیقی متن', year: '2022', movie_name: 'تل‌ماسه (Dune)', is_winner: true },
          { title: 'جایزه اسکار بهترین موسیقی متن', year: '1995', movie_name: 'شیر شاه (The Lion King)', is_winner: true },
          { title: 'جایزه گلدن گلوب بهترین موسیقی متن', year: '2001', movie_name: 'گلادیاتور (Gladiator)', is_winner: true },
        ],
        known_for: [
          { title: 'میان‌ستاره‌ای (Interstellar)', year: '2014', role: 'آهنگساز' },
          { title: 'شیر شاه (The Lion King)', year: '1994', role: 'آهنگساز' },
          { title: 'گلادیاتور (Gladiator)', year: '2000', role: 'آهنگساز' },
          { title: 'تلقین (Inception)', year: '2010', role: 'آهنگساز' },
          { title: 'شوالیه تاریکی (The Dark Knight)', year: '2008', role: 'آهنگساز' },
        ]
      }
    ],
    cast: [
      {
        name: 'تیموتی شالامی',
        english_name: 'Timothée Chalamet',
        character: 'پاول آتریدیس (لرد کواستز هادرک)',
        photo: 'https://image.tmdb.org/t/p/w500/BE2sdjpgsa2rNTFa66f7upkaOP.jpg',
        birth_date: '۲۷ دسامبر ۱۹۹۵ (۲۹ سال)',
        birth_place: 'نیویورک، ایالات متحده',
        biography: 'تیموتی شالامی یکی از برجسته‌ترین و کاریزماتیک‌ترین ستاره‌های جوان هالیوود است. او جوان‌ترین نامزد جایزه اسکار بهترین بازیگر مرد در هشتاد سال اخیر برای فیلم «مرا با نامت صدا کن» شد.',
        awards: [
          { title: 'نامزد جایزه اسکار بهترین بازیگر نقش اول مرد', year: '2018', movie_name: 'Call Me by Your Name', is_winner: false },
          { title: 'نامزد ۳ جایزه گلدن گلوب', year: '2018-2024', movie_name: 'Wonka, Beautiful Boy', is_winner: false },
        ],
        known_for: [
          { title: 'تل‌ماسه (Dune: Part 1 & 2)', year: '2021-2024', role: 'پاول آتریدیس' },
          { title: 'وانکا (Wonka)', year: '2023', role: 'ویلی وانکا' },
          { title: 'زنان کوچک (Little Women)', year: '2019', role: 'لوری' },
          { title: 'میان‌ستاره‌ای (Interstellar)', year: '2014', role: 'تام جوان' },
        ]
      },
      {
        name: 'زندایا',
        english_name: 'Zendaya',
        character: 'چانی (Chani)',
        photo: 'https://image.tmdb.org/t/p/w500/r3A7evGVVqKq6pX3n9V5d9K8O7P.jpg',
        birth_date: '۱ سپتامبر ۱۹۹۶ (۲۸ سال)',
        birth_place: 'اوکلند، کالیفرنیا',
        biography: 'زندایا بازیگر و نماد فشن برنده ۲ جایزه معتبر امی و یک گلدن گلوب است که با بازی خیره‌کننده در سریال سرخوشی (Euphoria) و فیلم‌های مرد عنکبوتی و تل‌ماسه به شهرت جهانی رسید.',
        awards: [
          { title: '۲ جایزه امی بهترین بازیگر نقش اول زن درام', year: '2020, 2022', movie_name: 'سریال Euphoria', is_winner: true },
          { title: 'جایزه گلدن گلوب بهترین بازیگر زن', year: '2023', movie_name: 'Euphoria', is_winner: true },
        ],
        known_for: [
          { title: 'سرخوشی (Euphoria)', year: '2019-2024', role: 'رو بنت' },
          { title: 'تل‌ماسه ۲ (Dune 2)', year: '2024', role: 'چانی' },
          { title: 'مرد عنکبوتی: راهی به خانه نیست', year: '2021', role: 'ام‌جی (MJ)' },
          { title: 'چالشگران (Challengers)', year: '2024', role: 'تاشی دانکن' },
        ]
      },
      {
        name: 'خاویر باردم',
        english_name: 'Javier Bardem',
        character: 'استیلگار (Stilgar)',
        photo: 'https://image.tmdb.org/t/p/w500/z0G7YpQ4vQ4tP9h5L8m2q3K8w4P.jpg',
        birth_date: '۱ مارس ۱۹۶۹ (۵۵ سال)',
        birth_place: 'لاس پالماس، اسپانیا',
        biography: 'خاویر باردم بازیگر نامدار اسپانیایی و برنده جایزه اسکار، گلدن گلوب و بفتا برای ایفای نقش فراموش‌نشدنی آنتون چیگور در شاهکار برادران کوئن «جایی برای پیرمردها نیست» است.',
        awards: [
          { title: 'جایزه اسکار بهترین بازیگر نقش مکمل مرد', year: '2008', movie_name: 'جایی برای پیرمردها نیست', is_winner: true },
          { title: 'جایزه بهترین بازیگر مرد جشنواره فیلم کن', year: '2010', movie_name: 'زیبا (Biutiful)', is_winner: true },
        ],
        known_for: [
          { title: 'جایی برای پیرمردها نیست (No Country for Old Men)', year: '2007', role: 'آنتون چیگور' },
          { title: 'اسکای‌فال (Skyfall)', year: '2012', role: 'رائول سیلوا' },
          { title: 'تل‌ماسه (Dune)', year: '2021-2024', role: 'استیلگار' },
        ]
      },
      {
        name: 'آستین باتلر',
        english_name: 'Austin Butler',
        character: 'فید-روثا هارکونن',
        photo: 'https://image.tmdb.org/t/p/w500/2L2G7bM8K9g5P8f7O4r2w8m6L0P.jpg',
        birth_date: '۱۷ اوت ۱۹۹۱ (۳۳ سال)',
        birth_place: 'آناهایم، کالیفرنیا',
        biography: 'آستین باتلر بازیگر جوان و بااستعداد هالیوود که با ایفای نقش الویس پریسلی در فیلم «الویس» برنده جایزه گلدن گلوب و بفتا شد و در تل‌ماسه ۲ در نقش فید-روثا بازی هولناک و ماندگاری ارائه داد.',
        awards: [
          { title: 'جایزه گلدن گلوب بهترین بازیگر مرد', year: '2023', movie_name: 'الویس (Elvis)', is_winner: true },
          { title: 'جایزه بفتا بهترین بازیگر مرد', year: '2023', movie_name: 'الویس', is_winner: true },
          { title: 'نامزد جایزه اسکار بهترین بازیگر مرد', year: '2023', movie_name: 'الویس', is_winner: false },
        ],
        known_for: [
          { title: 'الویس (Elvis)', year: '2022', role: 'الویس پریسلی' },
          { title: 'تل‌ماسه: بخش دو (Dune 2)', year: '2024', role: 'فید-روثا هارکونن' },
          { title: 'روزی روزگاری در هالیوود', year: '2019', role: 'تکس واتسون' },
        ]
      }
    ]
  },

  // 3. شوگان (Shōgun)
  'tt2798648': {
    imdb_id: 'tt2798648',
    awards_summary: 'رکورددار تاریخ تلویزیون با بردن ۱۸ جایزه امی (Emmy Awards) در یک فصل شامل بهترین سریال درام، بهترین بازیگر مرد و زن',
    awards: [
      {
        id: 'shogun-emmy-1',
        title: 'جایزه امی پرایم‌تایم (Primetime Emmy)',
        category: 'بهترین سریال درام سال (Outstanding Drama Series)',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی تلویزیون آمریکا',
        icon: 'emmy'
      },
      {
        id: 'shogun-emmy-2',
        title: 'جایزه امی (Emmy Awards)',
        category: 'بهترین بازیگر نقش اول مرد درام (هیرویوکی سانادا)',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی تلویزیون آمریکا',
        icon: 'emmy'
      },
      {
        id: 'shogun-emmy-3',
        title: 'جایزه امی (Emmy Awards)',
        category: 'بهترین بازیگر نقش اول زن درام (آنا ساوای)',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی تلویزیون آمریکا',
        icon: 'emmy'
      },
      {
        id: 'shogun-emmy-4',
        title: 'جایزه امی (Emmy Awards)',
        category: 'بهترین کارگردانی سریال درام و ۱۶ جایزه فنی',
        year: '2024',
        is_winner: true,
        organization: 'آکادمی تلویزیون آمریکا',
        icon: 'emmy'
      }
    ],
    directors: [
      {
        name: 'جاستین مارکس و ریچل کوندو',
        english_name: 'Justin Marks & Rachel Kondo',
        character: 'خالقان و نویسندگان',
        job: 'خالق، نویسنده و شورانر',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hiroyuki_Sanada_20240220.jpg',
        birth_date: '۱۹۸۰',
        birth_place: 'ایالات متحده',
        biography: 'تیم خالقان و فیلمنامه‌نویسان نابغه شوگان که با بازآفرینی وفادارانه و شگفت‌انگیز تاریخ فئودال ژاپن، اثری کلاسیک و جاودانه در سطح تاریخ تلویزیون خلق کردند.',
        awards: [
          { title: 'جایزه امی بهترین سریال درام', year: '2024', movie_name: 'Shōgun', is_winner: true },
        ],
        known_for: [
          { title: 'Shōgun', year: '2024', role: 'خالق و شورانر' },
          { title: 'Top Gun: Maverick', year: '2022', role: 'نویسنده داستان' },
        ]
      }
    ],
    crew: [
      {
        name: 'تارو ایمابوری',
        english_name: 'Taro Iwashiro',
        job: 'طراح صحنه و لباس تاریخی',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg/440px-Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg',
        biography: 'طراح لباس‌های اصیل سامورایی و زره‌های سنتی ژاپن در دوران ادو که برنده جایزه امی بهترین طراحی لباس تاریخی شد.',
        awards: [
          { title: 'جایزه امی بهترین طراحی لباس تاریخی', year: '2024', movie_name: 'Shogun', is_winner: true }
        ],
        known_for: [
          { title: 'Shōgun', year: '2024', role: 'طراح لباس' }
        ]
      }
    ],
    cast: [
      {
        name: 'هیرویوکی سانادا',
        english_name: 'Hiroyuki Sanada',
        character: 'لرد یوشی توراناگا',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hiroyuki_Sanada_20240220.jpg',
        birth_date: '۱۲ اکتبر ۱۹۶۰ (۶۴ سال)',
        birth_place: 'توکیو، ژاپن',
        biography: 'هیرویوکی سانادا اسطوره سینمای رزمی و درام ژاپن و هالیوود است. او اولین بازیگر مرد تاریخ ژاپن است که برنده جایزه امی بهترین بازیگر نقش اول مرد شد.',
        awards: [
          { title: 'جایزه امی پرایم‌تایم بهترین بازیگر نقش اول مرد', year: '2024', movie_name: 'شوگان', is_winner: true },
          { title: 'جایزه آکادمی فیلم ژاپن', year: '2003', movie_name: 'The Twilight Samurai', is_winner: true },
        ],
        known_for: [
          { title: 'شوگان (Shōgun)', year: '2024', role: 'لرد توراناگا' },
          { title: 'آخرین سامورایی (The Last Samurai)', year: '2003', role: 'اوجیو' },
          { title: 'جان ویک ۴ (John Wick: Chapter 4)', year: '2023', role: 'شیمازو کوجی' },
          { title: 'قطار سریع‌السیر (Bullet Train)', year: '2022', role: 'بزرگ‌تر' },
        ]
      },
      {
        name: 'آنا ساوای',
        english_name: 'Anna Sawai',
        character: 'تودا ماریکو (Lady Mariko)',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Anna_Sawai_from_Sidewalks_Entertainment_2024_%28cropped%29.jpg',
        birth_date: '۱۱ ژوئن ۱۹۹۲ (۳۲ سال)',
        birth_place: 'ولینگتون، نیوزیلند',
        biography: 'آنا ساوای با بازی شاهکار در نقش لیدی ماریکو در سریال شوگان به اولین زن آسیایی تاریخ بدل شد که برنده جایزه امی بهترین بازیگر نقش اول زن درام می‌شود.',
        awards: [
          { title: 'جایزه امی بهترین بازیگر زن درام', year: '2024', movie_name: 'شوگان', is_winner: true }
        ],
        known_for: [
          { title: 'شوگان (Shōgun)', year: '2024', role: 'لیدی ماریکو' },
          { title: 'سلطنت هیولاها (Monarch: Legacy of Monsters)', year: '2023', role: 'کیت راندا' },
          { title: 'سریع و خشن ۹ (F9)', year: '2021', role: 'ال' },
        ]
      },
      {
        name: 'کوزمو جارویس',
        english_name: 'Cosmo Jarvis',
        character: 'جان بلک‌تورن (آنجین)',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cosmo_Jarvis_at_the_Shogun_Tokyo_Premiere_February_2024_%28cropped%29.jpg',
        birth_date: '۱ سپتامبر ۱۹۸۹ (۳۵ سال)',
        birth_place: 'نیوجرسی / انگلستان',
        biography: 'بازیگر و نوازنده بریتانیایی که با بازی کاریزماتیک و شجاعانه در قامت کاپیتان جان بلک‌تورن (آنجین) به شهرت گسترده بین‌المللی دست یافت.',
        awards: [
          { title: 'نامزد جایزه امی بهترین بازیگر', year: '2024', movie_name: 'Shogun', is_winner: false }
        ],
        known_for: [
          { title: 'شوگان (Shōgun)', year: '2024', role: 'جان بلک‌تورن' },
          { title: 'پیکی بلایندرز (Peaky Blinders)', year: '2019', role: 'بارنی تومپکینز' },
          { title: 'ترغیب (Persuasion)', year: '2022', role: 'کاپیتان فردریک ونت‌ورث' },
        ]
      }
    ]
  },

  // 4. پوست شیر (The Lion Skin)
  'tt22440938': {
    imdb_id: 'tt22440938',
    awards_summary: 'برنده تندیس حافظ بهترین سریال درام، بهترین بازیگر مرد درام (هادی حجازی‌فر و شهاب حسینی)، بهترین فیلمنامه و کارگردانی جشن حافظ',
    awards: [
      {
        id: 'lion-hafez-1',
        title: 'جشن حافظ (Hafez Awards)',
        category: 'بهترین سریال درام شبکه نمایش خانگی',
        year: '1402',
        is_winner: true,
        organization: 'دنیای تصویر',
        icon: 'trophy'
      },
      {
        id: 'lion-hafez-2',
        title: 'جشن حافظ (Hafez Awards)',
        category: 'بهترین بازیگر مرد درام تلویزیونی (هادی حجازی‌فر)',
        year: '1402',
        is_winner: true,
        organization: 'دنیای تصویر',
        icon: 'trophy'
      },
      {
        id: 'lion-hafez-3',
        title: 'جشن حافظ (Hafez Awards)',
        category: 'بهترین فیلمنامه درام و بهترین کارگردانی (جمشید و نوید محمودی)',
        year: '1402',
        is_winner: true,
        organization: 'دنیای تصویر',
        icon: 'trophy'
      },
      {
        id: 'lion-hafez-4',
        title: 'جشن حافظ (Hafez Awards)',
        category: 'بهترین بازیگر نقش مکمل مرد (علیرضا کمالی)',
        year: '1402',
        is_winner: true,
        organization: 'دنیای تصویر',
        icon: 'trophy'
      }
    ],
    directors: [
      {
        name: 'جمشید محمودی',
        english_name: 'Jamshid Mahmoudi',
        character: 'کارگردان و نویسنده',
        job: 'کارگردان و فیلمنامه‌نویس',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱۳۶۱ (۴۲ سال)',
        birth_place: 'پروان، افغانستان',
        biography: 'جمشید محمودی کارگردان و نویسنده توانمند سینمای ایران است. او با ساخت آثاری چون «چند متر مکعب عشق» و «شکستن همزمان بیست استخوان» برنده جوایز متعدد از جشنواره فجر و جشنواره‌های معتبر خارجی شد و با سریال پرمخاطب پوست شیر رکوردهای تماشای شبکه خانگی را جابجا کرد.',
        awards: [
          { title: 'سیمرغ بلورین بهترین فیلم و بهترین کارگردانی نگاه نو جشنواره فجر', year: '۱۳۹۲', movie_name: 'چند متر مکعب عشق', is_winner: true },
          { title: 'تندیس بهترین کارگردانی سریال درام جشن حافظ', year: '۱۴۰۲', movie_name: 'پوست شیر', is_winner: true },
        ],
        known_for: [
          { title: 'پوست شیر', year: '۱۴۰۱-۱۴۰۲', role: 'کارگردان و نویسنده' },
          { title: 'چند متر مکعب عشق', year: '۱۳۹۲', role: 'کارگردان و نویسنده' },
          { title: 'شکستن همزمان بیست استخوان', year: '۱۳۹۷', role: 'کارگردان' },
          { title: 'مردن در آب مطهر', year: '۱۳۹۸', role: 'نویسنده و تهیه‌کننده' },
        ]
      }
    ],
    crew: [
      {
        name: 'بامداد افشار',
        english_name: 'Bamdad Afshar',
        job: 'آهنگساز موسیقی متن',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱۳۶۵ (۳۸ سال)',
        birth_place: 'تهران، ایران',
        biography: 'آهنگساز نوآور و برنده ۲ سیمرغ بلورین جشنواره فجر. او موسیقی رازآلود و دلهره‌آور سریال پوست شیر، قورباغه، مغزهای کوچک زنگ‌زده و پوست را تصنیف کرد.',
        awards: [
          { title: 'سیمرغ بلورین بهترین موسیقی متن جشنواره فجر', year: '۱۳۹۸', movie_name: 'پوست', is_winner: true },
          { title: 'سیمرغ بلورین بهترین موسیقی متن جشنواره فجر', year: '۱۴۰۰', movie_name: 'علفزار', is_winner: true },
        ],
        known_for: [
          { title: 'پوست شیر', year: '۱۴۰۱', role: 'آهنگساز' },
          { title: 'قورباغه', year: '۱۳۹۹', role: 'آهنگساز' },
          { title: 'مغزهای کوچک زنگ‌زده', year: '۱۳۹۶', role: 'آهنگساز' },
        ]
      }
    ],
    cast: [
      {
        name: 'شهاب حسینی',
        english_name: 'Shahab Hosseini',
        character: 'سرگرد محب مشکات',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱۴ بهمن ۱۳۵۲ (۵۱ سال)',
        birth_place: 'تهران، ایران',
        biography: 'سید شهاب‌الدین حسینی یکی از پرافتخارترین و محبوب‌ترین بازیگران تاریخ سینمای ایران است. او برای بازی در فیلم «فروشنده» اصغر فرهادی برنده جایزه نخل طلای بهترین بازیگر مرد جشنواره فیلم کن شد. او همچنین دارای خرس نقره‌ای جشنواره برلین و ۲ سیمرغ بلورین جشنواره فجر است.',
        awards: [
          { title: 'نخل طلای بهترین بازیگر مرد جشنواره فیلم کن (Prix d\'interprétation masculine)', year: '2016', movie_name: 'فروشنده (The Salesman)', is_winner: true },
          { title: 'خرس نقره‌ای بهترین گروه بازیگران مرد جشنواره برلین', year: '2011', movie_name: 'جدایی نادر از سیمین', is_winner: true },
          { title: 'سیمرغ بلورین بهترین بازیگر نقش اول مرد جشنواره فجر', year: '۱۳۸۷', movie_name: 'سوپراستار', is_winner: true },
          { title: 'سیمرغ بلورین بهترین بازیگر نقش مکمل مرد جشنواره فجر', year: '۱۳۸۶', movie_name: 'محیا', is_winner: true },
          { title: 'تندیس حافظ بهترین بازیگر مرد درام', year: '۱۳۹۵', movie_name: 'سریال شهرزاد', is_winner: true },
        ],
        known_for: [
          { title: 'فروشنده (The Salesman)', year: '۱۳۹۵', role: 'عماد' },
          { title: 'جدایی نادر از سیمین (A Separation)', year: '۱۳۸۹', role: 'حجت' },
          { title: 'درباره الی (About Elly)', year: '۱۳۸۷', role: 'احمد' },
          { title: 'شهرزاد (Shahrzad)', year: '۱۳۹۴-۱۳۹۷', role: 'قباد دیوان‌سالار' },
          { title: 'پوست شیر (The Lion Skin)', year: '۱۴۰۱-۱۴۰۲', role: 'سرگرد محب مشکات' },
          { title: 'شب دهم', year: '۱۳۸۰', role: 'حیدر خوش‌مرام' },
        ]
      },
      {
        name: 'هادی حجازی‌فر',
        english_name: 'Hadi Hejazifar',
        character: 'نعیم مولایی',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        birth_date: '۳۱ خرداد ۱۳۵۵ (۴۸ سال)',
        birth_place: 'خوی، آذربایجان غربی',
        biography: 'هادی حجازی‌فر بازیگر، کارگردان و فیلمنامه‌نویس برجسته سینمای ایران است که با ایستاده در غبار و ماجرای نیمروز درخشید و با کارگردانی فیلم موقعیت مهدی سیمرغ بلورین بهترین فیلم جشنواره فجر را از آن خود کرد.',
        awards: [
          { title: 'تندیس حافظ بهترین بازیگر مرد درام', year: '۱۴۰۲', movie_name: 'پوست شیر', is_winner: true },
          { title: 'سیمرغ بلورین بهترین کارگردانی فیلم اول جشنواره فجر', year: '۱۴۰۰', movie_name: 'موقعیت مهدی', is_winner: true },
          { title: 'سیمرغ بلورین بهترین فیلم جشنواره فیلم فجر', year: '۱۴۰۰', movie_name: 'موقعیت مهدی', is_winner: true },
          { title: 'نامزد سیمرغ بلورین بهترین بازیگر مکمل مرد', year: '۱۳۹۵', movie_name: 'ماجرای نیمروز', is_winner: false },
        ],
        known_for: [
          { title: 'پوست شیر', year: '۱۴۰۱', role: 'نعیم مولایی' },
          { title: 'موقعیت مهدی', year: '۱۴۰۰', role: 'مهدی باکری (کارگردان و بازیگر)' },
          { title: 'ایستاده در غبار', year: '۱۳۹۴', role: 'احمد متوسلیان' },
          { title: 'ماجرای نیمروز', year: '۱۳۹۵', role: 'کمال' },
          { title: 'آتابای', year: '۱۳۹۸', role: 'کاظم (نویسنده و بازیگر)' },
        ]
      },
      {
        name: 'علیرضا کمالی',
        english_name: 'Alireza Kamali',
        character: 'رضا پروانه',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        birth_date: '۲۷ اردیبهشت ۱۳۵۹ (۴۴ سال)',
        birth_place: 'تهران، ایران',
        biography: 'علیرضا کمالی بازیگر سینما و تلویزیون است که برای بازی صمیمی، قدرتمند و رفاقتی بی‌نظیر در نقش «رضا پروانه» در سریال پوست شیر محبوبیت عظیمی در میان مردم پیدا کرد و برنده تندیس حافظ شد.',
        awards: [
          { title: 'تندیس بهترین بازیگر مرد درام تلویزیونی جشن حافظ', year: '۱۴۰۲', movie_name: 'پوست شیر', is_winner: true }
        ],
        known_for: [
          { title: 'پوست شیر', year: '۱۴۰۱', role: 'رضا پروانه' },
          { title: 'وارش', year: '۱۳۹۸', role: 'یارمحمد' },
          { title: 'انقلاب زیبا', year: '۱۳۹۳', role: 'حامد' },
          { title: 'سد معبر', year: '۱۳۹۵', role: 'مهدی' },
        ]
      },
      {
        name: 'پانته‌آ بهرام',
        english_name: 'Pantea Bahram',
        character: 'لیلا برزگر',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱۳ اسفند ۱۳۴۸ (۵۵ سال)',
        birth_place: 'تهران، ایران',
        biography: 'پانته‌آ بهرام از بازیگران برجسته و باسابقه تئاتر و سینمای ایران است که برنده سیمرغ بلورین جشنواره فجر و تندیس خانه سینما شده و نقش‌های دراماتیک پرچالشی در سینما خلق کرده است.',
        awards: [
          { title: 'سیمرغ بلورین بهترین بازیگر نقش مکمل زن جشنواره فجر', year: '۱۳۸۴', movie_name: 'چهارشنبه‌سوری', is_winner: true },
          { title: 'تندیس بهترین بازیگر زن جشن خانه سینما', year: '۱۳۸۴', movie_name: 'چهارشنبه‌سوری', is_winner: true },
        ],
        known_for: [
          { title: 'چهارشنبه‌سوری', year: '۱۳۸۴', role: 'سیمین' },
          { title: 'پوست شیر', year: '۱۴۰۱', role: 'لیلا برزگر' },
          { title: 'ملکه', year: '۱۳۹۰', role: 'زن کرد' },
          { title: 'شنای پروانه', year: '۱۳۹۸', role: 'شاپور' },
        ]
      },
      {
        name: 'پردیس احمدیه',
        english_name: 'Pardis Ahmadieh',
        character: 'ساحل مولایی',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        birth_date: '۸ تیر ۱۳۷۱ (۳۲ سال)',
        birth_place: 'مراغه، ایران',
        biography: 'پردیس احمدیه بازیگر بااستعداد سینمای ایران که با بازی درخشان در فیلم «لاک قرمز» نامزد دریافت جایزه شد و در پوست شیر محوریت داستان غم‌انگیز ساحل را به تصویر کشید.',
        awards: [
          { title: 'نامزد تندیس حافظ بهترین بازیگر زن', year: '۱۳۹۶', movie_name: 'لاک قرمز', is_winner: false }
        ],
        known_for: [
          { title: 'پوست شیر', year: '۱۴۰۱', role: 'ساحل مولایی' },
          { title: 'لاک قرمز', year: '۱۳۹۴', role: 'اکرم' },
          { title: 'مجبوریم', year: '۱۳۹۸', role: 'گل‌بهار' },
          { title: 'سرکوب', year: '۱۳۹۷', role: 'پروانه' },
        ]
      }
    ]
  },

  // 5. فسیل (Fossil)
  'tt27050012': {
    imdb_id: 'tt27050012',
    awards_summary: 'پرفروش‌ترین فیلم تاریخ سینمای ایران (۳۲۴ میلیارد تومان) و برنده تندیس بهترین بازیگر کمدی جشن حافظ',
    awards: [
      {
        id: 'fossil-hafez-1',
        title: 'جشن حافظ (Hafez Awards)',
        category: 'تندیس بهترین بازیگر مرد کمدی (بهرام افشاری)',
        year: '1402',
        is_winner: true,
        organization: 'دنیای تصویر',
        icon: 'trophy'
      },
      {
        id: 'fossil-record',
        title: 'رکورد گیشه تاریخ سینما',
        category: 'پرمخاطب‌ترین فیلم سینمایی دهه ۱۴۰۰ ایران',
        year: '1402',
        is_winner: true,
        organization: 'گیشه رسمی سینمای ایران',
        icon: 'trophy'
      }
    ],
    directors: [
      {
        name: 'کریم امینی',
        english_name: 'Karim Amini',
        character: 'کارگردان',
        job: 'کارگردان سینما',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'کریم امینی کارگردان و بازیگر پرکار سینمای کمدی ایران که با دو فیلم فسیل و شهر هرت رکوردهای میلیاردی فروش را در گیشه ثبت کرد.',
        awards: [
          { title: 'دیپلم افتخار پرفروش‌ترین کارگردان سال', year: '۱۴۰۲', movie_name: 'فسیل', is_winner: true }
        ],
        known_for: [
          { title: 'فسیل', year: '۱۴۰۲', role: 'کارگردان' },
          { title: 'شهر هرت', year: '۱۴۰۲', role: 'کارگردان' },
          { title: 'گربه سیاه', year: '۱۳۹۸', role: 'کارگردان' },
        ]
      }
    ],
    crew: [
      {
        name: 'سید ابراهیم عامریان',
        english_name: 'Ebrahim Amerian',
        job: 'تهیه‌کننده',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'موفق‌ترین تهیه‌کننده بخش خصوصی سینمای ایران و تهیه‌کننده فیلم‌های فسیل، تگزاس ۱، ۲ و ۳، دینامیت و انفرادی.',
        known_for: [
          { title: 'فسیل', year: '۱۴۰۲', role: 'تهیه‌کننده' },
          { title: 'تگزاس ۱ و ۲ و ۳', year: '۱۳۹۷-۱۴۰۳', role: 'تهیه‌کننده' },
          { title: 'دینامیت', year: '۱۴۰۰', role: 'تهیه‌کننده' },
        ]
      }
    ],
    cast: [
      {
        name: 'بهرام افشاری',
        english_name: 'Bahram Afshari',
        character: 'اسماعیل (اسی)',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        birth_date: '۶ خرداد ۱۳۶۶ (۳۸ سال)',
        birth_place: 'همدان، ایران',
        biography: 'بهرام افشاری با قد ۱۹۸ سانتی‌متری یکی از قدبلندترین و مستعدترین بازیگران سینما و تئاتر ایران است که با نقش بهتاش فریبا در سریال پایتخت به شهرت افسانه‌ای رسید و با فیلم‌های فسیل، هفتادسی و رحمان ۱۴۰۰ پول‌سازترین بازیگر ایران نام گرفت.',
        awards: [
          { title: 'تندیس حافظ بهترین بازیگر مرد کمدی', year: '۱۴۰۲', movie_name: 'فسیل', is_winner: true },
          { title: 'تندیس حافظ بهترین بازیگر مرد کمدی تلویزیونی', year: '۱۳۹۷', movie_name: 'پایتخت ۵', is_winner: true },
          { title: 'نامزد سیمرغ بلورین جشنواره فجر', year: '۱۳۹۶', movie_name: 'لانتوری', is_winner: false },
        ],
        known_for: [
          { title: 'فسیل', year: '۱۴۰۲', role: 'اسماعیل' },
          { title: 'پایتخت (فصل ۵ و ۶)', year: '۱۳۹۷-۱۳۹۹', role: 'بهتاش فریبا' },
          { title: 'هفتادسی', year: '۱۴۰۳', role: 'کارگردان و بازیگر' },
          { title: 'رحمان ۱۴۰۰', year: '۱۳۹۷', role: 'انوش' },
          { title: 'لانتوری', year: '۱۳۹۴', role: 'نوید' },
        ]
      },
      {
        name: 'هادی کاظمی',
        english_name: 'Hadi Kazemi',
        character: 'سعید',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱۳ آبان ۱۳۵۵ (۴۸ سال)',
        birth_place: 'تهران، ایران',
        biography: 'هادی کاظمی بازیگر باسابقه طنز ایران که با خلق شخصیت‌های جاودانه‌ای چون نظام دوبرره در شب‌های برره و بابا شاه در قهوه تلخ نام خود را در حافظه جمعی ایرانیان ماندگار کرد.',
        awards: [
          { title: 'تندیس حافظ بهترین بازیگر مرد کمدی', year: '۱۳۹۰', movie_name: 'قهوه تلخ', is_winner: true }
        ],
        known_for: [
          { title: 'قهوه تلخ', year: '۱۳۸۹', role: 'بابا شاه' },
          { title: 'شب‌های برره', year: '۱۳۸۴', role: 'نظام دوبرره' },
          { title: 'فسیل', year: '۱۴۰۲', role: 'سعید' },
          { title: 'آنتن', year: '۱۴۰۱', role: 'خلیل' },
        ]
      },
      {
        name: 'ایمان صفا',
        english_name: 'Iman Safa',
        character: 'صفا',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱ دی ۱۳۶۲ (۴۱ سال)',
        birth_place: 'تهران، ایران',
        biography: 'ایمان صفا بازیگر توانمند تئاتر، سینما و تلویزیون که با نیسان آبی، فسیل و اجرای بی‌نظیر در برنامه جوکر محبوبیت فوق‌العاده‌ای کسب کرد.',
        known_for: [
          { title: 'فسیل', year: '۱۴۰۲', role: 'صفا' },
          { title: 'نیسان آبی', year: '۱۴۰۰', role: 'ممد چاخان' },
          { title: 'عملیات ۱۲۵', year: '۱۳۸۷', role: 'حسین' },
        ]
      },
      {
        name: 'الناز حبیبی',
        english_name: 'Elnaz Habibi',
        character: 'فرنگیس',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        birth_date: '۲۱ مرداد ۱۳۶۷ (۳۶ سال)',
        birth_place: 'تهران، ایران',
        biography: 'الناز حبیبی بازیگر خوش‌نام سینما و تلویزیون ایران که با دردسرهای عظیم، فسیل، تمساح خونی و رمانتیسم عماد و طوبا درخشیده است.',
        awards: [
          { title: 'نامزد سیمرغ بلورین بهترین بازیگر زن جشنواره فجر', year: '۱۳۹۹', movie_name: 'رمانتیسم عماد و طوبا', is_winner: false }
        ],
        known_for: [
          { title: 'فسیل', year: '۱۴۰۲', role: 'فرنگیس' },
          { title: 'تمساح خونی', year: '۱۴۰۲', role: 'خاطره' },
          { title: 'دردسرهای عظیم', year: '۱۳۹۳', role: 'بهار' },
        ]
      }
    ]
  },

  // 6. بتمن (The Batman)
  'tt1877830': {
    imdb_id: 'tt1877830',
    awards_summary: 'نامزد ۳ جایزه اسکار در بخش‌های بهترین جلوه‌های صوتی، گریم و جلوه‌های ویژه بصری',
    awards: [
      {
        id: 'batman-osc-1',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'نامزد ۳ اسکار بهترین چهره‌پردازی، جلوه‌های ویژه و صدا',
        year: '2023',
        is_winner: false,
        organization: 'Academy of Motion Picture Arts',
        icon: 'oscar'
      },
      {
        id: 'batman-sat-1',
        title: 'جایزه زحل (Saturn Awards)',
        category: 'بهترین فیلمنامه و بهترین کارگردانی فیلم ابرقهرمانی',
        year: '2022',
        is_winner: true,
        organization: 'Academy of Science Fiction, Fantasy and Horror',
        icon: 'trophy'
      }
    ],
    directors: [
      {
        name: 'مت ریوز',
        english_name: 'Matt Reeves',
        character: 'کارگردان و نویسنده',
        job: 'کارگردان و فیلمنامه‌نویس',
        photo: 'https://image.tmdb.org/t/p/w500/1X6G0k5O8o8b2w5k7P8b7x8u1P.jpg',
        birth_date: '۲۷ آوریل ۱۹۶۶ (۵۸ سال)',
        birth_place: 'راک‌ویل سنتر، نیویورک',
        biography: 'مت ریوز کارگردان سرشناس آمریکایی است که با ساخت سه‌گانه سیاره میمون‌ها و بتمن نوآر تاریک و واقع‌گرایانه ۲۰۲۲ تحسین جهانی به دست آورد.',
        known_for: [
          { title: 'The Batman', year: '2022', role: 'کارگردان' },
          { title: 'Dawn of the Planet of the Apes', year: '2014', role: 'کارگردان' },
          { title: 'Cloverfield', year: '2008', role: 'کارگردان' },
        ]
      }
    ],
    crew: [
      {
        name: 'مایکل جیاکینو',
        english_name: 'Michael Giacchino',
        job: 'آهنگساز موسیقی متن',
        photo: 'https://image.tmdb.org/t/p/w500/1x5M5fF0aA3r2rB2v7G8F9c3Y0P.jpg',
        biography: 'آهنگساز برنده جایزه اسکار برای انیمیشن «بالا (Up)» و خالق تم حماسی و کوبنده بتمن مت ریوز.',
        awards: [
          { title: 'جایزه اسکار بهترین موسیقی متن', year: '2010', movie_name: 'Up', is_winner: true },
        ],
        known_for: [
          { title: 'The Batman', year: '2022', role: 'آهنگساز' },
          { title: 'Up', year: '2009', role: 'آهنگساز' },
          { title: 'Spider-Man: No Way Home', year: '2021', role: 'آهنگساز' },
        ]
      }
    ],
    cast: [
      {
        name: 'رابرت پتینسون',
        english_name: 'Robert Pattinson',
        character: 'بروس وین / بتمن',
        photo: 'https://image.tmdb.org/t/p/w500/8A4PS5iG7F7b5d1K3l2w5k7P8b7.jpg',
        birth_date: '۱۳ مه ۱۹۸۶ (۳۸ سال)',
        birth_place: 'لندن، بریتانیا',
        biography: 'رابرت پتینسون از پدیده‌های بازیگری بریتانیاست که پس از مجموعه گرگ‌ومیش با همکاری با کارگردانان مؤلفی چون نولان، کراننبرگ و رابرت اگرز توانایی‌های شگرف خود را اثبات کرد.',
        known_for: [
          { title: 'بتمن (The Batman)', year: '2022', role: 'بروس وین' },
          { title: 'تنت (Tenet)', year: '2020', role: 'نیل' },
          { title: 'فانوس دریایی (The Lighthouse)', year: '2019', role: 'افریم وینسلو' },
        ]
      },
      {
        name: 'کالین فارل',
        english_name: 'Colin Farrell',
        character: 'آزوالد کابلپات / پنگوئن',
        photo: 'https://image.tmdb.org/t/p/w500/1x5M5fF0aA3r2rB2v7G8F9c3Y0P.jpg',
        birth_date: '۳۱ مه ۱۹۷۶ (۴۸ سال)',
        birth_place: 'دوبلین، ایرلند',
        biography: 'کالین فارل بازیگر برجسته ایرلندی و برنده ۲ جایزه گلدن گلوب و نامزد اسکار است که برای گریم شگفت‌انگیز و بازی استثنایی در نقش پنگوئن ستایش شد.',
        awards: [
          { title: 'جایزه گلدن گلوب بهترین بازیگر مرد', year: '2023', movie_name: 'The Banshees of Inisherin', is_winner: true },
          { title: 'جایزه بهترین بازیگر جشنواره ونیز', year: '2022', movie_name: 'The Banshees of Inisherin', is_winner: true },
        ],
        known_for: [
          { title: 'پنگوئن (The Penguin / The Batman)', year: '2022-2024', role: 'آزوالد کابلپات' },
          { title: 'بنشی‌های اینیشرین', year: '2022', role: 'پادریک' },
          { title: 'در بروژ (In Bruges)', year: '2008', role: 'ری' },
        ]
      },
      {
        name: 'زوئی کراویتز',
        english_name: 'Zoë Kravitz',
        character: 'سلینا کایل / زن گربه‌ای',
        photo: 'https://image.tmdb.org/t/p/w500/r3A7evGVVqKq6pX3n9V5d9K8O7P.jpg',
        birth_date: '۱ دسامبر ۱۹۸۸ (۳۵ سال)',
        birth_place: 'لس آنجلس، آمریکا',
        biography: 'بازیگر و کارگردان آمریکایی که با ایفای نقش زن گربه‌ای در بتمن و دروغ‌های کوچک بزرگ بازی‌های قدرتمندی ثبت کرد.',
        known_for: [
          { title: 'بتمن (The Batman)', year: '2022', role: 'سلینا کایل' },
          { title: 'مکس دیوانه: جاده خشم', year: '2015', role: 'توست' },
        ]
      }
    ]
  },

  // 7. جوکر (Joker)
  'tt7286456': {
    imdb_id: 'tt7286456',
    awards_summary: 'برنده ۲ جایزه اسکار (بهترین بازیگر نقش اول مرد برای واکین فینیکس و بهترین موسیقی متن) و برنده شیر طلایی جشنواره فیلم ونیز',
    awards: [
      {
        id: 'joker-osc-1',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین بازیگر نقش اول مرد (واکین فینیکس)',
        year: '2020',
        is_winner: true,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      },
      {
        id: 'joker-osc-2',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین موسیقی متن اصلی (هیلدور گودنادوتیر)',
        year: '2020',
        is_winner: true,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      },
      {
        id: 'joker-venice',
        title: 'جشنواره بین‌المللی فیلم ونیز',
        category: 'شیر طلایی بهترین فیلم (Golden Lion)',
        year: '2019',
        is_winner: true,
        organization: 'Venice Film Festival',
        icon: 'cannes'
      },
      {
        id: 'joker-gg',
        title: 'جایزه گلدن گلوب (Golden Globe)',
        category: 'بهترین بازیگر مرد درام و بهترین موسیقی متن',
        year: '2020',
        is_winner: true,
        organization: 'HFPA',
        icon: 'globe'
      }
    ],
    directors: [
      {
        name: 'تاد فیلیپس',
        english_name: 'Todd Phillips',
        character: 'کارگردان و نویسنده',
        job: 'کارگردان و نویسنده',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'کارگردان جسور آمریکایی که با تغییر ژانر از کمدی به درام‌های روان‌شناختی تاریک، شاهکار جوکر را ساخت و نامزد ۳ جایزه اسکار شد.',
        awards: [
          { title: 'شیر طلایی جشنواره فیلم ونیز', year: '2019', movie_name: 'Joker', is_winner: true },
          { title: 'نامزد اسکار بهترین کارگردانی و بهترین فیلم', year: '2020', movie_name: 'Joker', is_winner: false },
        ],
        known_for: [
          { title: 'Joker', year: '2019', role: 'کارگردان' },
          { title: 'The Hangover', year: '2009', role: 'کارگردان' },
        ]
      }
    ],
    crew: [
      {
        name: 'هیلدور گودنادوتیر',
        english_name: 'Hildur Guðnadóttir',
        job: 'آهنگساز موسیقی متن',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        birth_date: '۴ سپتامبر ۱۹۸۲',
        birth_place: 'ریکیاویک، ایسلند',
        biography: 'نوازنده برجسته ویولنسل و آهنگساز برنده اسکار، گرمی و امی که با نوای عمیق چلو تنهایی و فروپاشی روانی جوکر را جاودانه ساخت.',
        awards: [
          { title: 'جایزه اسکار بهترین موسیقی متن', year: '2020', movie_name: 'Joker', is_winner: true },
          { title: 'جایزه گرمی و امی بهترین موسیقی', year: '2019', movie_name: 'Chernobyl', is_winner: true },
        ],
        known_for: [
          { title: 'Joker', year: '2019', role: 'آهنگساز' },
          { title: 'Chernobyl (مینی‌سریال چرنوبیل)', year: '2019', role: 'آهنگساز' },
          { title: 'Tár', year: '2022', role: 'آهنگساز' },
        ]
      }
    ],
    cast: [
      {
        name: 'واکین فینیکس',
        english_name: 'Joaquin Phoenix',
        character: 'آرتور فلک / جوکر',
        photo: 'https://image.tmdb.org/t/p/w500/nTMZZv33tI9r1Lq8P6i7L8w1P.jpg',
        birth_date: '۲۸ اکتبر ۱۹۷۴ (۵۰ سال)',
        birth_place: 'سان خوان، پورتوریکو',
        biography: 'واکین فینیکس یکی از بزرگ‌ترین بازیگران متد تاریخ سینماست که برای تعهد جنون‌آمیز به نقش‌هایش، کاهش وزن شدید و اجرای روان‌شناختی آرتور فلک برنده اسکار بهترین بازیگر نقش اول مرد شد.',
        awards: [
          { title: 'جایزه اسکار بهترین بازیگر نقش اول مرد', year: '2020', movie_name: 'جوکر', is_winner: true },
          { title: 'جایزه گلدن گلوب بهترین بازیگر مرد', year: '2020', movie_name: 'جوکر', is_winner: true },
          { title: 'جایزه بفتا بهترین بازیگر مرد', year: '2020', movie_name: 'جوکر', is_winner: true },
          { title: 'جایزه بهترین بازیگر جشنواره کن', year: '2017', movie_name: 'تو هرگز واقعاً اینجا نبودی', is_winner: true },
        ],
        known_for: [
          { title: 'جوکر (Joker 1 & 2)', year: '2019-2024', role: 'آرتور فلک' },
          { title: 'گلادیاتور (Gladiator)', year: '2000', role: 'کومودوس' },
          { title: 'او (Her)', year: '2013', role: 'تئودور تومبلی' },
          { title: 'استاد (The Master)', year: '2012', role: 'فردی کوئل' },
        ]
      },
      {
        name: 'رابرت دنیرو',
        english_name: 'Robert De Niro',
        character: 'موری فرانکلین (مجری شو تلویزیونی)',
        photo: 'https://image.tmdb.org/t/p/w500/cT8htcck91yvd0k1w5k7P8b7x8u.jpg',
        birth_date: '۱۷ اوت ۱۹۴۳ (۸۱ سال)',
        birth_place: 'نیویورک، ایالات متحده',
        biography: 'رابرت دنیرو افسانه زنده سینمای جهان و برنده ۲ جایزه اسکار برای شاهکارهای «پدرخوانده ۲» و «گاو خشمگین» است.',
        awards: [
          { title: 'جایزه اسکار بهترین بازیگر نقش اول مرد', year: '1981', movie_name: 'گاو خشمگین (Raging Bull)', is_winner: true },
          { title: 'جایزه اسکار بهترین بازیگر نقش مکمل مرد', year: '1975', movie_name: 'پدرخوانده ۲ (The Godfather Part II)', is_winner: true },
          { title: 'جایزه یک عمر دستاورد هنری گلدن گلوب (سسیل بی دمیل)', year: '2011', is_winner: true },
        ],
        known_for: [
          { title: 'راننده تاکسی (Taxi Driver)', year: '1976', role: 'تراویس بیکل' },
          { title: 'پدرخوانده ۲ (The Godfather II)', year: '1974', role: 'ویتو کورلئونه جوان' },
          { title: 'رفقای خوب (Goodfellas)', year: '1990', role: 'جیمی کانوی' },
          { title: 'جوکر (Joker)', year: '2019', role: 'موری فرانکلین' },
        ]
      }
    ]
  },

  // 8. افعی تهران (The Viper of Tehran)
  'tt31535499': {
    imdb_id: 'tt31535499',
    awards_summary: 'نامزد و برنده تندیس بهترین فیلمنامه و کارگردانی جشن حافظ و از تحسین‌شده‌ترین سریال‌های درام روان‌شناختی ایران',
    awards: [
      {
        id: 'viper-hafez-1',
        title: 'جشن حافظ (Hafez Awards)',
        category: 'تندیس بهترین فیلمنامه سریال درام (پیمان معادی و پویا مهدوی‌زاده)',
        year: '1403',
        is_winner: true,
        organization: 'دنیای تصویر',
        icon: 'trophy'
      }
    ],
    directors: [
      {
        name: 'سامان مقدم',
        english_name: 'Saman Moghaddam',
        character: 'کارگردان',
        job: 'کارگردان باسابقه',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱۳۴۶ (۵۷ سال)',
        birth_place: 'تهران، ایران',
        biography: 'سامان مقدم کارگردان باسابقه و صاحب سبک سینمای ایران که آثار ماندگاری همچون کافه ستاره، مکس، نهنگ عنبر، پارتی و افعی تهران را کارگردانی کرده است.',
        known_for: [
          { title: 'افعی تهران', year: '۱۴۰۲-۱۴۰۳', role: 'کارگردان' },
          { title: 'نهنگ عنبر ۱ و ۲', year: '۱۳۹۴-۱۳۹۶', role: 'کارگردان' },
          { title: 'کافه ستاره', year: '۱۳۸۴', role: 'کارگردان' },
        ]
      }
    ],
    crew: [
      {
        name: 'امیر توسلی',
        english_name: 'Amir Tavassoli',
        job: 'آهنگساز موسیقی متن',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'آهنگساز باسابقه فیلم‌های سینمایی و سریال‌های مختارنامه، شهرزاد و افعی تهران.',
        known_for: [
          { title: 'افعی تهران', year: '۱۴۰۳', role: 'آهنگساز' },
          { title: 'مختارنامه', year: '۱۳۸۹', role: 'آهنگساز' },
        ]
      }
    ],
    cast: [
      {
        name: 'پیمان معادی',
        english_name: 'Payman Maadi',
        character: 'آرمان بیانی (کارگردان و منتقد)',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
        birth_date: '۹ تیر ۱۳۴۹ (۵۴ سال)',
        birth_place: 'نیویورک، ایالات متحده',
        biography: 'پیمان معادی بازیگر، فیلمنامه‌نویس و کارگردان بین‌المللی سینمای ایران است. او با بازی در شاهکارهای اصغر فرهادی «درباره الی» و «جدایی نادر از سیمین» به شهرت جهانی رسید و برنده خرس نقره‌ای جشنواره فیلم برلین شد. او همچنین در هالیوود در فیلم‌هایی چون شب حادثه (The Night Of) و ۱۳ ساعت ایفای نقش کرده است.',
        awards: [
          { title: 'خرس نقره‌ای بهترین بازیگر مرد جشنواره بین‌المللی فیلم برلین', year: '2011', movie_name: 'جدایی نادر از سیمین', is_winner: true },
          { title: 'سیمرغ بلورین بهترین بازیگر نقش اول مرد جشنواره فجر', year: '۱۳۹۸', movie_name: 'درخونگاه', is_winner: true },
          { title: 'تندیس بهترین فیلمنامه جشن حافظ', year: '۱۴۰۳', movie_name: 'افعی تهران', is_winner: true },
        ],
        known_for: [
          { title: 'جدایی نادر از سیمین (A Separation)', year: '۱۳۸۹', role: 'نادر' },
          { title: 'ابد و یک روز', year: '۱۳۹۴', role: 'مرتضی' },
          { title: 'متری شش و نیم', year: '۱۳۹۷', role: 'صمد' },
          { title: 'افعی تهران', year: '۱۴۰۳', role: 'آرمان بیانی' },
          { title: 'درباره الی (About Elly)', year: '۱۳۸۷', role: 'پیمان' },
          { title: 'برادران لیلا', year: '۱۴۰۱', role: 'منوچهر' },
        ]
      },
      {
        name: 'سحر دولتشاهی',
        english_name: 'Sahar Dolatshahi',
        character: 'مژگان مشتاق (روان‌شناس)',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱۶ مهر ۱۳۵۸ (۴۵ سال)',
        birth_place: 'تهران، ایران',
        biography: 'سحر دولتشاهی بازیگر برجسته و برنده ۲ سیمرغ بلورین جشنواره فیلم فجر برای فیلم‌های «عصر یخبندان» و «عرق سرد» است.',
        awards: [
          { title: 'سیمرغ بلورین بهترین بازیگر نقش مکمل زن جشنواره فجر', year: '۱۳۹۳', movie_name: 'عصر یخبندان', is_winner: true },
          { title: 'سیمرغ بلورین بهترین بازیگر نقش مکمل زن جشنواره فجر', year: '۱۳۹۶', movie_name: 'عرق سرد و چهارراه استانبول', is_winner: true },
        ],
        known_for: [
          { title: 'قورباغه', year: '۱۳۹۹', role: 'فرانک' },
          { title: 'افعی تهران', year: '۱۴۰۳', role: 'مژگان' },
          { title: 'عرق سرد', year: '۱۳۹۶', role: 'مهرانه نوری' },
          { title: 'وارونگی', year: '۱۳۹۴', role: 'نیلوفر' },
        ]
      },
      {
        name: 'مریلا زارعی',
        english_name: 'Merila Zarei',
        character: 'مرضیه',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        birth_date: '۲۵ فروردین ۱۳۵۳ (۵۰ سال)',
        birth_place: 'تهران، ایران',
        biography: 'مریلا زارعی از پرافتخارترین بازیگران زن سینمای ایران و دارنده ۳ سیمرغ بلورین جشنواره فیلم فجر برای فیلم‌های شیار ۱۴۳، زیر سقف دودی و سربازهای جمعه است.',
        awards: [
          { title: 'سیمرغ بلورین بهترین بازیگر نقش اول زن', year: '۱۳۹۲', movie_name: 'شیار ۱۴۳', is_winner: true },
          { title: 'سیمرغ بلورین بهترین بازیگر نقش اول زن', year: '۱۳۹۵', movie_name: 'زیر سقف دودی', is_winner: true },
          { title: 'سیمرغ بلورین بهترین بازیگر نقش مکمل زن', year: '۱۳۸۲', movie_name: 'سربازهای جمعه', is_winner: true },
        ],
        known_for: [
          { title: 'شیار ۱۴۳', year: '۱۳۹۲', role: 'الفت' },
          { title: 'درباره الی', year: '۱۳۸۷', role: 'سپیده' },
          { title: 'بادیگارد', year: '۱۳۹۴', role: 'راضیه' },
          { title: 'افعی تهران', year: '۱۴۰۳', role: 'مرضیه' },
        ]
      }
    ]
  },

  // 9. ددپول و ولورین (Deadpool & Wolverine)
  'tt6263850': {
    imdb_id: 'tt6263850',
    awards_summary: 'پرفروش‌ترین فیلم تاریخ با درجه سنی R با بیش از ۱.۳ میلیارد دلار فروش و برنده جوایز متعدد سرگرمی',
    awards: [
      {
        id: 'dp3-record',
        title: 'رکورد جهانی گیشه هالیوود',
        category: 'پرفروش‌ترین فیلم درجه R تاریخ سینمای جهان ($1.33B)',
        year: '2024',
        is_winner: true,
        organization: 'Box Office Mojo',
        icon: 'trophy'
      }
    ],
    directors: [
      {
        name: 'شان لوی',
        english_name: 'Shawn Levy',
        character: 'کارگردان',
        job: 'کارگردان و تهیه‌کننده',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'شان لوی کارگردان و تهیه‌کننده پرآوازه هالیوود و خالق سریال اتفاقات عجیب (Stranger Things) و فیلم‌های شب در موزه.',
        known_for: [
          { title: 'Deadpool & Wolverine', year: '2024', role: 'کارگردان' },
          { title: 'Stranger Things', year: '2016-2024', role: 'کارگردان و تهیه‌کننده' },
          { title: 'Free Guy', year: '2021', role: 'کارگردان' },
        ]
      }
    ],
    crew: [],
    cast: [
      {
        name: 'رایان رینولدز',
        english_name: 'Ryan Reynolds',
        character: 'وید ویلسون / ددپول',
        photo: 'https://image.tmdb.org/t/p/w500/4SYFiKtvgXBqY8qgVpQG6M0P.jpg',
        birth_date: '۲۳ اکتبر ۱۹۷۶ (۴۸ سال)',
        birth_place: 'ونکوور، کانادا',
        biography: 'رایان رینولدز از شوخ‌طبع‌ترین و موفق‌ترین ستارگان هالیوود است که با کاراکتر بی‌باک ددپول به محبوبیت جهانی رسید.',
        known_for: [
          { title: 'ددپول ۱، ۲ و ۳ (Deadpool)', year: '2016-2024', role: 'وید ویلسون' },
          { title: 'مرد آزاد (Free Guy)', year: '2021', role: 'گای' },
          { title: 'اعلان قرمز (Red Notice)', year: '2021', role: 'نولان بوث' },
        ]
      },
      {
        name: 'هیو جکمن',
        english_name: 'Hugh Jackman',
        character: 'لوگان / ولورین',
        photo: 'https://image.tmdb.org/t/p/w500/5vflp4fQ5M4k8v6L0P.jpg',
        birth_date: '۱۲ اکتبر ۱۹۶۸ (۵۶ سال)',
        birth_place: 'سیدنی، استرالیا',
        biography: 'هیو جکمن اسطوره سینما و تئاتر برنده جایزه گلدن گلوب، امی و تونی و نامزد اسکار برای بینوایان است که بیش از ۲۴ سال نقش جاودانه ولورین را ایفا کرده است.',
        awards: [
          { title: 'جایزه گلدن گلوب بهترین بازیگر مرد', year: '2013', movie_name: 'بینوایان (Les Misérables)', is_winner: true },
          { title: 'نامزد جایزه اسکار بهترین بازیگر مرد', year: '2013', movie_name: 'بینوایان', is_winner: false },
        ],
        known_for: [
          { title: 'مجموعه مردان ایکس و لوگان (Logan)', year: '2000-2024', role: 'ولورین' },
          { title: 'بزرگ‌ترین شومن (The Greatest Showman)', year: '2017', role: 'پی. تی. بارنوم' },
          { title: 'حیثیت (The Prestige)', year: '2006', role: 'رابرت انجیر' },
        ]
      },
      {
        name: 'اما کورین',
        english_name: 'Emma Corrin',
        character: 'کاساندرا نوا',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        biography: 'اما کورین برنده جایزه گلدن گلوب برای نقش پرنسس دایانا در سریال تاج (The Crown) و بازیگر نقش شرور کاساندرا نوا در ددپول ۳.'
      },
      {
        name: 'مورنا باکارین',
        english_name: 'Morena Baccarin',
        character: 'ونسا کارلایل',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'مورنا باکارین بازیگر نامزد جایزه امی و همسر وید ویلسون در مجموعه ددپول.'
      }
    ]
  },

  // 10. میان‌ستاره‌ای (Interstellar)
  'tt0816692': {
    imdb_id: 'tt0816692',
    awards_summary: 'برنده ۱ جایزه اسکار بهترین جلوه‌های ویژه و ۴۴ جایزه بین‌المللی سینمایی',
    awards: [
      {
        id: 'int-osc-1',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین جلوه‌های ویژه بصری (Best Visual Effects)',
        year: '2015',
        is_winner: true,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      },
      {
        id: 'int-osc-nom',
        title: 'نامزدی ۴ جایزه اسکار',
        category: 'بهترین موسیقی متن (هانس زیمر)، صداگذاری و طراحی صحنه',
        year: '2015',
        is_winner: false,
        organization: 'آکادمی علوم و هنرهای سینما',
        icon: 'oscar'
      }
    ],
    directors: [
      {
        name: 'کریستوفر نولان',
        english_name: 'Christopher Nolan',
        character: 'کارگردان و نویسنده',
        job: 'کارگردان و فیلمنامه‌نویس',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Christopher_Nolan_Cannes_2018.jpg/440px-Christopher_Nolan_Cannes_2018.jpg',
        biography: 'کریستوفر نولان خالق برخی از ماندگارترین شاهکارهای سینمای قرن بیست و یکم نظیر میان‌ستاره‌ای، تلقین و اوپنهایمر.'
      }
    ],
    crew: [
      {
        name: 'هانس زیمر',
        english_name: 'Hans Zimmer',
        character: 'آهنگساز',
        job: 'آهنگساز موسیقی متن',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hans_Zimmer_2018.jpg/440px-Hans_Zimmer_2018.jpg',
        biography: 'هانس زیمر اسطوره موسیقی فیلم جهان و برنده ۲ جایزه اسکار.'
      },
      {
        name: 'هویته ون هویتما',
        english_name: 'Hoyte van Hoytema',
        character: 'مدیر فیلمبرداری',
        job: 'مدیر فیلمبرداری IMAX',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Hoyte_van_Hoytema_2018.jpg/440px-Hoyte_van_Hoytema_2018.jpg',
        biography: 'هویته ون هویتما مدیر فیلمبرداری برنده جایزه اسکار.'
      }
    ],
    cast: [
      {
        name: 'متیو مک‌کانهی',
        english_name: 'Matthew McConaughey',
        character: 'کوپر (Cooper)',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        birth_date: '۴ نوامبر ۱۹۶۹ (۵۵ سال)',
        birth_place: 'تگزاس، آمریکا',
        biography: 'متیو مک‌کانهی برنده جایزه اسکار و گلدن گلوب برای فیلم باشگاه خریداران دالاس و ایفاگر نقش تاریخی کوپر در میان‌ستاره‌ای.',
        known_for: [
          { title: 'Interstellar', year: '2014', role: 'کوپر' },
          { title: 'Dallas Buyers Club', year: '2013', role: 'ران وودروف' },
          { title: 'True Detective', year: '2014', role: 'راست کول' }
        ]
      },
      {
        name: 'ان هاتاوی',
        english_name: 'Anne Hathaway',
        character: 'دکتر برند (Dr. Amelia Brand)',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        biography: 'ان هاتاوی بازیگر برنده جایزه اسکار، گلدن گلوب و بفتا برای بینوایان و ستاره شوالیه تاریکی برمی‌خیزد.',
        known_for: [
          { title: 'بینوایان (Les Misérables)', year: '2012', role: 'فانتین' },
          { title: 'میان‌ستاره‌ای', year: '2014', role: 'دکتر برند' }
        ]
      },
      {
        name: 'جسیکا چستین',
        english_name: 'Jessica Chastain',
        character: 'مورف بزرگسال (Murphy Cooper)',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'جسیکا چستین بازیگر برنده جایزه اسکار بهترین بازیگر نقش اول زن و ستاره چشم‌های تامی فی.'
      },
      {
        name: 'مایکل کین',
        english_name: 'Michael Caine',
        character: 'پروفسور برند',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'سر مایکل کین اسطوره بی‌بدیل سینمای بریتانیا و برنده ۲ جایزه اسکار.'
      },
      {
        name: 'مت دیمون',
        english_name: 'Matt Damon',
        character: 'دکتر من (Dr. Mann)',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Matt_Damon_TIFF_2015.jpg/440px-Matt_Damon_TIFF_2015.jpg',
        biography: 'مت دیمون ستاره برنده اسکار در نقش دانشمند تک‌افتاده سیاره یخ‌زده.'
      },
      {
        name: 'مکنزی فوی',
        english_name: 'Mackenzie Foy',
        character: 'مورف در کودکی',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        biography: 'مکنزی فوی برنده جایزه ساترن برای بهترین بازیگر جوان در فیلم میان‌ستاره‌ای.'
      },
      {
        name: 'تیموتی شالامی',
        english_name: 'Timothée Chalamet',
        character: 'تام در نوجوانی',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg/440px-Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg',
        biography: 'تیموتی شالامی در نقش فرزند نوجوان کوپر قبل از درخشش در فیلم‌های تل‌ماسه.'
      }
    ]
  },

  // 11. تلقین (Inception)
  'tt1375666': {
    imdb_id: 'tt1375666',
    awards_summary: 'برنده ۴ جایزه اسکار (فیلمبرداری، تدوین صدا، میکس صدا، جلوه‌های ویژه) از میان ۸ نامزدی',
    awards: [
      {
        id: 'inc-osc-1',
        title: '۴ جایزه اسکار (Academy Awards)',
        category: 'بهترین فیلمبرداری، جلوه‌های ویژه، تدوین و میکس صدا',
        year: '2011',
        is_winner: true,
        organization: 'آکادمی اسکار',
        icon: 'oscar'
      }
    ],
    directors: [
      {
        name: 'کریستوفر نولان',
        english_name: 'Christopher Nolan',
        character: 'کارگردان و فیلمنامه‌نویس',
        job: 'کارگردان و نویسنده',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Christopher_Nolan_Cannes_2018.jpg/440px-Christopher_Nolan_Cannes_2018.jpg',
        biography: 'کریستوفر نولان خالق دنیای رویاهای تودرتو در شاهکار تلقین.'
      }
    ],
    crew: [
      {
        name: 'هانس زیمر',
        english_name: 'Hans Zimmer',
        character: 'آهنگساز قطعه نمادین Time',
        job: 'آهنگساز',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hans_Zimmer_2018.jpg/440px-Hans_Zimmer_2018.jpg',
        biography: 'هانس زیمر با خلق قطعه افسانه‌ای Time یکی از باشکوه‌ترین ساندترک‌های تاریخ سینما را پدید آورد.'
      }
    ],
    cast: [
      {
        name: 'لئوناردو دی‌کاپریو',
        english_name: 'Leonardo DiCaprio',
        character: 'دام کاب (Dom Cobb)',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱۱ نوامبر ۱۹۷۴ (۵۰ سال)',
        birth_place: 'لس آنجلس، آمریکا',
        biography: 'لئوناردو دی‌کاپریو برنده جایزه اسکار بهترین بازیگر مرد و از تاثیرگذارترین چهره‌های تاریخ سینما.',
        known_for: [
          { title: 'Inception', year: '2010', role: 'دام کاب' },
          { title: 'تایتانیک (Titanic)', year: '1997', role: 'جک داوسون' },
          { title: 'از گور برخاسته (The Revenant)', year: '2015', role: 'هیو گلس' }
        ]
      },
      {
        name: 'جوزف گوردون لویت',
        english_name: 'Joseph Gordon-Levitt',
        character: 'آرتور (Arthur)',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'جوزف گوردون لویت ستاره نقش آرتور و صحنه بی‌وزنی ماندگار در راهروی هتل.'
      },
      {
        name: 'الیوت پیج',
        english_name: 'Elliot Page',
        character: 'آریادنه (Ariadne - معمار رویا)',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        biography: 'الیوت پیج نامزد جایزه اسکار و ایفاگر نقش معمار جوان و نابغه رویاها.'
      },
      {
        name: 'تام هاردی',
        english_name: 'Tom Hardy',
        character: 'ایمز (Eames - جعل‌کننده هویت)',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'تام هاردی ستاره کاریزماتیک بریتانیایی، نامزد جایزه اسکار و ستاره مکس دیوانه.'
      },
      {
        name: 'کن واتانابه',
        english_name: 'Ken Watanabe',
        character: 'سایتو (Mr. Saito)',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'کن واتانابه ستاره نامزد اسکار ژاپنی در نقش تاجر مرموز سفارش‌دهنده رویا.'
      },
      {
        name: 'کیلین مورفی',
        english_name: 'Cillian Murphy',
        character: 'رابرت فیشر (Robert Fischer)',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cillian_Murphy_Press_Conference_2024.jpg/440px-Cillian_Murphy_Press_Conference_2024.jpg',
        biography: 'کیلین مورفی ستاره برنده اسکار در نقش وارث امپراتوری تجاری فیشر.'
      },
      {
        name: 'ماریون کوتیار',
        english_name: 'Marion Cotillard',
        character: 'مل کاب (Mal Cobb)',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'ماریون کوتیار بازیگر فرانسوی برنده جایزه اسکار در نقش تصویر ذهنی همسر کاب.'
      },
      {
        name: 'مایکل کین',
        english_name: 'Michael Caine',
        character: 'پروفسور استفان مایلز',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'مایکل کین در نقش پدر همسر و استاد دانشگاه دام کاب.'
      }
    ]
  },

  // 12. شوالیه تاریکی (The Dark Knight)
  'tt0468569': {
    imdb_id: 'tt0468569',
    awards_summary: 'برنده ۲ جایزه اسکار (بهترین بازیگر نقش مکمل مرد برای هیث لجر و بهترین تدوین صدا)',
    awards: [
      {
        id: 'tdk-osc-1',
        title: 'جایزه اسکار بهترین بازیگر نقش مکمل مرد',
        category: 'هیث لجر برای نقش جاودانه جوکر',
        year: '2009',
        is_winner: true,
        organization: 'آکادمی اسکار',
        icon: 'oscar'
      }
    ],
    directors: [
      {
        name: 'کریستوفر نولان',
        english_name: 'Christopher Nolan',
        character: 'کارگردان',
        job: 'کارگردان و فیلمنامه‌نویس',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Christopher_Nolan_Cannes_2018.jpg/440px-Christopher_Nolan_Cannes_2018.jpg',
        biography: 'کریستوفر نولان با ساخت سه‌گانه شوالیه تاریکی استاندارد سینمای کمیک‌بوکی و جنایی را برای همیشه تغییر داد.'
      }
    ],
    crew: [
      {
        name: 'هانس زیمر و جیمز نیوتن هاوارد',
        english_name: 'Hans Zimmer',
        character: 'آهنگساز',
        job: 'آهنگسازان موسیقی متن',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hans_Zimmer_2018.jpg/440px-Hans_Zimmer_2018.jpg',
        biography: 'خالقین تم‌های هیجان‌انگیز گاتهام و تم اضطراب‌آور جوکر با تک‌نوازی ویولنسل.'
      }
    ],
    cast: [
      {
        name: 'کریستین بیل',
        english_name: 'Christian Bale',
        character: 'بروس وین / بتمن',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
        birth_date: '۳۰ ژانویه ۱۹۷۴ (۵۱ سال)',
        birth_place: 'ولز، بریتانیا',
        biography: 'کریستین بیل برنده جایزه اسکار و گلدن گلوب، ایفاگر نمادین‌ترین بتمن تاریخ سینما.',
        known_for: [
          { title: 'سه‌گانه شوالیه تاریکی (Dark Knight)', year: '2005-2012', role: 'بتمن' },
          { title: 'مبارز (The Fighter)', year: '2010', role: 'دیکی اکلاند' },
          { title: 'حیثیت (The Prestige)', year: '2006', role: 'آلفرد بوردن' }
        ]
      },
      {
        name: 'هیث لجر',
        english_name: 'Heath Ledger',
        character: 'جوکر (The Joker)',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'هیث لجر فقید برنده پس از مرگ جایزه اسکار، گلدن گلوب و بفتا برای برترین اجرای نقش منفی تمام اعصار.',
        known_for: [
          { title: 'The Dark Knight', year: '2008', role: 'جوکر' },
          { title: 'کوهستان بروکبک (Brokeback Mountain)', year: '2005', role: 'انیس دل مار' }
        ]
      },
      {
        name: 'آرون اکهارت',
        english_name: 'Aaron Eckhart',
        character: 'هاروی دنت / دوچهره (Two-Face)',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'آرون اکهارت در نقش دادستان شجاع گاتهام که به دوچهره بی‌رحم بدل می‌شود.'
      },
      {
        name: 'گری اولدمن',
        english_name: 'Gary Oldman',
        character: 'کمیسر جیمز گوردون',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'گری اولدمن برنده جایزه اسکار بهترین بازیگر مرد و اسطوره سینما در نقش پلیس پاک‌دست گاتهام.'
      },
      {
        name: 'مورگان فریمن',
        english_name: 'Morgan Freeman',
        character: 'لوسیوس فاکس',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'مورگان فریمن برنده جایزه اسکار و صدای ماندگار سینمای جهان در نقش نابغه تسلیحاتی وین انترپرایز.'
      },
      {
        name: 'مایکل کین',
        english_name: 'Michael Caine',
        character: 'آلفرد پنی‌ورث',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'سر مایکل کین در نقش خدمتکار وفادار و خردمند بروس وین.'
      },
      {
        name: 'مگی جیلنهال',
        english_name: 'Maggie Gyllenhaal',
        character: 'ریچل داوز',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'مگی جیلنهال نامزد جایزه اسکار و بازیگر نقش وکیل ریچل داوز.'
      }
    ]
  },

  // 13. جدایی نادر از سیمین (A Separation)
  'tt1832382': {
    imdb_id: 'tt1832382',
    awards_summary: 'برنده جایزه اسکار بهترین فیلم خارجی‌زبان (نخستین اسکار تاریخ سینمای ایران)، خرس طلای جشنواره برلین و گلدن گلوب',
    awards: [
      {
        id: 'sep-osc',
        title: 'جایزه اسکار (Academy Awards)',
        category: 'بهترین فیلم غیرانگلیسی‌زبان سال',
        year: '2012',
        is_winner: true,
        organization: 'آکادمی اسکار',
        icon: 'oscar'
      },
      {
        id: 'sep-berlin',
        title: 'خرس طلای جشنواره فیلم برلین',
        category: 'بهترین فیلم + خرس نقره‌ای گروه بازیگران مرد و زن',
        year: '2011',
        is_winner: true,
        organization: 'جشنواره بین‌المللی فیلم برلین',
        icon: 'trophy'
      }
    ],
    directors: [
      {
        name: 'اصغر فرهادی',
        english_name: 'Asghar Farhadi',
        character: 'کارگردان و فیلمنامه‌نویس',
        job: 'کارگردان و نویسنده',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'اصغر فرهادی یگانه کارگردان برنده ۲ جایزه اسکار سینمای ایران و برنده خرس طلای برلین و جوایز متعدد جشنواره کن.'
      }
    ],
    crew: [
      {
        name: 'محمود کلاری',
        english_name: 'Mahmoud Kalari',
        character: 'مدیر فیلمبرداری',
        job: 'مدیر فیلمبرداری',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'محمود کلاری فیلمبردار نامدار و برجسته سینمای ایران با سبک دوربین روی دست واقع‌گرایانه.'
      },
      {
        name: 'هایده صفی‌یاری',
        english_name: 'Hayedeh Safiyari',
        character: 'تدوین‌گر',
        job: 'تدوین فیلم',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'هایده صفی‌یاری تدوین‌گر برجسته و برنده چندین سیمرغ بلورین سینمای ایران.'
      }
    ],
    cast: [
      {
        name: 'پیمان معادی',
        english_name: 'Payman Maadi',
        character: 'نادر',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Payman_Maadi_at_Berlinale_2020.jpg/440px-Payman_Maadi_at_Berlinale_2020.jpg',
        birth_date: '۹ ژوئیه ۱۹۷۰ (۵۴ سال)',
        birth_place: 'نیویورک، آمریکا',
        biography: 'پیمان معادی برنده خرس نقره‌ای برلین، تندیس حافظ و سیمرغ بلورین، ستاره جدایی نادر از سیمین، ابد و یک روز و افعی تهران.',
        known_for: [
          { title: 'جدایی نادر از سیمین', year: '۱۳۸۹', role: 'نادر' },
          { title: 'درباره الی', year: '۱۳۸۷', role: 'پیمان' },
          { title: 'افعی تهران', year: '۱۴۰۲', role: 'آرمان بیانی' },
          { title: 'متری شش و نیم', year: '۱۳۹۷', role: 'صمد' }
        ]
      },
      {
        name: 'لیلا حاتمی',
        english_name: 'Leila Hatami',
        character: 'سیمین',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        biography: 'لیلا حاتمی برنده خرس نقره‌ای جشنواره برلین و چندین سیمرغ بلورین جشنواره فجر.',
        known_for: [
          { title: 'جدایی نادر از سیمین', year: '۱۳۸۹', role: 'سیمین' },
          { title: 'لیلا', year: '۱۳۷۵', role: 'لیلا' },
          { title: 'رگ خواب', year: '۱۳۹۵', role: 'مینا' }
        ]
      },
      {
        name: 'شهاب حسینی',
        english_name: 'Shahab Hosseini',
        character: 'حجت',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Shahab_Hosseini_20250202_%28cropped%29.jpg',
        biography: 'شهاب حسینی برنده نخل طلای جشنواره کن برای فروشنده و خرس نقره‌ای برلین برای جدایی نادر از سیمین.',
        known_for: [
          { title: 'فروشنده', year: '۱۳۹۴', role: 'عماد' },
          { title: 'جدایی نادر از سیمین', year: '۱۳۸۹', role: 'حجت' },
          { title: 'پوست شیر', year: '۱۴۰۱', role: 'محب مشکات' },
          { title: 'شهرزاد', year: '۱۳۹۴', role: 'قباد دیوان‌سالار' }
        ]
      },
      {
        name: 'ساره بیات',
        english_name: 'Sareh Bayat',
        character: 'راضیه',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'ساره بیات برنده خرس نقره‌ای جشنواره فیلم برلین برای نقش تاثیرگذار راضیه.'
      },
      {
        name: 'مریلا زارعی',
        english_name: 'Merila Zare\'i',
        character: 'خانم قهرایی (معلم ترمه)',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        biography: 'مریلا زارعی برنده ۳ سیمرغ بلورین جشنواره فجر و تندیس‌های متعدد سینمایی.'
      },
      {
        name: 'سارینا فرهادی',
        english_name: 'Sarina Farhadi',
        character: 'ترمه',
        photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
        biography: 'سارینا فرهادی برنده خرس نقره‌ای بهترین بازیگر زن جشنواره برلین در سن سیزده سالگی.'
      },
      {
        name: 'بابک کریمی',
        english_name: 'Babak Karimi',
        character: 'قاضی پرونده',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'بابک کریمی برنده خرس نقره‌ای گروهی برلین و بازیگر مطرح در سینمای اصغر فرهادی.'
      }
    ]
  },

  // 14. برکینگ بد (Breaking Bad)
  'tt0903747': {
    imdb_id: 'tt0903747',
    awards_summary: 'برنده ۱۶ جایزه امی پرایم‌تایم، ۲ جایزه گلدن گلوب و عنوان بالاترین امتیاز سریال در تاریخ گینس (۹.۵)',
    awards: [
      {
        id: 'bb-emmy',
        title: '۱۶ جایزه امی (Emmy Awards)',
        category: 'بهترین سریال درام، بهترین بازیگر مرد و مکمل',
        year: '2008-2014',
        is_winner: true,
        organization: 'آکادمی تلویزیون آمریکا',
        icon: 'trophy'
      }
    ],
    directors: [
      {
        name: 'وینس گیلیگان',
        english_name: 'Vince Gilligan',
        character: 'خالق، کارگردان و نویسنده',
        job: 'خالق و شو رانر',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'وینس گیلیگان نابغه تلویزیون و خالق دو شاهکار جاودانه برکینگ بد و بهتره با سال تماس بگیری (Better Call Saul).'
      }
    ],
    crew: [],
    cast: [
      {
        name: 'برایان کرانستون',
        english_name: 'Bryan Cranston',
        character: 'والتر وایت / هایزنبرگ (Walter White)',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
        birth_date: '۷ مارس ۱۹۵۶ (۶۹ سال)',
        birth_place: 'کالیفرنیا، آمریکا',
        biography: 'برایان کرانستون برنده ۴ جایزه امی، ۱ گلدن گلوب و ۲ جایزه تونی برای نقش افسانه‌ای هایزنبرگ.',
        known_for: [
          { title: 'Breaking Bad', year: '2008-2013', role: 'والتر وایت' },
          { title: 'Your Honor', year: '2020-2023', role: 'مایکل دسیاتو' },
          { title: 'ترامبو (Trumbo)', year: '2015', role: 'دالتون ترامبو' }
        ]
      },
      {
        name: 'آرون پال',
        english_name: 'Aaron Paul',
        character: 'جسی پینکمن (Jesse Pinkman)',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'آرون پال برنده ۳ جایزه امی بهترین بازیگر نقش مکمل مرد برای کاراکتر احساسی جسی پینکمن.'
      },
      {
        name: 'باب اودنکرک',
        english_name: 'Bob Odenkirk',
        character: 'سال گودمن (Saul Goodman)',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'باب اودنکرک ستاره برکینگ بد و سریال Better Call Saul با بازی درخشان در نقش وکیل کلاهبردار.'
      },
      {
        name: 'جانکارلو اسپوزیتو',
        english_name: 'Giancarlo Esposito',
        character: 'گاس فرینگ (Gustavo Fring)',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'جانکارلو اسپوزیتو نامزد چندین جایزه امی در نقش خونسردترین و دقیق‌ترین رئیس کارتل تاریخ تلویزیون.'
      },
      {
        name: 'آنا گان',
        english_name: 'Anna Gunn',
        character: 'اسکایلر وایت (Skyler White)',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'آنا گان برنده ۲ جایزه امی پرایم‌تایم بهترین بازیگر نقش مکمل زن.'
      },
      {
        name: 'دین نوریس',
        english_name: 'Dean Norris',
        character: 'هنک شریدر (Hank Schrader)',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'دین نوریس بازیگر محبوب نقش مامور جسور و پیگیر مبارزه با مواد مخدر DEA.'
      },
      {
        name: 'جاناتان بنکس',
        english_name: 'Jonathan Banks',
        character: 'مایک ارمنترات (Mike Ehrmantraut)',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'جاناتان بنکس نامزد ۶ جایزه امی در نقش متخصص کارکشته عملیات و امنیت.'
      }
    ]
  },

  // 15. شهرزاد (Shahrzad)
  'tt5557766': {
    imdb_id: 'tt5557766',
    awards_summary: 'محبوب‌ترین و موفق‌ترین سریال درام تاریخی عاشقانه تاریخ نمایش خانگی ایران با تندیس‌های متعدد جشن حافظ',
    awards: [
      {
        id: 'shahrzad-hafez',
        title: 'تندیس جشن حافظ',
        category: 'بهترین سریال، بهترین کارگردانی، بهترین بازیگر مرد و زن درام',
        year: '۱۳۹۵-۱۳۹۷',
        is_winner: true,
        organization: 'جشن دنیای تصویر (حافظ)',
        icon: 'trophy'
      }
    ],
    directors: [
      {
        name: 'حسن فتحی',
        english_name: 'Hassan Fathi',
        character: 'کارگردان و نویسنده',
        job: 'کارگردان',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'حسن فتحی کارگردان صاحب‌نام تاریخ معاصر ایران و سازنده سریال‌های ماندگاری چون شب دهم، مدار صفر درجه، شهرزاد و جیران.'
      }
    ],
    crew: [
      {
        name: 'محسن چاوشی',
        english_name: 'Mohsen Chavoshi',
        character: 'خواننده ترانه‌های ماندگار سریال',
        job: 'خواننده و آهنگساز قطعات شهرزاد',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'محسن چاوشی با ترانه‌های فراموش‌نشدنی «کجایی»، «همخواب» و «شهرزاد» رکورد شنیده‌شدن موسیقی سریال در ایران را شکست.'
      },
      {
        name: 'امیرحسین فتحی',
        english_name: 'Amir Hossein Fathi',
        character: 'همایون مهتدی / صابر عبدلی',
        job: 'بازیگر',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
        biography: 'امیرحسین فتحی بازیگر سینما و تئاتر.'
      }
    ],
    cast: [
      {
        name: 'ترانه علیدوستی',
        english_name: 'Taraneh Alidoosti',
        character: 'شهرزاد سعادت (پزشک و معشوقه فرهاد)',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        birth_date: '۱۲ ژانویه ۱۹۸۴ (۴۱ سال)',
        birth_place: 'تهران، ایران',
        biography: 'ترانه علیدوستی برنده سیمرغ بلورین بهترین بازیگر نقش اول زن و ستاره فیلم‌های اسکاری فروشنده و درباره الی و سریال شهرزاد.',
        known_for: [
          { title: 'شهرزاد', year: '۱۳۹۴-۱۳۹۷', role: 'شهرزاد' },
          { title: 'فروشنده', year: '۱۳۹۴', role: 'رعنا' },
          { title: 'برادران لیلا', year: '۱۴۰۱', role: 'لیلا' },
          { title: 'درباره الی', year: '۱۳۸۷', role: 'الی' }
        ]
      },
      {
        name: 'شهاب حسینی',
        english_name: 'Shahab Hosseini',
        character: 'قباد دیوان‌سالار',
        photo: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Shahab_Hosseini_20250202_%28cropped%29.jpg',
        biography: 'شهاب حسینی با اجرای نقش عمیق قباد دیوان‌سالار یکی از ماندگارترین شخصیت‌های تاریخ سریال‌های ایرانی را خلق کرد.',
        known_for: [
          { title: 'شهرزاد', year: '۱۳۹۴', role: 'قباد' },
          { title: 'فروشنده', year: '۱۳۹۴', role: 'عماد' },
          { title: 'پوست شیر', year: '۱۴۰۱', role: 'محب مشکات' }
        ]
      },
      {
        name: 'علی نصیریان',
        english_name: 'Ali Nasirian',
        character: 'بزرگ آقا دیوان‌سالار',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'استاد علی نصیریان چهره ماندگار و اسطوره بی‌بدیل تاریخ بازیگری تئاتر و سینمای ایران، برنده چندین سیمرغ بلورین و چهره برتر بازیگری.'
      },
      {
        name: 'مصطفی زمانی',
        english_name: 'Mostafa Zamani',
        character: 'فرهاد دماوندی (شاعر و روزنامه‌نگار)',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'مصطفی زمانی ستاره نقش یوسف پیامبر و ایفاگر نقش پرشور فرهاد دماوندی در سریال شهرزاد.'
      },
      {
        name: 'پریناز ایزدیار',
        english_name: 'Parinaz Izadyar',
        character: 'شیرین دیوان‌سالار',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'پریناز ایزدیار برنده سیمرغ بلورین بهترین بازیگر نقش اول زن برای ابد و یک روز و برنده تندیس حافظ برای شهرزاد.'
      },
      {
        name: 'مهدی سلطانی',
        english_name: 'Mehdi Soltani',
        character: 'هاشم خان دماوندی',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'دکتر مهدی سلطانی استاد دانشگاه تهران و بازیگر توانمند تئاتر و تلویزیون.'
      },
      {
        name: 'محمود پاک‌نیت',
        english_name: 'Mahmoud Pakniyat',
        character: 'جمشید سعادت (پدر شهرزاد)',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'محمود پاک‌نیت بازیگر کهنه‌کار و برنده دیپلم افتخار فجر.'
      },
      {
        name: 'گلاره عباسی',
        english_name: 'Gelareh Abbasi',
        character: 'اکرم دیوان‌سالار',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        biography: 'گلاره عباسی برنده سیمرغ بلورین بهترین بازیگر مکمل زن جشنواره فجر.'
      },
      {
        name: 'رویا نونهالی',
        english_name: 'Roya Nonahali',
        character: 'مهری نصرت',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'رویا نونهالی برنده ۲ سیمرغ بلورین جشنواره فجر و بازیگر برجسته سینما و تئاتر.'
      },
      {
        name: 'رضا کیانیان',
        english_name: 'Reza Kianian',
        character: 'شاپور بهبودی',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'رضا کیانیان برنده ۲ سیمرغ بلورین و از خلاق‌ترین بازیگران نسل طلایی سینمای ایران.'
      }
    ]
  },

  // 16. درون و بیرون ۲ (Inside Out 2)
  'tt22022452': {
    imdb_id: 'tt22022452',
    awards_summary: 'پرفروش‌ترین انیمیشن تاریخ سینمای جهان با بیش از ۱.۶۹ میلیارد دلار فروش جهانی و برنده جوایز متعدد آنی و منتخب منتقدان',
    awards: [
      {
        id: 'io2-record',
        title: 'رکورد تاریخی گیشه سینمای جهان',
        category: 'پرفروش‌ترین انیمیشن تاریخ سینما ($1.69B)',
        year: '2024',
        is_winner: true,
        organization: 'Box Office Mojo & Disney',
        icon: 'trophy'
      }
    ],
    directors: [
      {
        name: 'کلسی مان',
        english_name: 'Kelsey Mann',
        character: 'کارگردان',
        job: 'کارگردان انیمیشن',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        biography: 'کلسی مان کارگردان ارشد پیکسار و سازنده رکوردشکن انیمیشن Inside Out 2.'
      }
    ],
    crew: [],
    cast: [
      {
        name: 'امی پولر',
        english_name: 'Amy Poehler',
        character: 'شادی (Joy)',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        biography: 'امی پولر بازیگر و کمدین برنده جایزه گلدن گلوب و صداپیشه پرانرژی شادی در سری انیمیشن‌های پیکسار.'
      },
      {
        name: 'مایا هاوک',
        english_name: 'Maya Hawke',
        character: 'اضطراب (Anxiety)',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        biography: 'مایا هاوک ستاره سریال اتفاقات عجیب (Stranger Things) و صداپیشه احساس محبوب اضطراب.'
      },
      {
        name: 'فیلیس اسمیت',
        english_name: 'Phyllis Smith',
        character: 'غم (Sadness)',
        photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        biography: 'فیلیس اسمیت بازیگر سریال اداره (The Office) و صداپیشه غم در پیکسار.'
      },
      {
        name: 'لوئیس بلک',
        english_name: 'Lewis Black',
        character: 'خشم (Anger)',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
        biography: 'لوئیس بلک استندآپ کمدین و صداپیشه شخصیت خشم.'
      },
      {
        name: 'ایو ادبیری',
        english_name: 'Ayo Edebiri',
        character: 'حسادت (Envy)',
        photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
        biography: 'ایو ادبیری بازیگر برنده جایزه امی و گلدن گلوب برای سریال The Bear.'
      },
      {
        name: 'تونی هیل',
        english_name: 'Tony Hale',
        character: 'ترس (Fear)',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        biography: 'تونی هیل برنده ۲ جایزه امی پرایم‌تایم.'
      }
    ]
  }
};

/**
 * Intelligent helper to retrieve extended metadata (awards, cast bios, filmography)
 */
export function getExtendedMovieMetadata(imdbId?: string, title?: string, englishTitle?: string): MovieExtendedDetails | null {
  const cleanId = (imdbId || '').trim();
  const cleanEn = (englishTitle || '').toLowerCase().trim();
  const cleanFa = (title || '').toLowerCase().trim();

  // 1. Direct match by ID
  if (cleanId && KNOWN_EXTENDED_MOVIE_DATA[cleanId]) {
    return KNOWN_EXTENDED_MOVIE_DATA[cleanId];
  }

  // 2. Search in dictionary
  for (const [id, details] of Object.entries(KNOWN_EXTENDED_MOVIE_DATA)) {
    if (cleanId && id === cleanId) return details;
  }

  // 3. Fallback matching by title
  if (cleanFa.includes('اوپنهایمر') || cleanEn.includes('oppenheimer')) return KNOWN_EXTENDED_MOVIE_DATA['tt15398776'];
  if (cleanFa.includes('تل‌ماسه') || cleanFa.includes('تلماسه') || cleanEn.includes('dune')) return KNOWN_EXTENDED_MOVIE_DATA['tt15239678'];
  if (cleanFa.includes('شوگان') || cleanEn.includes('shogun')) return KNOWN_EXTENDED_MOVIE_DATA['tt2798648'];
  if (cleanFa.includes('پوست شیر') || cleanEn.includes('lion skin')) return KNOWN_EXTENDED_MOVIE_DATA['tt22440938'];
  if (cleanFa.includes('فسیل') || cleanEn.includes('fossil')) return KNOWN_EXTENDED_MOVIE_DATA['tt27050012'];
  if (cleanFa.includes('بتمن') || cleanEn.includes('batman')) return KNOWN_EXTENDED_MOVIE_DATA['tt1877830'];
  if (cleanFa.includes('جوکر') || cleanEn.includes('joker')) return KNOWN_EXTENDED_MOVIE_DATA['tt7286456'];
  if (cleanFa.includes('افعی تهران') || cleanEn.includes('viper of tehran')) return KNOWN_EXTENDED_MOVIE_DATA['tt31535499'];
  if (cleanFa.includes('ددپول') || cleanEn.includes('deadpool')) return KNOWN_EXTENDED_MOVIE_DATA['tt6263850'];
  if (cleanFa.includes('میان‌ستاره') || cleanFa.includes('میان ستاره') || cleanEn.includes('interstellar')) return KNOWN_EXTENDED_MOVIE_DATA['tt0816692'];
  if (cleanFa.includes('تلقین') || cleanEn.includes('inception')) return KNOWN_EXTENDED_MOVIE_DATA['tt1375666'];
  if (cleanFa.includes('شوالیه تاریکی') || cleanEn.includes('dark knight')) return KNOWN_EXTENDED_MOVIE_DATA['tt0468569'];
  if (cleanFa.includes('جدایی نادر') || cleanFa.includes('جدایی') || cleanEn.includes('separation')) return KNOWN_EXTENDED_MOVIE_DATA['tt1832382'];
  if (cleanFa.includes('برکینگ بد') || cleanEn.includes('breaking bad')) return KNOWN_EXTENDED_MOVIE_DATA['tt0903747'];
  if (cleanFa.includes('شهرزاد') || cleanEn.includes('shahrzad')) return KNOWN_EXTENDED_MOVIE_DATA['tt5557766'];
  if (cleanFa.includes('درون و بیرون') || cleanEn.includes('inside out')) return KNOWN_EXTENDED_MOVIE_DATA['tt22022452'];

  return null;
}
