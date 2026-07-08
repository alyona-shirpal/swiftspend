import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { createSupabaseUserClient } from '../services/supabase'
import { Currency } from '../types'
import { ExchangeRateService } from '../services/exchangeRate'
import type { RateSnapshot } from '@swiftspend/types'

const Schema = z.object({
  currency: z.string().min(3).max(3),
  is_default: z.boolean().optional(),
})

const PositionSchema = z.object({
  position: z.number().int().min(0)
})

const OnboardingSchema = z.object({
  currencies: z.array(z.string().min(3).max(3)).min(1).max(10),
  default_currency: z.string().min(3).max(3)
})

export const getUserCurrencies = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const supabase = createSupabaseUserClient(req.accessToken!)
    const { data, error } = await supabase
      .from('user_currencies')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (error) throw error
    
    // Check if category onboarding is needed via the explicit flag in user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('categories_onboarded_at')
      .eq('user_id', userId)
      .single()

    const hasCompletedOnboarding = Boolean(profile?.categories_onboarded_at)
    const needs_onboarding = !hasCompletedOnboarding && (!data || data.length === 0)

    // User needs category onboarding if they have currencies set up
    // but haven't completed the category onboarding step yet
    const needs_category_onboarding = !needs_onboarding && !hasCompletedOnboarding

    res.json({
      needs_onboarding,
      needs_category_onboarding,
      currencies: data ?? []
    })
  } catch (err) {
    next(err)
  }
}

export const createUserCurrency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currency, is_default } = Schema.parse(req.body)
    const userId = req.user!.id
    const supabase = createSupabaseUserClient(req.accessToken!)

    const snapshot = await ExchangeRateService.getCachedRates(supabase)
    if (!snapshot.rates[currency as Currency]) {
      return res.status(400).json({ error: 'Currency not found in exchange rates' })
    }

    const { data: existingCurrencies, error: extErr } = await supabase
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
      await supabase
        .from('user_currencies')
        .update({ is_default: false })
        .eq('user_id', userId)
    }

    const { data: inserted, error: insertError } = await supabase
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
    const { data: expenses, error: expensesError } = await supabase
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

          const { error } = await supabase
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

export const onboardUserCurrencies = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currencies, default_currency } = OnboardingSchema.parse(req.body)
    const userId = req.user!.id
    const supabase = createSupabaseUserClient(req.accessToken!)

    if (!currencies.includes(default_currency)) {
      return res.status(400).json({ error: 'Default currency must be in your selected currencies' })
    }

    const snapshot = await ExchangeRateService.getCachedRates(supabase)
    const invalidCodes = currencies.filter(code => !snapshot.rates[code])
    if (invalidCodes.length > 0) {
      return res.status(400).json({ error: `Invalid currency code: ${invalidCodes.join(', ')}` })
    }

    const { data: existingCurrencies, error: existingErr } = await supabase
      .from('user_currencies')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (existingErr) throw existingErr
    if (existingCurrencies && existingCurrencies.length > 0) {
      return res.json({ currencies: existingCurrencies })
    }

    const rows = currencies.map((currency, index) => ({
      user_id: userId,
      currency,
      is_default: currency === default_currency,
      position: index
    }))

    const { data, error: insertError } = await supabase
      .from('user_currencies')
      .insert(rows)
      .select()

    if (insertError) throw insertError
    res.status(201).json({ currencies: data })
  } catch (err) {
    next(err)
  }
}

export const deleteUserCurrency = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currency = req.params.currency as string
    const userId = req.user!.id
    const supabase = createSupabaseUserClient(req.accessToken!)

    const { data: existing, error } = await supabase
      .from('user_currencies')
      .select('id, currency, is_default')
      .eq('user_id', userId)

    if (error) throw error

    const target = existing.find(c => c.currency === currency)
    if (!target) return res.status(404).json({ error: 'Not found' })
    if (target.is_default) return res.status(400).json({ error: 'Cannot delete default currency' })
    if (existing.length <= 1) return res.status(400).json({ error: 'Cannot delete last currency' })

    const { error: delError } = await supabase
      .from('user_currencies')
      .delete()
      .eq('user_id', userId)
      .eq('currency', currency)

    if (delError) throw delError

    // Remove from JSONB (Using JS loop because Supabase JS cannot run raw SQL string UPDATEs)
    const { data: expenses, error: expensesError } = await supabase
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
              await supabase
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
    const supabase = createSupabaseUserClient(req.accessToken!)

    const { data: existing, error } = await supabase
      .from('user_currencies')
      .select('id, currency')
      .eq('user_id', userId)
    
    if (error) throw error

    if (!existing.some(c => c.currency === currency)) {
      return res.status(404).json({ error: 'Not found' })
    }

    await supabase
      .from('user_currencies')
      .update({ is_default: false })
      .eq('user_id', userId)

    const { data, error: updError } = await supabase
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

export const updateCurrencyPosition = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currency = req.params.currency
    const { position: newPosition } = PositionSchema.parse(req.body)
    const userId = req.user!.id
    const supabase = createSupabaseUserClient(req.accessToken!)

    const { data: existing, error } = await supabase
      .from('user_currencies')
      .select('id, currency, position')
      .eq('user_id', userId)
      .order('position', { ascending: true })
    
    if (error) throw error

    const targetIndex = existing.findIndex(c => c.currency === currency)
    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Currency not found' })
    }

    const currencies = [...existing]
    const [target] = currencies.splice(targetIndex, 1)
    
    // Insert at new position
    currencies.splice(newPosition, 0, target!)

    // Update all positions to ensure sequence is maintained
    await Promise.all(
      currencies.map((c, index) => 
        supabase
          .from('user_currencies')
          .update({ position: index })
          .eq('id', c.id)
      )
    )

    const { data: finalCurrencies, error: fetchErr } = await supabase
      .from('user_currencies')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (fetchErr) throw fetchErr

    res.json(finalCurrencies)
  } catch (err) {
    next(err)
  }
}
