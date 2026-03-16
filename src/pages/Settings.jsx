import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { loadTariffRates } from '@/lib/tariffRates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { formatAmount } from '@/lib/utils'

export default function Settings() {
  const [rates, setRates] = useState({ daily_rate: '', weekly_rate: '', monthly_rate: '' })
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesSaving, setRatesSaving] = useState(false)
  const [ratesMsg, setRatesMsg] = useState(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['daily_rate', 'weekly_rate', 'monthly_rate'])
      if (data) {
        const map = Object.fromEntries(data.map((r) => [r.key, r.value]))
        setRates({
          daily_rate: map.daily_rate ?? '',
          weekly_rate: map.weekly_rate ?? '',
          monthly_rate: map.monthly_rate ?? '',
        })
      }
      setRatesLoading(false)
    }
    load()
  }, [])

  async function saveRates(e) {
    e.preventDefault()
    setRatesSaving(true)
    setRatesMsg(null)
    try {
      for (const [key, value] of Object.entries(rates)) {
        const { error } = await supabase
          .from('settings')
          .update({ value: String(value), updated_at: new Date().toISOString() })
          .eq('key', key)
        if (error) throw error
      }
      await loadTariffRates()
      setRatesMsg({ type: 'success', text: 'Тарифы сохранены' })
    } catch {
      setRatesMsg({ type: 'error', text: 'Не удалось сохранить тарифы' })
    } finally {
      setRatesSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwdMsg(null)
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Пароли не совпадают' })
      return
    }
    if (newPassword.length < 4) {
      setPwdMsg({ type: 'error', text: 'Пароль должен быть не менее 4 символов' })
      return
    }
    setPwdSaving(true)
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: newPassword, updated_at: new Date().toISOString() })
        .eq('key', 'password')
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      setPwdMsg({ type: 'success', text: 'Пароль изменён' })
    } catch {
      setPwdMsg({ type: 'error', text: 'Не удалось изменить пароль' })
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Настройки</h1>
        <p className="text-sm text-gray-500 mt-1">Управление ценами и учётной записью</p>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Цены</h2>
        <p className="text-sm text-gray-500 mb-5">
          Суточный тариф — за каждый день. Еженедельный и ежемесячный — фиксированная сумма.
        </p>
        {ratesLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Загрузка...
          </div>
        ) : (
          <form onSubmit={saveRates} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Суточный тариф (за день)</Label>
                <div className="relative">
                  <Input
                    inputMode="numeric"
                    value={formatAmount(rates.daily_rate)}
                    onChange={(e) => setRates((r) => ({ ...r, daily_rate: e.target.value.replace(/\D/g, '') }))}
                    className="pr-14"
                    placeholder="0"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    UZS
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Еженедельный тариф</Label>
                <div className="relative">
                  <Input
                    inputMode="numeric"
                    value={formatAmount(rates.weekly_rate)}
                    onChange={(e) => setRates((r) => ({ ...r, weekly_rate: e.target.value.replace(/\D/g, '') }))}
                    className="pr-14"
                    placeholder="0"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    UZS
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Ежемесячный тариф</Label>
                <div className="relative">
                  <Input
                    inputMode="numeric"
                    value={formatAmount(rates.monthly_rate)}
                    onChange={(e) => setRates((r) => ({ ...r, monthly_rate: e.target.value.replace(/\D/g, '') }))}
                    className="pr-14"
                    placeholder="0"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    UZS
                  </span>
                </div>
              </div>
            </div>
            {ratesMsg && (
              <p
                className={`text-sm px-3 py-2 rounded-lg ${
                  ratesMsg.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {ratesMsg.text}
              </p>
            )}
            <Button type="submit" disabled={ratesSaving} className="w-full md:w-auto">
              {ratesSaving && <Loader2 size={14} className="mr-2 animate-spin" />}
              <Save size={14} className="mr-2" />
              Сохранить тарифы
            </Button>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Сменить пароль</h2>
        <form onSubmit={changePassword} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="newPwd">Новый пароль</Label>
            <Input
              id="newPwd"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPwd">Подтвердите пароль</Label>
            <Input
              id="confirmPwd"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {pwdMsg && (
            <p
              className={`text-sm px-3 py-2 rounded-lg ${
                pwdMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {pwdMsg.text}
            </p>
          )}
          <Button type="submit" disabled={pwdSaving} className="w-full md:w-auto">
            {pwdSaving && <Loader2 size={14} className="mr-2 animate-spin" />}
            <Save size={14} className="mr-2" />
            Сменить пароль
          </Button>
        </form>
      </div>
    </div>
  )
}
