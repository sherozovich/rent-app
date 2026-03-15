import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { loadTariffRates } from '@/lib/tariffRates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'

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
      setRatesMsg({ type: 'success', text: 'Rates saved successfully' })
    } catch {
      setRatesMsg({ type: 'error', text: 'Failed to save rates' })
    } finally {
      setRatesSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwdMsg(null)
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (newPassword.length < 4) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 4 characters' })
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
      setPwdMsg({ type: 'success', text: 'Password changed successfully' })
    } catch {
      setPwdMsg({ type: 'error', text: 'Failed to change password' })
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage pricing and account settings</p>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Pricing</h2>
        <p className="text-sm text-gray-500 mb-5">
          Daily rate is charged per day. Weekly and monthly rates are flat fees.
        </p>
        {ratesLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Loading...
          </div>
        ) : (
          <form onSubmit={saveRates} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Daily rate (per day)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={rates.daily_rate}
                    onChange={(e) => setRates((r) => ({ ...r, daily_rate: e.target.value }))}
                    className="pr-14"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    UZS
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Weekly rate (flat)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={rates.weekly_rate}
                    onChange={(e) => setRates((r) => ({ ...r, weekly_rate: e.target.value }))}
                    className="pr-14"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    UZS
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Monthly rate (flat)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={rates.monthly_rate}
                    onChange={(e) => setRates((r) => ({ ...r, monthly_rate: e.target.value }))}
                    className="pr-14"
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
              Save Rates
            </Button>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="newPwd">New password</Label>
            <Input
              id="newPwd"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPwd">Confirm new password</Label>
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
            Change Password
          </Button>
        </form>
      </div>
    </div>
  )
}
