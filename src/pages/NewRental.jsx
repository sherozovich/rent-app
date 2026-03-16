import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateAgreementNumber } from '@/lib/agreementNumber'
import { formatUzPhone } from '@/lib/utils'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import StatusBadge from '@/components/StatusBadge'

const STEPS = ['Курьер', 'Скутер', 'Условия', 'Проверка', 'Готово']

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

// ─── SearchCombobox ────────────────────────────────────────────────────────────
function SearchCombobox({ value, onChange, options, placeholder, disabled }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const display = open ? query : (value || '')
  const filtered = open
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 80)
    : []

  return (
    <div ref={ref} className="relative">
      <Input
        value={display}
        onFocus={() => { setOpen(true); setQuery('') }}
        onChange={e => { setQuery(e.target.value); onChange('') }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border bg-white shadow-md">
          {filtered.map(o => (
            <button key={o} type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(o); setQuery(o); setOpen(false) }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const emptyQuickForm = {
  full_name: '', passport_no: '', phone: '',
  license_no: '', license_issue_date: '',
  birth_country: '', birth_city: '',
}

// ─── Step 1: Select or quick-add courier ─────────────────────────────────────
function Step1({ data, setData }) {
  const { couriers, loading, addCourier } = useCouriers()
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyQuickForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [search, setSearch] = useState('')
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name')
      .then(r => r.json())
      .then(data => setCountries(data.map(c => c.name.common).sort()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.birth_country) { setCities([]); return }
    fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: form.birth_country }),
    })
      .then(r => r.json())
      .then(d => setCities(d.data || []))
      .catch(() => setCities([]))
  }, [form.birth_country])

  async function handleQuickAdd(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await addCourier(form)
      setAddOpen(false)
      setForm(emptyQuickForm)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = search.length > 0
    ? couriers.filter((c) => c.full_name.toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Выберите курьера</h2>

      <Input
        placeholder="Поиск по имени..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : search.length === 0 ? (
        <p className="text-sm text-muted-foreground">Введите имя для поиска...</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Курьеры не найдены.</p>
          ) : filtered.map((c) => (
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

      <Button variant="outline" size="sm" onClick={() => { setForm(emptyQuickForm); setFormError(null); setAddOpen(true) }}>
        + Добавить курьера
      </Button>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить курьера</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label>ФИО</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="напр. Иванов Иван"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Номер паспорта</Label>
              <Input
                value={form.passport_no}
                onChange={(e) => setForm((p) => ({ ...p, passport_no: e.target.value.toUpperCase() }))}
                placeholder="напр. AB1234567"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Телефон</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: formatUzPhone(e.target.value) }))}
                placeholder="+998 XX XXX XX XX"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Номер прав</Label>
              <Input
                value={form.license_no}
                onChange={(e) => setForm((p) => ({ ...p, license_no: e.target.value.toUpperCase() }))}
                placeholder="напр. AA123456"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Дата выдачи прав</Label>
              <Input
                type="date"
                value={form.license_issue_date}
                onChange={(e) => setForm((p) => ({ ...p, license_issue_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Страна рождения</Label>
              <SearchCombobox
                value={form.birth_country}
                onChange={(v) => setForm((p) => ({ ...p, birth_country: v, birth_city: '' }))}
                options={countries}
                placeholder="Поиск страны..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Город рождения</Label>
              <SearchCombobox
                value={form.birth_city}
                onChange={(v) => setForm((p) => ({ ...p, birth_city: v }))}
                options={cities}
                placeholder="Поиск города..."
                disabled={!form.birth_country}
              />
            </div>
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Сохранение...' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Step 2: Select available scooter ────────────────────────────────────────
function Step2({ data, setData }) {
  const { scooters, loading } = useScooters()
  const [search, setSearch] = useState('')
  const available = scooters.filter((s) => s.status === 'available')
  const filtered = search.length > 0
    ? available.filter((s) => s.plate.toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Выберите скутер</h2>
      <Input
        placeholder="Поиск по номеру..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : available.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет доступных скутеров.</p>
      ) : search.length === 0 ? (
        <p className="text-sm text-muted-foreground">Введите номер для поиска...</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Скутеры не найдены.</p>
          ) : filtered.map((s) => (
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
  const { tariff, days, start_date } = data
  const endDate = computeEndDate(start_date, tariff, days)

  function set(field, value) {
    setData((p) => ({ ...p, [field]: value }))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Условия аренды</h2>

      <div className="space-y-2">
        <Label>Тариф</Label>
        <Select value={tariff} onValueChange={(v) => set('tariff', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите тариф" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Суточный (мин. 3 дня)</SelectItem>
            <SelectItem value="weekly">Еженедельный (7 дней)</SelectItem>
            <SelectItem value="monthly">Ежемесячный (30 дней)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tariff === 'daily' && (
        <div className="space-y-2">
          <Label>Количество дней (мин. 3)</Label>
          <Input
            type="number"
            min={3}
            value={days}
            onChange={(e) => set('days', e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Дата начала</Label>
        <Input
          type="date"
          value={start_date}
          onChange={(e) => set('start_date', e.target.value)}
        />
      </div>

      {endDate && (
        <p className="text-sm text-muted-foreground">
          Дата окончания: <span className="font-medium text-foreground">{endDate}</span>
        </p>
      )}
    </div>
  )
}

// ─── Step 4: Review & confirm ─────────────────────────────────────────────────
function Step4({ data }) {
  const endDate = computeEndDate(data.start_date, data.tariff, data.days)

  const tariffLabels = { daily: 'Суточный', weekly: 'Еженедельный', monthly: 'Ежемесячный' }
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Проверка</h2>
      <div className="rounded-lg border divide-y text-sm">
        <Row label="Курьер" value={data.courier?.full_name} />
        <Row label="Телефон" value={data.courier?.phone} />
        <Row label="Скутер" value={`${data.scooter?.model} — ${data.scooter?.plate}`} />
        <Row label="VIN" value={data.scooter?.vin} />
        <Row label="Тариф" value={tariffLabels[data.tariff] ?? data.tariff} />
        {data.tariff === 'daily' && <Row label="Дней" value={data.days} />}
        <Row label="Начало" value={data.start_date} />
        <Row label="Окончание" value={endDate} />
        <Row label="Номер прав" value={data.license_no} />
        <Row label="Дата выдачи прав" value={data.license_issue_date} />
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
      <h2 className="text-lg font-semibold">Аренда создана</h2>
      <p className="text-muted-foreground text-sm">Номер договора</p>
      <p className="text-2xl font-bold tracking-wide">{agreementNo}</p>
      <p className="text-sm text-muted-foreground">
        Распечатайте договор и доверенность на странице аренды.
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
          license_no: data.courier.license_no ?? '',
          license_issue_date: data.courier.license_issue_date ?? null,
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
        <h1 className="text-2xl font-bold">Новая аренда</h1>
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
                {step === 0 ? 'Отмена' : 'Назад'}
              </Button>

              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                  Далее
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              ) : (
                <Button onClick={handleConfirm} disabled={submitting}>
                  {submitting ? 'Создание...' : 'Подтвердить'}
                </Button>
              )}
            </>
          ) : (
            <Button className="w-full" onClick={() => navigate(`/rentals/${createdId}`)}>
              Открыть аренду
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
