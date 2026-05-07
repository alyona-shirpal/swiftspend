import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { z } from 'zod';

const DailyReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().min(3).max(3).optional(),
});

const MonthlyReportSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/),
  currency: z.string().min(3).max(3).optional(),
});

const YearlyReportSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  currency: z.string().min(3).max(3).optional(),
});

async function resolveCurrency(reqCurrency: string | undefined, userId: string): Promise<string> {
  if (reqCurrency) return reqCurrency;
  const { data } = await supabaseAdmin
    .from('user_currencies')
    .select('currency')
    .eq('user_id', userId)
    .eq('is_default', true)
    .limit(1)
    .single();
  return data?.currency || 'EUR';
}

function getAmount(amounts: any, currency: string): number {
  if (!amounts || typeof amounts !== 'object') return 0;
  return Number((amounts as any)[currency]) || 0;
}

function getWeekDates(date: Date): Array<{ date: string; day: string; isToday: boolean }> {
  const result: Array<{ date: string; day: string; isToday: boolean }> = [];
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0]!;
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    result.push({
      date: dateStr,
      day: dayNames[i]!,
      isToday: dateStr === date.toISOString().split('T')[0]!
    });
  }
  
  return result;
}

function getMonthDates(year: number, month: number): Array<{ date: string; day: number }> {
  const result: Array<{ date: string; day: number }> = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0]!;
    result.push({
      date: dateStr,
      day
    });
  }
  
  return result;
}

function getYearMonths(year: number): Array<{ month: string; monthName: string }> {
  const result: Array<{ month: string; monthName: string }> = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let month = 0; month < 12; month++) {
    const monthNum = (month + 1).toString().padStart(2, '0');
    result.push({
      month: `${year}-${monthNum}`,
      monthName: monthNames[month]!
    });
  }
  
  return result;
}

function calculateChangePercent(current: number, previous: number): { changePercent: number; direction: 'up' | 'down' | 'same' } {
  if (previous === 0) {
    return { changePercent: 0, direction: 'same' };
  }
  
  const changePercent = ((current - previous) / previous) * 100;
  let direction: 'up' | 'down' | 'same' = 'same';
  
  if (changePercent > 0.1) direction = 'up';
  else if (changePercent < -0.1) direction = 'down';
  
  return { changePercent: Math.abs(changePercent), direction };
}

function generateDailyInsight(total: number, hasData: boolean): string {
  if (!hasData) return "No expenses recorded for this day";
  if (total === 0) return "No expenses recorded for this day";
  
  // Simple daily average estimation (this could be improved with actual user data)
  const estimatedDailyAverage = 50; // EUR
  
  if (total > estimatedDailyAverage * 1.2) {
    return `Today's spending is ${Math.round(((total - estimatedDailyAverage) / estimatedDailyAverage) * 100)}% higher than your daily average`;
  } else if (total < estimatedDailyAverage * 0.8) {
    return `Today's spending is ${Math.round(((estimatedDailyAverage - total) / estimatedDailyAverage) * 100)}% lower than your daily average`;
  } else {
    return "Today's spending is close to your daily average";
  }
}

function generateMonthlyInsight(total: number, hasData: boolean): string {
  if (!hasData) return "No expenses recorded for this month";
  if (total === 0) return "No expenses recorded for this month";
  
  const estimatedMonthlyAverage = 1500; // EUR
  
  if (total > estimatedMonthlyAverage * 1.2) {
    return `This month's spending is ${Math.round(((total - estimatedMonthlyAverage) / estimatedMonthlyAverage) * 100)}% higher than your monthly average`;
  } else if (total < estimatedMonthlyAverage * 0.8) {
    return `This month's spending is ${Math.round(((estimatedMonthlyAverage - total) / estimatedMonthlyAverage) * 100)}% lower than your monthly average`;
  } else {
    return "This month's spending is close to your monthly average";
  }
}

function generateYearlyInsight(total: number, hasData: boolean, monthlyTotals: Array<{ month: string; total: number }>): string {
  if (!hasData) return "No expenses recorded for this year";
  if (total === 0) return "No expenses recorded for this year";
  
  if (monthlyTotals.length === 0) return "No monthly data available";
  
  const topMonth = monthlyTotals.reduce((max, month) => month.total > max.total ? month : max);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIndex = parseInt(topMonth.month.split('-')[1]!) - 1;
  const monthName = monthNames[monthIndex]!;
  
  return `Top spending month was ${monthName} with ${topMonth.total.toFixed(2)} EUR`;
}

export const getDailyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date, currency: reqCurrency } = DailyReportSchema.parse(req.query);
    const userId = req.user!.id;
    const currency = await resolveCurrency(reqCurrency, userId);

    // Get current day expenses
    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select(`
        id, category_id, description, date, created_at, amount, currency, amounts,
        categories (id, name, icon, color)
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get previous day expenses for comparison
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0]!;
    
    const { data: prevExpenses } = await supabaseAdmin
      .from('expenses')
      .select('amounts')
      .eq('user_id', userId)
      .eq('date', prevDateStr);

    // Get week data for chart
    const weekDates = getWeekDates(new Date(date));
    const weekDateStrings = weekDates.map(d => d.date);
    
    const { data: weekExpenses } = await supabaseAdmin
      .from('expenses')
      .select('date, amounts')
      .eq('user_id', userId)
      .in('date', weekDateStrings);

    // Calculate totals
    let total = 0;
    let previousTotal = 0;
    const catMap = new Map<string, any>();

    for (const e of expenses || []) {
      const amt = getAmount(e.amounts, currency);
      total += amt;

      const c = Array.isArray(e.categories) ? e.categories[0] : e.categories;
      const catId = c?.id ?? 'un-categorized';
      
      if (!catMap.has(catId)) {
        catMap.set(catId, {
          id: c?.id ?? null,
          name: c?.name ?? 'Uncategorized',
          icon: c?.icon ?? 'help',
          color: c?.color ?? '#999999',
          total: 0,
          count: 0
        });
      }
      const entry = catMap.get(catId);
      entry.total += amt;
      entry.count += 1;
    }

    for (const e of prevExpenses || []) {
      previousTotal += getAmount(e.amounts, currency);
    }

    // Build weekly chart data
    const weekDayTotals = new Map<string, number>();
    for (const e of weekExpenses || []) {
      const amt = getAmount(e.amounts, currency);
      weekDayTotals.set(e.date, (weekDayTotals.get(e.date) || 0) + amt);
    }

    const weeklyChart = weekDates.map(day => ({
      day: day.day,
      amount: weekDayTotals.get(day.date) || 0,
      is_today: day.isToday
    }));

    // Calculate top categories with percentages
    const categories = Array.from(catMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(cat => ({
        ...cat,
        percentage: total > 0 ? Math.round((cat.total / total) * 100) : 0
      }));

    // Calculate comparison
    const { changePercent, direction } = calculateChangePercent(total, previousTotal);

    // Generate insight
    const hasData = total > 0;
    const insight = generateDailyInsight(total, hasData);

    res.json({
      total,
      previous_total: previousTotal,
      change_percent: changePercent,
      direction,
      weekly_chart: weeklyChart,
      top_categories: categories,
      insight,
      has_data: hasData
    });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year, month, currency: reqCurrency } = MonthlyReportSchema.parse(req.query);
    const userId = req.user!.id;
    const currency = await resolveCurrency(reqCurrency, userId);

    const y = parseInt(year);
    const m = parseInt(month);
    const startDate = new Date(Date.UTC(y, m - 1, 1)).toISOString().split('T')[0]!;
    const endDate = new Date(Date.UTC(y, m, 0)).toISOString().split('T')[0]!;

    // Get current month expenses
    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('id, category_id, date, amounts, categories (id, name, icon, color)')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    // Get previous month expenses for comparison
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    const prevStartDate = new Date(Date.UTC(prevYear, prevMonth - 1, 1)).toISOString().split('T')[0]!;
    const prevEndDate = new Date(Date.UTC(prevYear, prevMonth, 0)).toISOString().split('T')[0]!;
    
    const { data: prevExpenses } = await supabaseAdmin
      .from('expenses')
      .select('amounts')
      .eq('user_id', userId)
      .gte('date', prevStartDate)
      .lte('date', prevEndDate);

    // Calculate totals and categories
    let total = 0;
    let previousTotal = 0;
    const catMap = new Map<string, any>();
    const dayMap = new Map<string, number>();

    for (const e of expenses || []) {
      const amt = getAmount(e.amounts, currency);
      total += amt;

      const c = Array.isArray(e.categories) ? e.categories[0] : e.categories;
      const catId = c?.id ?? 'un-categorized';
      
      if (!catMap.has(catId)) {
        catMap.set(catId, {
          id: c?.id ?? null,
          name: c?.name ?? 'Uncategorized',
          icon: c?.icon ?? 'help',
          color: c?.color ?? '#999999',
          total: 0,
          count: 0
        });
      }
      const entry = catMap.get(catId);
      entry.total += amt;
      entry.count += 1;

      dayMap.set(e.date, (dayMap.get(e.date) || 0) + amt);
    }

    for (const e of prevExpenses || []) {
      previousTotal += getAmount(e.amounts, currency);
    }

    // Build daily chart data (all days of month)
    const monthDates = getMonthDates(y, m);
    const dailyChart = monthDates.map(day => ({
      day: day.day,
      amount: dayMap.get(day.date) || 0
    }));

    // Calculate top categories with percentages
    const categories = Array.from(catMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(cat => ({
        ...cat,
        percentage: total > 0 ? Math.round((cat.total / total) * 100) : 0
      }));

    // Calculate comparison
    const { changePercent, direction } = calculateChangePercent(total, previousTotal);

    // Generate insight
    const hasData = total > 0;
    const insight = generateMonthlyInsight(total, hasData);

    res.json({
      total,
      previous_total: previousTotal,
      change_percent: changePercent,
      direction,
      daily_chart: dailyChart,
      top_categories: categories,
      insight,
      has_data: hasData
    });
  } catch (err) {
    next(err);
  }
};

export const getYearlyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year, currency: reqCurrency } = YearlyReportSchema.parse(req.query);
    const userId = req.user!.id;
    const currency = await resolveCurrency(reqCurrency, userId);

    const y = parseInt(year);
    const startDate = new Date(Date.UTC(y, 0, 1)).toISOString().split('T')[0]!;
    const endDate = new Date(Date.UTC(y, 11, 31)).toISOString().split('T')[0]!;

    // Get current year expenses
    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('id, category_id, date, amounts, categories (id, name, icon, color)')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    // Get previous year expenses for comparison
    const prevYear = y - 1;
    const prevStartDate = new Date(Date.UTC(prevYear, 0, 1)).toISOString().split('T')[0]!;
    const prevEndDate = new Date(Date.UTC(prevYear, 11, 31)).toISOString().split('T')[0]!;
    
    const { data: prevExpenses } = await supabaseAdmin
      .from('expenses')
      .select('amounts')
      .eq('user_id', userId)
      .gte('date', prevStartDate)
      .lte('date', prevEndDate);

    // Calculate totals and categories
    let total = 0;
    let previousTotal = 0;
    const catMap = new Map<string, any>();
    const monthMap = new Map<string, number>();

    for (const e of expenses || []) {
      const amt = getAmount(e.amounts, currency);
      total += amt;

      const c = Array.isArray(e.categories) ? e.categories[0] : e.categories;
      const catId = c?.id ?? 'un-categorized';
      
      if (!catMap.has(catId)) {
        catMap.set(catId, {
          id: c?.id ?? null,
          name: c?.name ?? 'Uncategorized',
          icon: c?.icon ?? 'help',
          color: c?.color ?? '#999999',
          total: 0,
          count: 0
        });
      }
      const entry = catMap.get(catId);
      entry.total += amt;
      entry.count += 1;

      const month = e.date.substring(0, 7); // YYYY-MM
      monthMap.set(month, (monthMap.get(month) || 0) + amt);
    }

    for (const e of prevExpenses || []) {
      previousTotal += getAmount(e.amounts, currency);
    }

    // Build monthly chart data (all 12 months)
    const yearMonths = getYearMonths(y);
    const monthlyChart = yearMonths.map(monthData => ({
      month: monthData.monthName,
      amount: monthMap.get(monthData.month) || 0
    }));

    // Calculate top categories with percentages
    const categories = Array.from(catMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(cat => ({
        ...cat,
        percentage: total > 0 ? Math.round((cat.total / total) * 100) : 0
      }));

    // Calculate comparison
    const { changePercent, direction } = calculateChangePercent(total, previousTotal);

    // Generate insight
    const hasData = total > 0;
    const monthlyTotals = Array.from(monthMap.entries()).map(([month, total]) => ({ month, total }));
    const insight = generateYearlyInsight(total, hasData, monthlyTotals);

    res.json({
      total,
      previous_total: previousTotal,
      change_percent: changePercent,
      direction,
      monthly_chart: monthlyChart,
      top_categories: categories,
      insight,
      has_data: hasData
    });
  } catch (err) {
    next(err);
  }
};
