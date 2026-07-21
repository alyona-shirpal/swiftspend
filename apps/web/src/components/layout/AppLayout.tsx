import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';

const MAX_WIDTH_CLASSES = {
  md: 'max-w-md',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  full: 'max-w-screen-xl',
} as const;

type AppLayoutProps = {
  /** Plain string renders the standard page title; pass a node for custom titles (e.g. the brand). */
  title: React.ReactNode;
  /** Path the back button navigates to. Omit both backTo and onBack to hide the button. */
  backTo?: string;
  /** Custom back handler; takes precedence over backTo. */
  onBack?: () => void;
  backDisabled?: boolean;
  /** Right-aligned header content (icon buttons, currency switchers). */
  actions?: React.ReactNode;
  width?: keyof typeof MAX_WIDTH_CLASSES;
  bottomNav?: boolean;
  mainClassName?: string;
  children: React.ReactNode;
};

/**
 * Shared page scaffold: sticky top app bar, centered main column, and the
 * floating bottom navigation. Every route except /expenses/new uses it.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  backTo,
  onBack,
  backDisabled,
  actions,
  width = 'md',
  bottomNav = true,
  mainClassName,
  children,
}) => {
  const navigate = useNavigate();
  const handleBack = onBack ?? (backTo ? () => navigate(backTo) : undefined);

  return (
    <div
      className={`min-h-screen bg-surface font-body text-on-surface ${
        bottomNav ? 'pb-32' : 'pb-10'
      }`}
    >
      <header className="sticky top-0 z-40 flex w-full items-center justify-between gap-2 bg-surface px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {handleBack && (
            <button
              type="button"
              onClick={handleBack}
              disabled={backDisabled}
              aria-label="Back"
              className="-ml-2 rounded-full p-2 text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          {typeof title === 'string' ? (
            <h1 className="truncate font-headline text-xl font-black tracking-tight text-black">
              {title}
            </h1>
          ) : (
            title
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        )}
      </header>

      <main
        className={[
          'mx-auto w-full min-w-0 px-4 pb-4 pt-3 sm:px-6',
          MAX_WIDTH_CLASSES[width],
          mainClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>

      {bottomNav && <BottomNavigation />}
    </div>
  );
};

export const HeaderIconButton: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="rounded-full p-2 text-secondary transition-colors last:-mr-2 hover:bg-surface-container-low"
  >
    <span className="material-symbols-outlined">{icon}</span>
  </button>
);

export const HeaderCurrencyToggle: React.FC<{
  options: string[];
  value: string;
  onChange: (currency: string) => void;
}> = ({ options, value, onChange }) => {
  if (options.length < 2) return null;

  return (
    <div className="no-scrollbar flex max-w-[52vw] overflow-x-auto rounded-lg bg-surface-container-low p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
            option === value
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-secondary hover:text-primary'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};
