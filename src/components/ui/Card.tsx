'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'interactive' | 'highlighted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accentColor?: string;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      accentColor,
      className = '',
      children,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      glass-card
      relative overflow-hidden
    `;

    const variants = {
      default: '',
      interactive: 'glass-card-hover cursor-pointer',
      highlighted: 'border-aurora-teal/30 shadow-aurora',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <motion.div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
        style={{
          ...style,
          '--game-color': accentColor,
        } as React.CSSProperties}
        {...props}
      >
        {accentColor && (
          <div
            className="absolute top-0 left-0 right-0 h-1 opacity-80"
            style={{ background: accentColor }}
          />
        )}
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
