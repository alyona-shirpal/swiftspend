import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'surface' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]',
      secondary: 'bg-secondary text-on-secondary hover:opacity-90 active:scale-[0.98]',
      surface: 'bg-surface-container-highest text-primary hover:bg-surface-variant active:scale-[0.98]',
      outline: 'border border-outline-variant bg-transparent text-primary hover:bg-surface-container-low active:scale-[0.98]',
      ghost: 'bg-transparent text-secondary hover:bg-surface-container-low transition-colors',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-4 text-base',
      xl: 'px-8 py-5 text-sm tracking-widest uppercase font-bold',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-headline transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="material-symbols-outlined animate-spin mr-2 text-sm">progress_activity</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
