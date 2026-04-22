import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'lowest' | 'container' | 'outline';
}

export const Card: React.FC<CardProps> = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-surface-container shadow-sm',
    lowest: 'bg-surface-container-lowest shadow-sm',
    container: 'bg-surface-container-low',
    outline: 'bg-transparent border border-outline-variant/20',
  };

  return (
    <div
      className={cn('rounded-xl p-6 transition-all', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};
