/**
 * Gemini API client for dynamic prompt generation.
 * Uses Vertex AI with service account credentials.
 * Supports both local development (file path) and Vercel (JSON in env var).
 */

import { GameType, Language, Label } from '@/types';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Configuration
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'dap-development';
const LOCATION = process.env.GOOGLE_LOCATION || 'us-west4';
const MODEL_ID = process.env.GEMINI_MODEL_ID || 'gemini-2.5-flash';

// Setup credentials for both local and Vercel environments
function setupCredentials() {
  // Already set up
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return true;
  }

  // Option 1: Local development with file path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;
    return true;
  }

  // Option 2: Vercel deployment with JSON in env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      // Write credentials to /tmp (writable in Vercel serverless)
      const tmpDir = '/tmp';
      const credPath = join(tmpDir, 'gcp-credentials.json');
      
      // Parse and write the JSON credentials
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      writeFileSync(credPath, JSON.stringify(credentials));
      
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
      console.log('Credentials written to:', credPath);
      return true;
    } catch (error) {
      console.error('Failed to setup credentials from JSON:', error);
      return false;
    }
  }

  console.warn('No Google credentials found. Gemini API will use fallback prompts.');
  return false;
}

// Initialize credentials on module load
setupCredentials();

// Lazy import and client initialization
let genaiClient: any = null;

async function getClient() {
  if (!genaiClient) {
    // Ensure credentials are set up
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      setupCredentials();
    }
    
    try {
      const { GoogleGenAI } = await import('@google/genai');
      genaiClient = new GoogleGenAI({
        vertexai: true,
        project: PROJECT_ID,
        location: LOCATION,
      });
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
      return null;
    }
  }
  return genaiClient;
}

// Random seed for variety
const getRandomSeed = () => Math.random().toString(36).substring(7);

// Topic categories for variety
const TOPIC_CATEGORIES = {
  'finish-thought': [
    'travel plans', 'food preferences', 'weekend activities', 'work/study', 'family',
    'movies/shows', 'music', 'shopping', 'health', 'hobbies', 'weather', 'news',
    'childhood memories', 'future goals', 'recent experiences', 'opinions', 'comparisons'
  ],
  'quick-answer': [
    'favorite things', 'preferences', 'daily routine', 'simple facts', 'opinions',
    'would you rather', 'this or that', 'last time you', 'best/worst', 'if you could'
  ],
  'storyteller': [
    'funny incident', 'embarrassing moment', 'strange dream', 'childhood memory',
    'travel story', 'school/college story', 'work story', 'family gathering',
    'unexpected encounter', 'cooking disaster', 'tech fail', 'festival memory',
    'first day somewhere', 'learning something new', 'helping someone'
  ],
  'memory-lane': [
    'first teacher', 'childhood friend', 'favorite toy', 'old phone number',
    'grandparents house', 'first movie in theater', 'school bus', 'favorite snack as kid',
    'first bicycle', 'old neighbor', 'childhood game', 'first crush', 'school prayer',
    'lunch box memory', 'summer vacation spot', 'festival celebration', 'birthday party'
  ],
  'number-dictation': [
    'phone number', 'OTP code', 'PIN number', 'address number', 'vehicle number',
    'bank account digits', 'Aadhaar digits', 'price', 'measurement', 'date'
  ]
};

// Prompt templates with variety instructions
const GAME_PROMPT_TEMPLATES: Record<GameType, string> = {
  'finish-thought': `You are generating prompts for a voice data collection app. Generate ONE unique, creative sentence starter in {language_name} that someone would naturally trail off from while thinking.

REQUIREMENTS:
- Topic category: {topic_category}
- Must be incomplete and invite continuation
- Natural, conversational tone
- 5-15 words
- Be creative and unique (seed: {seed})
- Don't repeat common examples

AVOID these overused starters:
- "मुझे लगता है कि आज..." 
- "I was thinking..."
- "நான் நினைக்கிறேன்..."

Generate something FRESH and DIFFERENT about: {topic_category}

Return ONLY the sentence starter in {language_name}, nothing else.`,

  'quick-answer': `You are generating prompts for a voice data collection app. Generate ONE unique, interesting question in {language_name} that can be answered in one confident sentence.

REQUIREMENTS:
- Question category: {topic_category}
- Easy to answer quickly and confidently
- Conversational and natural
- Be creative and unique (seed: {seed})

AVOID these overused questions:
- "आपका पसंदीदा खाना क्या है?"
- "What's your favorite color/food/season?"
- "உங்களுக்கு பிடித்த நிறம் என்ன?"

Generate something FRESH about: {topic_category}

Return ONLY the question in {language_name}, nothing else.`,

  'storyteller': `You are generating prompts for a voice data collection app. Generate ONE unique, engaging story topic in {language_name} that someone can narrate in 10-20 seconds.

REQUIREMENTS:
- Story category: {topic_category}
- Interesting and relatable
- Easy to narrate briefly
- Be creative and unique (seed: {seed})
- Should evoke a specific memory or scenario

AVOID generic topics like:
- "Tell me about a dream"
- "Share a memory"

Generate a SPECIFIC, UNIQUE topic about: {topic_category}
For example: "The time you accidentally wore mismatched shoes" or "Your first attempt at cooking"

Return ONLY the story topic in {language_name}, nothing else.`,

  'memory-lane': `You are generating prompts for a voice data collection app. Generate ONE unique memory recall prompt in {language_name} that makes someone think out loud while trying to remember.

REQUIREMENTS:
- Memory category: {topic_category}
- Should trigger genuine recall effort
- Specific enough to evoke a memory
- Be creative and unique (seed: {seed})

AVOID generic prompts like:
- "Remember your childhood"
- "Think of an old friend"

Generate a SPECIFIC prompt about: {topic_category}
For example: "What was the name of the street you grew up on?" or "Try to remember your first mobile phone's ringtone"

Return ONLY the memory prompt in {language_name}, nothing else.`,

  'number-dictation': `Generate a realistic {topic_category} for dictation practice.

REQUIREMENTS:
- Type: {topic_category}
- If phone number: 10 digits, can start with 6,7,8,9
- If OTP: 4-6 digits
- If PIN: 4-6 digits
- If price: realistic Indian price (like 1599, 24999)
- Format: digits separated by spaces
- Be random (seed: {seed})

Return ONLY the number sequence with spaces between digits, nothing else.
Example formats:
- Phone: "9 8 7 6 5 4 3 2 1 0"
- OTP: "4 5 8 2 9 1"
- Price: "2 4 9 9 9"`,
};

const LANGUAGE_NAMES: Record<Language, string> = {
  hi: 'Hindi',
  en: 'English',
  ta: 'Tamil',
};

export interface GeneratedPrompt {
  text: string;
  instruction: string;
  expectedLabel?: Label;
  metadata?: Record<string, unknown>;
}

/**
 * Generate a dynamic prompt for a specific game and language using Gemini
 */
export async function generatePrompt(
  gameType: GameType,
  language: Language,
  mode?: 'complete' | 'trail-off'
): Promise<GeneratedPrompt> {
  try {
    const client = await getClient();
    
    if (!client) {
      console.warn('Gemini client not available, using fallback prompt');
      return getRandomFallbackPrompt(gameType, language);
    }

    const template = GAME_PROMPT_TEMPLATES[gameType];
    const languageName = LANGUAGE_NAMES[language];
    
    // Get random topic category for variety
    const topicCategories = TOPIC_CATEGORIES[gameType];
    const randomTopic = topicCategories[Math.floor(Math.random() * topicCategories.length)];
    
    const prompt = template
      .replace(/{language_name}/g, languageName)
      .replace(/{topic_category}/g, randomTopic)
      .replace(/{seed}/g, getRandomSeed());

    // Use the correct API: client.models.generateContent
    const response = await client.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
    });

    const text = response.text?.trim() || response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      console.warn('Empty response from Gemini, using fallback');
      return getRandomFallbackPrompt(gameType, language);
    }

    // Clean up the response (remove quotes if present)
    const cleanText = text.replace(/^["']|["']$/g, '').trim();

    // Determine mode for games that need it
    const actualMode = mode || (Math.random() > 0.5 ? 'complete' : 'trail-off');

    return parseResponse(gameType, language, cleanText, actualMode);
  } catch (error) {
    console.error('Gemini API error:', error);
    return getRandomFallbackPrompt(gameType, language);
  }
}

/**
 * Parse Gemini response based on game type
 */
function parseResponse(
  gameType: GameType,
  language: Language,
  text: string,
  mode: 'complete' | 'trail-off'
): GeneratedPrompt {
  switch (gameType) {
    case 'finish-thought':
      return {
        text,
        instruction: getInstruction('finish-thought', language),
        expectedLabel: 'incomplete',
      };

    case 'quick-answer':
      return {
        text,
        instruction: getInstruction('quick-answer', language),
        expectedLabel: 'complete',
      };

    case 'storyteller':
      return {
        text,
        instruction: getInstruction('storyteller', language, mode),
        expectedLabel: mode === 'complete' ? 'complete' : 'incomplete',
      };

    case 'memory-lane':
      return {
        text,
        instruction: getInstruction('memory-lane', language, mode),
        expectedLabel: mode === 'complete' ? 'complete' : 'incomplete',
      };

    case 'number-dictation':
      return {
        text,
        instruction: getInstruction('number-dictation', language, mode),
        expectedLabel: mode === 'complete' ? 'complete' : 'incomplete',
      };

    default:
      return {
        text,
        instruction: 'Record your response',
        expectedLabel: undefined,
      };
  }
}

/**
 * Get instruction text based on game type and language
 */
function getInstruction(
  gameType: GameType,
  language: Language,
  mode?: 'complete' | 'trail-off'
): string {
  const instructions: Record<GameType, Record<Language, string | ((m: string) => string)>> = {
    'finish-thought': {
      hi: 'इसे जारी रखें और स्वाभाविक रूप से रुकें',
      en: 'Continue this and trail off naturally',
      ta: 'இதைத் தொடர்ந்து இயல்பாக நிறுத்துங்கள்',
    },
    'quick-answer': {
      hi: 'एक वाक्य में आत्मविश्वास से जवाब दें',
      en: 'Answer confidently in one sentence',
      ta: 'ஒரு வாக்கியத்தில் நம்பிக்கையுடன் பதிலளிக்கவும்',
    },
    'storyteller': {
      hi: (m: string) => m === 'complete' ? 'कहानी पूरी करें' : 'बीच में रुक जाएं जैसे सोच रहे हों',
      en: (m: string) => m === 'complete' ? 'Complete the story' : 'Stop mid-thought as if thinking',
      ta: (m: string) => m === 'complete' ? 'கதையை முடிக்கவும்' : 'நடுவில் நிறுத்துங்கள்',
    },
    'memory-lane': {
      hi: (m: string) => m === 'complete' ? 'याद करके बताएं' : 'याद करते हुए सोचें',
      en: (m: string) => m === 'complete' ? 'Recall and say it' : 'Try to recall out loud',
      ta: (m: string) => m === 'complete' ? 'நினைவுகூர்ந்து சொல்லுங்கள்' : 'நினைவுகூர முயற்சிக்கவும்',
    },
    'number-dictation': {
      hi: (m: string) => m === 'complete' ? 'पूरा नंबर बोलें' : 'बीच में रुकें जैसे जांच रहे हों',
      en: (m: string) => m === 'complete' ? 'Dictate the full number' : 'Pause midway as if checking',
      ta: (m: string) => m === 'complete' ? 'முழு எண்ணையும் சொல்லுங்கள்' : 'நடுவில் நிறுத்துங்கள்',
    },
  };

  const instr = instructions[gameType][language];
  if (typeof instr === 'function') {
    return instr(mode || 'complete');
  }
  return instr;
}

// Extended fallback prompts for variety
const FALLBACK_PROMPTS: Record<GameType, Record<Language, GeneratedPrompt[]>> = {
  'finish-thought': {
    hi: [
      { text: 'अगर मुझे मौका मिले तो मैं...', instruction: 'इसे जारी रखें और स्वाभाविक रूप से रुकें', expectedLabel: 'incomplete' },
      { text: 'कल जब मैं बाज़ार गया था तो वहाँ...', instruction: 'इसे जारी रखें और स्वाभाविक रूप से रुकें', expectedLabel: 'incomplete' },
      { text: 'मेरी माँ हमेशा कहती हैं कि...', instruction: 'इसे जारी रखें और स्वाभाविक रूप से रुकें', expectedLabel: 'incomplete' },
      { text: 'इस बारिश में मुझे याद आता है...', instruction: 'इसे जारी रखें और स्वाभाविक रूप से रुकें', expectedLabel: 'incomplete' },
      { text: 'अगले हफ्ते मैं शायद...', instruction: 'इसे जारी रखें और स्वाभाविक रूप से रुकें', expectedLabel: 'incomplete' },
    ],
    en: [
      { text: 'The last time I went to a restaurant...', instruction: 'Continue this and trail off naturally', expectedLabel: 'incomplete' },
      { text: 'If I could travel anywhere right now...', instruction: 'Continue this and trail off naturally', expectedLabel: 'incomplete' },
      { text: 'My friend was telling me about this new...', instruction: 'Continue this and trail off naturally', expectedLabel: 'incomplete' },
      { text: 'I\'ve been meaning to try...', instruction: 'Continue this and trail off naturally', expectedLabel: 'incomplete' },
      { text: 'The weather today reminds me of...', instruction: 'Continue this and trail off naturally', expectedLabel: 'incomplete' },
    ],
    ta: [
      { text: 'நேத்து நான் கடைக்கு போனப்போ...', instruction: 'இதைத் தொடர்ந்து இயல்பாக நிறுத்துங்கள்', expectedLabel: 'incomplete' },
      { text: 'என்னோட நண்பன் சொன்னான்...', instruction: 'இதைத் தொடர்ந்து இயல்பாக நிறுத்துங்கள்', expectedLabel: 'incomplete' },
      { text: 'அடுத்த வாரம் நான் போகணும்...', instruction: 'இதைத் தொடர்ந்து இயல்பாக நிறுத்துங்கள்', expectedLabel: 'incomplete' },
      { text: 'இந்த பாட்டு கேக்கும்போது எனக்கு...', instruction: 'இதைத் தொடர்ந்து இயல்பாக நிறுத்துங்கள்', expectedLabel: 'incomplete' },
      { text: 'சின்ன வயசுல நான் எப்பவும்...', instruction: 'இதைத் தொடர்ந்து இயல்பாக நிறுத்துங்கள்', expectedLabel: 'incomplete' },
    ],
  },
  'quick-answer': {
    hi: [
      { text: 'आपकी सबसे अच्छी छुट्टी कहाँ बिताई?', instruction: 'एक वाक्य में आत्मविश्वास से जवाब दें', expectedLabel: 'complete' },
      { text: 'सुबह उठकर सबसे पहले क्या करते हैं?', instruction: 'एक वाक्य में आत्मविश्वास से जवाब दें', expectedLabel: 'complete' },
      { text: 'आपका पसंदीदा त्योहार कौन सा है?', instruction: 'एक वाक्य में आत्मविश्वास से जवाब दें', expectedLabel: 'complete' },
      { text: 'चाय या कॉफी, क्या पसंद है?', instruction: 'एक वाक्य में आत्मविश्वास से जवाब दें', expectedLabel: 'complete' },
      { text: 'आखिरी बार आपने कौन सी फिल्म देखी?', instruction: 'एक वाक्य में आत्मविश्वास से जवाब दें', expectedLabel: 'complete' },
    ],
    en: [
      { text: 'What\'s your go-to comfort food?', instruction: 'Answer confidently in one sentence', expectedLabel: 'complete' },
      { text: 'Morning person or night owl?', instruction: 'Answer confidently in one sentence', expectedLabel: 'complete' },
      { text: 'What\'s the last book you read?', instruction: 'Answer confidently in one sentence', expectedLabel: 'complete' },
      { text: 'Beach vacation or mountain trip?', instruction: 'Answer confidently in one sentence', expectedLabel: 'complete' },
      { text: 'What skill would you love to learn?', instruction: 'Answer confidently in one sentence', expectedLabel: 'complete' },
    ],
    ta: [
      { text: 'உங்களுக்கு பிடித்த திரைப்படம் எது?', instruction: 'ஒரு வாக்கியத்தில் நம்பிக்கையுடன் பதிலளிக்கவும்', expectedLabel: 'complete' },
      { text: 'காலையில் எழுந்ததும் முதல்ல என்ன செய்வீங்க?', instruction: 'ஒரு வாக்கியத்தில் நம்பிக்கையுடன் பதிலளிக்கவும்', expectedLabel: 'complete' },
      { text: 'உங்களுக்கு பிடித்த பண்டிகை எது?', instruction: 'ஒரு வாக்கியத்தில் நம்பிக்கையுடன் பதிலளிக்கவும்', expectedLabel: 'complete' },
      { text: 'டீ-யா காபி-யா?', instruction: 'ஒரு வாக்கியத்தில் நம்பிக்கையுடன் பதிலளிக்கவும்', expectedLabel: 'complete' },
      { text: 'கடைசியா எந்த ஊருக்கு போனீங்க?', instruction: 'ஒரு வாக்கியத்தில் நம்பிக்கையுடன் பதிலளிக்கவும்', expectedLabel: 'complete' },
    ],
  },
  'storyteller': {
    hi: [
      { text: 'जब आपने पहली बार खाना बनाने की कोशिश की', instruction: 'कहानी शुरू करें और बीच में रुकें', expectedLabel: 'incomplete' },
      { text: 'स्कूल में आपकी सबसे मज़ेदार घटना', instruction: 'कहानी पूरी करें', expectedLabel: 'complete' },
      { text: 'जब आप पहली बार ट्रेन में अकेले सफर किए', instruction: 'कहानी शुरू करें और बीच में रुकें', expectedLabel: 'incomplete' },
      { text: 'एक बार जब आपका फोन गिर गया था', instruction: 'कहानी पूरी करें', expectedLabel: 'complete' },
      { text: 'जब आपने गलती से किसी और को मैसेज भेज दिया', instruction: 'कहानी शुरू करें और बीच में रुकें', expectedLabel: 'incomplete' },
    ],
    en: [
      { text: 'The time you got lost in a new city', instruction: 'Start telling, then stop mid-thought', expectedLabel: 'incomplete' },
      { text: 'Your most embarrassing autocorrect moment', instruction: 'Complete the story', expectedLabel: 'complete' },
      { text: 'When you accidentally liked an old photo while stalking', instruction: 'Start telling, then stop mid-thought', expectedLabel: 'incomplete' },
      { text: 'The worst haircut you ever got', instruction: 'Complete the story', expectedLabel: 'complete' },
      { text: 'When you waved back at someone who wasn\'t waving at you', instruction: 'Start telling, then stop mid-thought', expectedLabel: 'incomplete' },
    ],
    ta: [
      { text: 'முதல் முறை பஸ்ல தனியா போனப்போ', instruction: 'சொல்ல ஆரம்பித்து நடுவில் நிறுத்துங்கள்', expectedLabel: 'incomplete' },
      { text: 'ஸ்கூல்ல நடந்த ஒரு சுவாரசியமான சம்பவம்', instruction: 'கதையை முடிக்கவும்', expectedLabel: 'complete' },
      { text: 'தவறான நம்பருக்கு கால் பண்ணின அனுபவம்', instruction: 'சொல்ல ஆரம்பித்து நடுவில் நிறுத்துங்கள்', expectedLabel: 'incomplete' },
      { text: 'மழையில் மாட்டிக்கிட்ட ஒரு நாள்', instruction: 'கதையை முடிக்கவும்', expectedLabel: 'complete' },
      { text: 'முதல் ஜாப் இன்டர்வியூ அனுபவம்', instruction: 'சொல்ல ஆரம்பித்து நடுவில் நிறுத்துங்கள்', expectedLabel: 'incomplete' },
    ],
  },
  'memory-lane': {
    hi: [
      { text: 'अपने पहले मोबाइल फोन का मॉडल याद करें', instruction: 'याद करते हुए जोर से सोचें', expectedLabel: 'incomplete' },
      { text: 'बचपन में आपका सबसे अच्छा दोस्त कौन था?', instruction: 'याद करके बताएं', expectedLabel: 'complete' },
      { text: 'आपके स्कूल का गेट किस रंग का था?', instruction: 'याद करते हुए जोर से सोचें', expectedLabel: 'incomplete' },
      { text: 'पहली बार साइकिल चलाना किसने सिखाया?', instruction: 'याद करके बताएं', expectedLabel: 'complete' },
      { text: 'बचपन में आपका पसंदीदा कार्टून कौन सा था?', instruction: 'याद करते हुए जोर से सोचें', expectedLabel: 'incomplete' },
    ],
    en: [
      { text: 'What was your email password in school?', instruction: 'Try to recall out loud', expectedLabel: 'incomplete' },
      { text: 'Name of your favorite teacher in school', instruction: 'Recall and say it', expectedLabel: 'complete' },
      { text: 'What was your first email ID?', instruction: 'Try to recall out loud', expectedLabel: 'incomplete' },
      { text: 'Your best friend\'s landline number from childhood', instruction: 'Try to recall out loud', expectedLabel: 'incomplete' },
      { text: 'What was your favorite snack from the school canteen?', instruction: 'Recall and say it', expectedLabel: 'complete' },
    ],
    ta: [
      { text: 'உங்க முதல் போன் நம்பர் என்ன?', instruction: 'நினைவுகூர முயற்சிக்கவும்', expectedLabel: 'incomplete' },
      { text: 'சின்ன வயசுல உங்க பக்கத்து வீட்டுக்காரர் பேரு என்ன?', instruction: 'நினைவுகூர்ந்து சொல்லுங்கள்', expectedLabel: 'complete' },
      { text: 'ஸ்கூல்ல உங்க ரோல் நம்பர் என்ன?', instruction: 'நினைவுகூர முயற்சிக்கவும்', expectedLabel: 'incomplete' },
      { text: 'முதல் தடவை பார்த்த சினிமா எது?', instruction: 'நினைவுகூர்ந்து சொல்லுங்கள்', expectedLabel: 'complete' },
      { text: 'சின்ன வயசுல பிடிச்ச ஐஸ்கிரீம் flavor என்ன?', instruction: 'நினைவுகூர முயற்சிக்கவும்', expectedLabel: 'incomplete' },
    ],
  },
  'number-dictation': {
    hi: [
      { text: '9 8 4 5 6 7 2 3 1 0', instruction: 'नंबर बोलें और बीच में रुकें', expectedLabel: 'incomplete' },
      { text: '7 3 8 2 9 4', instruction: 'पूरा नंबर बोलें', expectedLabel: 'complete' },
      { text: '6 5 4 3 2 1 8 9 0 7', instruction: 'नंबर बोलें और बीच में रुकें', expectedLabel: 'incomplete' },
      { text: '2 4 9 9 9', instruction: 'पूरा नंबर बोलें', expectedLabel: 'complete' },
      { text: '8 7 6 5 4 3 2 1 9 0', instruction: 'नंबर बोलें और बीच में रुकें', expectedLabel: 'incomplete' },
    ],
    en: [
      { text: '9 1 2 3 4 5 6 7 8 0', instruction: 'Dictate and pause after the 6th digit', expectedLabel: 'incomplete' },
      { text: '4 8 2 9 5 1', instruction: 'Dictate the full number', expectedLabel: 'complete' },
      { text: '7 8 9 0 1 2 3 4 5 6', instruction: 'Dictate and pause after the 6th digit', expectedLabel: 'incomplete' },
      { text: '1 5 9 9', instruction: 'Dictate the full number', expectedLabel: 'complete' },
      { text: '6 3 8 2 9 1 0 4 5 7', instruction: 'Dictate and pause after the 6th digit', expectedLabel: 'incomplete' },
    ],
    ta: [
      { text: '9 4 5 6 7 8 1 2 3 0', instruction: '6வது இலக்கத்திற்குப் பிறகு நிறுத்துங்கள்', expectedLabel: 'incomplete' },
      { text: '5 8 3 2 9 7', instruction: 'முழு எண்ணையும் சொல்லுங்கள்', expectedLabel: 'complete' },
      { text: '8 7 6 5 4 3 2 1 0 9', instruction: '6வது இலக்கத்திற்குப் பிறகு நிறுத்துங்கள்', expectedLabel: 'incomplete' },
      { text: '3 9 9 9', instruction: 'முழு எண்ணையும் சொல்லுங்கள்', expectedLabel: 'complete' },
      { text: '7 2 8 4 5 9 1 0 3 6', instruction: '6வது இலக்கத்திற்குப் பிறகு நிறுத்துங்கள்', expectedLabel: 'incomplete' },
    ],
  },
};

/**
 * Get a random fallback prompt for variety
 */
function getRandomFallbackPrompt(gameType: GameType, language: Language): GeneratedPrompt {
  const prompts = FALLBACK_PROMPTS[gameType][language];
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex];
}
