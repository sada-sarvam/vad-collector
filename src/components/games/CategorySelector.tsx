'use client';

import { motion } from 'framer-motion';
import { Category, Label } from '@/types';
import { CATEGORIES } from '@/lib/constants';

interface CategorySelectorProps {
  label: Label;
  selected: Category;
  onChange: (category: Category) => void;
  disabled?: boolean;
}

export default function CategorySelector({
  label,
  selected,
  onChange,
  disabled = false,
}: CategorySelectorProps) {
  // Filter categories based on label
  const relevantCategories = CATEGORIES.filter((cat) => cat.label === label);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-white/70">
        What kind of {label === 'complete' ? 'ending' : 'trailing off'} was this?
      </label>
      <div className="grid grid-cols-2 gap-3">
        {relevantCategories.map((cat) => (
          <motion.button
            key={cat.id}
            onClick={() => !disabled && onChange(cat.id as Category)}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={`
              p-4 rounded-xl text-left transition-all duration-200
              ${
                selected === cat.id
                  ? 'bg-white/10 border-2'
                  : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{
              borderColor: selected === cat.id ? cat.color : 'transparent',
            }}
          >
            <div
              className="w-3 h-3 rounded-full mb-2"
              style={{ backgroundColor: cat.color }}
            />
            <div className="text-sm font-medium text-white">{cat.name}</div>
            <div className="text-xs text-white/50 mt-1">{cat.description}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
