import { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { createExpenseRecord } from '../services/createExpense';
import { getDocumentProcessingCapability, parseExpenseDocument } from '../services/documentExpense';
import { createSupabaseUserClient } from '../services/supabase';
import { ExchangeRateService } from '../services/exchangeRate';
import { Currency } from '../types';

const AutoSchema = z.enum(['true', 'false']).default('false');
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export const getDocumentExpenseConfig = (_req: AuthRequest, res: Response) => {
  res.set('Cache-Control', 'private, max-age=86400, stale-while-revalidate=604800');
  res.json(getDocumentProcessingCapability());
};

export const processExpenseDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const auto = AutoSchema.parse(req.query.auto) === 'true';
    const file = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (file.length === 0) return res.status(400).json({ error: 'Upload a non-empty file' });
    if (file.length > MAX_FILE_BYTES) return res.status(413).json({ error: 'File must be 15 MB or smaller' });

    const mimeType = req.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream';
    const filename = decodeURIComponent(req.get('x-file-name') ?? 'document');
    const supabase = createSupabaseUserClient(req.accessToken!);
    const [{ data: categories, error: categoriesError }, snapshot] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', req.user!.id)
        .eq('is_hidden', false)
        .order('name'),
      ExchangeRateService.getCachedRates(supabase),
    ]);
    if (categoriesError) throw categoriesError;
    if (!categories?.length) return res.status(400).json({ error: 'Create at least one category before processing a document' });

    const currencies = Object.values(Currency)
      .filter((currency) => Boolean(snapshot.rates[currency]))
      .sort();
    const parsed = await parseExpenseDocument(file, mimeType, filename, { categories, currencies });

    if (!auto) {
      return res.json({ status: 'parsed', ...parsed });
    }

    const expense = await createExpenseRecord(req.accessToken!, req.user!.id, {
      ...parsed.expense,
      date: parsed.expense.date ?? new Date().toISOString().split('T')[0],
    });
    return res.status(201).json({ status: 'created', provider: parsed.provider, expense });
  } catch (error) {
    next(error);
  }
};
