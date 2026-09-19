import { Movie, BoxOfficeEntry, TrackingItem } from '../types';

export const INITIAL_MOVIES: Movie[] = [
  {
    message_id: 101,
    title: "اوپنهایمر",
    english_title: "Oppenheimer",
    description: "داستان زندگی جی. رابرت اوپنهایمر، فیزیکدان نظری آمریکایی که نقش محوری در پروژه منهتن و ساخت اولین بمب هسته‌ای جهان در جنگ جهانی دوم داشت.",
    poster_url: "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    year: "2023",
    genre: "زندگینامه | تاریخی | درام",
    rating: "8.9",
    country: "آمریکا",
    actors: "کیلین مورفی، امیلی بلانت، مت دیمون، رابرت داونی جونیور، فلورنس پیو",
    quality: "4K UHD",
    channel: "universal",
    timestamp: 1715000000000,
    category: "foreign_movies",
    box_office: "$957,800,000 (فروش جهانی)",
    imdb_id: "tt15398776",
    trailer_url: "https://www.youtube.com/watch?v=uYPbbksJxIg",
    movie_stills: JSON.stringify([
      "https://image.tmdb.org/t/p/w780/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
      "https://image.tmdb.org/t/p/w780/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg",
      "https://image.tmdb.org/t/p/w780/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg"
    ]),
    actor_photos: JSON.stringify([
      {
        name: "Cillian Murphy",
        english_name: "Cillian Murphy",
        character: "J. Robert Oppenheimer",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cillian_Murphy_Press_Conference_2024.jpg/440px-Cillian_Murphy_Press_Conference_2024.jpg",
        biography: "کیلین مورفی بازیگر سرشناس ایرلندی، برنده جایزه اسکار، بفتا و گلدن گلوب برای نقش‌آفرینی در فیلم اوپنهایمر."
      },
      {
        name: "Robert Downey Jr.",
        english_name: "Robert Downey Jr.",
        character: "Lewis Strauss",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg/440px-Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg",
        biography: "رابرت داونی جونیور برنده جایزه اسکار، گلدن گلوب و بفتا برای اوپنهایمر و بازیگر افسانه‌ای نقش تونی استارک."
      },
      {
        name: "Emily Blunt",
        english_name: "Emily Blunt",
        character: "Katherine Oppenheimer",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emily_Blunt_at_the_Oppenheimer_premiere_%28cropped%29.jpg/440px-Emily_Blunt_at_the_Oppenheimer_premiere_%28cropped%29.jpg",
        biography: "امیلی بلانت بازیگر تحسین‌شده بریتانیایی و نامزد جایزه اسکار و گلدن گلوب."
      },
      {
        name: "Matt Damon",
        english_name: "Matt Damon",
        character: "Leslie Groves",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Matt_Damon_TIFF_2015.jpg/440px-Matt_Damon_TIFF_2015.jpg",
        biography: "مت دیمون بازیگر، تهیه‌کننده و فیلمنامه‌نویس برنده جایزه اسکار."
      }
    ]),
    is_favorite: true
  },
  {
    message_id: 102,
    title: "تل‌ماسه: بخش دو",
    english_title: "Dune: Part Two",
    description: "پل اتریدیز با چو و فرمن‌ها متحد می‌شود در حالی که به دنبال انتقام از توطئه‌گرانی است که خانواده‌اش را نابود کردند، و بین عشق زندگی‌اش و سرنوشت جهان انتخابی سخت دارد.",
    poster_url: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    year: "2024",
    genre: "علمی تخیلی | ماجراجویی | اکشن",
    rating: "8.6",
    country: "آمریکا",
    actors: "تیموتی شالامی، زندایا، ربکا فرگوسن، خاویر باردم، جاش برولین",
    quality: "4K UHD",
    channel: "warner",
    timestamp: 1714500000000,
    category: "foreign_movies",
    box_office: "$711,844,358 (فروش جهانی)",
    imdb_id: "tt15239678",
    trailer_url: "https://www.youtube.com/watch?v=Way9Dexny3w",
    movie_stills: JSON.stringify([
      "https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s5hj0x2.jpg",
      "https://image.tmdb.org/t/p/w780/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg"
    ]),
    actor_photos: JSON.stringify([
      {
        name: "Timothée Chalamet",
        english_name: "Timothée Chalamet",
        character: "Paul Atreides",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg/440px-Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg",
        biography: "تیموتی شالامی یکی از برجسته‌ترین ستارگان نسل جدید سینمای جهان و نامزد جایزه اسکار."
      },
      {
        name: "Zendaya",
        english_name: "Zendaya",
        character: "Chani",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Zendaya_-_2019_by_Glenn_Francis.jpg/440px-Zendaya_-_2019_by_Glenn_Francis.jpg",
        biography: "زندایا بازیگر و خواننده برنده ۲ جایزه امی و ستاره فیلم‌های تل‌ماسه و مرد عنکبوتی."
      },
      {
        name: "Rebecca Ferguson",
        english_name: "Rebecca Ferguson",
        character: "Lady Jessica",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Rebecca_Ferguson_2019_by_Glenn_Francis.jpg/440px-Rebecca_Ferguson_2019_by_Glenn_Francis.jpg",
        biography: "ربکا فرگوسن بازیگر تحسین‌شده سوئدی و ستاره فیلم‌های ماموریت غیرممکن و تل‌ماسه."
      },
      {
        name: "Javier Bardem",
        english_name: "Javier Bardem",
        character: "Stilgar",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Javier_Bardem_Cannes_2018.jpg/440px-Javier_Bardem_Cannes_2018.jpg",
        biography: "خاویر باردم بازیگر برنده جایزه اسکار و گلدن گلوب اهل اسپانیا."
      }
    ]),
    is_favorite: true
  },
  {
    message_id: 103,
    title: "پوست شیر",
    english_title: "The Lion Skin",
    description: "نعیم پس از ۱۵ سال حبس آزاد می‌شود تا دخترش ساحل را ببیند. اما اتفاقات تلخی رخ می‌دهد که او را وارد ماجرایی پر از انتقام و راز می‌کند.",
    poster_url: "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    year: "1401",
    genre: "جنایی | درام | معمایی",
    rating: "8.7",
    country: "ایران",
    actors: "هادی حجازی‌فر، شهاب حسینی، پانته‌آ بهرام، مهرداد صدیقیان، علیرضا کمالی، پردیس احمدیه",
    quality: "1080p Full HD",
    channel: "filmnet",
    timestamp: 1714000000000,
    category: "iranian_series",
    box_office: "پربیننده‌ترین سریال سال",
    imdb_id: "tt22440938",
    trailer_url: "https://www.youtube.com/watch?v=EFj3wVEsTPk",
    actor_photos: JSON.stringify([
      {
        name: "شهاب حسینی",
        english_name: "Shahab Hosseini",
        character: "سرگرد محب مشکات",
        photo: "https://upload.wikimedia.org/wikipedia/commons/4/42/Shahab_Hosseini_20250202_%28cropped%29.jpg",
        biography: "شهاب حسینی برنده جایزه نخل طلای بهترین بازیگر مرد جشنواره فیلم کن برای فیلم فروشنده و خرس نقره‌ای برلین."
      },
      {
        name: "هادی حجازی‌فر",
        english_name: "Hadi Hejazifar",
        character: "نعیم مولایی",
        photo: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Hadi_Hejazifar_%28cropped%29.jpg",
        biography: "هادی حجازی‌فر بازیگر و کارگردان سینمای ایران، برنده سیمرغ بلورین جشنواره فیلم فجر و تندیس حافظ."
      },
      {
        name: "علیرضا کمالی",
        english_name: "Alireza Kamali",
        character: "رضا پروانه",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Alireza_Kamali_2023.jpg/440px-Alireza_Kamali_2023.jpg",
        biography: "علیرضا کمالی برنده تندیس حافظ بهترین بازیگر مرد درام برای نقش ماندگار رضا پروانه."
      },
      {
        name: "پانته‌آ بهرام",
        english_name: "Pantea Bahram",
        character: "لیلا برزگر",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Pantea_Bahram_in_2018.jpg/440px-Pantea_Bahram_in_2018.jpg",
        biography: "پانته‌آ بهرام برنده سیمرغ بلورین جشنواره فیلم فجر و از بازیگران برجسته تئاتر و سینما."
      }
    ]),
    is_favorite: false
  },
  {
    message_id: 104,
    title: "افعی تهران",
    english_title: "The Viper of Tehran",
    description: "یک منتقد سینما و کارگردان به نام آرمان بیانی درگیر ساخت فیلمی مستند درباره پرونده یک قاتل زنجیره‌ای معروف به نام افعی تهران می‌شود.",
    poster_url: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    year: "1402",
    genre: "درام | معمایی | جنایی",
    rating: "8.3",
    country: "ایران",
    actors: "پیمان معادی، سحر دولتشاهی، آزاده صمدی، پژمان جمشیدی، مریلا زارعی",
    quality: "1080p Full HD",
    channel: "filmnet",
    timestamp: 1713500000000,
    category: "iranian_series",
    box_office: "سریال تحسین‌شده شبکه نمایش خانگی",
    imdb_id: "tt31535499",
    trailer_url: "https://www.youtube.com/watch?v=0C9zRjefbeQ",
    actor_photos: JSON.stringify([
      {
        name: "پیمان معادی",
        english_name: "Payman Maadi",
        character: "آرمان بیانی",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Payman_Maadi_at_Berlinale_2020.jpg/440px-Payman_Maadi_at_Berlinale_2020.jpg",
        biography: "پیمان معادی برنده خرس نقره‌ای جشنواره فیلم برلین برای جدایی نادر از سیمین."
      },
      {
        name: "سحر دولتشاهی",
        english_name: "Sahar Dolatshahi",
        character: "مژگان مشتاق (روانشناس)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Sahar_Dolatshahi_at_Cannes_2016.jpg/440px-Sahar_Dolatshahi_at_Cannes_2016.jpg",
        biography: "سحر دولتشاهی برنده ۲ سیمرغ بلورین جشنواره فیلم فجر."
      },
      {
        name: "پژمان جمشیدی",
        english_name: "Pejman Jamshidi",
        character: "بابک (تهیه‌کننده)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Pejman_Jamshidi_in_2020.jpg/440px-Pejman_Jamshidi_in_2020.jpg",
        biography: "پژمان جمشیدی از محبوب‌ترین و پرفروش‌ترین بازیگران سینمای ایران."
      }
    ]),
    is_favorite: false
  },
  {
    message_id: 105,
    title: "چشم‌چران عمارت (فرید)",
    english_title: "Yalı Çapkını",
    description: "داستان ازدواج اجباری فرید، پسر جوان و بی‌مسئولیت یک خانواده اصیل در استانبول با سیران، دختری سرکش از غازی عینتاب.",
    poster_url: "https://image.tmdb.org/t/p/w780/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
    year: "2023",
    genre: "درام | عاشقانه",
    rating: "7.9",
    country: "ترکیه",
    actors: "آفرا ساراچ‌اوغلو، مرت رمضان دمیر، چتین تکیندور",
    quality: "1080p HD",
    channel: "startv",
    timestamp: 1713000000000,
    category: "turkish_series",
    box_office: "پربیننده‌ترین سریال ترکیه‌ای",
    imdb_id: "tt21868356",
    trailer_url: "https://www.youtube.com/watch?v=wu_Rg5aAstI",
    actor_photos: JSON.stringify([
      {
        name: "آفرا ساراچ‌اوغلو",
        english_name: "Afra Saraçoğlu",
        character: "Seyran Şanlı",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Afra_Sara%C3%A7o%C4%9Flu_2022.jpg/440px-Afra_Sara%C3%A7o%C4%9Flu_2022.jpg",
        biography: "آفرا ساراچ‌اوغلو بازیگر درخشان سریال چشم‌چران عمارت."
      },
      {
        name: "مرت رمضان دمیر",
        english_name: "Mert Ramazan Demir",
        character: "Ferit Korhan",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Mert_Ramazan_Demir.jpg/440px-Mert_Ramazan_Demir.jpg",
        biography: "مرت رمضان دمیر بازیگر محبوب و پرطرفدار ترکیه‌ای."
      },
      {
        name: "چتین تکیندور",
        english_name: "Çetin Tekindor",
        character: "Halis Korhan (هالیس آقا)",
        photo: "https://m.media-amazon.com/images/M/MV5BMGQxZjExNjgtMGY4MS00MTQ1LWFmYTItNDM5MWI5OWY5NTc2XkEyXkFqcGc@._V1_.jpg",
        biography: "چتین تکیندور بازیگر پیشکسوت و افسانه‌ای سینما و تلویزیون ترکیه و ایفاگر نقش به یادماندنی هالیس آقا در سریال چشم‌چران عمارت."
      }
    ]),
    is_favorite: true
  },
  {
    message_id: 106,
    title: "فسیل",
    english_title: "Fossil",
    description: "داستان سه دوست نوازنده در دهه ۵۰ خورشیدی که در آستانه انقلاب دستخوش حوادث غیرمنتظره‌ای می‌شوند و سال‌ها بعد در شرایطی کاملاً دگرگون بیدار می‌شوند.",
    poster_url: "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    year: "1401",
    genre: "کمدی | تاریخی",
    rating: "7.6",
    country: "ایران",
    actors: "بهرام افشاری، هادی کاظمی، ایمان صفا، الناز حبیبی، الهه حصاری",
    quality: "1080p Full HD",
    channel: "cinema",
    timestamp: 1712500000000,
    category: "iranian_movies",
    box_office: "۳۲۴ میلیارد تومان (پرفروش‌ترین فیلم تاریخ سینمای ایران)",
    imdb_id: "tt27050012",
    trailer_url: "https://www.youtube.com/watch?v=2T0kaQtLHEA",
    actor_photos: JSON.stringify([
      {
        name: "بهرام افشاری",
        english_name: "Bahram Afshari",
        character: "اسماعیل (اسی)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bahram_Afshari_in_2019.jpg/440px-Bahram_Afshari_in_2019.jpg",
        biography: "بهرام افشاری برنده تندیس حافظ و ستاره پرفروش‌ترین فیلم تاریخ سینمای ایران (فسیل)."
      },
      {
        name: "هادی کاظمی",
        english_name: "Hadi Kazemi",
        character: "سعید",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Hadi_Kazemi_2019.jpg/440px-Hadi_Kazemi_2019.jpg",
        biography: "هادی کاظمی بازیگر کمدی مطرح سینما و تلویزیون."
      },
      {
        name: "ایمان صفا",
        english_name: "Iman Safa",
        character: "صفا",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Iman_Safa_2022.jpg/440px-Iman_Safa_2022.jpg",
        biography: "ایمان صفا بازیگر توانمند تئاتر، سینما و شبکه نمایش خانگی."
      },
      {
        name: "الناز حبیبی",
        english_name: "Elnaz Habibi",
        character: "فرنگیس",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Elnaz_Habibi_2020.jpg/440px-Elnaz_Habibi_2020.jpg",
        biography: "الناز حبیبی بازیگر نامزد سیمرغ بلورین جشنواره فیلم فجر."
      }
    ]),
    is_favorite: false
  },
  {
    message_id: 107,
    title: "جوان",
    english_title: "Jawan",
    description: "مردی که به دنبال اصلاح اشتباهات جامعه و انتقام از گذشته‌اش است، با یک افسر پلیس سرسخت روبرو می‌شود.",
    poster_url: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    year: "2023",
    genre: "اکشن | هیجان انگیز",
    rating: "7.2",
    country: "هند",
    actors: "شاهرخ خان، نایانتارا، ویجی ستوپاتی، دیپیکا پادوکونه",
    quality: "1080p Full HD",
    channel: "redchillies",
    timestamp: 1712000000000,
    category: "indian_movies",
    box_office: "$140,000,000 (فروش جهانی)",
    imdb_id: "tt15354916",
    trailer_url: "https://www.youtube.com/watch?v=MWOlnZSnXJo",
    actor_photos: JSON.stringify([
      {
        name: "شاهرخ خان",
        english_name: "Shah Rukh Khan",
        character: "Vikram Rathore / Azad",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg/440px-Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg",
        biography: "شاهرخ خان، پادشاه بالیوود، برنده ۱۴ جایزه فیلم‌فیر و یکی از موفق‌ترین ستارگان تاریخ سینما."
      },
      {
        name: "دیپیکا پادوکونه",
        english_name: "Deepika Padukone",
        character: "Aishwarya Rathore",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Deepika_Padukone_Cannes_2019.jpg/440px-Deepika_Padukone_Cannes_2019.jpg",
        biography: "دیپیکا پادوکونه ستاره بین‌المللی هند و برنده چندین جایزه فیلم‌فیر."
      },
      {
        name: "نایانتارا",
        english_name: "Nayanthara",
        character: "Narmada Rai",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Nayanthara_at_SIIMA_2016.jpg/440px-Nayanthara_at_SIIMA_2016.jpg",
        biography: "نایانتارا معروف به بانوی اول سینمای هند جنوبی."
      },
      {
        name: "ویجی ستوپاتی",
        english_name: "Vijay Sethupathi",
        character: "Kalee Gaikwad",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Vijay_Sethupathi_at_Jawan_Pre_Release_Event.jpg/440px-Vijay_Sethupathi_at_Jawan_Pre_Release_Event.jpg",
        biography: "ویجی ستوپاتی برنده جایزه ملی فیلم هند و از برجسته‌ترین بازیگران سینمای تامیل."
      }
    ]),
    is_favorite: false
  },
  {
    message_id: 108,
    title: "پاندای کونگ‌فوکار ۴",
    english_title: "Kung Fu Panda 4",
    description: "پو پس از سال‌ها مبارزه با شروران بزرگ، قرار است رهبر معنوی دره صلح شود، اما قبل از آن باید جانشین خود را پیدا کند و با دشمن جدیدی به نام آفتاب‌پرست روبرو شود.",
    poster_url: "https://image.tmdb.org/t/p/w780/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
    year: "2024",
    genre: "انیمیشن | کمدی | خانوادگی | اکشن",
    rating: "7.4",
    country: "آمریکا",
    actors: "جک بلک، آکوافینا، وایولا دیویس، داستین هافمن",
    quality: "4K UHD",
    channel: "dreamworks",
    timestamp: 1711500000000,
    category: "children",
    box_office: "$548,500,000 (فروش جهانی)",
    imdb_id: "tt21692408",
    trailer_url: "https://www.youtube.com/watch?v=_inKs4eeHiI",
    actor_photos: JSON.stringify([
      {
        name: "جک بلک",
        english_name: "Jack Black",
        character: "Po (پو)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Jack_Black_2019.jpg/440px-Jack_Black_2019.jpg",
        biography: "جک بلک کمدین و صداپیشه جاودانه شخصیت پو."
      },
      {
        name: "آکوافینا",
        english_name: "Awkwafina",
        character: "Zhen (ژِن)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Awkwafina_2019.jpg/440px-Awkwafina_2019.jpg",
        biography: "آکوافینا بازیگر برنده گلدن گلوب."
      },
      {
        name: "وایولا دیویس",
        english_name: "Viola Davis",
        character: "The Chameleon",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Viola_Davis_by_Gage_Skidmore.jpg/440px-Viola_Davis_by_Gage_Skidmore.jpg",
        biography: "وایولا دیویس برنده اسکار، امی، تونی و گرمی."
      },
      {
        name: "داستین هافمن",
        english_name: "Dustin Hoffman",
        character: "Master Shifu (استاد شیفو)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Dustin_Hoffman_2017.jpg/440px-Dustin_Hoffman_2017.jpg",
        biography: "داستین هافمن برنده ۲ جایزه اسکار و اسطوره بازیگری تاریخ سینما."
      }
    ]),
    is_favorite: false
  },
  {
    message_id: 109,
    title: "شورگان",
    english_title: "Shōgun",
    description: "در ژاپن سال ۱۶۰۰ در آستانه یک جنگ داخلی تاریخی، لرد توراناگا برای بقای خود با اتحادهای خطرناک و سرنوشت‌ساز مبارزه می‌کند.",
    poster_url: "https://image.tmdb.org/t/p/w780/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg",
    year: "2024",
    genre: "درام | تاریخی | اکشن",
    rating: "8.8",
    country: "آمریکا",
    actors: "هیرویوکی سانادا، کازمو جارویس، آنا ساوای",
    quality: "4K UHD",
    channel: "fx",
    timestamp: 1711000000000,
    category: "foreign_series",
    box_office: "برنده ۱۸ جایزه امی (شاهکار تاریخی ۲۰۲۴)",
    imdb_id: "tt2798648",
    trailer_url: "https://www.youtube.com/watch?v=yAN5uspO_hk",
    actor_photos: JSON.stringify([
      {
        name: "هیرویوکی سانادا",
        english_name: "Hiroyuki Sanada",
        character: "Lord Yoshii Toranaga (لرد توراناگا)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Hiroyuki_Sanada_20240220.jpg",
        biography: "هیرویوکی سانادا برنده جایزه امی بهترین بازیگر نقش اول مرد برای سریال شورگان."
      },
      {
        name: "آنا ساوای",
        english_name: "Anna Sawai",
        character: "Toda Mariko (تودا ماریکو)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Anna_Sawai_from_Sidewalks_Entertainment_2024_%28cropped%29.jpg",
        biography: "آنا ساوای نخستین زن آسیایی برنده جایزه امی درام."
      },
      {
        name: "کازمو جارویس",
        english_name: "Cosmo Jarvis",
        character: "John Blackthorne (جان بلک‌تورن)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Cosmo_Jarvis_at_the_Shogun_Tokyo_Premiere_February_2024_%28cropped%29.jpg",
        biography: "کازمو جارویس بازیگر و موسیقیدان بریتانیایی در نقش دریانورد انگلیسی."
      },
      {
        name: "تادانوبو آسانو",
        english_name: "Tadanobu Asano",
        character: "Kashigi Yabushige (یابوشیگه)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg/440px-Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg",
        biography: "تادانوبو آسانو نامزد جایزه امی و بازیگر تحسین‌شده ژاپنی."
      }
    ]),
    is_favorite: true
  },
  {
    message_id: 110,
    title: "میان‌ستاره‌ای",
    english_title: "Interstellar",
    description: "در آینده‌ای که زمین به دلیل طوفان‌های غبار و نابودی محصولات کشاورزی غیرقابل سکونت شده است، تیمی از فضانوردان شجاع از طریق یک کرم‌چاله در نزدیکی زحل به کهکشانی ناشناخته سفر می‌کنند تا سیاره‌ای جدید برای بقای بشریت بیابند.",
    poster_url: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    year: "2014",
    genre: "علمی تخیلی | درام | ماجراجویی",
    rating: "8.7",
    country: "آمریکا / انگلستان",
    actors: "متیو مک‌کانهی، ان هاتاوی، جسیکا چستین، مایکل کین، مت دیمون، تیموتی شالامی، مکنزی فوی",
    quality: "4K IMAX UHD",
    channel: "paramount",
    timestamp: 1710000000000,
    category: "foreign_movies",
    box_office: "$773,800,000 (فروش جهانی)",
    imdb_id: "tt0816692",
    trailer_url: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    movie_stills: JSON.stringify([
      "https://image.tmdb.org/t/p/w780/rAiYTua5VoEgACVzbUmBg7rAzUt.jpg",
      "https://image.tmdb.org/t/p/w780/xJHokMbljvjADYdit5fK5VQsXEG.jpg"
    ]),
    actor_photos: JSON.stringify([
      {
        name: "Matthew McConaughey",
        english_name: "Matthew McConaughey",
        character: "Joseph Cooper (کوپر)",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
        biography: "متیو مک‌کانهی برنده اسکار برای باشگاه خریداران دالاس و بازیگر نقش جاودانه کوپر در میان‌ستاره‌ای."
      },
      {
        name: "Anne Hathaway",
        english_name: "Anne Hathaway",
        character: "Dr. Amelia Brand (دکتر برند)",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
        biography: "ان هاتاوی برنده جایزه اسکار و گلدن گلوب."
      },
      {
        name: "Jessica Chastain",
        english_name: "Jessica Chastain",
        character: "Murphy Cooper (مورف)",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
        biography: "جسیکا چستین برنده جایزه اسکار بهترین بازیگر زن."
      },
      {
        name: "Michael Caine",
        english_name: "Michael Caine",
        character: "Professor John Brand",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80",
        biography: "سر مایکل کین اسطوره سینمای بریتانیا و برنده ۲ اسکار."
      },
      {
        name: "Matt Damon",
        english_name: "Matt Damon",
        character: "Dr. Mann",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Matt_Damon_TIFF_2015.jpg/440px-Matt_Damon_TIFF_2015.jpg",
        biography: "مت دیمون ستاره برنده اسکار در نقش دکتر من."
      },
      {
        name: "Timothée Chalamet",
        english_name: "Timothée Chalamet",
        character: "Tom Cooper (نوجوانی)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg/440px-Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg",
        biography: "تیموتی شالامی در نقش تام نوجوان."
      }
    ]),
    is_favorite: true
  },
  {
    message_id: 111,
    title: "تلقین",
    english_title: "Inception",
    description: "یک دزد ماهر که اسرار باارزش را از اعماق ضمیر ناخودآگاه در هنگام خواب استخراج می‌کند، ماموریتی برعکس دریافت می‌کند: کاشتن یک ایده در ذهن وارث یک شرکت بزرگ.",
    poster_url: "https://image.tmdb.org/t/p/w780/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    year: "2010",
    genre: "علمی تخیلی | اکشن | هیجان‌انگیز",
    rating: "8.8",
    country: "آمریکا",
    actors: "لئوناردو دی‌کاپریو، جوزف گوردون لویت، الیوت پیج، تام هاردی، کن واتانابه، کیلین مورفی، ماریون کوتیار",
    quality: "4K UHD",
    channel: "warner",
    timestamp: 1709500000000,
    category: "foreign_movies",
    box_office: "$839,000,000 (فروش جهانی)",
    imdb_id: "tt1375666",
    trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    actor_photos: JSON.stringify([
      {
        name: "Leonardo DiCaprio",
        english_name: "Leonardo DiCaprio",
        character: "Dom Cobb (دام کاب)",
        photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80",
        biography: "لئوناردو دی‌کاپریو برنده جایزه اسکار و ستاره شاهکار تلقین."
      },
      {
        name: "Joseph Gordon-Levitt",
        english_name: "Joseph Gordon-Levitt",
        character: "Arthur (آرتور)",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
        biography: "جوزف گوردون لویت ستاره نقش آرتور."
      },
      {
        name: "Tom Hardy",
        english_name: "Tom Hardy",
        character: "Eames (ایمز)",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
        biography: "تام هاردی بازیگر بریتانیایی و نامزد اسکار."
      },
      {
        name: "Elliot Page",
        english_name: "Elliot Page",
        character: "Ariadne (آریادنه)",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
        biography: "الیوت پیج نامزد اسکار در نقش معمار رویا."
      },
      {
        name: "Cillian Murphy",
        english_name: "Cillian Murphy",
        character: "Robert Fischer",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cillian_Murphy_Press_Conference_2024.jpg/440px-Cillian_Murphy_Press_Conference_2024.jpg",
        biography: "کیلین مورفی برنده اسکار در نقش فیشر."
      }
    ]),
    is_favorite: true
  },
  {
    message_id: 112,
    title: "جدایی نادر از سیمین",
    english_title: "A Separation",
    description: "زوجی در آستانه جدایی هستند و برای خروج از کشور و سرنوشت دخترشان اختلاف دارند. با ورود یک پرستار باردار به خانه برای مراقبت از پدر بیمار، زنجیره‌ای از حوادث پیش‌بینی نشده آغاز می‌شود.",
    poster_url: "https://image.tmdb.org/t/p/w780/69iI79ymSL29EZi19vWfC0r1iQ7.jpg",
    year: "1389",
    genre: "درام | اجتماعی | معمایی",
    rating: "8.3",
    country: "ایران",
    actors: "پیمان معادی، لیلا حاتمی، شهاب حسینی، ساره بیات، مریلا زارعی، بابک کریمی، سارینا فرهادی",
    quality: "1080p Full HD",
    channel: "filimo",
    timestamp: 1709000000000,
    category: "iranian_movies",
    box_office: "برنده نخستین جایزه اسکار تاریخ سینمای ایران و خرس طلای برلین",
    imdb_id: "tt1832382",
    trailer_url: "https://www.youtube.com/watch?v=58Onuy5USTc",
    actor_photos: JSON.stringify([
      {
        name: "پیمان معادی",
        english_name: "Payman Maadi",
        character: "نادر",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Payman_Maadi_at_Berlinale_2020.jpg/440px-Payman_Maadi_at_Berlinale_2020.jpg",
        biography: "پیمان معادی برنده خرس نقره‌ای برلین."
      },
      {
        name: "لیلا حاتمی",
        english_name: "Leila Hatami",
        character: "سیمین",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
        biography: "لیلا حاتمی برنده خرس نقره‌ای برلین و سیمرغ فجر."
      },
      {
        name: "شهاب حسینی",
        english_name: "Shahab Hosseini",
        character: "حجت",
        photo: "https://upload.wikimedia.org/wikipedia/commons/4/42/Shahab_Hosseini_20250202_%28cropped%29.jpg",
        biography: "شهاب حسینی برنده نخل طلای کن و خرس نقره‌ای برلین."
      },
      {
        name: "ساره بیات",
        english_name: "Sareh Bayat",
        character: "راضیه",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
        biography: "ساره بیات برنده خرس نقره‌ای گروهی برلین."
      },
      {
        name: "مریلا زارعی",
        english_name: "Merila Zare'i",
        character: "خانم قهرایی",
        photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
        biography: "مریلا زارعی برنده ۳ سیمرغ بلورین فجر."
      }
    ]),
    is_favorite: true
  },
  {
    message_id: 113,
    title: "شهرزاد",
    english_title: "Shahrzad",
    description: "روایتی عاشقانه و پرتعلیق در بستر وقایع تاریخی کودتای ۲۸ مرداد سال ۱۳۳۲ در تهران، که در آن عشق پاک میان شهرزاد دانشجوی پزشکی و فرهاد دانشجوی روزنامه‌نگاری با دخالت بزرگ‌آقا دستخوش طوفانی از حوادث می‌شود.",
    poster_url: "https://image.tmdb.org/t/p/w780/8U2tW49p4YpA0o27eS7lZ42cE6C.jpg",
    year: "1394",
    genre: "درام | تاریخی | عاشقانه | جنایی",
    rating: "8.2",
    country: "ایران",
    actors: "ترانه علیدوستی، شهاب حسینی، علی نصیریان، مصطفی زمانی، پریناز ایزدیار، مهدی سلطانی، محمود پاک‌نیت، گلاره عباسی",
    quality: "1080p Full HD",
    channel: "shahrzad",
    timestamp: 1708500000000,
    category: "iranian_series",
    box_office: "محبوب‌ترین سریال تاریخ شبکه نمایش خانگی ایران",
    imdb_id: "tt5332732",
    trailer_url: "https://www.youtube.com/watch?v=DjyOdsSmSnA",
    actor_photos: JSON.stringify([
      {
        name: "ترانه علیدوستی",
        english_name: "Taraneh Alidoosti",
        character: "شهرزاد سعادت",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
        biography: "ترانه علیدوستی ستاره نقش ماندگار شهرزاد."
      },
      {
        name: "شهاب حسینی",
        english_name: "Shahab Hosseini",
        character: "قباد دیوان‌سالار",
        photo: "https://upload.wikimedia.org/wikipedia/commons/4/42/Shahab_Hosseini_20250202_%28cropped%29.jpg",
        biography: "شهاب حسینی با بازی در نقش قباد دیوان‌سالار برنده تندیس حافظ شد."
      },
      {
        name: "علی نصیریان",
        english_name: "Ali Nasirian",
        character: "بزرگ آقا دیوان‌سالار",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80",
        biography: "استاد علی نصیریان اسطوره بی‌بدیل سینما و تئاتر ایران."
      },
      {
        name: "مصطفی زمانی",
        english_name: "Mostafa Zamani",
        character: "فرهاد دماوندی",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
        biography: "مصطفی زمانی در نقش فرهاد دماوندی عاشق دل‌سوخته شهرزاد."
      },
      {
        name: "پریناز ایزدیار",
        english_name: "Parinaz Izadyar",
        character: "شیرین دیوان‌سالار",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
        biography: "پریناز ایزدیار برنده سیمرغ فجر و تندیس حافظ برای شهرزاد."
      },
      {
        name: "مهدی سلطانی",
        english_name: "Mehdi Soltani",
        character: "هاشم دماوندی",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
        biography: "دکتر مهدی سلطانی بازیگر و مدرس سینما و تئاتر."
      }
    ]),
    is_favorite: true
  },
  {
    message_id: 114,
    title: "برکینگ بد",
    english_title: "Breaking Bad",
    description: "یک معلم شیمی دبیرستان پس از تشخیص سرطان ریه در مرحله پایانی، برای تأمین آینده مالی خانواده‌اش با کمک شاگرد سابق خود وارد دنیای تاریک تولید و فروش مت‌آمفتامین با خلوص بالا می‌شود.",
    poster_url: "https://image.tmdb.org/t/p/w780/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    year: "2008-2013",
    genre: "جنایی | درام | هیجان انگیز",
    rating: "9.5",
    country: "آمریکا",
    actors: "برایان کرانستون، آرون پال، آنا گان، دین نوریس، باب اودنکرک، جانکارلو اسپوزیتو، جاناتان بنکس",
    quality: "4K UHD",
    channel: "amc",
    timestamp: 1708000000000,
    category: "foreign_series",
    box_office: "برنده ۱۶ جایزه امی و بالاترین امتیاز سریال تاریخ در گینس (۹.۵)",
    imdb_id: "tt0903747",
    trailer_url: "https://www.youtube.com/watch?v=HhesaQXLuRY",
    actor_photos: JSON.stringify([
      {
        name: "Bryan Cranston",
        english_name: "Bryan Cranston",
        character: "Walter White / Heisenberg",
        photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80",
        biography: "برایان کرانستون برنده ۴ جایزه امی برای هایزنبرگ."
      },
      {
        name: "Aaron Paul",
        english_name: "Aaron Paul",
        character: "Jesse Pinkman",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
        biography: "آرون پال برنده ۳ جایزه امی پرایم‌تایم."
      },
      {
        name: "Bob Odenkirk",
        english_name: "Bob Odenkirk",
        character: "Saul Goodman",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80",
        biography: "باب اودنکرک ستاره برکینگ بد و Better Call Saul."
      },
      {
        name: "Giancarlo Esposito",
        english_name: "Giancarlo Esposito",
        character: "Gus Fring",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
        biography: "جانکارلو اسپوزیتو در نقش گاس فرینگ رئیس کارتل."
      }
    ]),
    is_favorite: true
  },
  {
    message_id: 115,
    title: "درون و بیرون ۲",
    english_title: "Inside Out 2",
    description: "رایلی به سن نوجوانی و بلوغ می‌رسد و ذهن او دستخوش تغییری ناگهانی می‌شود؛ جایی که احساسات قدیمی (شادی، غم، خشم، ترس، نفرت) با ورود احساسات کاملاً جدیدی از جمله «اضطراب»، «حسادت»، «کسالت» و «خجالت» روبرو می‌شوند.",
    poster_url: "https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    year: "2024",
    genre: "انیمیشن | ماجراجویی | کمدی | خانوادگی",
    rating: "7.7",
    country: "آمریکا",
    actors: "امی پولر، مایا هاوک، فیلیس اسمیت، لوئیس بلک، ایو ادبیری، تونی هیل",
    quality: "4K UHD",
    channel: "pixar",
    timestamp: 1707500000000,
    category: "children",
    box_office: "$1,698,000,000 (پرفروش‌ترین انیمیشن تاریخ جهان)",
    imdb_id: "tt22022452",
    trailer_url: "https://www.youtube.com/watch?v=LEjhY15eCx0",
    actor_photos: JSON.stringify([
      {
        name: "Amy Poehler",
        english_name: "Amy Poehler",
        character: "Joy (شادی)",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
        biography: "امی پولر کمدین برنده گلدن گلوب و صداپیشه شادی."
      },
      {
        name: "Maya Hawke",
        english_name: "Maya Hawke",
        character: "Anxiety (اضطراب)",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
        biography: "مایا هاوک صداپیشه شخصیت جذاب اضطراب."
      },
      {
        name: "Phyllis Smith",
        english_name: "Phyllis Smith",
        character: "Sadness (غم)",
        photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
        biography: "فیلیس اسمیت صداپیشه ماندگار غم در پیکسار."
      },
      {
        name: "Ayo Edebiri",
        english_name: "Ayo Edebiri",
        character: "Envy (حسادت)",
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80",
        biography: "ایو ادبیری برنده جوایز امی و گلدن گلوب."
      }
    ]),
    is_favorite: true
  }
];

export const INITIAL_BOX_OFFICE: BoxOfficeEntry[] = [
  {
    message_id: 101,
    title: "اوپنهایمر (Oppenheimer)",
    english_title: "Oppenheimer",
    poster_url: "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    box_office_value: 957800000,
    box_office_label: "$957,800,000",
    category: "foreign_movies",
    rating: "8.9",
    year: "2023",
    imdb_id: "tt15398776",
    budget: "$100,000,000",
    roi_percentage: 857,
    country: "آمریکا / انگلستان",
    rank: 1
  },
  {
    message_id: 102,
    title: "تل‌ماسه: بخش دو (Dune: Part Two)",
    english_title: "Dune: Part Two",
    poster_url: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    box_office_value: 711844358,
    box_office_label: "$711,844,358",
    category: "foreign_movies",
    rating: "8.6",
    year: "2024",
    imdb_id: "tt15239678",
    budget: "$190,000,000",
    roi_percentage: 274,
    country: "آمریکا / کانادا",
    rank: 2
  },
  {
    message_id: 108,
    title: "پاندای کونگ‌فوکار ۴ (Kung Fu Panda 4)",
    english_title: "Kung Fu Panda 4",
    poster_url: "https://image.tmdb.org/t/p/w780/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
    box_office_value: 548500000,
    box_office_label: "$548,500,000",
    category: "children",
    rating: "7.4",
    year: "2024",
    imdb_id: "tt21692408",
    budget: "$85,000,000",
    roi_percentage: 545,
    country: "آمریکا / چین",
    rank: 3
  },
  {
    message_id: 106,
    title: "فسیل (Fossil)",
    english_title: "Fossil",
    poster_url: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&auto=format&fit=crop&q=80",
    box_office_value: 324000000,
    box_office_label: "۳۲۴ میلیارد تومان (رکورد گیشه سینمای ایران)",
    category: "iranian_movies",
    rating: "7.8",
    year: "1402",
    imdb_id: "tt27050012",
    budget: "۱۵ میلیارد تومان",
    roi_percentage: 2060,
    country: "ایران",
    rank: 4
  },
  {
    message_id: 107,
    title: "جوان (Jawan)",
    english_title: "Jawan",
    poster_url: "https://image.tmdb.org/t/p/w780/jVo5Z8Pq0mN4x9k7P1v9ZkW5Z8.jpg",
    box_office_value: 140000000,
    box_office_label: "$140,000,000",
    category: "indian_movies",
    rating: "7.2",
    year: "2023",
    imdb_id: "tt15354916",
    budget: "$36,000,000",
    roi_percentage: 288,
    country: "هند",
    rank: 5
  },
  {
    message_id: 109,
    title: "شوگان (Shōgun)",
    english_title: "Shōgun",
    poster_url: "https://image.tmdb.org/t/p/w780/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg",
    box_office_value: 95000000,
    box_office_label: "برنده ۱۸ جایزه امی (پربیننده‌ترین سریال تاریخی ۲۰۲۴)",
    category: "foreign_series",
    rating: "8.8",
    year: "2024",
    imdb_id: "tt2798648",
    budget: "$250,000,000",
    roi_percentage: 100,
    country: "آمریکا / ژاپن",
    rank: 6
  },
  {
    message_id: 103,
    title: "پوست شیر (The Lion Skin)",
    english_title: "The Lion Skin",
    poster_url: "https://image.tmdb.org/t/p/w780/m9f0Q0Zp0y47pW1f9ZkX6V2b7q.jpg",
    box_office_value: 80000000,
    box_office_label: "پربیننده‌ترین سریال شبکه نمایش خانگی سال",
    category: "iranian_series",
    rating: "8.4",
    year: "1401",
    imdb_id: "tt22440938",
    budget: "تولید اختصاصی فیلم‌نت",
    roi_percentage: 350,
    country: "ایران",
    rank: 7
  }
];

export const INITIAL_TRACKING: TrackingItem[] = [];
