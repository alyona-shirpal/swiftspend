import type { Category } from '../types/api';

export function sortCategoriesByLastUsed(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const aTime = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
    const bTime = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;

    return bTime - aTime || a.name.localeCompare(b.name);
  });
}
