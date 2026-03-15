import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateAgreementNumber } from '@/lib/agreementNumber'
import { useCouriers } from '@/hooks/useCouriers'
import { useScooters } from '@/hooks/useScooters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import StatusBadge from '@/components/StatusBadge'

const STEPS = ['Courier', 'Scooter', 'Details', 'Review', 'Activate']

// Compute end_date based on tariff and days
function computeEndDate(startDate, tariff, days) {
  if (!startDate) return ''
  const d = new Date(startDate)
  if (tariff === 'daily') d.setDate(d.getDate() + Number(days) - 1)
  else if (tariff === 'weekly') d.setDate(d.getDate() + 6)
  else if (tariff === 'monthly') d.setDate(d.getDate() + 29)
  return d.toISOString().split('T')[0]
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i < current
                  ? 'bg-primary border-primary text-primary-foreground'
                  : i === current
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs mt-1 hidden md:block ${i === current ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${i < current ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Select or quick-add courier ─────────────────────────────────────
function Step1({ data, setData }) {
  const { couriers, loading, addCourier } = useCouriers()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ full_name: '', passport_no: '', phone: '' })
  const [saving, setSaving] = useState(false)

  async function handleQuickAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addCourier(form)
      setShowAdd(false)
      setForm({ full_name: '', passport_no: '', phone: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Select Courier</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {couriers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setData((p) => ({ ...p, courier: c }))}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                data.courier?.id === c.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="font-medium">{c.full_name}</div>
              <div className="text-sm text-muted-foreground">{c.phone}</div>
            </button>
          ))}
        </div>
      )}

      {!showAdd ? (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          + Quick Add Courier
        </Button>
      ) : (
        <form onSubmit={handleQuickAdd} className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">New Courier</p>
          <Input
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            required
          />
          <Input
            placeholder="Passport No"
            value={form.passport_no}
            onChange={(e) => setForm((p) => ({ ...p, passport_no: e.target.value }))}
            required
          />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Add'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Step 2: Select available scooter ────────────────────────────────────────
function Step2({ data, setData }) {
  const { scooters, loading } = useScooters()
  const available = scooters.filter((s) => s.status === 'available')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Select Scooter</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : available.length === 0 ? (
        <p className="text-sm text-muted-foreground">No scooters available right now.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {available.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setData((p) => ({ ...p, scooter: s }))}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                data.scooter?.id === s.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="font-medium">{s.model}</div>
              <div className="text-sm text-muted-foreground">
                {s.plate} · {s.vin}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Rental details ───────────────────────────────────────────────────
function Step3({ data, setData }) {
  const { tariff, days, start_date, license_no, license_issue_date } = data
  const endDate = computeEndDate(start_date, tariff, days)

  function set(field, value) {
    setData((p) => ({ ...p, [field]: value }))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Rental Details</h2>

      <div className="space-y-2">
        <Label>Tariff</Label>
        <Select value={tariff} onValueChange={(v) => set('tariff', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select tariff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily (min 3 days)</SelectItem>
            <SelectItem value="weekly">Weekly (7 days)</SelectItem>
            <SelectItem value="monthly">Monthly (30 days)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tariff === 'daily' && (
        <div className="space-y-2">
          <Label>Number of Days (min 3)</Label>
          <Input
            type="number"
            min={3}
            value={days}
            onChange={(e) => set('days', e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Start Date</Label>
        <Input
          type="date"
          value={start_date}
          onChange={(e) => set('start_date', e.target.value)}
        />
      </div>

      {endDate && (
        <p className="text-sm text-muted-foreground">
          End date: <span className="font-medium text-foreground">{endDate}</span>
        </p>
      )}

      <div className="space-y-2">
        <Label>Driver's License No</Label>
        <Input
          value={license_no}
          onChange={(e) => set('license_no', e.target.value)}
          placeholder="e.g. DLN123456"
        />
      </div>

      <div className="space-y-2">
        <Label>License Issue Date</Label>
        <Input
          type="date"
          value={license_issue_date}
          onChange={(e) => set('license_issue_date', e.target.value)}
        />
      </div>
    </div>
  )
}

// ─── Step 4: Review & confirm ─────────────────────────────────────────────────
function Step4({ data }) {
  const endDate = computeEndDate(data.start_date, data.tariff, data.days)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Review</h2>
      <div className="rounded-lg border divide-y text-sm">
        <Row label="Courier" value={data.courier?.full_name} />
        <Row label="Phone" value={data.courier?.phone} />
        <Row label="Scooter" value={`${data.scooter?.model} — ${data.scooter?.plate}`} />
        <Row label="VIN" value={data.scooter?.vin} />
        <Row label="Tariff" value={data.tariff} />
        {data.tariff === 'daily' && <Row label="Days" value={data.days} />}
        <Row label="Start" value={data.start_date} />
        <Row label="End" value={endDate} />
        <Row label="License No" value={data.license_no} />
        <Row label="License Issued" value={data.license_issue_date} />
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  )
}

// ─── Step 5: Activate (confirmation screen) ───────────────────────────────────
function Step5({ agreementNo }) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check size={32} className="text-green-600" />
      </div>
      <h2 className="text-lg font-semibold">Rental Created</h2>
      <p className="text-muted-foreground text-sm">Agreement number</p>
      <p className="text-2xl font-bold tracking-wide">{agreementNo}</p>
      <p className="text-sm text-muted-foreground">
        Print the agreement and doverenost from the Rental Detail page.
      </p>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
const initialData = {
  courier: null,
  scooter: null,
  tariff: 'daily',
  days: 3,
  start_date: new Date().toISOString().split('T')[0],
  license_no: '',
  license_issue_date: '',
}

export default function NewRental() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill

  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    ...initialData,
    courier: prefill?.courier ?? null,
    scooter: prefill?.scooter ?? null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [createdId, setCreatedId] = useState(null)
  const [agreementNo, setAgreementNo] = useState('')

  function canNext() {
    if (step === 0) return !!data.courier
    if (step === 1) return !!data.scooter
    if (step === 2) {
      const endDate = computeEndDate(data.start_date, data.tariff, data.days)
      return (
        data.tariff &&
        data.start_date &&
        endDate &&
        data.license_no &&
        data.license_issue_date &&
        (data.tariff !== 'daily' || Number(data.days) >= 3)
      )
    }
    return true
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const endDate = computeEndDate(data.start_date, data.tariff, data.days)
      const agreement_no = await generateAgreementNumber()

      const { data: rental, error: insertError } = await supabase
        .from('rentals')
        .insert({
          agreement_no,
          courier_id: data.courier.id,
          scooter_id: data.scooter.id,
          tariff: data.tariff,
          start_date: data.start_date,
          end_date: endDate,
          status: 'active',
          license_no: data.license_no,
          license_issue_date: data.license_issue_date,
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      setAgreementNo(agreement_no)
      setCreatedId(rental.id)
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rentals')}>
          <ChevronLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold">New Rental</h1>
      </div>

      <StepIndicator current={step} />

      <div className="rounded-lg border bg-card p-6">
        {step === 0 && <Step1 data={data} setData={setData} />}
        {step === 1 && <Step2 data={data} setData={setData} />}
        {step === 2 && <Step3 data={data} setData={setData} />}
        {step === 3 && <Step4 data={data} />}
        {step === 4 && <Step5 agreementNo={agreementNo} />}

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-between mt-6">
          {step < 4 ? (
            <>
              <Button
                variant="outline"
                onClick={() => (step === 0 ? navigate('/rentals') : setStep((s) => s - 1))}
                disabled={submitting}
              >
                <ChevronLeft size={16} className="mr-1" />
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>

              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              ) : (
                <Button onClick={handleConfirm} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Confirm & Create'}
                </Button>
              )}
            </>
          ) : (
            <Button className="w-full" onClick={() => navigate(`/rentals/${createdId}`)}>
              View Rental Detail
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
