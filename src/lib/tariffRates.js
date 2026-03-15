import { supabase } from './supabase'

/**
 * Tariff rates loaded from the settings table.
 * daily: per-day rate (UZS)
 * weekly: flat rate for a 7-day rental (UZS)
 * monthly: flat rate for a 30-day rental (UZS)
 */
export const TARIFF_RATES = {
  daily: 50000,
  weekly: 300000,
  monthly: 1000000,
}

/**
 * Fetch current rates from the settings table and update TARIFF_RATES in place.
 * Call once at app startup and after saving new rates in Settings page.
 */
export async function loadTariffRates() {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['daily_rate', 'weekly_rate', 'monthly_rate'])
  if (data) {
    for (const { key, value } of data) {
      const num = Number(value)
      if (!isNaN(num) && num > 0) {
        if (key === 'daily_rate') TARIFF_RATES.daily = num
        if (key === 'weekly_rate') TARIFF_RATES.weekly = num
        if (key === 'monthly_rate') TARIFF_RATES.monthly = num
      }
    }
  }
}

/**
 * Calculate the total charge for a rental.
 * - daily: days × daily_rate
 * - weekly: flat weekly_rate
 * - monthly: flat monthly_rate
 */
export function calcTotalCharged(tariff, startDate, endDate) {
  if (!tariff || !startDate || !endDate) return 0
  if (tariff === 'weekly') return TARIFF_RATES.weekly
  if (tariff === 'monthly') return TARIFF_RATES.monthly
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
  return days * TARIFF_RATES.daily
}
