'use client';

import { motion } from 'framer-motion';
import { Language, Label } from '@/types';

interface PromptDisplayProps {
  text: string;
  instruction: string;
  language: Language;
  expectedLabel?: Label;
  isLoading?: boolean;
}

export default function PromptDisplay({
  text,
  instruction,
  language,
  expectedLabel,
  isLoading = false,
}: PromptDisplayProps) {
  const getFontClass = () => {
    switch (language) {
      case 'hi':
        return 'prompt-text-hindi';
      case 'ta':
        return 'prompt-text-tamil';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-lg w-3/4 mx-auto" />
          <div className="h-4 bg-white/5 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 space-y-6"
    >
      {/* Expected Label Indicator */}
      {expectedLabel && (
        <div className="flex justify-center">
          <span
            className={`mode-indicator ${
              expectedLabel === 'complete' ? 'mode-complete' : 'mode-incomplete'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                expectedLabel === 'complete' ? 'bg-green-500' : 'bg-orange-500'
              }`}
            />
            {expectedLabel === 'complete' ? 'Complete' : 'Trail Off'}
          </span>
        </div>
      )}

      {/* Main Prompt */}
      <div className="text-center">
        <p className={`prompt-text ${getFontClass()}`}>
          {text}
        </p>
      </div>

      {/* Instruction */}
      <div className="text-center">
        <p className="text-white/60 text-sm">
          <span className="text-aurora-teal font-medium">Instruction:</span>{' '}
          {instruction}
        </p>
      </div>
    </motion.div>
  );
}
