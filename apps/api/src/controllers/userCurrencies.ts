import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../services/supabase'
import { Currency } from '../types'
import { ExchangeRateService } from '../services/exchangeRate'
import { ensureUserCurrencies } from '../services/userCurrencies'
import type { RateSnapshot } from '@swiftspend/types'

const Schema = z.object({
  currency: z.enum(['UAH', 'ALL', 'EUR', 'USD']),
  is_default: z.boolean().optional(),
})

export const createUserCurrency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currency, is_default } = Schema.parse(req.body)
    const userId = req.user!.id

    await ensureUserCurrencies(userId)

    // Determine next position
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('user_currencies')
      .select('position')
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) throw existingError
    const nextPosition = (existing?.position ?? -1) + 1

    if (is_default) {
      const { error } = await supabaseAdmin
        .from('user_currencies')
        .update({ is_default: false })
        .eq('user_id', userId)
      if (error) throw error
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('user_currencies')
      .insert({
        user_id: userId,
        currency,
        is_default: Boolean(is_default),
        position: nextPosition,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Backfill existing expenses using stored snapshots (no API call needed)
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('id, amount, currency, amounts, exchange_rate_snapshot')
      .eq('user_id', userId)

    if (expensesError) throw expensesError

    const expenseRows = (expenses ?? []) as Array<{
      id: string
      amount: number
      currency: Currency
      amounts: Record<string, unknown> | null
      exchange_rate_snapshot: unknown
    }>

    const targetCurrency = currency as Currency

    const chunkSize = 50
    for (let i = 0; i < expenseRows.length; i += chunkSize) {
      const chunk = expenseRows.slice(i, i + chunkSize)
      await Promise.all(
        chunk.map(async (e) => {
          const snapshot = e.exchange_rate_snapshot as RateSnapshot
          const computed = ExchangeRateService.calculateFromSnapshot(
            e.amount,
            e.currency,
            targetCurrency,
            snapshot
          )

          const updatedAmounts = {
            ...(e.amounts ?? {}),
            [targetCurrency]: computed,
          }

          const { error } = await supabaseAdmin
            .from('expenses')
            .update({ amounts: updatedAmounts })
            .eq('id', e.id)
            .eq('user_id', userId)

          if (error) throw error
        })
      )
    }

    res.status(201).json(inserted)
  } catch (err) {
    next(err)
  }
}
