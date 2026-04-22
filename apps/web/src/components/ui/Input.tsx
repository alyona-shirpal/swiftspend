import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-on-surface-variant font-label text-[10px] font-bold tracking-[0.15em] uppercase">
            {label}
          </label>
        )}
        <div className={cn(
          "editorial-focus border-b-2 border-surface-container-highest transition-all duration-300",
          error && "border-b-error"
        )}>
          <input
            ref={ref}
            className={cn(
              "w-full bg-transparent border-none py-3 px-0 font-body text-lg text-primary focus:ring-0 transition-all placeholder:text-outline-variant",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[10px] text-error font-medium uppercase tracking-tight mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
