import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ReportBottomNav: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 py-3 pb-safe bg-[#f2f4f6] border-t border-outline-variant/10">
      <a
        className="flex flex-col items-center justify-center text-black py-1"
        href="#"
        onClick={(event) => {
          event.preventDefault();
          navigate('/dashboard');
        }}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          dashboard
        </span>
        <span className="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Home</span>
      </a>
      <div className="relative -top-6">
        <button
          type="button"
          onClick={() => navigate('/expenses/new')}
          aria-label="Add expense"
          className="w-16 h-16 bg-primary text-on-primary rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] flex items-center justify-center active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>
      </div>
      <a
        className="flex flex-col items-center justify-center text-black py-1"
        href="#"
        onClick={(event) => {
          event.preventDefault();
        }}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          insert_chart
        </span>
        <span className="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Reports</span>
      </a>
    </nav>
  );
};
