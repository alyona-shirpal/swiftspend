import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
});

export const getCategories = async (req: AuthRequest, res: Response, next: any) => {
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

export const createCategory = async (req: AuthRequest, res: Response, next: any) => {
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

export const updateCategory = async (req: AuthRequest, res: Response, next: any) => {
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

export const deleteCategory = async (req: AuthRequest, res: Response, next: any) => {
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
