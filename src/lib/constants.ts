import { GameConfig, GameType, Language } from '@/types';

// Game configurations
export const GAMES: GameConfig[] = [
  {
    id: 'finish-thought',
    name: 'Finish My Thought',
    nameHindi: 'मेरी बात पूरी करो',
    nameTamil: 'என் எண்ணத்தை முடிக்க',
    description: 'Continue a sentence and trail off naturally',
    icon: '💭',
    color: '#F59E0B',
    focusLabel: 'incomplete',
    instructions: {
      hi: 'वाक्य को जारी रखें और स्वाभाविक रूप से रुकें जैसे सोच रहे हों',
      en: 'Continue the sentence and trail off naturally as if thinking',
      ta: 'வாக்கியத்தைத் தொடர்ந்து சிந்திப்பது போல் இயல்பாக நிறுத்துங்கள்',
    },
  },
  {
    id: 'quick-answer',
    name: 'Quick Answer',
    nameHindi: 'जल्दी जवाब',
    nameTamil: 'விரைவான பதில்',
    description: 'Answer questions with short, confident responses',
    icon: '⚡',
    color: '#10B981',
    focusLabel: 'complete',
    instructions: {
      hi: 'प्रश्न का एक वाक्य में आत्मविश्वास से उत्तर दें',
      en: 'Answer the question confidently in one sentence',
      ta: 'கேள்விக்கு ஒரு வாக்கியத்தில் நம்பிக்கையுடன் பதிலளிக்கவும்',
    },
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    nameHindi: 'कहानी सुनाओ',
    nameTamil: 'கதை சொல்',
    description: 'Tell mini-stories, sometimes complete, sometimes trailing off',
    icon: '📖',
    color: '#8B5CF6',
    focusLabel: 'both',
    instructions: {
      hi: 'एक छोटी कहानी सुनाएं - कभी पूरी, कभी अधूरी',
      en: 'Tell a mini-story - sometimes complete, sometimes trailing off',
      ta: 'ஒரு சிறிய கதை சொல்லுங்கள் - சில நேரம் முழுமையாக, சில நேரம் அரைகுறையாக',
    },
  },
  {
    id: 'memory-lane',
    name: 'Memory Lane',
    nameHindi: 'यादों की गली',
    nameTamil: 'நினைவுப் பாதை',
    description: 'Recall memories - remember clearly or think out loud',
    icon: '🧠',
    color: '#EC4899',
    focusLabel: 'both',
    instructions: {
      hi: 'कुछ याद करें - या तो स्पष्ट रूप से बताएं या सोचते हुए बोलें',
      en: 'Recall something - either remember clearly or think out loud',
      ta: 'ஏதாவது நினைவுகூருங்கள் - தெளிவாக சொல்லுங்கள் அல்லது சிந்தித்து பேசுங்கள்',
    },
  },
  {
    id: 'number-dictation',
    name: 'Number Dictation',
    nameHindi: 'नंबर बोलो',
    nameTamil: 'எண் சொல்',
    description: 'Dictate numbers - complete or pause midway',
    icon: '🔢',
    color: '#3B82F6',
    focusLabel: 'both',
    instructions: {
      hi: 'नंबर बोलें - पूरा या बीच में रुकें',
      en: 'Dictate numbers - complete the sequence or pause midway',
      ta: 'எண்களை சொல்லுங்கள் - முழுமையாக அல்லது நடுவில் நிறுத்துங்கள்',
    },
  },
];

// Language configurations
export const LANGUAGES: { id: Language; name: string; nativeName: string; flag: string }[] = [
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
];

// Collection targets
export const COLLECTION_TARGETS = {
  perCategory: 500,        // Target per category per language
  perExpertDaily: 50,      // Daily target per expert
  minDuration: 2,          // Minimum recording duration (seconds)
  maxDuration: 16,         // Maximum recording duration (seconds)
  idealDurationRange: [3, 10], // Ideal duration range
};

// Category configurations
export const CATEGORIES = [
  {
    id: 'complete-nofiller',
    label: 'complete' as const,
    name: 'Complete (No Filler)',
    description: 'Clear, confident endings',
    color: '#22C55E',
  },
  {
    id: 'complete-withfiller',
    label: 'complete' as const,
    name: 'Complete (With Filler)',
    description: 'Complete with natural fillers like "you know"',
    color: '#4ADE80',
  },
  {
    id: 'incomplete-midfiller',
    label: 'incomplete' as const,
    name: 'Incomplete (Mid-Filler)',
    description: 'Trailing off with fillers in the middle',
    color: '#F97316',
  },
  {
    id: 'incomplete-endfiller',
    label: 'incomplete' as const,
    name: 'Incomplete (End-Filler)',
    description: 'Trailing off with fillers at the end',
    color: '#FB923C',
  },
];

// Filler words by language
export const FILLER_WORDS: Record<Language, string[]> = {
  hi: ['उम्म', 'आ', 'वो', 'क्या है ना', 'मतलब', 'अच्छा', 'हाँ'],
  en: ['um', 'uh', 'like', 'you know', 'I mean', 'well', 'so'],
  ta: ['அது', 'என்ன', 'அப்போ', 'ஆமா', 'சரி'],
};

// Get game by ID
export function getGameById(id: GameType): GameConfig | undefined {
  return GAMES.find(game => game.id === id);
}

// Get language by ID
export function getLanguageById(id: Language) {
  return LANGUAGES.find(lang => lang.id === id);
}
