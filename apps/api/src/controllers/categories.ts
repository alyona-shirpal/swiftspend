import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { RecentExpenseCategoryJoinRow, CategoryRow } from '../types/supabase';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
});

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'lunch_dining', color: '#FF6B35' },
  { name: 'Restaurants', icon: 'dining', color: '#9B59B6' },
  { name: 'Home', icon: 'home', color: '#2196F3' },
  { name: 'Travel', icon: 'flight', color: '#0EA5A4' },
  { name: 'Health', icon: 'medical_services', color: '#16A34A' },
  { name: 'Beauty', icon: 'face', color: '#E91E63' },
  { name: 'Clothing', icon: 'checkroom', color: '#F59E0B' },
  { name: 'Childcare', icon: 'child_care', color: '#8B5CF6' },
  { name: 'Utilities', icon: 'bolt', color: '#0F766E' },
  { name: 'Education', icon: 'school', color: '#2563EB' },
  { name: 'Entertainment', icon: 'theater_comedy', color: '#D97706' },
  { name: 'Transport', icon: 'directions_car', color: '#475569' },
  { name: 'Electronics', icon: 'devices', color: '#7C3AED' },
  { name: 'Gifts', icon: 'redeem', color: '#DB2777' },
  { name: 'Sport', icon: 'sports_basketball', color: '#0EA5E9' },
  { name: 'Work', icon: 'work', color: '#334155' },
  { name: 'Pets', icon: 'pets', color: '#059669' },
  { name: 'Other', icon: 'more_horiz', color: '#6B7280' },
];

export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('name');

    if (error) throw error;

    const existingNames = new Set(data?.map(c => c.name) || []);
    const missingDefaults = DEFAULT_CATEGORIES.filter(c => !existingNames.has(c.name));

    if (missingDefaults.length > 0) {
      // Seed missing default categories for this user
      const categoriesToInsert = missingDefaults.map(cat => ({
        user_id: req.user!.id,
        ...cat
      }));

      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('categories')
        .insert(categoriesToInsert)
        .select();

      if (insertError) {
        console.error('Failed to seed default categories:', insertError);
      } else {
        // Combine and sort
        const combined = [...(data || []), ...(insertedData || [])];
        return res.json(combined.sort((a, b) => a.name.localeCompare(b.name)));
      }
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = CreateCategorySchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        user_id: req.user!.id,
        ...validated
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = CreateCategorySchema.partial().parse(req.body);
    const { id } = req.params;

    // Check ownership
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!category) return res.status(404).json({ error: 'Not found' });
    if (category.user_id !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!category) return res.status(404).json({ error: 'Not found' });
    if (category.user_id !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getRecentCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get unique categories from recent expenses
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select(`
        category_id,
        created_at,
        categories (
          id,
          name,
          icon,
          color
        )
      `)
      .eq('user_id', req.user!.id)
      .not('category_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const rows = (data ?? []) as unknown as RecentExpenseCategoryJoinRow[];

    const uniqueCategories = new Map<string, CategoryRow>();
    for (const item of rows) {
      if (item.category_id && item.categories && !uniqueCategories.has(item.category_id)) {
        uniqueCategories.set(item.category_id, item.categories);
        if (uniqueCategories.size >= 4) break;
      }
    }

    res.json(Array.from(uniqueCategories.values()));
  } catch (err) {
    next(err);
  }
};

export const completeCategoryOnboarding = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Upsert into user_profiles to mark category onboarding as complete
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        { user_id: userId, categories_onboarded_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
