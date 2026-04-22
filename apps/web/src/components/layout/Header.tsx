import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { cn } from '../../utils/cn';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-md border-b border-surface-container-high/30 flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black text-primary uppercase tracking-[0.2em] font-headline">
          SPEND
        </h1>
      </div>

      <nav className="hidden md:flex gap-8 items-center">
        <NavLink to="/" className={({ isActive }) => cn("text-sm font-bold tracking-tight py-1 px-3 rounded-md transition-all", isActive ? "bg-surface-container-highest text-primary" : "text-secondary hover:bg-surface-container-low")}>Home</NavLink>
        <NavLink to="/expenses" className={({ isActive }) => cn("text-sm font-bold tracking-tight py-1 px-3 rounded-md transition-all", isActive ? "bg-surface-container-highest text-primary" : "text-secondary hover:bg-surface-container-low")}>Ledger</NavLink>
        <NavLink to="/reports/daily" className={({ isActive }) => cn("text-sm font-bold tracking-tight py-1 px-3 rounded-md transition-all", isActive ? "bg-surface-container-highest text-primary" : "text-secondary hover:bg-surface-container-low")}>Reports</NavLink>
      </nav>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => signOut()}
          className="text-secondary hover:text-primary transition-colors focus:outline-none"
          title="Logout"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/10">
          {user?.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">
              {user?.email?.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
