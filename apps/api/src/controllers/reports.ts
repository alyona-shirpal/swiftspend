import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { z } from 'zod';

const DailyReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const MonthlyReportSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/)
});

const YearlyReportSchema = z.object({
  year: z.string().regex(/^\d{4}$/)
});

export const getDailyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date } = DailyReportSchema.parse(req.query);
    
    const { data, error } = await supabaseAdmin.rpc('get_daily_report', {
      p_user_id: req.user!.id,
      p_date: date
    });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year, month } = MonthlyReportSchema.parse(req.query);
    
    const { data, error } = await supabaseAdmin.rpc('get_monthly_report', {
      p_user_id: req.user!.id,
      p_year: parseInt(year),
      p_month: parseInt(month)
    });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getYearlyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year } = YearlyReportSchema.parse(req.query);
    
    const { data, error } = await supabaseAdmin.rpc('get_yearly_report', {
      p_user_id: req.user!.id,
      p_year: parseInt(year)
    });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};
