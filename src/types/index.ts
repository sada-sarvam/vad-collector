// Game Types
export type GameType = 
  | 'finish-thought' 
  | 'quick-answer' 
  | 'storyteller' 
  | 'memory-lane' 
  | 'number-dictation';

export type Language = 'hi' | 'en' | 'ta';

export type Label = 'complete' | 'incomplete';

export type Category = 
  | 'complete-nofiller'
  | 'complete-withfiller'
  | 'incomplete-midfiller'
  | 'incomplete-endfiller';

// Prompt Types
export interface Prompt {
  id: string;
  gameType: GameType;
  language: Language;
  text: string;
  instruction: string;
  expectedLabel?: Label;  // For games with random modes, this is set when prompt is fetched
  mode?: 'complete' | 'trail-off' | 'random';
}

// Recording Types
export interface Recording {
  _id?: string;
  id: string;
  expertId: string;
  expertName: string;
  gameType: GameType;
  language: Language;
  label: Label;
  category: Category;
  audioUrl: string;
  audioDuration: number;
  promptId: string;
  promptText: string;
  instruction: string;
  createdAt: Date;
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  rejected?: boolean;
  rejectionReason?: string;
}

// Stats Types
export interface CategoryStats {
  category: Category;
  count: number;
  target: number;
  percentage: number;
}

export interface LanguageStats {
  language: Language;
  total: number;
  complete: number;
  incomplete: number;
  byCategory: CategoryStats[];
}

export interface GameStats {
  gameType: GameType;
  total: number;
  byLanguage: Record<Language, number>;
}

export interface ExpertStats {
  expertId: string;
  expertName: string;
  totalRecordings: number;
  todayRecordings: number;
  byGame: GameStats[];
  byLanguage: LanguageStats[];
  streak: number;
  rank: number;
}

export interface OverallStats {
  totalRecordings: number;
  totalExperts: number;
  todayRecordings: number;
  byLanguage: LanguageStats[];
  byGame: GameStats[];
  completionPercentage: number;
}

// Game Configuration
export interface GameConfig {
  id: GameType;
  name: string;
  nameHindi: string;
  nameTamil: string;
  description: string;
  icon: string;
  color: string;
  focusLabel: 'complete' | 'incomplete' | 'both';
  instructions: {
    hi: string;
    en: string;
    ta: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Expert/User Types
export interface Expert {
  id: string;
  name: string;
  email: string;
  languages: Language[];
  createdAt: Date;
  lastActive: Date;
  totalRecordings: number;
}
