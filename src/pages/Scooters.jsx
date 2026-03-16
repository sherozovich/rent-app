import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useScooters } from '@/hooks/useScooters'
import StatusBadge from '@/components/StatusBadge'
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

const emptyForm = { model: '', vin: '', plate: '', status: 'available' }

export default function Scooters() {
  const { scooters, loading, error, addScooter, updateScooter, deleteScooter } = useScooters()
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm)
    setFormError(null)
    setOpen(true)
  }

  function openEdit(scooter) {
    setEditTarget(scooter)
    setForm({
      model: scooter.model,
      vin: scooter.vin,
      plate: scooter.plate,
      status: scooter.status,
    })
    setFormError(null)
    setOpen(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    const upper = ['plate', 'vin'].includes(name)
    setForm((prev) => ({ ...prev, [name]: upper ? value.toUpperCase() : value }))
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteScooter(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editTarget) {
        await updateScooter(editTarget.id, form)
      } else {
        await addScooter(form)
      }
      setOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Скутеры</h1>
          <p className="text-sm text-gray-500 mt-1">Управление парком скутеров</p>
        </div>
        <Button onClick={openAdd} className="w-full md:w-auto">
          <Plus size={16} className="mr-2" />
          Добавить скутер
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" /> Загрузка...
        </div>
      ) : scooters.length === 0 ? (
        <p className="text-muted-foreground text-sm">Скутеры не добавлены. Добавьте первый.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-x-auto bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Модель</TableHead>
                <TableHead>Номер</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {scooters.map((scooter) => (
                <TableRow key={scooter.id}>
                  <TableCell className="font-medium">{scooter.model}</TableCell>
                  <TableCell>{scooter.plate}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {scooter.vin}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={scooter.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(scooter)}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { setDeleteTarget(scooter); setDeleteError(null) }}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить скутер</DialogTitle>
          </DialogHeader>
          {deleteTarget?.status !== 'available' ? (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              Нельзя удалить <span className="font-medium">{deleteTarget?.model} — {deleteTarget?.plate}</span> — статус <span className="font-medium">{deleteTarget?.status}</span>. Удалять можно только доступные скутеры.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Удалить <span className="font-medium">{deleteTarget?.model} — {deleteTarget?.plate}</span>? Это нельзя отменить.
            </p>
          )}
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || deleteTarget?.status !== 'available'}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Редактировать скутер' : 'Добавить скутер'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Модель</Label>
              <Input
                id="model"
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="напр. Xiaomi Mi 365"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                name="vin"
                value={form.vin}
                onChange={handleChange}
                placeholder="напр. 1HGBH41JXMN109186"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">Номерной знак</Label>
              <Input
                id="plate"
                name="plate"
                value={form.plate}
                onChange={handleChange}
                placeholder="напр. AA1234BB"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступен</SelectItem>
                  <SelectItem value="rented">Арендован</SelectItem>
                  <SelectItem value="maintenance">Обслуживание</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Сохранение...' : editTarget ? 'Сохранить' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
