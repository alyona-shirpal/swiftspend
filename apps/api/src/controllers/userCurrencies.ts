import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../services/supabase'
import { Currency } from '../types'
import { ExchangeRateService } from '../services/exchangeRate'
import { ensureUserCurrencies } from '../services/userCurrencies'
import type { RateSnapshot } from '@swiftspend/types'

const Schema = z.object({
  currency: z.string().min(3).max(3),
  is_default: z.boolean().optional(),
})

export const getUserCurrencies = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { data, error } = await supabaseAdmin
      .from('user_currencies')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createUserCurrency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currency, is_default } = Schema.parse(req.body)
    const userId = req.user!.id

    const snapshot = await ExchangeRateService.getCachedRates()
    if (!snapshot.rates[currency as Currency]) {
      return res.status(400).json({ error: 'Currency not found in exchange rates' })
    }

    const { data: existingCurrencies, error: extErr } = await supabaseAdmin
      .from('user_currencies')
      .select('currency, position')
      .eq('user_id', userId)
    if (extErr) throw extErr

    if (existingCurrencies.some(c => c.currency === currency)) {
      return res.status(409).json({ error: 'Currency already exists for user' })
    }

    const maxPosition = existingCurrencies.reduce((max, c) => Math.max(max, c.position), -1)
    const nextPosition = maxPosition + 1

    if (is_default) {
      await supabaseAdmin
        .from('user_currencies')
        .update({ is_default: false })
        .eq('user_id', userId)
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

    // Backfill existing expenses (Using JS loop because Supabase JS cannot run raw SQL string UPDATEs)
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

    let backfilled_count = 0
    const targetCurrency = currency as Currency

    const chunkSize = 50
    for (let i = 0; i < expenseRows.length; i += chunkSize) {
      const chunk = expenseRows.slice(i, i + chunkSize)
      await Promise.all(
        chunk.map(async (e) => {
          const snap = e.exchange_rate_snapshot as RateSnapshot
          const computed = ExchangeRateService.calculateFromSnapshot(
            e.amount,
            e.currency,
            targetCurrency,
            snap
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

          if (!error) backfilled_count++
        })
      )
    }

    res.status(201).json({ currency: inserted, backfilled_count })
  } catch (err) {
    next(err)
  }
}

export const deleteUserCurrency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currency = req.params.currency as string
    const userId = req.user!.id

    const { data: existing, error } = await supabaseAdmin
      .from('user_currencies')
      .select('id, currency, is_default')
      .eq('user_id', userId)

    if (error) throw error

    const target = existing.find(c => c.currency === currency)
    if (!target) return res.status(404).json({ error: 'Not found' })
    if (target.is_default) return res.status(400).json({ error: 'Cannot delete default currency' })
    if (existing.length <= 1) return res.status(400).json({ error: 'Cannot delete last currency' })

    const { error: delError } = await supabaseAdmin
      .from('user_currencies')
      .delete()
      .eq('user_id', userId)
      .eq('currency', currency)

    if (delError) throw delError

    // Remove from JSONB (Using JS loop because Supabase JS cannot run raw SQL string UPDATEs)
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('id, amounts')
      .eq('user_id', userId)

    if (!expensesError && expenses) {
      const chunkSize = 50
      for (let i = 0; i < expenses.length; i += chunkSize) {
        const chunk = expenses.slice(i, i + chunkSize)
        await Promise.all(
          chunk.map(async (e) => {
            if (e.amounts && typeof e.amounts === 'object') {
              const amounts = { ...(e.amounts as Record<string, unknown>) }
              delete amounts[currency]
              await supabaseAdmin
                .from('expenses')
                .update({ amounts })
                .eq('id', e.id)
                .eq('user_id', userId)
            }
          })
        )
      }
    }

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export const setDefaultCurrency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currency = req.params.currency
    const userId = req.user!.id

    const { data: existing, error } = await supabaseAdmin
      .from('user_currencies')
      .select('id, currency')
      .eq('user_id', userId)
    
    if (error) throw error

    if (!existing.some(c => c.currency === currency)) {
      return res.status(404).json({ error: 'Not found' })
    }

    await supabaseAdmin
      .from('user_currencies')
      .update({ is_default: false })
      .eq('user_id', userId)

    const { data, error: updError } = await supabaseAdmin
      .from('user_currencies')
      .update({ is_default: true })
      .eq('user_id', userId)
      .eq('currency', currency)
      .select()
      .single()

    if (updError) throw updError
    res.json(data)
  } catch (err) {
    next(err)
  }
}
