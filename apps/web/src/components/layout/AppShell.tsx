import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      
      <main className="flex-1 pt-20 pb-28 md:pb-8 max-w-7xl mx-auto w-full px-6 overflow-x-hidden">
        <Outlet />
      </main>

      <BottomNav />

      {/* Decorative Background Accents */}
      <div className="fixed top-0 right-0 -z-10 w-64 h-64 bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-on-tertiary-container/5 blur-[120px] rounded-full pointer-events-none"></div>
    </div>
  );
};
