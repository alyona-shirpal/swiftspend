import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';

const navItems = [
  { icon: 'dashboard', label: 'Home', path: '/' },
  { icon: 'insert_chart', label: 'Reports', path: '/reports/daily' },
  { icon: 'add_circle', label: 'Add', path: '/expenses/new' },
  { icon: 'search', label: 'Search', path: '/expenses' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-surface-container-low border-t border-surface-container-high shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center transition-all duration-200 active:scale-90",
              isActive 
                ? "text-primary scale-110" 
                : "text-secondary opacity-60 hover:opacity-100"
            )
          }
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {item.icon}
          </span>
          <span className="font-body text-[10px] font-medium tracking-wide uppercase mt-1">
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
};
