import React from 'react';

type AnimatedBrandTextProps = {
  className?: string;
  compact?: boolean;
};

const BRAND_TEXT = 'SwiftSpend';

export const AnimatedBrandText: React.FC<AnimatedBrandTextProps> = ({
  className = '',
  compact = false,
}) => {
  const [burst, setBurst] = React.useState(0);

  return (
    <button
      type="button"
      aria-label="Animate SwiftSpend"
      onClick={() => setBurst((value) => value + 1)}
      className={`animated-brand-text ${compact ? 'animated-brand-text--compact' : ''} ${className}`}
    >
      <span
        key={burst}
        aria-hidden="true"
        className={
          burst > 0
            ? 'animated-brand-text__word animated-brand-text__word--active'
            : 'animated-brand-text__word'
        }
      >
        {BRAND_TEXT.split('').map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className="animated-brand-text__letter"
            style={
              { '--brand-delay': `${index * 34}ms` } as React.CSSProperties
            }
          >
            {letter}
          </span>
        ))}
      </span>
    </button>
  );
};
