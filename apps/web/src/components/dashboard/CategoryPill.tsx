import React from 'react';
import { Category } from '../../types/api';

interface CategoryPillProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ category, isSelected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
        isSelected
          ? 'bg-primary text-on-primary'
          : 'bg-surface-container-highest text-secondary hover:bg-surface-variant'
      }`}
    >
      <span className="material-symbols-outlined text-sm">{category.icon}</span>
      {category.name}
    </button>
  );
};
