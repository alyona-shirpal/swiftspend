-- RPC for daily reports
CREATE OR REPLACE FUNCTION get_daily_report(p_user_id uuid, p_date date)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_uah numeric;
    v_total_all numeric;
    v_total_eur numeric;
    v_total_usd numeric;
    v_categories json;
    v_expenses json;
BEGIN
    SELECT COALESCE(SUM((amounts->>'UAH')::numeric), 0), COALESCE(SUM((amounts->>'ALL')::numeric), 0), COALESCE(SUM((amounts->>'EUR')::numeric), 0), COALESCE(SUM((amounts->>'USD')::numeric), 0)
    INTO v_total_uah, v_total_all, v_total_eur, v_total_usd
    FROM expenses
    WHERE user_id = p_user_id AND date = p_date;

    SELECT COALESCE(json_agg(cat_totals), '[]'::json) INTO v_categories
    FROM (
        SELECT 
            category_id,
            SUM((amounts->>'UAH')::numeric) as uah,
            SUM((amounts->>'ALL')::numeric) as all,
            SUM((amounts->>'EUR')::numeric) as eur,
            SUM((amounts->>'USD')::numeric) as usd
        FROM expenses
        WHERE user_id = p_user_id AND date = p_date
        GROUP BY category_id
    ) cat_totals;

    SELECT COALESCE(json_agg(e), '[]'::json) INTO v_expenses
    FROM (
        SELECT * FROM expenses
        WHERE user_id = p_user_id AND date = p_date
        ORDER BY created_at DESC
    ) e;

    RETURN json_build_object(
        'default_currency', 'EUR',
        'totals', json_build_object('UAH', v_total_uah, 'ALL', v_total_all, 'EUR', v_total_eur, 'USD', v_total_usd),
        'categories', v_categories,
        'expenses', v_expenses
    );
END;
$$;

-- RPC for monthly reports
CREATE OR REPLACE FUNCTION get_monthly_report(p_user_id uuid, p_year int, p_month int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_uah numeric;
    v_total_all numeric;
    v_total_eur numeric;
    v_total_usd numeric;
    v_categories json;
    v_daily_totals json;
BEGIN
    SELECT COALESCE(SUM((amounts->>'UAH')::numeric), 0), COALESCE(SUM((amounts->>'ALL')::numeric), 0), COALESCE(SUM((amounts->>'EUR')::numeric), 0), COALESCE(SUM((amounts->>'USD')::numeric), 0)
    INTO v_total_uah, v_total_all, v_total_eur, v_total_usd
    FROM expenses
    WHERE user_id = p_user_id 
      AND EXTRACT(YEAR FROM date) = p_year 
      AND EXTRACT(MONTH FROM date) = p_month;

    SELECT COALESCE(json_agg(cat_totals), '[]'::json) INTO v_categories
    FROM (
        SELECT 
            category_id,
            SUM((amounts->>'UAH')::numeric) as uah,
            SUM((amounts->>'ALL')::numeric) as all,
            SUM((amounts->>'EUR')::numeric) as eur,
            SUM((amounts->>'USD')::numeric) as usd
        FROM expenses
        WHERE user_id = p_user_id 
          AND EXTRACT(YEAR FROM date) = p_year 
          AND EXTRACT(MONTH FROM date) = p_month
        GROUP BY category_id
    ) cat_totals;

    SELECT COALESCE(json_agg(day_totals), '[]'::json) INTO v_daily_totals
    FROM (
        SELECT 
            date::text,
            SUM((amounts->>'UAH')::numeric) as uah,
            SUM((amounts->>'ALL')::numeric) as all,
            SUM((amounts->>'EUR')::numeric) as eur,
            SUM((amounts->>'USD')::numeric) as usd
        FROM expenses
        WHERE user_id = p_user_id 
          AND EXTRACT(YEAR FROM date) = p_year 
          AND EXTRACT(MONTH FROM date) = p_month
        GROUP BY date
        ORDER BY date
    ) day_totals;

    RETURN json_build_object(
        'default_currency', 'EUR',
        'totals', json_build_object('UAH', v_total_uah, 'ALL', v_total_all, 'EUR', v_total_eur, 'USD', v_total_usd),
        'categories', v_categories,
        'daily_totals', v_daily_totals
    );
END;
$$;

-- RPC for yearly reports
CREATE OR REPLACE FUNCTION get_yearly_report(p_user_id uuid, p_year int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_uah numeric;
    v_total_all numeric;
    v_total_eur numeric;
    v_total_usd numeric;
    v_top_categories json;
    v_monthly_totals json;
BEGIN
    SELECT COALESCE(SUM((amounts->>'UAH')::numeric), 0), COALESCE(SUM((amounts->>'ALL')::numeric), 0), COALESCE(SUM((amounts->>'EUR')::numeric), 0), COALESCE(SUM((amounts->>'USD')::numeric), 0)
    INTO v_total_uah, v_total_all, v_total_eur, v_total_usd
    FROM expenses
    WHERE user_id = p_user_id 
      AND EXTRACT(YEAR FROM date) = p_year;

    SELECT COALESCE(json_agg(cat_totals), '[]'::json) INTO v_top_categories
    FROM (
        SELECT 
            category_id,
            SUM((amounts->>'UAH')::numeric) as uah,
            SUM((amounts->>'ALL')::numeric) as all,
            SUM((amounts->>'EUR')::numeric) as eur,
            SUM((amounts->>'USD')::numeric) as usd
        FROM expenses
        WHERE user_id = p_user_id 
          AND EXTRACT(YEAR FROM date) = p_year
        GROUP BY category_id
        ORDER BY SUM((amounts->>'EUR')::numeric) DESC
        LIMIT 5
    ) cat_totals;

    SELECT COALESCE(json_agg(month_totals), '[]'::json) INTO v_monthly_totals
    FROM (
        SELECT 
            EXTRACT(MONTH FROM date)::int::text as month,
            SUM((amounts->>'UAH')::numeric) as uah,
            SUM((amounts->>'ALL')::numeric) as all,
            SUM((amounts->>'EUR')::numeric) as eur,
            SUM((amounts->>'USD')::numeric) as usd
        FROM expenses
        WHERE user_id = p_user_id 
          AND EXTRACT(YEAR FROM date) = p_year
        GROUP BY EXTRACT(MONTH FROM date)
        ORDER BY EXTRACT(MONTH FROM date)
    ) month_totals;

    RETURN json_build_object(
        'default_currency', 'EUR',
        'totals', json_build_object('UAH', v_total_uah, 'ALL', v_total_all, 'EUR', v_total_eur, 'USD', v_total_usd),
        'top_categories', v_top_categories,
        'monthly_totals', v_monthly_totals
    );
END;
$$;
