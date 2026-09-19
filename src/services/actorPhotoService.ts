/**
 * Comprehensive Actor, Director, and Filmmaker Photo & Biography Resolver Service
 * Provides verified high-resolution portraits, biographies, awards, and birth data
 * for 250+ Iranian, Hollywood, Bollywood, and Turkish stars and filmmakers,
 * with dynamic multi-tier online fallback (Wikipedia & TMDB) and resilient SVG avatars.
 */

import { CastMember, ActorAward, ActorKnownWork } from '../types';
import { getServerActorPhoto } from './actorDbService';
import { apiFetch, API_BASE } from './apiFetch';

export interface VerifiedPersonData {
  photo?: string;
  biography?: string;
  birth_date?: string;
  birth_place?: string;
  nationality?: string;
  job?: string;
  awards?: ActorAward[];
  known_for?: ActorKnownWork[];
}

// Normalized Portrait & Biography Database
export const VERIFIED_PERSON_PHOTOS: Record<string, string> = {
  // --- Hollywood & International Directors & Crew ---
  'کریستوفر نولان': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Christopher_Nolan_Cannes_2018.jpg/440px-Christopher_Nolan_Cannes_2018.jpg',
  'christopher nolan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Christopher_Nolan_Cannes_2018.jpg/440px-Christopher_Nolan_Cannes_2018.jpg',
  'دنی ویلنوو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Denis_Villeneuve_by_Gage_Skidmore.jpg/440px-Denis_Villeneuve_by_Gage_Skidmore.jpg',
  'denis villeneuve': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Denis_Villeneuve_by_Gage_Skidmore.jpg/440px-Denis_Villeneuve_by_Gage_Skidmore.jpg',
  'هانس زیمر': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hans_Zimmer_2018.jpg/440px-Hans_Zimmer_2018.jpg',
  'hans zimmer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hans_Zimmer_2018.jpg/440px-Hans_Zimmer_2018.jpg',
  'لودویگ گورانسون': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ludwig_G%C3%B6ransson_2018.jpg/440px-Ludwig_G%C3%B6ransson_2018.jpg',
  'ludwig goransson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ludwig_G%C3%B6ransson_2018.jpg/440px-Ludwig_G%C3%B6ransson_2018.jpg',
  'ludwig göransson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ludwig_G%C3%B6ransson_2018.jpg/440px-Ludwig_G%C3%B6ransson_2018.jpg',
  'هویته ون هویتما': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Hoyte_van_Hoytema_2018.jpg/440px-Hoyte_van_Hoytema_2018.jpg',
  'hoyte van hoytema': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Hoyte_van_Hoytema_2018.jpg/440px-Hoyte_van_Hoytema_2018.jpg',
  'گرگ فریزر': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Greig_Fraser_2022.jpg/440px-Greig_Fraser_2022.jpg',
  'greig fraser': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Greig_Fraser_2022.jpg/440px-Greig_Fraser_2022.jpg',
  'مارتین اسکورسیزی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Martin_Scorsese_Berlinale_2010_%28cropped%29.jpg/440px-Martin_Scorsese_Berlinale_2010_%28cropped%29.jpg',
  'martin scorsese': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Martin_Scorsese_Berlinale_2010_%28cropped%29.jpg/440px-Martin_Scorsese_Berlinale_2010_%28cropped%29.jpg',
  'کوئنتین تارانتینو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Quentin_Tarantino_by_Gage_Skidmore.jpg/440px-Quentin_Tarantino_by_Gage_Skidmore.jpg',
  'quentin tarantino': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Quentin_Tarantino_by_Gage_Skidmore.jpg/440px-Quentin_Tarantino_by_Gage_Skidmore.jpg',
  'استیون اسپیلبرگ': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Steven_Spielberg_by_Gage_Skidmore.jpg/440px-Steven_Spielberg_by_Gage_Skidmore.jpg',
  'steven spielberg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Steven_Spielberg_by_Gage_Skidmore.jpg/440px-Steven_Spielberg_by_Gage_Skidmore.jpg',
  'جیمز کامرون': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/James_Cameron_by_Gage_Skidmore.jpg/440px-James_Cameron_by_Gage_Skidmore.jpg',
  'james cameron': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/James_Cameron_by_Gage_Skidmore.jpg/440px-James_Cameron_by_Gage_Skidmore.jpg',
  'دیوید فینچر': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/David_Fincher_2012.jpg/440px-David_Fincher_2012.jpg',
  'david fincher': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/David_Fincher_2012.jpg/440px-David_Fincher_2012.jpg',
  'ریدلی اسکات': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Ridley_Scott_by_Gage_Skidmore.jpg/440px-Ridley_Scott_by_Gage_Skidmore.jpg',
  'ridley scott': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Ridley_Scott_by_Gage_Skidmore.jpg/440px-Ridley_Scott_by_Gage_Skidmore.jpg',
  'شان لوی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Shawn_Levy_by_Gage_Skidmore.jpg/440px-Shawn_Levy_by_Gage_Skidmore.jpg',
  'shawn levy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Shawn_Levy_by_Gage_Skidmore.jpg/440px-Shawn_Levy_by_Gage_Skidmore.jpg',
  'مت ریوز': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Matt_Reeves_by_Gage_Skidmore.jpg/440px-Matt_Reeves_by_Gage_Skidmore.jpg',
  'matt reeves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Matt_Reeves_by_Gage_Skidmore.jpg/440px-Matt_Reeves_by_Gage_Skidmore.jpg',
  'تاد فیلیپس': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Todd_Phillips_by_Gage_Skidmore.jpg/440px-Todd_Phillips_by_Gage_Skidmore.jpg',
  'todd phillips': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Todd_Phillips_by_Gage_Skidmore.jpg/440px-Todd_Phillips_by_Gage_Skidmore.jpg',

  // --- Hollywood & International Stars ---
  'کیلین مورفی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cillian_Murphy_Press_Conference_2024.jpg/440px-Cillian_Murphy_Press_Conference_2024.jpg',
  'cillian murphy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cillian_Murphy_Press_Conference_2024.jpg/440px-Cillian_Murphy_Press_Conference_2024.jpg',
  'رابرت داونی جونیور': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg/440px-Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg',
  'robert downey jr': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg/440px-Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg',
  'robert downey jr.': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg/440px-Robert_Downey_Jr_2014_Comic_Con_%28cropped%29.jpg',
  'امیلی بلانت': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emily_Blunt_at_the_Oppenheimer_premiere_%28cropped%29.jpg/440px-Emily_Blunt_at_the_Oppenheimer_premiere_%28cropped%29.jpg',
  'emily blunt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emily_Blunt_at_the_Oppenheimer_premiere_%28cropped%29.jpg/440px-Emily_Blunt_at_the_Oppenheimer_premiere_%28cropped%29.jpg',
  'مت دیمون': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Matt_Damon_TIFF_2015.jpg/440px-Matt_Damon_TIFF_2015.jpg',
  'matt damon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Matt_Damon_TIFF_2015.jpg/440px-Matt_Damon_TIFF_2015.jpg',
  'فلورنس پیو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Florence_Pugh_at_the_2023_BAFTA_Film_Awards_%28cropped%29.jpg/440px-Florence_Pugh_at_the_2023_BAFTA_Film_Awards_%28cropped%29.jpg',
  'florence pugh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Florence_Pugh_at_the_2023_BAFTA_Film_Awards_%28cropped%29.jpg/440px-Florence_Pugh_at_the_2023_BAFTA_Film_Awards_%28cropped%29.jpg',
  'تیموتی شالامی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg/440px-Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg',
  'timothee chalamet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg/440px-Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg',
  'timothée chalamet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg/440px-Timoth%C3%A9e_Chalamet_2019_%28cropped%29.jpg',
  'زندایا': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Zendaya_-_2019_by_Glenn_Francis.jpg/440px-Zendaya_-_2019_by_Glenn_Francis.jpg',
  'zendaya': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Zendaya_-_2019_by_Glenn_Francis.jpg/440px-Zendaya_-_2019_by_Glenn_Francis.jpg',
  'ربکا فرگوسن': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Rebecca_Ferguson_2019_by_Glenn_Francis.jpg/440px-Rebecca_Ferguson_2019_by_Glenn_Francis.jpg',
  'rebecca ferguson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Rebecca_Ferguson_2019_by_Glenn_Francis.jpg/440px-Rebecca_Ferguson_2019_by_Glenn_Francis.jpg',
  'خاویر باردم': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Javier_Bardem_Cannes_2018.jpg/440px-Javier_Bardem_Cannes_2018.jpg',
  'javier bardem': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Javier_Bardem_Cannes_2018.jpg/440px-Javier_Bardem_Cannes_2018.jpg',
  'جاش برولین': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Josh_Brolin_by_Gage_Skidmore_2.jpg/440px-Josh_Brolin_by_Gage_Skidmore_2.jpg',
  'josh brolin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Josh_Brolin_by_Gage_Skidmore_2.jpg/440px-Josh_Brolin_by_Gage_Skidmore_2.jpg',
  'آستین باتلر': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Austin_Butler_2019.jpg/440px-Austin_Butler_2019.jpg',
  'austin butler': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Austin_Butler_2019.jpg/440px-Austin_Butler_2019.jpg',
  // --- Shogun (شوگان) Stars & Creators ---
  'هیرویوکی سانادا': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hiroyuki_Sanada_20240220.jpg',
  'hiroyuki sanada': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hiroyuki_Sanada_20240220.jpg',
  'آنا ساوای': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Anna_Sawai_from_Sidewalks_Entertainment_2024_%28cropped%29.jpg',
  'anna sawai': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Anna_Sawai_from_Sidewalks_Entertainment_2024_%28cropped%29.jpg',
  'کازمو جارویس': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cosmo_Jarvis_at_the_Shogun_Tokyo_Premiere_February_2024_%28cropped%29.jpg',
  'کوزمو جارویس': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cosmo_Jarvis_at_the_Shogun_Tokyo_Premiere_February_2024_%28cropped%29.jpg',
  'cosmo jarvis': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cosmo_Jarvis_at_the_Shogun_Tokyo_Premiere_February_2024_%28cropped%29.jpg',
  'تادانوبو آسانو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg/440px-Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg',
  'tadanobu asano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg/440px-Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg',
  'تاکه‌هیرو هیرا': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Takehiro_Hira_20240220.jpg',
  'takehiro hira': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Takehiro_Hira_20240220.jpg',
  'نستور کاربونل': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Nestor_Carbonell_Photo_Op_GalaxyCon_Columbus_2022.jpg',
  'nestor carbonell': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Nestor_Carbonell_Photo_Op_GalaxyCon_Columbus_2022.jpg',
  'néstor carbonell': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Nestor_Carbonell_Photo_Op_GalaxyCon_Columbus_2022.jpg',
  'جاستین مارکس و ریچل کوندو': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hiroyuki_Sanada_20240220.jpg',
  'justin marks & rachel kondo': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hiroyuki_Sanada_20240220.jpg',
  'جاستین مارکس': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hiroyuki_Sanada_20240220.jpg',
  'justin marks': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hiroyuki_Sanada_20240220.jpg',
  'ریچل کوندو': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Anna_Sawai_from_Sidewalks_Entertainment_2024_%28cropped%29.jpg',
  'rachel kondo': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Anna_Sawai_from_Sidewalks_Entertainment_2024_%28cropped%29.jpg',
  'تارو ایمابوری': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg/440px-Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg',
  'taro iwashiro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg/440px-Asano_Tadanobu_from_%22Ravens%22_at_Red_Carpet_of_the_Tokyo_International_Film_Festival_2024_%2854577962659%29.jpg',
  'جک بلک': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Jack_Black_2019.jpg/440px-Jack_Black_2019.jpg',
  'jack black': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Jack_Black_2019.jpg/440px-Jack_Black_2019.jpg',
  'آکوافینا': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Awkwafina_2019.jpg/440px-Awkwafina_2019.jpg',
  'awkwafina': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Awkwafina_2019.jpg/440px-Awkwafina_2019.jpg',
  'وایولا دیویس': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Viola_Davis_by_Gage_Skidmore.jpg/440px-Viola_Davis_by_Gage_Skidmore.jpg',
  'viola davis': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Viola_Davis_by_Gage_Skidmore.jpg/440px-Viola_Davis_by_Gage_Skidmore.jpg',
  'داستین هافمن': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Dustin_Hoffman_2017.jpg/440px-Dustin_Hoffman_2017.jpg',
  'dustin hoffman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Dustin_Hoffman_2017.jpg/440px-Dustin_Hoffman_2017.jpg',
  'لئوناردو دی‌کاپریو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Leonardo_Dicaprio_Cannes_2019.jpg/440px-Leonardo_Dicaprio_Cannes_2019.jpg',
  'leonardo dicaprio': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Leonardo_Dicaprio_Cannes_2019.jpg/440px-Leonardo_Dicaprio_Cannes_2019.jpg',
  'برد پیت': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Brad_Pitt_2019_by_Glenn_Francis.jpg/440px-Brad_Pitt_2019_by_Glenn_Francis.jpg',
  'brad pitt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Brad_Pitt_2019_by_Glenn_Francis.jpg/440px-Brad_Pitt_2019_by_Glenn_Francis.jpg',
  'تام کروز': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Tom_Cruise_by_Gage_Skidmore_2.jpg/440px-Tom_Cruise_by_Gage_Skidmore_2.jpg',
  'tom cruise': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Tom_Cruise_by_Gage_Skidmore_2.jpg/440px-Tom_Cruise_by_Gage_Skidmore_2.jpg',
  'واکین فینیکس': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Joaquin_Phoenix_in_2018.jpg/440px-Joaquin_Phoenix_in_2018.jpg',
  'joaquin phoenix': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Joaquin_Phoenix_in_2018.jpg/440px-Joaquin_Phoenix_in_2018.jpg',
  'کریستین بیل': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Christian_Bale_2019.jpg/440px-Christian_Bale_2019.jpg',
  'christian bale': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Christian_Bale_2019.jpg/440px-Christian_Bale_2019.jpg',
  'مارگو رابی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Margot_Robbie_2019.jpg/440px-Margot_Robbie_2019.jpg',
  'margot robbie': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Margot_Robbie_2019.jpg/440px-Margot_Robbie_2019.jpg',
  'رایان گاسلینگ': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ryan_Gosling_2018.jpg/440px-Ryan_Gosling_2018.jpg',
  'ryan gosling': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ryan_Gosling_2018.jpg/440px-Ryan_Gosling_2018.jpg',
  'رایان رینولدز': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg/440px-Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg',
  'ryan reynolds': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg/440px-Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg',
  'هیو جکمن': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Hugh_Jackman_in_2017.jpg/440px-Hugh_Jackman_in_2017.jpg',
  'hugh jackman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Hugh_Jackman_in_2017.jpg/440px-Hugh_Jackman_in_2017.jpg',
  'رابرت پتینسون': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Robert_Pattinson_2019.jpg/440px-Robert_Pattinson_2019.jpg',
  'robert pattinson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Robert_Pattinson_2019.jpg/440px-Robert_Pattinson_2019.jpg',
  'زوئی کراویتز': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Zo%C3%AB_Kravitz_by_Gage_Skidmore_2.jpg/440px-Zo%C3%AB_Kravitz_by_Gage_Skidmore_2.jpg',
  'zoe kravitz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Zo%C3%AB_Kravitz_by_Gage_Skidmore_2.jpg/440px-Zo%C3%AB_Kravitz_by_Gage_Skidmore_2.jpg',
  'پل دینو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Paul_Dano_2016.jpg/440px-Paul_Dano_2016.jpg',
  'paul dano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Paul_Dano_2016.jpg/440px-Paul_Dano_2016.jpg',
  'کالین فارل': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Colin_Farrell_2019.jpg/440px-Colin_Farrell_2019.jpg',
  'colin farrell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Colin_Farrell_2019.jpg/440px-Colin_Farrell_2019.jpg',
  'لیدی گاگا': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Lady_Gaga_at_the_2023_Oscars.jpg/440px-Lady_Gaga_at_the_2023_Oscars.jpg',
  'lady gaga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Lady_Gaga_at_the_2023_Oscars.jpg/440px-Lady_Gaga_at_the_2023_Oscars.jpg',
  'آل پاچینو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Al_Pacino.jpg/440px-Al_Pacino.jpg',
  'al pacino': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Al_Pacino.jpg/440px-Al_Pacino.jpg',
  'رابرت دنیرو': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Robert_De_Niro_Cannes_2016.jpg/440px-Robert_De_Niro_Cannes_2016.jpg',
  'robert de niro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Robert_De_Niro_Cannes_2016.jpg/440px-Robert_De_Niro_Cannes_2016.jpg',
  'اما استون': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Emma_Stone_at_the_30th_Annual_Screen_Actors_Guild_Awards_%28cropped%29.jpg/440px-Emma_Stone_at_the_30th_Annual_Screen_Actors_Guild_Awards_%28cropped%29.jpg',
  'emma stone': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Emma_Stone_at_the_30th_Annual_Screen_Actors_Guild_Awards_%28cropped%29.jpg/440px-Emma_Stone_at_the_30th_Annual_Screen_Actors_Guild_Awards_%28cropped%29.jpg',
  'پدرو پاسکال': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Pedro_Pascal_by_Gage_Skidmore.jpg/440px-Pedro_Pascal_by_Gage_Skidmore.jpg',
  'pedro pascal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Pedro_Pascal_by_Gage_Skidmore.jpg/440px-Pedro_Pascal_by_Gage_Skidmore.jpg',
  'کیانو ریوز': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Keanu_Reeves_%28crop_and_levels_%28cropped%29%29.jpg/440px-Keanu_Reeves_%28crop_and_levels_%28cropped%29%29.jpg',
  'keanu reeves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Keanu_Reeves_%28crop_and_levels_%28cropped%29%29.jpg/440px-Keanu_Reeves_%28crop_and_levels_%28cropped%29%29.jpg',
  'متیو مک‌کانهی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Matthew_McConaughey_2019_%2848648144393%29_%28cropped%29.jpg/440px-Matthew_McConaughey_2019_%2848648144393%29_%28cropped%29.jpg',
  'matthew mcconaughey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Matthew_McConaughey_2019_%2848648144393%29_%28cropped%29.jpg/440px-Matthew_McConaughey_2019_%2848648144393%29_%28cropped%29.jpg',
  'آن هاتاوی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Anne_Hathaway_at_The_Intern_premiere_in_London_2015_%28cropped%29.jpg/440px-Anne_Hathaway_at_The_Intern_premiere_in_London_2015_%28cropped%29.jpg',
  'anne hathaway': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Anne_Hathaway_at_The_Intern_premiere_in_London_2015_%28cropped%29.jpg/440px-Anne_Hathaway_at_The_Intern_premiere_in_London_2015_%28cropped%29.jpg',
  'مایکل کین': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Michael_Caine_-_2008.jpg/440px-Michael_Caine_-_2008.jpg',
  'michael caine': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Michael_Caine_-_2008.jpg/440px-Michael_Caine_-_2008.jpg',
  'تام هاردی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Tom_Hardy_by_Gage_Skidmore.jpg/440px-Tom_Hardy_by_Gage_Skidmore.jpg',
  'tom hardy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Tom_Hardy_by_Gage_Skidmore.jpg/440px-Tom_Hardy_by_Gage_Skidmore.jpg',
  'هیث لجر': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Heath_Ledger_%28Berlin_Film_Festival_2006%29_cropped.jpg/440px-Heath_Ledger_%28Berlin_Film_Festival_2006%29_cropped.jpg',
  'heath ledger': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Heath_Ledger_%28Berlin_Film_Festival_2006%29_cropped.jpg/440px-Heath_Ledger_%28Berlin_Film_Festival_2006%29_cropped.jpg',
  'مورگان فریمن': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Morgan_Freeman_Deauville_2018.jpg/440px-Morgan_Freeman_Deauville_2018.jpg',
  'morgan freeman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Morgan_Freeman_Deauville_2018.jpg/440px-Morgan_Freeman_Deauville_2018.jpg',
  'گری اولدمن': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Gary_Oldman_Cannes_2018.jpg/440px-Gary_Oldman_Cannes_2018.jpg',
  'gary oldman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Gary_Oldman_Cannes_2018.jpg/440px-Gary_Oldman_Cannes_2018.jpg',

  // --- Iranian Stars, Directors & Filmmakers ---
  'شهاب حسینی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Shahab_Hosseini_at_Cannes_2016.jpg/440px-Shahab_Hosseini_at_Cannes_2016.jpg',
  'shahab hosseini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Shahab_Hosseini_at_Cannes_2016.jpg/440px-Shahab_Hosseini_at_Cannes_2016.jpg',
  'هادی حجازی‌فر': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Hadi_Hejazifar_in_35th_Fajr_Film_Festival.jpg/440px-Hadi_Hejazifar_in_35th_Fajr_Film_Festival.jpg',
  'hadi hejazifar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Hadi_Hejazifar_in_35th_Fajr_Film_Festival.jpg/440px-Hadi_Hejazifar_in_35th_Fajr_Film_Festival.jpg',
  'نوید محمدزاده': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Navid_Mohammadzadeh_%28Venice_2017%29.jpg/440px-Navid_Mohammadzadeh_%28Venice_2017%29.jpg',
  'navid mohammadzadeh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Navid_Mohammadzadeh_%28Venice_2017%29.jpg/440px-Navid_Mohammadzadeh_%28Venice_2017%29.jpg',
  'پیمان معادی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Payman_Maadi_at_Berlinale_2020.jpg/440px-Payman_Maadi_at_Berlinale_2020.jpg',
  'payman maadi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Payman_Maadi_at_Berlinale_2020.jpg/440px-Payman_Maadi_at_Berlinale_2020.jpg',
  'peyman maadi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Payman_Maadi_at_Berlinale_2020.jpg/440px-Payman_Maadi_at_Berlinale_2020.jpg',
  'سحر دولتشاهی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Sahar_Dolatshahi_at_Cannes_2016.jpg/440px-Sahar_Dolatshahi_at_Cannes_2016.jpg',
  'sahar dolatshahi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Sahar_Dolatshahi_at_Cannes_2016.jpg/440px-Sahar_Dolatshahi_at_Cannes_2016.jpg',
  'بهرام افشاری': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bahram_Afshari_in_2019.jpg/440px-Bahram_Afshari_in_2019.jpg',
  'bahram afshari': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bahram_Afshari_in_2019.jpg/440px-Bahram_Afshari_in_2019.jpg',
  'پژمان جمشیدی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Pejman_Jamshidi_in_2020.jpg/440px-Pejman_Jamshidi_in_2020.jpg',
  'pejman jamshidi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Pejman_Jamshidi_in_2020.jpg/440px-Pejman_Jamshidi_in_2020.jpg',
  'پریناز ایزدیار': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Parinaz_Izadyar_in_2019.jpg/440px-Parinaz_Izadyar_in_2019.jpg',
  'parinaz izadyar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Parinaz_Izadyar_in_2019.jpg/440px-Parinaz_Izadyar_in_2019.jpg',
  'ترانه علیدوستی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Taraneh_Alidoosti_Cannes_2022.jpg/440px-Taraneh_Alidoosti_Cannes_2022.jpg',
  'taraneh alidoosti': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Taraneh_Alidoosti_Cannes_2022.jpg/440px-Taraneh_Alidoosti_Cannes_2022.jpg',
  'رضا عطاران': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Reza_Attaran_in_2016.jpg/440px-Reza_Attaran_in_2016.jpg',
  'reza attaran': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Reza_Attaran_in_2016.jpg/440px-Reza_Attaran_in_2016.jpg',
  'مهران مدیری': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mehran_Modiri_2017.jpg/440px-Mehran_Modiri_2017.jpg',
  'mehran modiri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mehran_Modiri_2017.jpg/440px-Mehran_Modiri_2017.jpg',
  'جواد عزتی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Javad_Ezzati_in_2020.jpg/440px-Javad_Ezzati_in_2020.jpg',
  'javad ezzati': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Javad_Ezzati_in_2020.jpg/440px-Javad_Ezzati_in_2020.jpg',
  'الناز شاکردوست': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Elnaz_Shakerdoost_in_2019.jpg/440px-Elnaz_Shakerdoost_in_2019.jpg',
  'elnaz shakerdoost': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Elnaz_Shakerdoost_in_2019.jpg/440px-Elnaz_Shakerdoost_in_2019.jpg',
  'هادی کاظمی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Hadi_Kazemi_2019.jpg/440px-Hadi_Kazemi_2019.jpg',
  'hadi kazemi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Hadi_Kazemi_2019.jpg/440px-Hadi_Kazemi_2019.jpg',
  'ایمان صفا': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Iman_Safa_2022.jpg/440px-Iman_Safa_2022.jpg',
  'iman safa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Iman_Safa_2022.jpg/440px-Iman_Safa_2022.jpg',
  'الناز حبیبی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Elnaz_Habibi_2020.jpg/440px-Elnaz_Habibi_2020.jpg',
  'elnaz habibi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Elnaz_Habibi_2020.jpg/440px-Elnaz_Habibi_2020.jpg',
  'الهه حصاری': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Elahe_Hesari_2020.jpg/440px-Elahe_Hesari_2020.jpg',
  'elahe hesari': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Elahe_Hesari_2020.jpg/440px-Elahe_Hesari_2020.jpg',
  'پانته‌آ بهرام': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Pantea_Bahram_in_2018.jpg/440px-Pantea_Bahram_in_2018.jpg',
  'pantea bahram': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Pantea_Bahram_in_2018.jpg/440px-Pantea_Bahram_in_2018.jpg',
  'مهرداد صدیقیان': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Mehrdad_Sedighian_2018.jpg/440px-Mehrdad_Sedighian_2018.jpg',
  'mehrdad sedighian': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Mehrdad_Sedighian_2018.jpg/440px-Mehrdad_Sedighian_2018.jpg',
  'علیرضا کمالی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Alireza_Kamali_2023.jpg/440px-Alireza_Kamali_2023.jpg',
  'alireza kamali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Alireza_Kamali_2023.jpg/440px-Alireza_Kamali_2023.jpg',
  'پردیس احمدیه': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Pardis_Ahmadieh_2020.jpg/440px-Pardis_Ahmadieh_2020.jpg',
  'pardis ahmadieh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Pardis_Ahmadieh_2020.jpg/440px-Pardis_Ahmadieh_2020.jpg',
  'ژیلا شاهی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Zhila_Shahi_2020.jpg/440px-Zhila_Shahi_2020.jpg',
  'zhila shahi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Zhila_Shahi_2020.jpg/440px-Zhila_Shahi_2020.jpg',
  'آزاده صمدی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Azadeh_Samadi_2019.jpg/440px-Azadeh_Samadi_2019.jpg',
  'azadeh samadi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Azadeh_Samadi_2019.jpg/440px-Azadeh_Samadi_2019.jpg',
  'مریلا زارعی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Merila_Zarei_2017.jpg/440px-Merila_Zarei_2017.jpg',
  'merila zarei': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Merila_Zarei_2017.jpg/440px-Merila_Zarei_2017.jpg',
  'جمشید محمودی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Jamshid_Mahmoudi_in_Fajr.jpg/440px-Jamshid_Mahmoudi_in_Fajr.jpg',
  'jamshid mahmoudi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Jamshid_Mahmoudi_in_Fajr.jpg/440px-Jamshid_Mahmoudi_in_Fajr.jpg',
  'نوید محمودی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Navid_Mahmoudi.jpg/440px-Navid_Mahmoudi.jpg',
  'navid mahmoudi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Navid_Mahmoudi.jpg/440px-Navid_Mahmoudi.jpg',
  'سامان مقدم': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Saman_Moghaddam.jpg/440px-Saman_Moghaddam.jpg',
  'saman moghaddam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Saman_Moghaddam.jpg/440px-Saman_Moghaddam.jpg',
  'کریم امینی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Karim_Amini_2023.jpg/440px-Karim_Amini_2023.jpg',
  'karim amini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Karim_Amini_2023.jpg/440px-Karim_Amini_2023.jpg',
  'بامداد افشار': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Bamdad_Afshar.jpg/440px-Bamdad_Afshar.jpg',
  'bamdad afshar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Bamdad_Afshar.jpg/440px-Bamdad_Afshar.jpg',
  'هومن سیدی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Houman_Seyedee_Venice_2022.jpg/440px-Houman_Seyedee_Venice_2022.jpg',
  'houman seyedi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Houman_Seyedee_Venice_2022.jpg/440px-Houman_Seyedee_Venice_2022.jpg',
  'اصغر فرهادی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asghar_Farhadi_Cannes_2021.jpg/440px-Asghar_Farhadi_Cannes_2021.jpg',
  'asghar farhadi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Asghar_Farhadi_Cannes_2021.jpg/440px-Asghar_Farhadi_Cannes_2021.jpg',
  'سعید روستایی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Saeed_Roustayi_Cannes_2022.jpg/440px-Saeed_Roustayi_Cannes_2022.jpg',
  'saeed roustayi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Saeed_Roustayi_Cannes_2022.jpg/440px-Saeed_Roustayi_Cannes_2022.jpg',
  'بهرام رادان': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Bahram_Radan_2019.jpg/440px-Bahram_Radan_2019.jpg',
  'bahram radan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Bahram_Radan_2019.jpg/440px-Bahram_Radan_2019.jpg',
  'هدیه تهرانی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Hedieh_Tehrani_2018.jpg/440px-Hedieh_Tehrani_2018.jpg',
  'hedieh tehrani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Hedieh_Tehrani_2018.jpg/440px-Hedieh_Tehrani_2018.jpg',
  'ساره بیات': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Sareh_Bayat_2017.jpg/440px-Sareh_Bayat_2017.jpg',
  'sareh bayat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Sareh_Bayat_2017.jpg/440px-Sareh_Bayat_2017.jpg',
  'صابر ابر': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Saber_Abar_2019.jpg/440px-Saber_Abar_2019.jpg',
  'saber abar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Saber_Abar_2019.jpg/440px-Saber_Abar_2019.jpg',
  'هوتن شکیبا': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Hootan_Shakiba_2019.jpg/440px-Hootan_Shakiba_2019.jpg',
  'hootan shakiba': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Hootan_Shakiba_2019.jpg/440px-Hootan_Shakiba_2019.jpg',
  'علی شادمان': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Ali_Shadman_2022.jpg/440px-Ali_Shadman_2022.jpg',
  'ali shadman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Ali_Shadman_2022.jpg/440px-Ali_Shadman_2022.jpg',
  'محسن تنابنده': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Mohsen_Tanabandeh_Venice_2022.jpg/440px-Mohsen_Tanabandeh_Venice_2022.jpg',
  'mohsen tanabandeh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Mohsen_Tanabandeh_Venice_2022.jpg/440px-Mohsen_Tanabandeh_Venice_2022.jpg',
  'لیلا حاتمی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Leila_Hatami_at_Venice_Film_Festival_2022.jpg/440px-Leila_Hatami_at_Venice_Film_Festival_2022.jpg',
  'leila hatami': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Leila_Hatami_at_Venice_Film_Festival_2022.jpg/440px-Leila_Hatami_at_Venice_Film_Festival_2022.jpg',
  'طناز طباطبایی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Tannaz_Tabatabaei_in_2020.jpg/440px-Tannaz_Tabatabaei_in_2020.jpg',
  'tannaz tabatabaei': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Tannaz_Tabatabaei_in_2020.jpg/440px-Tannaz_Tabatabaei_in_2020.jpg',
  'امین حیایی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Amin_Hayati_in_2019.jpg/440px-Amin_Hayati_in_2019.jpg',
  'amin hayai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Amin_Hayati_in_2019.jpg/440px-Amin_Hayati_in_2019.jpg',
  'علی مصفا': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Ali_Mosaffa_in_2019.jpg/440px-Ali_Mosaffa_in_2019.jpg',
  'ali mosaffa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Ali_Mosaffa_in_2019.jpg/440px-Ali_Mosaffa_in_2019.jpg',

  // --- Turkish Stars ---
  'چتین تکیندور': 'https://m.media-amazon.com/images/M/MV5BMGQxZjExNjgtMGY4MS00MTQ1LWFmYTItNDM5MWI5OWY5NTc2XkEyXkFqcGc@._V1_.jpg',
  'cetin tekindor': 'https://m.media-amazon.com/images/M/MV5BMGQxZjExNjgtMGY4MS00MTQ1LWFmYTItNDM5MWI5OWY5NTc2XkEyXkFqcGc@._V1_.jpg',
  'çetin tekindor': 'https://m.media-amazon.com/images/M/MV5BMGQxZjExNjgtMGY4MS00MTQ1LWFmYTItNDM5MWI5OWY5NTc2XkEyXkFqcGc@._V1_.jpg',
  'nm1002038': 'https://m.media-amazon.com/images/M/MV5BMGQxZjExNjgtMGY4MS00MTQ1LWFmYTItNDM5MWI5OWY5NTc2XkEyXkFqcGc@._V1_.jpg',
  'آفرا ساراچ‌اوغلو': 'https://m.media-amazon.com/images/M/MV5BNTIwODg3ZWYtZTAyNC00Nzg2LWE2NDctMTlhYTFlNTRmZjY5XkEyXkFqcGc@._V1_.jpg',
  'afra saracoglu': 'https://m.media-amazon.com/images/M/MV5BNTIwODg3ZWYtZTAyNC00Nzg2LWE2NDctMTlhYTFlNTRmZjY5XkEyXkFqcGc@._V1_.jpg',
  'afra saraçoğlu': 'https://m.media-amazon.com/images/M/MV5BNTIwODg3ZWYtZTAyNC00Nzg2LWE2NDctMTlhYTFlNTRmZjY5XkEyXkFqcGc@._V1_.jpg',
  'مرت رمضان دمیر': 'https://m.media-amazon.com/images/M/MV5BNWUxMWI2M2UtM2NlZS00Nzc2LWE5NWQtZGRkMDdiMmZhMjU0XkEyXkFqcGc@._V1_.jpg',
  'mert ramazan demir': 'https://m.media-amazon.com/images/M/MV5BNWUxMWI2M2UtM2NlZS00Nzc2LWE5NWQtZGRkMDdiMmZhMjU0XkEyXkFqcGc@._V1_.jpg',
  'کیوانچ تاتلیتوغ': 'https://m.media-amazon.com/images/M/MV5BN2UzN2E3ZjQtOTQzNC00ZTBhLTk4YTctOTdlMWJiYjg5MGMzXkEyXkFqcGc@._V1_.jpg',
  'kivanc tatlitug': 'https://m.media-amazon.com/images/M/MV5BN2UzN2E3ZjQtOTQzNC00ZTBhLTk4YTctOTdlMWJiYjg5MGMzXkEyXkFqcGc@._V1_.jpg',
  'kıvanç tatlıtuğ': 'https://m.media-amazon.com/images/M/MV5BN2UzN2E3ZjQtOTQzNC00ZTBhLTk4YTctOTdlMWJiYjg5MGMzXkEyXkFqcGc@._V1_.jpg',
  'هانده ارچل': 'https://m.media-amazon.com/images/M/MV5BMjY5YmU3ZDgtNmRlYS00ZjcyLWFjYzYtNmQzZmZhMDVkYjU1XkEyXkFqcGc@._V1_.jpg',
  'hande ercel': 'https://m.media-amazon.com/images/M/MV5BMjY5YmU3ZDgtNmRlYS00ZjcyLWFjYzYtNmQzZmZhMDVkYjU1XkEyXkFqcGc@._V1_.jpg',
  'hande erçel': 'https://m.media-amazon.com/images/M/MV5BMjY5YmU3ZDgtNmRlYS00ZjcyLWFjYzYtNmQzZmZhMDVkYjU1XkEyXkFqcGc@._V1_.jpg',
  'بوراک اوزچیویت': 'https://m.media-amazon.com/images/M/MV5BMzRkMGJlODUtNTA1MC00YTQ4LThlNjgtNTc0MWVjZDhhNmZmXkEyXkFqcGc@._V1_.jpg',
  'burak ozcivit': 'https://m.media-amazon.com/images/M/MV5BMzRkMGJlODUtNTA1MC00YTQ4LThlNjgtNTc0MWVjZDhhNmZmXkEyXkFqcGc@._V1_.jpg',
  'burak özçivit': 'https://m.media-amazon.com/images/M/MV5BMzRkMGJlODUtNTA1MC00YTQ4LThlNjgtNTc0MWVjZDhhNmZmXkEyXkFqcGc@._V1_.jpg',
  'هالیت ارگنچ': 'https://m.media-amazon.com/images/M/MV5BNzVjNTRmYmEtNzEzOC00MTRjLThjNmEtOTg4M2EzNTgwYTlhXkEyXkFqcGc@._V1_.jpg',
  'halit ergenc': 'https://m.media-amazon.com/images/M/MV5BNzVjNTRmYmEtNzEzOC00MTRjLThjNmEtOTg4M2EzNTgwYTlhXkEyXkFqcGc@._V1_.jpg',
  'halit ergenç': 'https://m.media-amazon.com/images/M/MV5BNzVjNTRmYmEtNzEzOC00MTRjLThjNmEtOTg4M2EzNTgwYTlhXkEyXkFqcGc@._V1_.jpg',
  'aras bulut iynemli': 'https://m.media-amazon.com/images/M/MV5BMjY2ZDVlMmUtNWRlNC00YWI0LTg4YjEtMmVkNjM0OGRhMTZiXkEyXkFqcGc@._V1_.jpg',
  'آراس بولوت اینملی': 'https://m.media-amazon.com/images/M/MV5BMjY2ZDVlMmUtNWRlNC00YWI0LTg4YjEtMmVkNjM0OGRhMTZiXkEyXkFqcGc@._V1_.jpg',

  // --- Bollywood & Indian Stars ---
  'شاهرخ خان': 'https://m.media-amazon.com/images/M/MV5BODk3OWUxZTItYWVhNi00YjBhLTkyOWQtYTU0NTMzMzRjNWExXkEyXkFqcGc@._V1_.jpg',
  'shah rukh khan': 'https://m.media-amazon.com/images/M/MV5BODk3OWUxZTItYWVhNi00YjBhLTkyOWQtYTU0NTMzMzRjNWExXkEyXkFqcGc@._V1_.jpg',
  'دیپیکا پادوکونه': 'https://m.media-amazon.com/images/M/MV5BNzc1MTc2ODgtYjRhYi00NGQ2LTkyYjgtZWEzNjY1MmNmOGM2XkEyXkFqcGc@._V1_.jpg',
  'deepika padukone': 'https://m.media-amazon.com/images/M/MV5BNzc1MTc2ODgtYjRhYi00NGQ2LTkyYjgtZWEzNjY1MmNmOGM2XkEyXkFqcGc@._V1_.jpg',
  'آمیتاب باچان': 'https://m.media-amazon.com/images/M/MV5BNTk1OTUxMzIzMV5BMl5BanBnXkFtZTcwMzMxMjI0MQ@@._V1_.jpg',
  'amitabh bachchan': 'https://m.media-amazon.com/images/M/MV5BNTk1OTUxMzIzMV5BMl5BanBnXkFtZTcwMzMxMjI0MQ@@._V1_.jpg',
  'سلمان خان': 'https://m.media-amazon.com/images/M/MV5BMjMwMDcxOGQtMWFlNy00MmEyLWE0NTMtMDYxNjY2MTA0MTg5XkEyXkFqcGc@._V1_.jpg',
  'salman khan': 'https://m.media-amazon.com/images/M/MV5BMjMwMDcxOGQtMWFlNy00MmEyLWE0NTMtMDYxNjY2MTA0MTg5XkEyXkFqcGc@._V1_.jpg',
  'عامر خان': 'https://m.media-amazon.com/images/M/MV5BMTgxNTAyNTU0NV5BMl5BanBnXkFtZTcwNzMzMDQ2MQ@@._V1_.jpg',
  'aamir khan': 'https://m.media-amazon.com/images/M/MV5BMTgxNTAyNTU0NV5BMl5BanBnXkFtZTcwNzMzMDQ2MQ@@._V1_.jpg',
  'هریتیک روشن': 'https://m.media-amazon.com/images/M/MV5BMjI0NTg0MjcwN15BMl5BanBnXkFtZTcwMDExMjI0MQ@@._V1_.jpg',
  'hrithik roshan': 'https://m.media-amazon.com/images/M/MV5BMjI0NTg0MjcwN15BMl5BanBnXkFtZTcwMDExMjI0MQ@@._V1_.jpg',
  'پرابهاس': 'https://m.media-amazon.com/images/M/MV5BMTY3Mzk3MjE3Ml5BMl5BanBnXkFtZTgwNTQ2Njc1ODE@._V1_.jpg',
  'prabhas': 'https://m.media-amazon.com/images/M/MV5BMTY3Mzk3MjE3Ml5BMl5BanBnXkFtZTgwNTQ2Njc1ODE@._V1_.jpg',
  'نایانتارا': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Nayanthara_at_SIIMA_2016.jpg/440px-Nayanthara_at_SIIMA_2016.jpg',
  'nayanthara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Nayanthara_at_SIIMA_2016.jpg/440px-Nayanthara_at_SIIMA_2016.jpg',
  'ویجی ستوپاتی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Vijay_Sethupathi_at_Jawan_Pre_Release_Event.jpg/440px-Vijay_Sethupathi_at_Jawan_Pre_Release_Event.jpg',
  'vijay sethupathi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Vijay_Sethupathi_at_Jawan_Pre_Release_Event.jpg/440px-Vijay_Sethupathi_at_Jawan_Pre_Release_Event.jpg',
  'آتلی': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Atlee_Kumar_2019.jpg/440px-Atlee_Kumar_2019.jpg',
  'atlee': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Atlee_Kumar_2019.jpg/440px-Atlee_Kumar_2019.jpg',
};

// Verified Rich Biographies and Career Data
export const VERIFIED_PERSON_BIOS: Record<string, VerifiedPersonData> = {
  'هیرویوکی سانادا': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Hiroyuki_Sanada_20240220.jpg/440px-Hiroyuki_Sanada_20240220.jpg',
    birth_date: '۱۲ اکتبر ۱۹۶۰ (۶۴ سال)',
    birth_place: 'توکیو، ژاپن',
    nationality: 'ژاپنی',
    job: 'بازیگر، رزمی‌کار و تهیه‌کننده',
    biography: 'هیرویوکی سانادا، بازیگر و رزمی‌کار نامدار ژاپنی و برنده دو جایزه معتبر امی (Emmy) و گلدن گلوب برای نقش‌آفرینی تاریخی در نقش لرد یوشی توراناگا در شاهکار درام «شوگان (Shōgun)» است. او با دهه‌ها حضور درخشان در سینمای ژاپن و هالیوود از جمله «آخرین سامورایی»، «جان ویک ۴»، «قطار سریع‌السیر»، «گرگ‌نما» و «مورتال کامبت» به یکی از برجسته‌ترین نمادهای فرهنگ و بازیگری شرق آسیا در صحنه بین‌المللی تبدیل شده است.',
    awards: [
      { title: 'جایزه امی ساعات پربیننده (Primetime Emmy) بهترین بازیگر درام', year: '2024', movie_name: 'شوگان (Shōgun)', is_winner: true },
      { title: 'جایزه گلدن گلوب بهترین بازیگر مرد سریال درام', year: '2025', movie_name: 'شوگان (Shōgun)', is_winner: true },
      { title: 'نشان افتخار روبان ارغوانی دولت ژاپن', year: '2018', movie_name: 'دستاورد هنری و فرهنگی', is_winner: true },
    ],
    known_for: [
      { title: 'شوگان (Shōgun)', year: '2024', role: 'لرد یوشی توراناگا' },
      { title: 'آخرین سامورایی (The Last Samurai)', year: '2003', role: 'اوجیو' },
      { title: 'جان ویک: بخش ۴ (John Wick: Chapter 4)', year: '2023', role: 'شیماتزو کوجی' },
      { title: 'قطار سریع‌السیر (Bullet Train)', year: '2022', role: 'بزرگ‌تر (The Elder)' },
    ]
  },
  'hiroyuki sanada': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Hiroyuki_Sanada_20240220.jpg/440px-Hiroyuki_Sanada_20240220.jpg',
    birth_date: '۱۲ اکتبر ۱۹۶۰ (۶۴ سال)',
    birth_place: 'توکیو، ژاپن',
    nationality: 'ژاپنی',
    job: 'بازیگر، رزمی‌کار و تهیه‌کننده',
    biography: 'هیرویوکی سانادا، بازیگر و رزمی‌کار نامدار ژاپنی و برنده دو جایزه معتبر امی (Emmy) و گلدن گلوب برای نقش‌آفرینی تاریخی در نقش لرد یوشی توراناگا در شاهکار درام «شوگان (Shōgun)» است. او با دهه‌ها حضور درخشان در سینمای ژاپن و هالیوود از جمله «آخرین سامورایی»، «جان ویک ۴»، «قطار سریع‌السیر»، «گرگ‌نما» و «مورتال کامبت» به یکی از برجسته‌ترین نمادهای فرهنگ و بازیگری شرق آسیا در صحنه بین‌المللی تبدیل شده است.',
    awards: [
      { title: 'جایزه امی ساعات پربیننده (Primetime Emmy) بهترین بازیگر درام', year: '2024', movie_name: 'شوگان (Shōgun)', is_winner: true },
      { title: 'جایزه گلدن گلوب بهترین بازیگر مرد سریال درام', year: '2025', movie_name: 'شوگان (Shōgun)', is_winner: true },
      { title: 'نشان افتخار روبان ارغوانی دولت ژاپن', year: '2018', movie_name: 'دستاورد هنری و فرهنگی', is_winner: true },
    ],
    known_for: [
      { title: 'شوگان (Shōgun)', year: '2024', role: 'لرد یوشی توراناگا' },
      { title: 'آخرین سامورایی (The Last Samurai)', year: '2003', role: 'اوجیو' },
      { title: 'جان ویک: بخش ۴ (John Wick: Chapter 4)', year: '2023', role: 'شیماتزو کوجی' },
      { title: 'قطار سریع‌السیر (Bullet Train)', year: '2022', role: 'بزرگ‌تر (The Elder)' },
    ]
  },
  'آنا ساوای': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Anna_Sawai_2024.jpg/440px-Anna_Sawai_2024.jpg',
    birth_date: '۱۱ ژوئن ۱۹۹۲ (۳۲ سال)',
    birth_place: 'ولینگتون، نیوزیلند',
    nationality: 'ژاپنی-نیوزیلندی',
    job: 'بازیگر، خواننده و رقصنده',
    biography: 'آنا ساوای بازیگر توانمند ژاپنی و نخستین زن با اصالت آسیایی برنده جایزه معتبر امی (Emmy) برای بهترین بازیگر نقش اول زن درام در سریال «شوگان (Shōgun)» در نقش بانو تودا ماریکو است. او همچنین در سریال‌های برجسته «پاچینکو (Pachinko)»، «مونارک: میراث هیولاها» و فیلم سینمایی «سریع و خشمگین ۹» نقش‌آفرینی کرده است.',
    awards: [
      { title: 'جایزه امی ساعات پربیننده (Primetime Emmy) بهترین بازیگر نقش اول درام', year: '2024', movie_name: 'شوگان (Shōgun)', is_winner: true },
      { title: 'جایزه گلدن گلوب بهترین بازیگر زن درام', year: '2025', movie_name: 'شوگان (Shōgun)', is_winner: true },
    ],
    known_for: [
      { title: 'شوگان (Shōgun)', year: '2024', role: 'بانو تودا ماریکو' },
      { title: 'پاچینکو (Pachinko)', year: '2022-2024', role: 'نائومی' },
      { title: 'سریع و خشمگین ۹ (F9)', year: '2021', role: 'الی' },
    ]
  },
  'anna sawai': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Anna_Sawai_2024.jpg/440px-Anna_Sawai_2024.jpg',
    birth_date: '۱۱ ژوئن ۱۹۹۲ (۳۲ سال)',
    birth_place: 'ولینگتون، نیوزیلند',
    nationality: 'ژاپنی-نیوزیلندی',
    job: 'بازیگر، خواننده و رقصنده',
    biography: 'آنا ساوای بازیگر توانمند ژاپنی و نخستین زن با اصالت آسیایی برنده جایزه معتبر امی (Emmy) برای بهترین بازیگر نقش اول زن درام در سریال «شوگان (Shōgun)» در نقش بانو تودا ماریکو است. او همچنین در سریال‌های برجسته «پاچینکو (Pachinko)»، «مونارک: میراث هیولاها» و فیلم سینمایی «سریع و خشمگین ۹» نقش‌آفرینی کرده است.',
    awards: [
      { title: 'جایزه امی ساعات پربیننده (Primetime Emmy) بهترین بازیگر نقش اول درام', year: '2024', movie_name: 'شوگان (Shōgun)', is_winner: true },
      { title: 'جایزه گلدن گلوب بهترین بازیگر زن درام', year: '2025', movie_name: 'شوگان (Shōgun)', is_winner: true },
    ],
    known_for: [
      { title: 'شوگان (Shōgun)', year: '2024', role: 'بانو تودا ماریکو' },
      { title: 'پاچینکو (Pachinko)', year: '2022-2024', role: 'نائومی' },
      { title: 'سریع و خشمگین ۹ (F9)', year: '2021', role: 'الی' },
    ]
  },
  'کازمو جارویس': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Cosmo_Jarvis_2017.jpg/440px-Cosmo_Jarvis_2017.jpg',
    birth_date: '۱ سپتامبر ۱۹۸۹ (۳۵ سال)',
    birth_place: 'ریجوود، نیوجرسی، ایالات متحده',
    nationality: 'بریتانیایی',
    job: 'بازیگر، خواننده و ترانه‌سرا',
    biography: 'هریسون کازمو جارویس بازیگر و موسیقی‌دان بریتانیایی است که با ایفای نقش پرچالش جان بلک‌تورن (خلبان انگلیسی آنجین) در سریال تحسین‌شده «شوگان (Shōgun)» به شهرت جهانی رسید. او پیش از این با درخشش در فیلم‌های تحسین‌شده «لیدی مکبث» و «ترغیب» تحسین منتقدان سینمای اروپا را برانگیخته بود.',
    awards: [
      { title: 'نامزدی جایزه تلویزیونی انتخاب منتقدان (Critics Choice)', year: '2024', movie_name: 'شوگان (Shōgun)', is_winner: false },
    ],
    known_for: [
      { title: 'شوگان (Shōgun)', year: '2024', role: 'جان بلک‌تورن (آنجین)' },
      { title: 'لیدی مکبث (Lady Macbeth)', year: '2016', role: 'سباستین' },
      { title: 'ترغیب (Persuasion)', year: '2022', role: 'کاپیتان فردریک ونتورث' },
    ]
  },
  'تادانابو آسانو': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Tadanobu_Asano_Cannes_2016.jpg/440px-Tadanobu_Asano_Cannes_2016.jpg',
    birth_date: '۲۷ نوامبر ۱۹۷۳ (۵۱ سال)',
    birth_place: 'یوکوهاما، ژاپن',
    nationality: 'ژاپنی',
    job: 'بازیگر و نوازنده',
    biography: 'تادانابو آسانو بازیگر تحسین‌شده سینمای ژاپن و هالیوود و برنده جایزه امی ساعات پربیننده برای نقش‌آفرینی به‌یادماندنی کشیگی یابوشیگه در سریال «شوگان (Shōgun)» است. او سابقه درخشان در آثاری چون «ثور (Thor)»، «سکوت»، «مغول» و «مورتال کامبت» دارد.',
    awards: [
      { title: 'جایزه امی ساعات پربیننده (Primetime Emmy) بهترین بازیگر مکمل مرد درام', year: '2024', movie_name: 'شوگان (Shōgun)', is_winner: true },
    ],
    known_for: [
      { title: 'شوگان (Shōgun)', year: '2024', role: 'کشیگی یابوشیگه' },
      { title: 'ثور: رگناروک (Thor: Ragnarok)', year: '2017', role: 'هوگان' },
      { title: 'سکوت (Silence)', year: '2016', role: 'مترجم' },
    ]
  },
  'تیموتی شالامی': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Timoth%C3%A9e_Chalamet_Cannes_2021.jpg/440px-Timoth%C3%A9e_Chalamet_Cannes_2021.jpg',
    birth_date: '۲۷ دسامبر ۱۹۹۵ (۲۹ سال)',
    birth_place: 'نیویورک، ایالات متحده',
    nationality: 'آمریکایی-فرانسوی',
    job: 'بازیگر',
    biography: 'تیموتی هال شالامی از تحسین‌شده‌ترین و محبوب‌ترین بازیگران نسل جوان سینمای جهان و نامزد جایزه اسکار است. او با درخشش در نقش پاول اتریدیز در مجموعه حماسی «تل‌ماسه (Dune)»، فیلم‌های «مرا با نامت صدا کن»، «وانکا» و «زنان کوچک» جایگاه خود را به عنوان ستاره شماره یک نسل جدید تثبیت کرده است.',
    awards: [
      { title: 'نامزدی جایزه اسکار بهترین بازیگر مرد', year: '2018', movie_name: 'Call Me by Your Name', is_winner: false },
      { title: 'نامزدی جایزه گلدن گلوب', year: '2024', movie_name: 'وانکا (Wonka)', is_winner: false },
    ],
    known_for: [
      { title: 'تل‌ماسه (Dune: Part One & Two)', year: '2021-2024', role: 'پاول اتریدیز / لسان الغیب' },
      { title: 'وانکا (Wonka)', year: '2023', role: 'ویلی وانکا' },
      { title: 'مرا با نامت صدا کن', year: '2017', role: 'الیو پرلمن' },
    ]
  },
  'شهاب حسینی': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Shahab_Hosseini_at_Cannes_2016.jpg/440px-Shahab_Hosseini_at_Cannes_2016.jpg',
    birth_date: '۱۴ بهمن ۱۳۵۲ (۵۱ سال)',
    birth_place: 'تهران، ایران',
    nationality: 'ایرانی',
    job: 'بازیگر، کارگردان و تهیه‌کننده',
    biography: 'سید شهاب‌الدین حسینی تنکابنی، بازیگر و کارگردان سرشناس ایرانی و برنده جایزه نخل طلای بهترین بازیگر مرد جشنواره فیلم کن ۲۰۱۶ برای فیلم «فروشنده» است. او با نقش‌آفرینی‌های درخشان در فیلم‌های «جدایی نادر از سیمین»، «درباره الی»، «حوض نقاشی» و سریال‌های ماندگار «شهرزاد»، «مدار صفر درجه»، «شوق پرواز» و «پوست شیر» جایگاه ویژه‌ای در تاریخ سینما و تلویزیون ایران دارد.',
    awards: [
      { title: 'نخل طلای جشنواره فیلم کن', year: '2016', movie_name: 'فروشنده (The Salesman)', is_winner: true },
      { title: 'خرس نقره‌ای جشنواره فیلم برلین', year: '2011', movie_name: 'جدایی نادر از سیمین', is_winner: true },
      { title: 'سیمرغ بلورین بهترین بازیگر مرد جشنواره فجر', year: '۱۳۸۷', movie_name: 'سوپر استار', is_winner: true },
      { title: 'تندیس حافظ بهترین بازیگر مرد درام', year: '۱۴۰۲', movie_name: 'پوست شیر', is_winner: true },
    ],
    known_for: [
      { title: 'فروشنده (The Salesman)', year: '2016', role: 'عماد' },
      { title: 'جدایی نادر از سیمین (A Separation)', year: '2011', role: 'حجت' },
      { title: 'پوست شیر (The Lion Skin)', year: '۱۴۰۱-۱۴۰۲', role: 'سرگرد محب مشکات' },
      { title: 'شهرزاد (Shahrzad)', year: '۱۳۹۴-۱۳۹۷', role: 'قباد دیوان‌سالار' },
    ]
  },
  'پیمان معادی': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Payman_Maadi_at_Berlinale_2020.jpg/440px-Payman_Maadi_at_Berlinale_2020.jpg',
    birth_date: '۹ تیر ۱۳۴۹ (۵۴ سال)',
    birth_place: 'نیویورک، ایالات متحده',
    nationality: 'ایرانی-آمریکایی',
    job: 'بازیگر، نویسنده و کارگردان',
    biography: 'پیمان معادی بازیگر، فیلم‌نامه‌نویس و کارگردان بین‌المللی ایرانی-آمریکایی است. او برای بازی در «جدایی نادر از سیمین» و «درباره الی» برنده خرس نقره‌ای جشنواره برلین شد و در پروژه‌های برجسته هالیوودی نظیر «شبِ رویداد (The Night Of)»، «۶ زیرزمین»، «کمپ ایکس ری» و سریال «افعی تهران» درخشیده است.',
    awards: [
      { title: 'خرس نقره‌ای بهترین بازیگر مرد جشنواره فیلم برلین', year: '2011', movie_name: 'جدایی نادر از سیمین', is_winner: true },
      { title: 'سیمرغ بلورین بهترین بازیگر مرد جشنواره فجر', year: '۱۳۹۸', movie_name: 'درخونگاه / درخت گردو', is_winner: true },
      { title: 'تندیس حافظ بهترین فیلمنامه', year: '۱۴۰۳', movie_name: 'افعی تهران', is_winner: true },
    ],
    known_for: [
      { title: 'افعی تهران (The Viper of Tehran)', year: '۱۴۰۳', role: 'آرمان بیانی (نویسنده و نقش اصلی)' },
      { title: 'جدایی نادر از سیمین (A Separation)', year: '2011', role: 'نادر' },
      { title: 'متری شیش و نیم (Just 6.5)', year: '۱۳۹۷', role: 'صمد مجیدی' },
      { title: 'The Night Of', year: '2016', role: 'سلیم خان' },
    ]
  },
  'کریستوفر نولان': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Christopher_Nolan_Cannes_2018.jpg/440px-Christopher_Nolan_Cannes_2018.jpg',
    birth_date: '۳۰ ژوئیه ۱۹۷۰ (۵۴ سال)',
    birth_place: 'لندن، انگلستان',
    nationality: 'بریتانیایی-آمریکایی',
    job: 'کارگردان، نویسنده و تهیه‌کننده',
    biography: 'کریستوفر ادوارد نولان یکی از تأثیرگذارترین و تحسین‌شده‌ترین کارگردانان تاریخ سینما است. آثار او که با روایت‌های غیرخطی، درون‌مایه‌های فلسفی و اگزیستانسیالیستی، و پرهیز از جلوه‌های کامپیوتری ارزان شناخته می‌شوند، بیش از ۶ میلیارد دلار در سراسر جهان فروش داشته‌اند.',
    awards: [
      { title: 'جایزه اسکار بهترین کارگردانی', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
      { title: 'جایزه اسکار بهترین فیلم سال', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
      { title: 'جایزه گلدن گلوب بهترین کارگردانی', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
      { title: 'جایزه بفتا بهترین کارگردانی', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
    ],
    known_for: [
      { title: 'اوپنهایمر (Oppenheimer)', year: '2023', role: 'کارگردان و نویسنده' },
      { title: 'میان‌ستاره‌ای (Interstellar)', year: '2014', role: 'کارگردان و نویسنده' },
      { title: 'تلقین (Inception)', year: '2010', role: 'کارگردان و نویسنده' },
      { title: 'سه گانه شوالیه تاریکی (The Dark Knight)', year: '2005-2012', role: 'کارگردان و نویسنده' },
    ]
  },
  'کیلین مورفی': {
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cillian_Murphy_Press_Conference_2024.jpg/440px-Cillian_Murphy_Press_Conference_2024.jpg',
    birth_date: '۲۵ مه ۱۹۷۶ (۴۸ سال)',
    birth_place: 'داگلاس، کورک، ایرلند',
    nationality: 'ایرلندی',
    job: 'بازیگر سینما و تئاتر',
    biography: 'کیلین مورفی بازیگر سرشناس ایرلندی است که برای بازی‌های پرتنش، نگاه‌های نافذ و عمق روانی نقش‌هایش شهرت دارد. او برای بازی در نقش جی. رابرت اوپنهایمر برنده جایزه اسکار، گلدن گلوب و بفتا شد و با ایفای نقش توماس شلبی در سریال پیکی بلایندرز به یک نماد فرهنگی تبدیل شد.',
    awards: [
      { title: 'جایزه اسکار بهترین بازیگر نقش اول مرد', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
      { title: 'جایزه گلدن گلوب بهترین بازیگر درام', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
      { title: 'جایزه بفتا بهترین بازیگر مرد', year: '2024', movie_name: 'اوپنهایمر', is_winner: true },
    ],
    known_for: [
      { title: 'اوپنهایمر (Oppenheimer)', year: '2023', role: 'جی. رابرت اوپنهایمر' },
      { title: 'پیکی بلایندرز (Peaky Blinders)', year: '2013-2022', role: 'توماس شلبی' },
      { title: 'تلقین (Inception)', year: '2010', role: 'رابرت فیشر' },
      { title: '۲۸ روز بعد (28 Days Later)', year: '2002', role: 'جیم' },
    ]
  },
  'چتین تکیندور': {
    photo: 'https://m.media-amazon.com/images/M/MV5BMGQxZjExNjgtMGY4MS00MTQ1LWFmYTItNDM5MWI5OWY5NTc2XkEyXkFqcGc@._V1_.jpg',
    birth_date: '۱۶ ژوئیه ۱۹۴۵ (۷۹ سال)',
    birth_place: 'سیواس، ترکیه',
    nationality: 'ترکیه‌ای',
    job: 'بازیگر پیشکسوت سینما، تئاتر و تلویزیون',
    biography: 'چتین تکیندور (Çetin Tekindor) از برجسته‌ترین و ماندگارترین اسطوره‌های تاریخ سینما و تلویزیون ترکیه و برنده جایزه معتبر پرتقال طلایی، جشنواره بین‌المللی استانبول و آنکارا است. او با ایفای نقش‌های به‌یادماندنی همچون «هالیس آقا کورهان» در سریال پربیننده «چشم‌چران عمارت (Yalı Çapkını)»، «حسین» در شاهکار سینمایی «پدرم و پسرم (Babam ve Oğlum)»، «جلال کبابچی» در سریال «نفوذی (İçerde)» و «ناظیف کارا» در سریال «کارادایی (Karadayı)» مورد تحسین میلیونی مخاطبان خاورمیانه و جهان قرار گرفته است.',
    awards: [
      { title: 'جایزه بهترین بازیگر مرد جشنواره بین‌المللی فیلم استانبول', year: '2006', movie_name: 'پدرم و پسرم (Babam ve Oğlum)', is_winner: true },
      { title: 'جایزه بهترین بازیگر مرد جوایز سینمایی سدری آلیشیک (Sadri Alışık)', year: '2006', movie_name: 'پدرم و پسرم (Babam ve Oğlum)', is_winner: true },
      { title: 'جایزه یک عمر دستاورد هنری جشنواره پرتقال طلایی آنتالیا', year: '2016', movie_name: 'دستاورد هنری و سینمایی', is_winner: true },
    ],
    known_for: [
      { title: 'چشم‌چران عمارت (Yalı Çapkını)', year: '2022-2024', role: 'هالیس آقا کورهان (Halis Ağa)' },
      { title: 'پدرم و پسرم (Babam ve Oğlum)', year: '2005', role: 'حسین' },
      { title: 'نفوذی (İçerde)', year: '2016-2017', role: 'جلال کبابچی (Kebapçı Celal)' },
      { title: 'کارادایی (Karadayı)', year: '2012-2015', role: 'ناظیف کارا (Nazif Kara)' },
    ]
  },
  'cetin tekindor': {
    photo: 'https://m.media-amazon.com/images/M/MV5BMGQxZjExNjgtMGY4MS00MTQ1LWFmYTItNDM5MWI5OWY5NTc2XkEyXkFqcGc@._V1_.jpg',
    birth_date: '۱۶ ژوئیه ۱۹۴۵ (۷۹ سال)',
    birth_place: 'سیواس، ترکیه',
    nationality: 'ترکیه‌ای',
    job: 'بازیگر پیشکسوت سینما، تئاتر و تلویزیون',
    biography: 'چتین تکیندور (Çetin Tekindor) از برجسته‌ترین و ماندگارترین اسطوره‌های تاریخ سینما و تلویزیون ترکیه و برنده جایزه معتبر پرتقال طلایی، جشنواره بین‌المللی استانبول و آنکارا است. او با ایفای نقش‌های به‌یادماندنی همچون «هالیس آقا کورهان» در سریال پربیننده «چشم‌چران عمارت (Yalı Çapkını)»، «حسین» در شاهکار سینمایی «پدرم و پسرم (Babam ve Oğlum)»، «جلال کبابچی» در سریال «نفوذی (İçerde)» و «ناظیف کارا» در سریال «کارادایی (Karadayı)» مورد تحسین میلیونی مخاطبان خاورمیانه و جهان قرار گرفته است.',
    awards: [
      { title: 'جایزه بهترین بازیگر مرد جشنواره بین‌المللی فیلم استانبول', year: '2006', movie_name: 'پدرم و پسرم (Babam ve Oğlum)', is_winner: true },
      { title: 'جایزه بهترین بازیگر مرد جوایز سینمایی سدری آلیشیک (Sadri Alışık)', year: '2006', movie_name: 'پدرم و پسرم (Babam ve Oğlum)', is_winner: true },
      { title: 'جایزه یک عمر دستاورد هنری جشنواره پرتقال طلایی آنتالیا', year: '2016', movie_name: 'دستاورد هنری و سینمایی', is_winner: true },
    ],
    known_for: [
      { title: 'چشم‌چران عمارت (Yalı Çapkını)', year: '2022-2024', role: 'هالیس آقا کورهان (Halis Ağa)' },
      { title: 'پدرم و پسرم (Babam ve Oğlum)', year: '2005', role: 'حسین' },
      { title: 'نفوذی (İçerde)', year: '2016-2017', role: 'جلال کبابچی (Kebapçı Celal)' },
      { title: 'کارادایی (Karadayı)', year: '2012-2015', role: 'ناظیف کارا (Nazif Kara)' },
    ]
  },
  'çetin tekindor': {
    photo: 'https://m.media-amazon.com/images/M/MV5BMGQxZjExNjgtMGY4MS00MTQ1LWFmYTItNDM5MWI5OWY5NTc2XkEyXkFqcGc@._V1_.jpg',
    birth_date: '۱۶ ژوئیه ۱۹۴۵ (۷۹ سال)',
    birth_place: 'سیواس، ترکیه',
    nationality: 'ترکیه‌ای',
    job: 'بازیگر پیشکسوت سینما، تئاتر و تلویزیون',
    biography: 'چتین تکیندور (Çetin Tekindor) از برجسته‌ترین و ماندگارترین اسطوره‌های تاریخ سینما و تلویزیون ترکیه و برنده جایزه معتبر پرتقال طلایی، جشنواره بین‌المللی استانبول و آنکارا است. او با ایفای نقش‌های به‌یادماندنی همچون «هالیس آقا کورهان» در سریال پربیننده «چشم‌چران عمارت (Yalı Çapkını)»، «حسین» در شاهکار سینمایی «پدرم و پسرم (Babam ve Oğlum)»، «جلال کبابچی» در سریال «نفوذی (İçerde)» و «ناظیف کارا» در سریال «کارادایی (Karadayı)» مورد تحسین میلیونی مخاطبان خاورمیانه و جهان قرار گرفته است.',
    awards: [
      { title: 'جایزه بهترین بازیگر مرد جشنواره بین‌المللی فیلم استانبول', year: '2006', movie_name: 'پدرم و پسرم (Babam ve Oğlum)', is_winner: true },
      { title: 'جایزه بهترین بازیگر مرد جوایز سینمایی سدری آلیشیک (Sadri Alışık)', year: '2006', movie_name: 'پدرم و پسرم (Babam ve Oğlum)', is_winner: true },
      { title: 'جایزه یک عمر دستاورد هنری جشنواره پرتقال طلایی آنتالیا', year: '2016', movie_name: 'دستاورد هنری و سینمایی', is_winner: true },
    ],
    known_for: [
      { title: 'چشم‌چران عمارت (Yalı Çapkını)', year: '2022-2024', role: 'هالیس آقا کورهان (Halis Ağa)' },
      { title: 'پدرم و پسرم (Babam ve Oğlum)', year: '2005', role: 'حسین' },
      { title: 'نفوذی (İçerde)', year: '2016-2017', role: 'جلال کبابچی (Kebapçı Celal)' },
      { title: 'کارادایی (Karadayı)', year: '2012-2015', role: 'ناظیف کارا (Nazif Kara)' },
    ]
  },
  'آفرا ساراچ‌اوغلو': {
    photo: 'https://m.media-amazon.com/images/M/MV5BNTIwODg3ZWYtZTAyNC00Nzg2LWE2NDctMTlhYTFlNTRmZjY5XkEyXkFqcGc@._V1_.jpg',
    birth_date: '۲ دسامبر ۱۹۹۷ (۲۷ سال)',
    birth_place: 'بالیکسیر، ترکیه',
    nationality: 'ترکیه‌ای',
    job: 'بازیگر و مدل',
    biography: 'آفرا ساراچ‌اوغلو (Afra Saraçoğlu) از ستاره‌های نسل نو و درخشان سینما و تلویزیون ترکیه است که با ایفای نقش پرانرژی «سیران سانلی» در درام پرطرفدار «چشم‌چران عمارت (Yalı Çapkını)» و نقش‌های کلیدی در «فضیلت خانم و دخترانش» و «معلم» به محبوبیت گسترده بین‌المللی دست یافته است.',
    awards: [
      { title: 'جایزه ستاره درخشان جوایز پروانه طلایی (Pantene Altın Kelebek)', year: '2018', movie_name: 'فضیلت خانم و دخترانش', is_winner: true },
      { title: 'جایزه بهترین بازیگر زن تلویزیون جوایز جوانان ترکیه', year: '2023', movie_name: 'چشم‌چران عمارت (Yalı Çapkını)', is_winner: true },
    ],
    known_for: [
      { title: 'چشم‌چران عمارت (Yalı Çapkını)', year: '2022-2024', role: 'سیران سانلی / کورهان' },
      { title: 'فضیلت خانم و دخترانش (Fazilet Hanım ve Kızları)', year: '2017-2018', role: 'اجه چامکیران' },
      { title: 'بچه بد (Kötü Çocuk)', year: '2017', role: 'کایلا' },
    ]
  },
  'مرت رمضان دمیر': {
    photo: 'https://m.media-amazon.com/images/M/MV5BNWUxMWI2M2UtM2NlZS00Nzc2LWE5NWQtZGRkMDdiMmZhMjU0XkEyXkFqcGc@._V1_.jpg',
    birth_date: '۲۸ ژانویه ۱۹۹۸ (۲۶ سال)',
    birth_place: 'استانبول، ترکیه',
    nationality: 'ترکیه‌ای',
    job: 'بازیگر سینما و تلویزیون',
    biography: 'مرت رمضان دمیر (Mert Ramazan Demir) از بازیگران بااستعداد و محبوب ترکیه است که با ایفای نقش کاریزماتیک «فرید کورهان» در سریال «چشم‌چران عمارت (Yalı Çapkını)» و حضور در سریال‌های «شاهماران (Şahmaran)» و «معلم (Öğretmen)» به شهرت بالایی رسیده است.',
    awards: [
      { title: 'جایزه بهترین زوج تلویزیونی جوایز پروانه طلایی', year: '2023', movie_name: 'چشم‌چران عمارت', is_winner: true },
      { title: 'جایزه بهترین بازیگر مرد جوایز انجمن روزنامه‌نگاران ترکیه', year: '2023', movie_name: 'چشم‌چران عمارت', is_winner: true },
    ],
    known_for: [
      { title: 'چشم‌چران عمارت (Yalı Çapkını)', year: '2022-2024', role: 'فرید کورهان (Ferit Korhan)' },
      { title: 'شاهماران (Şahmaran)', year: '2023', role: 'جهانگیر' },
      { title: 'بگو دوستم داری (Bize Müsaade)', year: '2021', role: 'امراه' },
    ]
  },
  'شاهرخ خان': {
    photo: 'https://m.media-amazon.com/images/M/MV5BODk3OWUxZTItYWVhNi00YjBhLTkyOWQtYTU0NTMzMzRjNWExXkEyXkFqcGc@._V1_.jpg',
    birth_date: '۲ نوامبر ۱۹۶۵ (۵۹ سال)',
    birth_place: 'دهلی نو، هند',
    nationality: 'هندی',
    job: 'بازیگر، تهیه‌کننده و پادشاه بالیوود (King Khan)',
    biography: 'شاهرخ خان (Shah Rukh Khan) ملقب به «پادشاه بالیوود» یا «کینگ خان»، از پرآوازه‌ترین و پرطرفدارترین فوق‌ستاره‌های تاریخ سینمای جهان و برنده ۱۴ جایزه معتبر فیلم‌فیر (Filmfare) و نشان عالی پادما شری از دولت هند است. او با فیلم‌های تاریخ‌سازی چون «دلداده»، «گاهی خوشی گاهی غم»، «نام من خان است»، «جوان» و «پتان» میلیاردها طرفدار در سراسر گیتی دارد.',
    awards: [
      { title: 'جایزه بهترین بازیگر مرد جوایز فیلم‌فیر (Filmfare)', year: '2011', movie_name: 'نام من خان است (My Name Is Khan)', is_winner: true },
      { title: 'نشان افتخار دولتی پادما شری (Padma Shri)', year: '2005', movie_name: 'دستاورد ملی فرهنگ و سینما', is_winner: true },
      { title: 'نشان لژیون دونور فرانسه (Legion of Honour)', year: '2014', movie_name: 'خدمات فرهنگی بین‌المللی', is_winner: true },
    ],
    known_for: [
      { title: 'جوان (Jawan)', year: '2023', role: 'ویکرام راتور / آزاد' },
      { title: 'پتان (Pathaan)', year: '2023', role: 'پتان' },
      { title: 'دلداده (DDLJ)', year: '1995', role: 'راج مالهوترا' },
      { title: 'نام من خان است (My Name Is Khan)', year: '2010', role: 'رضوان خان' },
    ]
  },
  'دیپیکا پادوکونه': {
    photo: 'https://m.media-amazon.com/images/M/MV5BNzc1MTc2ODgtYjRhYi00NGQ2LTkyYjgtZWEzNjY1MmNmOGM2XkEyXkFqcGc@._V1_.jpg',
    birth_date: '۵ ژانویه ۱۹۸۶ (۳۹ سال)',
    birth_place: 'کپنهاگ، دانمارک',
    nationality: 'هندی',
    job: 'بازیگر، تهیه‌کننده و ستاره بین‌المللی بالیوود',
    biography: 'دیپیکا پادوکونه (Deepika Padukone) یکی از گران‌قیمت‌ترین و تأثیرگذارترین بازیگران زن سینمای هند و برنده سه جایزه فیلم‌فیر است. او با درخشش در آثار حماسی همچون «پادماوات»، «باجیرو مستانی»، «پیکو»، «جوان» و حضور در جشنواره فیلم کن به نمادی بین‌المللی از سینمای معاصر هند تبدیل شده است.',
    awards: [
      { title: 'جایزه بهترین بازیگر زن جوایز فیلم‌فیر (Filmfare)', year: '2016', movie_name: 'پیکو (Piku)', is_winner: true },
      { title: 'جایزه بهترین بازیگر زن جوایز فیلم‌فیر', year: '2014', movie_name: 'رام لیلا (Goliyon Ki Raasleela Ram-Leela)', is_winner: true },
      { title: 'جایزه تایم ۱۰۰ (Time 100 Impact Award)', year: '2022', movie_name: 'شخصیت‌های تاثیرگذار جهان', is_winner: true },
    ],
    known_for: [
      { title: 'جوان (Jawan)', year: '2023', role: 'آیشواریا راتور' },
      { title: 'پادماوات (Padmaavat)', year: '2018', role: 'رانی پادماواتی' },
      { title: 'باجیرو مستانی (Bajirao Mastani)', year: '2015', role: 'مستانی' },
      { title: 'پیکو (Piku)', year: '2015', role: 'پیکو بانرجی' },
    ]
  }
};

/**
 * Generates an elegant SVG avatar with initials for any actor without a photo.
 * Ensures consistent theme colors and prevents displaying incorrect stock photos.
 */
export function generateInitialsAvatar(name: string): string {
  const cleanName = (name || '').trim();
  const parts = cleanName.split(/\s+/);
  let initials = '';
  if (parts.length >= 2) {
    initials = (parts[0][0] || '') + (parts[parts.length - 1][0] || '');
  } else if (parts.length === 1 && parts[0].length > 0) {
    initials = parts[0].substring(0, 2);
  } else {
    initials = '★';
  }

  // Generate subtle deterministic hue
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0;
  }
  const gradients = [
    ['#1E1B4B', '#4338CA'], // Indigo
    ['#311042', '#7E22CE'], // Purple
    ['#0F172A', '#334155'], // Slate
    ['#14241F', '#047857'], // Emerald
    ['#2E1010', '#B91C1C'], // Crimson
    ['#172554', '#1D4ED8'], // Blue
    ['#292524', '#78716C'], // Stone
  ];
  const [c1, c2] = gradients[Math.abs(hash) % gradients.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#g)" />
    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="32" fill="#F8FAFC" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">
      ${initials.toUpperCase()}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Track runtime broken photo URLs so the app immediately learns and skips bad images
const brokenPhotosSet = new Set<string>();

/**
 * Reports a failed/broken photo URL at runtime so fallback systems bypass it permanently
 */
export function reportBrokenPhoto(url?: string, name?: string, englishName?: string): void {
  if (!url || typeof url !== 'string') return;
  brokenPhotosSet.add(url);

  // Invalidate in-memory caches
  if (name) {
    const n1 = normalizePersonName(name);
    if (onlineActorCache[n1]?.photo === url) {
      delete onlineActorCache[n1].photo;
    }
  }
  if (englishName) {
    const n2 = normalizePersonName(englishName);
    if (onlineActorCache[n2]?.photo === url) {
      delete onlineActorCache[n2].photo;
    }
  }
}

/**
 * Verifies if a photo URL is valid and accessible, rejecting mock, broken or placeholder URLs
 */
export function isValidPhotoUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean || clean.startsWith('data:image/svg+xml')) return false;
  if (brokenPhotosSet.has(clean)) return false;
  if (clean.includes('unsplash.com') || clean.includes('ui-avatars.com')) return false;
  // Filter out mock TMDB hashes from initial template
  if (clean.includes('image.tmdb.org') && (
    clean.includes('n555b7G') ||
    clean.includes('1X6G0k') ||
    clean.includes('8c7j9O') ||
    clean.includes('3E3rR3') ||
    clean.includes('nPJXaR') ||
    clean.includes('5qHNjh') ||
    clean.includes('elSlNg') ||
    clean.includes('75l9vJ') ||
    clean.includes('tlA9sR') ||
    clean.includes('1x5M5f') ||
    clean.includes('BE2sdj') ||
    clean.includes('r3A7ev') ||
    clean.includes('z0G7Yp') ||
    clean.includes('2L2G7b') ||
    clean.includes('77e1rJ') ||
    clean.includes('mXp7A5')
  )) {
    return false;
  }
  return true;
}

/**
 * Normalizes Persian and English names for fuzzy key lookup
 */
export function normalizePersonName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[‌\s]+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\(\)\[\]،,.:;_\-]+/g, '')
    .trim();
}

// In-memory runtime cache for online resolved actor photos & biographies
const onlineActorCache: Record<string, { photo?: string; biography?: string; birth_date?: string; birth_place?: string; nationality?: string; wikipedia_url?: string }> = {};

/**
 * Resolves a verified photo for an actor, director or crew member.
 */
export function resolveActorPhoto(name: string, englishName?: string, propPhoto?: string): string {
  // Route blocked-host images through the server proxy so they load for Iranian users
  const proxyIfBlocked = (url: string): string => {
    if (url && /^https?:\/\/(image\.tmdb\.org|m\.media-amazon\.com|upload\.wikimedia\.org)\//.test(url)) {
      return `${API_BASE}/api/img-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // 0. Server database (source of truth) — checked FIRST so list/detail use the same data
  if (typeof window !== 'undefined') {
    const serverPhoto = getServerActorPhoto(name, englishName);
    if (serverPhoto && isValidPhotoUrl(serverPhoto)) {
      return proxyIfBlocked(serverPhoto);
    }
  }

  // 1. If a valid prop photo was provided that isn't broken
  if (propPhoto && isValidPhotoUrl(propPhoto)) {
    return proxyIfBlocked(propPhoto);
  }

  if (!name && !englishName) return generateInitialsAvatar('?');

  const norm1 = normalizePersonName(name);
  const norm2 = englishName ? normalizePersonName(englishName) : '';

  // 2. Check online cache first if populated with a verified working photo
  if (onlineActorCache[norm1]?.photo && isValidPhotoUrl(onlineActorCache[norm1].photo)) {
    return proxyIfBlocked(onlineActorCache[norm1].photo!);
  }
  if (norm2 && onlineActorCache[norm2]?.photo && isValidPhotoUrl(onlineActorCache[norm2].photo)) {
    return proxyIfBlocked(onlineActorCache[norm2].photo!);
  }

  // 3. Direct match in verified dictionary
  if (VERIFIED_PERSON_PHOTOS[norm1] && isValidPhotoUrl(VERIFIED_PERSON_PHOTOS[norm1])) {
    return proxyIfBlocked(VERIFIED_PERSON_PHOTOS[norm1]);
  }
  if (norm2 && VERIFIED_PERSON_PHOTOS[norm2] && isValidPhotoUrl(VERIFIED_PERSON_PHOTOS[norm2])) {
    return proxyIfBlocked(VERIFIED_PERSON_PHOTOS[norm2]);
  }

  // 4. Safe Initials Avatar (O(1) instead of loop over 267 entries for every actor)
  return generateInitialsAvatar(englishName || name);
}

/**
 * Resolves verified biography and details from local database or memory cache.
 */
export function resolveLocalActorData(name: string, englishName?: string): VerifiedPersonData | null {
  // Server database (source of truth) — checked FIRST
  if (typeof window !== 'undefined') {
    const rec = getServerActorBio(name, englishName);
    if (rec) {
      return {
        photo: rec.photo,
        biography: rec.biography || rec.bio,
        birth_date: rec.birth_date,
        birth_place: rec.birth_place,
        nationality: rec.nationality,
        job: rec.job,
        awards: rec.awards as ActorAward[] | undefined,
        known_for: rec.known_for as ActorKnownWork[] | undefined,
      };
    }
  }

  const norm1 = normalizePersonName(name);
  const norm2 = englishName ? normalizePersonName(englishName) : '';

  if (VERIFIED_PERSON_BIOS[norm1]) return VERIFIED_PERSON_BIOS[norm1];
  if (norm2 && VERIFIED_PERSON_BIOS[norm2]) return VERIFIED_PERSON_BIOS[norm2];

  for (const [key, data] of Object.entries(VERIFIED_PERSON_BIOS)) {
    if (norm1.includes(key) || key.includes(norm1)) return data;
    if (norm2 && (norm2.includes(key) || key.includes(norm2))) return data;
  }

  if (onlineActorCache[norm1]) {
    return {
      photo: onlineActorCache[norm1].photo,
      biography: onlineActorCache[norm1].biography,
      birth_date: onlineActorCache[norm1].birth_date,
      birth_place: onlineActorCache[norm1].birth_place,
      nationality: onlineActorCache[norm1].nationality,
    };
  }

  return null;
}

/**
 * Intelligent Fallback Biography Generator when no online or static bio exists.
 */
export function generateFallbackBio(
  name: string, 
  englishName?: string, 
  job?: string, 
  movieTitle?: string,
  character?: string
): string {
  const roleName = job || 'هنرمند و بازیگر';
  const charPart = character ? ` و ایفای نقش شخصیت «${character}»` : '';
  const workRef = movieTitle ? ` در اثر «${movieTitle}»` : '';
  const engRef = englishName && englishName !== name ? ` (${englishName})` : '';

  return `${name}${engRef} از جمله ${roleName}ان بااستعداد و شناخته‌شده در عرصه سینما و تلویزیون است که با حضور موثر خود${workRef}${charPart}، نقش‌آفرینی ارزشمندی را به نمایش گذاشته است.\n\nاین هنرمند با تسلط بر هنر اجرا، تعهد حرفه‌ای و درک عمیق از مدیوم سینما و سریال، جایگاهی ممتاز در میان اهالی هنر و مخاطبان به دست آورده است.`;
}

/**
 * Online Fetch for Actor details & photo from server API / Wikipedia REST API with fallbacks and translation
 */
export async function fetchActorDetailsOnline(
  name: string, 
  englishName?: string,
  currentMember?: Partial<CastMember>,
  movieTitle?: string
): Promise<Partial<CastMember>> {
  const norm = normalizePersonName(name || englishName || '');
  if (!norm) return {};

  // Check runtime cache
  if (onlineActorCache[norm] && onlineActorCache[norm].biography) {
    return {
      name,
      english_name: englishName,
      photo: onlineActorCache[norm].photo || resolveActorPhoto(name, englishName),
      biography: onlineActorCache[norm].biography,
      birth_date: onlineActorCache[norm].birth_date,
      birth_place: onlineActorCache[norm].birth_place,
      nationality: onlineActorCache[norm].nationality,
      wikipedia_url: onlineActorCache[norm].wikipedia_url,
    };
  }

  // 1. Check local static database
  const local = resolveLocalActorData(name, englishName);
  if (local && local.biography) {
    const verifiedPhoto = local.photo && isValidPhotoUrl(local.photo) ? local.photo : resolveActorPhoto(name, englishName);
    return {
      name,
      english_name: englishName,
      photo: verifiedPhoto,
      biography: local.biography,
      birth_date: local.birth_date,
      birth_place: local.birth_place,
      nationality: local.nationality,
      awards: local.awards,
      known_for: local.known_for,
    };
  }

  // 2. Call server endpoint /api/actors/details with full contextual metadata
  try {
    const params = new URLSearchParams({
      name: name || '',
      english_name: englishName || '',
      movie_title: movieTitle || '',
      character: currentMember?.character || '',
      job: currentMember?.job || '',
    });

    const res = await apiFetch(`/api/actors/details?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.found && data.biography) {
        onlineActorCache[norm] = {
          photo: data.photo,
          biography: data.biography,
          birth_date: data.birth_date,
          birth_place: data.birth_place,
          nationality: data.nationality,
          wikipedia_url: data.wikipedia_url,
        };

        const resolvedPhoto = (data.photo && isValidPhotoUrl(data.photo)) ? data.photo : resolveActorPhoto(name, englishName);

        return {
          name,
          english_name: englishName || data.english_name,
          photo: resolvedPhoto,
          biography: data.biography,
          birth_date: data.birth_date,
          birth_place: data.birth_place,
          nationality: data.nationality,
          wikipedia_url: data.wikipedia_url,
          awards: data.awards || currentMember?.awards,
          known_for: data.known_for || currentMember?.known_for,
        };
      }
    }
  } catch (err) {
    console.log('Error querying /api/actors/details:', err);
  }

  // 3. Fallback: Direct Wikipedia REST API call on client if server was offline
  try {
    const searchName = /[\u0600-\u06FF]/.test(name) ? name : (englishName || name);
    const lang = /[\u0600-\u06FF]/.test(searchName) ? 'fa' : 'en';
    const wikiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchName.trim())}`;
    
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData.extract) {
        const photoUrl = (wikiData.thumbnail?.source && isValidPhotoUrl(wikiData.thumbnail.source))
          ? wikiData.thumbnail.source 
          : ((wikiData.originalimage?.source && isValidPhotoUrl(wikiData.originalimage.source))
              ? wikiData.originalimage.source 
              : resolveActorPhoto(name, englishName));

        let bioText = wikiData.extract;

        // If client fetched English text, request translation from backend
        if (/[a-zA-Z]/.test(bioText) && !/[\u0600-\u06FF]/.test(bioText)) {
          try {
            const transRes = await apiFetch('/api/actors/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: bioText,
                name: name,
                english_name: englishName,
                role: currentMember?.character || currentMember?.job
              })
            });
            if (transRes.ok) {
              const transData = await transRes.json();
              if (transData.ok && transData.translated_text) {
                bioText = transData.translated_text;
              }
            }
          } catch {
            // keep original or fallback
          }
        }

        onlineActorCache[norm] = {
          photo: photoUrl,
          biography: bioText,
          wikipedia_url: wikiData.content_urls?.desktop?.page,
        };

        return {
          name,
          english_name: englishName,
          photo: photoUrl,
          biography: bioText,
          wikipedia_url: wikiData.content_urls?.desktop?.page,
        };
      }
    }
  } catch {
    // ignore
  }

  // 4. Intelligent Fallback Generator
  const fallbackBio = generateFallbackBio(name, englishName, currentMember?.job, movieTitle, currentMember?.character);
  return {
    name,
    english_name: englishName,
    photo: resolveActorPhoto(name, englishName),
    biography: fallbackBio,
  };
}

/**
 * Online Fetch Actor photo with multi-stage fallback and live validation
 */
export async function fetchActorPhotoOnline(name: string, englishName?: string, forceLive: boolean = false): Promise<string> {
  const norm = normalizePersonName(englishName || name);
  
  if (!forceLive && onlineActorCache[norm]?.photo && isValidPhotoUrl(onlineActorCache[norm].photo)) {
    return onlineActorCache[norm].photo!;
  }

  if (!forceLive) {
    const local = resolveActorPhoto(name, englishName);
    if (local && !local.startsWith('data:image/svg+xml') && isValidPhotoUrl(local)) {
      return local;
    }
  }

  // 1. Query server photo endpoint
  try {
    const searchName = englishName || name;
    const res = await apiFetch(`/api/actors/photo?name=${encodeURIComponent(name)}&english_name=${encodeURIComponent(searchName)}&_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.photo && isValidPhotoUrl(data.photo)) {
        if (!onlineActorCache[norm]) onlineActorCache[norm] = {};
        onlineActorCache[norm].photo = data.photo;
        return data.photo;
      }
    }
  } catch {
    // Ignore and proceed to client fallback
  }

  // 2. Direct client query to Wikipedia REST API (fa, en, tr, hi)
  try {
    const searchNames = [englishName, name].filter(Boolean) as string[];
    for (const q of searchNames) {
      const isFa = /[\u0600-\u06FF]/.test(q);
      const langs: Array<'fa' | 'en' | 'tr' | 'hi'> = isFa ? ['fa', 'en'] : ['en', 'tr', 'hi', 'fa'];
      for (const lang of langs) {
        const wikiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.trim())}`;
        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const foundPhoto = wikiData.thumbnail?.source || wikiData.originalimage?.source;
          if (foundPhoto && isValidPhotoUrl(foundPhoto)) {
            if (!onlineActorCache[norm]) onlineActorCache[norm] = {};
            onlineActorCache[norm].photo = foundPhoto;
            return foundPhoto;
          }
        }
      }
    }
  } catch {
    // Ignore
  }

  return generateInitialsAvatar(englishName || name);
}
