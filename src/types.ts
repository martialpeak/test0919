export interface Movie {
  message_id: number;
  title: string;
  english_title?: string;
  description?: string;
  poster_url?: string;
  year?: string;
  genre?: string;
  rating?: string;
  country?: string;
  actors?: string;
  director?: string;
  quality?: string;
  channel?: string;
  timestamp?: number;
  synced_at?: number;
  category?: string;
  actor_photos?: string;
  trailer_url?: string;
  /** Server-hosted trailer (nginx /downloads/trailers/<id>.mp4) — plays behind the hero banner without YouTube. */
  local_trailer?: string;
  movie_stills?: string;
  is_favorite?: boolean;
  imdb_id?: string;
  box_office?: string;
  search_text?: string;
  awards?: MovieAward[];
  awards_summary?: string;
  crew?: CastMember[];
  next_episode_info?: NextEpisodeInfo;
  /** Runtime in minutes (movie: total, series: avg episode length) */
  runtime?: number;
  /** Series shelf: available seasons / episodes */
  seasons_count?: number;
  episodes_count?: number;
}

export interface MovieAward {
  id?: string;
  title: string;
  category: string;
  year: string;
  is_winner: boolean;
  recipient?: string;
  organization?: string;
  icon?: 'oscar' | 'globe' | 'bafta' | 'cannes' | 'emmy' | 'fajr' | 'trophy';
}

export interface ActorAward {
  title: string;
  category?: string;
  year: string;
  movie_name?: string;
  is_winner: boolean;
}

export interface ActorKnownWork {
  title: string;
  english_title?: string;
  year?: string;
  role?: string;
  poster?: string;
}

export interface ActorPhoto {
  name: string;
  photo: string;
  character?: string;
  biography?: string;
  tmdb_id?: number;
}

export interface CastMember {
  name: string;
  english_name?: string;
  character?: string;
  photo?: string;
  job?: string;
  biography?: string;
  birth_date?: string;
  birth_place?: string;
  nationality?: string;
  wikipedia_url?: string;
  awards?: ActorAward[];
  known_for?: ActorKnownWork[];
  tmdb_id?: number;
}

export interface ServerCastResponse {
  ok: boolean;
  imdb_id?: string;
  directors: CastMember[];
  crew?: CastMember[];
  cast: CastMember[];
  awards?: MovieAward[];
  awards_summary?: string;
}

export interface ServerAwardsResponse {
  ok: boolean;
  imdb_id?: string;
  awards_summary?: string;
  total_won?: number;
  total_nominated?: number;
  awards: MovieAward[];
}

export interface ServerTrailerResponse {
  ok: boolean;
  imdb_id?: string;
  imdb_url?: string;
  imdb_video_id?: string;
  imdb_embed_url?: string;
  video_url?: string;
  video_definition?: string;
  page_url?: string;
  youtube_url?: string;
  source?: 'imdb' | 'youtube' | 'direct';
}

export interface BoxOfficeEntry {
  message_id: number;
  title: string;
  english_title?: string;
  poster_url: string;
  box_office_value: number;
  box_office_label: string;
  category: string;
  rating: string;
  year: string;
  rank: number;
  budget?: string;
  roi_percentage?: number;
  country?: string;
  imdb_id?: string;
}

export type TrackingStatus = 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';

export interface NextEpisodeInfo {
  airDate: string;
  timestamp: number; // Epoch timestamp in ms for live countdown
  season: number;
  episode: number;
  episodeTitle?: string;
  network?: string;
  source?: 'tvmaze' | 'tmdb' | 'broadcast_db' | 'user';
  formattedPersian?: string;
  dayOfWeek?: string;
  timeOfDay?: string;
  isUpcoming: boolean;
}

export interface TrackingItem {
  message_id: number;
  media_type: 'movie' | 'series';
  status?: TrackingStatus;
  current_season?: number;
  last_episode: number;
  total_episodes?: number;
  times_watched: number;
  user_rating?: number;
  next_episode_date: string;
  next_episode_info?: NextEpisodeInfo;
  note: string;
  title?: string;
  english_title?: string;
  poster_url?: string;
  category?: string;
  year?: string;
  genre?: string;
  favorite?: boolean;
  updated_at?: number;
}

export interface TrackingRequest {
  media_type: 'movie' | 'series';
  status?: TrackingStatus;
  current_season?: number;
  last_episode: number;
  total_episodes?: number;
  times_watched: number;
  user_rating?: number;
  next_episode_date: string;
  next_episode_info?: NextEpisodeInfo;
  note: string;
  favorite?: boolean;
}

export type ViewMode = 'GRID' | 'LIST';

export type SortType = 
  | 'NEWEST' 
  | 'OLDEST' 
  | 'YEAR_NEW' 
  | 'YEAR_OLD' 
  | 'RATING_HIGH' 
  | 'RATING_LOW' 
  | 'NAME';

export type ActiveTab = 'home' | 'ai_assistant' | 'actors' | 'detail' | 'tracking' | 'boxoffice' | 'settings' | 'trailer';

// --- AI Cinephile Assistant & Voice Types ---
export type VoiceSpeaker = 'delara' | 'farid';

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  suggestions?: string[];
  modelUsed?: string;
  category?: 'chat' | 'mood' | 'philosophy' | 'battle' | 'iranian_oscar' | 'guess_game';
  dataPayload?: any;
}

export interface MoodCategory {
  id: string;
  title: string;
  persianLabel: string;
  iconName: string;
  gradient: string;
  description: string;
  vibeTags: string[];
}

export interface MoodMovieRecommendation {
  title: string;
  english_title?: string;
  year?: string;
  rating?: string;
  director?: string;
  poster_url?: string;
  why_it_matches: string;
  cinematic_vibe: string;
  iconic_quote?: string;
  match_percentage: number;
}

export interface PhilosophicalAnalysisResult {
  title: string;
  english_title?: string;
  year?: string;
  director?: string;
  poster_url?: string;
  philosophical_school: string; // e.g. Existentialism, Nihilism, Absurdism, Determinism
  core_thesis: string;
  deep_analysis: string;
  hidden_symbolism: {
    symbol: string;
    meaning: string;
  }[];
  ending_interpretation: string;
  cinematography_and_color: string;
  key_quote?: string;
}

export interface BattleCategoryComparison {
  name: string;
  score1: number; // 1-10
  score2: number; // 1-10
  comparison_text: string;
  winner_index: 1 | 2 | 0; // 0 for tie
}

export interface MovieBattleResult {
  movie1_title: string;
  movie2_title: string;
  movie1_year?: string;
  movie2_year?: string;
  movie1_director?: string;
  movie2_director?: string;
  movie1_poster?: string;
  movie2_poster?: string;
  overall_winner: string;
  winner_index: 1 | 2 | 0;
  verdict_summary: string;
  categories: BattleCategoryComparison[];
  artistic_legacy_comparison: string;
  final_recommendation: string;
}

export interface IranianCinemaAnalysisResult {
  topic_title: string;
  era_or_movement: string;
  director_or_film?: string;
  historical_context: string;
  aesthetic_innovations: string[];
  oscar_and_international_impact: string;
  essential_masterpieces: {
    title: string;
    english_title?: string;
    year: string;
    director: string;
    significance: string;
  }[];
  philosophical_undercurrent: string;
}

export interface GuessGameQuestion {
  id: string;
  title: string;
  english_title: string;
  year: string;
  director: string;
  emoji_clues: string[];
  iconic_dialogue: string;
  cryptic_premise: string;
  genre_hint: string;
  cast_hint: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'cinephile';
  fun_fact: string;
  points: number;
}

