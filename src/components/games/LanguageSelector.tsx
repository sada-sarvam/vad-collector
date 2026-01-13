'use client';

import { motion } from 'framer-motion';
import { Language } from '@/types';
import { LANGUAGES } from '@/lib/constants';

interface LanguageSelectorProps {
  selected: Language;
  onChange: (language: Language) => void;
  disabled?: boolean;
}

export default function LanguageSelector({
  selected,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div className="flex gap-3">
      {LANGUAGES.map((lang) => (
        <motion.button
          key={lang.id}
          onClick={() => !disabled && onChange(lang.id)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          className={`
            relative px-6 py-3 rounded-xl font-medium
            transition-all duration-200
            ${
              selected === lang.id
                ? 'bg-white/10 border-2 border-aurora-teal text-white'
                : 'bg-white/5 border-2 border-transparent text-white/60 hover:text-white hover:bg-white/10'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{lang.flag}</span>
            <div className="text-left">
              <div className="text-sm font-semibold">{lang.name}</div>
              <div className="text-xs text-white/50">{lang.nativeName}</div>
            </div>
          </div>
          {selected === lang.id && (
            <motion.div
              layoutId="language-indicator"
              className="absolute inset-0 border-2 border-aurora-teal rounded-xl"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
