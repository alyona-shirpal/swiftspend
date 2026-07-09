import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type NavItem = {
  label: string;
  icon: string;
  path: string;
  active: boolean;
};

const iconFill = {
  fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24",
};

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome =
    location.pathname === '/' || location.pathname === '/dashboard';
  const isReports =
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/analytics');

  const items: NavItem[] = [
    {
      label: 'Home',
      icon: 'dashboard',
      path: '/',
      active: isHome,
    },
    {
      label: 'Reports',
      icon: 'insert_chart',
      path: '/reports',
      active: isReports,
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-safe pt-2"
      aria-label="Primary"
    >
      <div className="mx-auto grid h-[76px] max-w-md grid-cols-[1fr_auto_1fr] items-center rounded-[28px] border border-white bg-surface-container-lowest px-3 shadow-[0_-16px_40px_rgba(25,28,30,0.12),0_2px_0_rgba(255,255,255,0.9)_inset]">
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            <button
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={item.active ? 'page' : undefined}
              className={[
                'mx-auto flex h-14 min-w-[96px] items-center justify-center gap-2 rounded-[22px] px-4 transition-all duration-200 active:scale-95',
                item.active
                  ? 'bg-on-surface text-surface shadow-[0_10px_24px_rgba(25,28,30,0.18)]'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
              ].join(' ')}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={item.active ? iconFill : undefined}
              >
                {item.icon}
              </span>
              <span className="font-label text-[11px] font-bold uppercase tracking-wide">
                {item.label}
              </span>
            </button>

            {index === 0 && (
              <button
                type="button"
                onClick={() => navigate('/expenses/new')}
                aria-label="Add expense"
                className="mx-1 flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary text-on-primary shadow-[0_16px_30px_rgba(0,0,0,0.24)] ring-4 ring-surface-container-lowest transition-transform duration-200 active:scale-90"
              >
                <span className="material-symbols-outlined text-[32px] font-bold">
                  add
                </span>
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};
