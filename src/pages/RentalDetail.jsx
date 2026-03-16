import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, RefreshCw, CheckCircle, FileText, FileCheck } from 'lucide-react'
import { useRental } from '@/hooks/useRentals'
import { calcTotalCharged } from '@/lib/tariffRates'
import { formatAmount } from '@/lib/utils'
import { printPdf } from '@/lib/printPdf'
import { rentalAgreementDoc, doverenostDoc } from '@/lib/pdfTemplates'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import StatusBadge from '@/components/StatusBadge'
import PhotoUpload from '@/components/PhotoUpload'

const emptyPayment = { amount: '', method: 'cash', paid_at: new Date().toISOString().split('T')[0], note: '' }

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  )
}

export default function RentalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { rental, payments, loading, error, totalPaid, addPayment, updateRentalStatus, updatePhotos, refetch } =
    useRental(id)

  const [payOpen, setPayOpen] = useState(false)
  const [payForm, setPayForm] = useState(emptyPayment)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [confirmComplete, setConfirmComplete] = useState(false)

  async function handleAddPayment(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await addPayment({ ...payForm, amount: Number(payForm.amount) })
      setPayOpen(false)
      setPayForm(emptyPayment)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete() {
    setSaving(true)
    try {
      await updateRentalStatus('completed')
      setConfirmComplete(false)
    } finally {
      setSaving(false)
    }
  }

  async function handlePrintAgreement() {
    await printPdf(rentalAgreementDoc(rental))
  }

  async function handlePrintDoverenost() {
    await printPdf(doverenostDoc(rental))
  }

  function handleRenew() {
    // Navigate to new rental with pre-filled courier + scooter via state
    navigate('/rentals/new', {
      state: {
        prefill: {
          courier: rental.courier,
          scooter: rental.scooter,
        },
      },
    })
  }

  if (loading) return <p className="p-6 text-muted-foreground text-sm">Загрузка...</p>
  if (error) return <p className="p-6 text-destructive text-sm">{error}</p>
  if (!rental) return null

  const totalCharged = rental
    ? calcTotalCharged(rental.tariff, rental.start_date, rental.end_date)
    : 0
  const balance = totalCharged - totalPaid

  const daysLeft = Math.ceil(
    (new Date(rental.end_date) - new Date()) / (1000 * 60 * 60 * 24),
  )
  const isExpiringSoon = daysLeft <= 2 && daysLeft >= 0 && rental.status === 'active'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rentals')}>
          <ChevronLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-mono">{rental.agreement_no}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={rental.status} />
            {isExpiringSoon && (
              <span className="text-xs text-orange-600 font-medium">
                Истекает через {daysLeft} дн.
              </span>
            )}
          </div>
        </div>
        {rental.status === 'active' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRenew}>
              <RefreshCw size={14} className="mr-1" />
              Продлить
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => setConfirmComplete(true)}
            >
              <CheckCircle size={14} className="mr-1" />
              Завершить
            </Button>
          </div>
        )}
      </div>

      {/* Rental info */}
      <div className="rounded-lg border bg-card p-5 mb-4">
        <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Курьер</p>
        <InfoRow label="ФИО" value={rental.courier?.full_name} />
        <InfoRow label="Телефон" value={rental.courier?.phone} />
        <InfoRow label="Паспорт" value={rental.courier?.passport_no} />
        <InfoRow label="Номер прав" value={rental.license_no} />
        <InfoRow label="Дата выдачи прав" value={rental.license_issue_date} />
      </div>

      <div className="rounded-lg border bg-card p-5 mb-4">
        <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Скутер</p>
        <InfoRow label="Модель" value={rental.scooter?.model} />
        <InfoRow label="Номер" value={rental.scooter?.plate} />
        <InfoRow label="VIN" value={rental.scooter?.vin} />
      </div>

      <div className="rounded-lg border bg-card p-5 mb-4">
        <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Период аренды</p>
        <InfoRow label="Тариф" value={{ daily: 'Суточный', weekly: 'Еженедельный', monthly: 'Ежемесячный' }[rental.tariff] ?? rental.tariff} />
        <InfoRow label="Дата начала" value={rental.start_date} />
        <InfoRow label="Дата окончания" value={rental.end_date} />
      </div>

      {/* Photos */}
      <div className="rounded-lg border bg-card p-5 mb-4">
        <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Фотографии</p>
        <PhotoUpload
          rentalId={rental.id}
          photos={rental.photos || []}
          onUpdate={async (newPhotos) => {
            await updatePhotos(newPhotos)
          }}
        />
      </div>

      {/* PDF Actions */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Button variant="outline" className="w-full sm:w-auto" onClick={handlePrintAgreement}>
          <FileText size={14} className="mr-2" />
          Печать договора
        </Button>
        <Button variant="outline" className="w-full sm:w-auto" onClick={handlePrintDoverenost}>
          <FileCheck size={14} className="mr-2" />
          Печать доверенности
        </Button>
      </div>

      {/* Payments */}
      <div className="rounded-lg border bg-card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Платежи
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">
              К оплате:{' '}
              <span className="font-mono">{totalCharged.toLocaleString()}</span>
            </span>
            <span className="text-sm font-medium">
              Оплачено:{' '}
              <span className="text-green-700 font-mono">{totalPaid.toLocaleString()}</span>
            </span>
            {balance > 0 && (
              <span className="text-sm font-medium text-red-600">
                Остаток: <span className="font-mono">{balance.toLocaleString()}</span>
              </span>
            )}
            {balance <= 0 && totalCharged > 0 && (
              <span className="text-sm text-green-700 font-medium">Оплачено полностью</span>
            )}
            {rental.status === 'active' && (
              <Button size="sm" onClick={() => setPayOpen(true)}>
                <Plus size={14} className="mr-1" />
                Добавить
              </Button>
            )}
          </div>
        </div>

        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Платежи не записаны.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Способ</TableHead>
                  <TableHead>Примечание</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.paid_at}</TableCell>
                    <TableCell className="font-medium">{Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell>{{ cash: 'Наличные', transfer: 'Перевод' }[p.method] ?? p.method}</TableCell>
                    <TableCell className="text-muted-foreground">{p.note || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить платёж</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Сумма</Label>
              <Input
                inputMode="numeric"
                value={formatAmount(payForm.amount)}
                onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value.replace(/\D/g, '') }))}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Способ оплаты</Label>
              <Select
                value={payForm.method}
                onValueChange={(v) => setPayForm((p) => ({ ...p, method: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Наличные</SelectItem>
                  <SelectItem value="transfer">Перевод</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input
                type="date"
                value={payForm.paid_at}
                onChange={(e) => setPayForm((p) => ({ ...p, paid_at: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Примечание (необязательно)</Label>
              <Input
                value={payForm.note}
                onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="напр. Еженедельный платёж"
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Сохранение...' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation Dialog */}
      <Dialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Завершить аренду?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Аренда будет помечена как завершённая, скутер станет доступен.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmComplete(false)}>
              Отмена
            </Button>
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? 'Сохранение...' : 'Завершить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
