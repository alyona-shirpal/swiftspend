
export interface ReportCategory {
  id: string | null;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface WeeklyChartItem {
  day: string;
  amount: number;
  is_today: boolean;
}

export interface DailyChartItem {
  day: number;
  amount: number;
}

export interface MonthlyChartItem {
  month: string;
  amount: number;
}

export interface DailyReportResponse {
  total: number;
  previous_total: number;
  change_percent: number;
  direction: 'up' | 'down' | 'same';
  weekly_chart: WeeklyChartItem[];
  top_categories: ReportCategory[];
  insight: string;
  has_data: boolean;
}

export interface MonthlyReportResponse {
  total: number;
  previous_total: number;
  change_percent: number;
  direction: 'up' | 'down' | 'same';
  daily_chart: DailyChartItem[];
  top_categories: ReportCategory[];
  insight: string;
  has_data: boolean;
}

export interface YearlyReportResponse {
  total: number;
  previous_total: number;
  change_percent: number;
  direction: 'up' | 'down' | 'same';
  monthly_chart: MonthlyChartItem[];
  top_categories: ReportCategory[];
  insight: string;
  has_data: boolean;
}
