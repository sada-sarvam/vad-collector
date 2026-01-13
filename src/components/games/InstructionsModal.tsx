'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Play, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { GameConfig, Language } from '@/types';
import { COLLECTION_TARGETS } from '@/lib/constants';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameConfig;
  language: Language;
}

// Game-specific instructions and examples
const GAME_DETAILS: Record<string, {
  objective: string;
  howToPlay: string[];
  examples: { label: string; text: string; audio?: string }[];
  tips: string[];
}> = {
  'finish-thought': {
    objective: 'Record yourself continuing a sentence and trailing off naturally, as if you\'re thinking or got distracted.',
    howToPlay: [
      'You\'ll see the start of a sentence on screen',
      'Continue speaking the sentence naturally',
      'Trail off with fillers like "umm...", "so...", or just pause mid-thought',
      'Don\'t finish your thought completely!',
    ],
    examples: [
      { label: 'incomplete', text: '"मुझे लगता है कि आज... उम्म... क्या है ना..."' },
      { label: 'incomplete', text: '"I was thinking we could go to the... you know..."' },
      { label: 'incomplete', text: '"நான் நினைக்கிறேன்... அது என்ன..."' },
    ],
    tips: [
      'Speak naturally, as if talking to a friend',
      'Use your language\'s natural filler words',
      'It\'s okay to hesitate and pause',
    ],
  },
  'quick-answer': {
    objective: 'Answer simple questions with short, confident, and complete responses.',
    howToPlay: [
      'You\'ll see a question on screen',
      'Answer clearly and confidently',
      'Keep your answer short (1-2 sentences)',
      'Finish your sentence completely!',
    ],
    examples: [
      { label: 'complete', text: '"मुझे बिरयानी बहुत पसंद है।"' },
      { label: 'complete', text: '"My favorite season is winter because I love the cold."' },
      { label: 'complete', text: '"எனக்கு நீல நிறம் மிகவும் பிடிக்கும்."' },
    ],
    tips: [
      'Be confident and clear',
      'Don\'t add unnecessary fillers at the end',
      'Speak at a natural pace',
    ],
  },
  'storyteller': {
    objective: 'Tell a mini-story based on a topic. Sometimes you\'ll complete it, sometimes you\'ll trail off.',
    howToPlay: [
      'You\'ll see a story topic and whether to COMPLETE or TRAIL OFF',
      'Start telling your story naturally',
      'If COMPLETE: Finish your thought clearly',
      'If TRAIL OFF: Stop mid-sentence as if distracted',
    ],
    examples: [
      { label: 'complete', text: '"एक बार मैंने एक अजीब सपना देखा जिसमें मैं उड़ रहा था और फिर मैं जाग गया।"' },
      { label: 'incomplete', text: '"So I was walking down the street and then this guy came up to me and he said... what was it..."' },
    ],
    tips: [
      'Pay attention to the mode (COMPLETE or TRAIL OFF)',
      'Keep stories simple and short',
      'Be expressive and natural',
    ],
  },
  'memory-lane': {
    objective: 'Try to recall a memory. Either remember clearly or think out loud while trying to recall.',
    howToPlay: [
      'You\'ll be asked to recall something (a name, place, event)',
      'If you "remember": Say it clearly and completely',
      'If you\'re "thinking": Speak your thought process, trail off with uncertainty',
    ],
    examples: [
      { label: 'complete', text: '"हाँ, वो मेरे स्कूल का दोस्त राहुल था।"' },
      { label: 'incomplete', text: '"उसका नाम क्या था... आ... वो... शुरू में R से था शायद..."' },
      { label: 'incomplete', text: '"Let me think... it was... um... something like..."' },
    ],
    tips: [
      'Be authentic - actually try to recall!',
      'Thinking out loud sounds more natural',
      'Include hesitation when unsure',
    ],
  },
  'number-dictation': {
    objective: 'Dictate a sequence of numbers. Sometimes complete, sometimes stop midway.',
    howToPlay: [
      'You\'ll see a number sequence to dictate',
      'If COMPLETE: Say all the numbers clearly',
      'If STOP MIDWAY: Pause as if checking or unsure',
    ],
    examples: [
      { label: 'complete', text: '"नौ, आठ, सात, छह, पाँच, चार, तीन, दो, एक, शून्य।"' },
      { label: 'incomplete', text: '"Nine, eight, seven, six, five... wait, let me check..."' },
    ],
    tips: [
      'Speak numbers clearly with natural pauses',
      'When stopping, act as if you\'re verifying something',
      'Use your language\'s number words',
    ],
  },
};

export default function InstructionsModal({
  isOpen,
  onClose,
  game,
  language,
}: InstructionsModalProps) {
  const details = GAME_DETAILS[game.id];

  if (!details) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal Container - Centered with Flexbox */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl pointer-events-auto"
            >
              <div className="glass-card p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{game.icon}</span>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">
                      {game.name}
                    </h2>
                    <p className="text-white/50">{game.nameHindi}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {/* Objective */}
              <div className="p-4 rounded-xl bg-aurora-teal/10 border border-aurora-teal/20">
                <h3 className="text-sm font-semibold text-aurora-teal mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Objective
                </h3>
                <p className="text-white/80">{details.objective}</p>
              </div>

              {/* How to Play */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-aurora-blue" />
                  How to Play
                </h3>
                <ol className="space-y-2">
                  {details.howToPlay.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/70 shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-white/70 text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Examples */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Mic className="w-4 h-4 text-aurora-purple" />
                  Examples
                </h3>
                <div className="space-y-2">
                  {details.examples.map((example, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                          example.label === 'complete'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {example.label}
                      </span>
                      <p className="text-white/80 text-sm italic">{example.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-aurora-pink" />
                  Tips
                </h3>
                <ul className="space-y-2">
                  {details.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-white/70 text-sm">
                      <span className="text-aurora-teal">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recording Requirements */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="text-sm font-semibold text-white">Recording Requirements</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/50">Min Duration:</span>
                    <span className="text-white ml-2">{COLLECTION_TARGETS.minDuration}s</span>
                  </div>
                  <div>
                    <span className="text-white/50">Max Duration:</span>
                    <span className="text-white ml-2">{COLLECTION_TARGETS.maxDuration}s</span>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="flex justify-center pt-4">
                <Button variant="primary" size="lg" onClick={onClose}>
                  Got it, let's start! 🎤
                </Button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
