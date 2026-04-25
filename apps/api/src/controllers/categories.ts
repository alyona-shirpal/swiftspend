import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
});

export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('name');

    if (error) throw error;
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

    const uniqueCategories = new Map();
    for (const item of data) {
      // @ts-ignore - Supabase types are nested but sometimes not fully inferred
      if (item.categories && !uniqueCategories.has(item.category_id)) {
        uniqueCategories.set(item.category_id, item.categories);
        if (uniqueCategories.size >= 4) break;
      }
    }

    res.json(Array.from(uniqueCategories.values()));
  } catch (err) {
    next(err);
  }
};
