import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { useCouriers } from '@/hooks/useCouriers'
import { supabase } from '@/lib/supabase'
import { formatUzPhone } from '@/lib/utils'
import SearchCombobox from '@/components/SearchCombobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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

const AVATAR_COMPRESSION = { maxSizeMB: 0.3, maxWidthOrHeight: 400, useWebWorker: true }

const emptyForm = {
  full_name: '', passport_no: '', phone: '',
  license_no: '', license_issue_date: '',
  birth_country: '', birth_city: '',
  address: '', avatar_url: '',
}


export default function Couriers() {
  const { couriers, loading, error, addCourier, updateCourier, deleteCourier } = useCouriers()
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const avatarInputRef = useRef(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name')
      .then((r) => r.json())
      .then((data) => setCountries(data.map((c) => c.name.common).sort()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.birth_country) { setCities([]); return }
    fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: form.birth_country }),
    })
      .then((r) => r.json())
      .then((d) => setCities(d.data || []))
      .catch(() => setCities([]))
  }, [form.birth_country])

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm)
    setFormError(null)
    setOpen(true)
  }

  function openEdit(courier) {
    setEditTarget(courier)
    setForm({
      full_name: courier.full_name,
      passport_no: courier.passport_no,
      phone: formatUzPhone(courier.phone ?? ''),
      license_no: courier.license_no ?? '',
      license_issue_date: courier.license_issue_date ?? '',
      birth_country: courier.birth_country ?? '',
      birth_city: courier.birth_city ?? '',
      address: courier.address ?? '',
      avatar_url: courier.avatar_url ?? '',
    })
    setFormError(null)
    setOpen(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    const upper = ['passport_no', 'license_no'].includes(name)
    setForm((prev) => ({ ...prev, [name]: upper ? value.toUpperCase() : value }))
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const compressed = await imageCompression(file, AVATAR_COMPRESSION)
      const id = editTarget?.id ?? `new-${Date.now()}`
      const path = `${id}-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('courier-photos')
        .upload(path, compressed, { upsert: true })
      if (uploadError) throw new Error(uploadError.message)
      const { data } = supabase.storage.from('courier-photos').getPublicUrl(path)
      setForm((p) => ({ ...p, avatar_url: data.publicUrl }))
    } catch (err) {
      setFormError(err.message)
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteCourier(deleteTarget.id)
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
        await updateCourier(editTarget.id, form)
      } else {
        await addCourier(form)
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
          <h1 className="text-xl font-semibold text-gray-900">Курьеры</h1>
          <p className="text-sm text-gray-500 mt-1">Управление курьерами</p>
        </div>
        <Button onClick={openAdd} className="w-full md:w-auto">
          <Plus size={16} className="mr-2" />
          Добавить курьера
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" /> Загрузка...
        </div>
      ) : couriers.length === 0 ? (
        <p className="text-muted-foreground text-sm">Курьеры не добавлены. Добавьте первого.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-x-auto bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-10" />
                <TableHead>ФИО</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Паспорт</TableHead>
                <TableHead>Аренд</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {couriers.map((courier) => (
                <TableRow key={courier.id}>
                  <TableCell>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={courier.avatar_url || undefined} alt={courier.full_name} />
                      <AvatarFallback className="text-xs">{courier.full_name?.[0] ?? '?'}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{courier.full_name}</TableCell>
                  <TableCell>{courier.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{courier.passport_no}</TableCell>
                  <TableCell>{courier.active_rentals}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(courier)}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { setDeleteTarget(courier); setDeleteError(null) }}>
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
            <DialogTitle>Удалить курьера</DialogTitle>
          </DialogHeader>
          {deleteTarget?.active_rentals > 0 ? (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              Нельзя удалить <span className="font-medium">{deleteTarget?.full_name}</span> — есть {deleteTarget?.active_rentals} активных аренд. Сначала завершите или отмените их.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Удалить <span className="font-medium">{deleteTarget?.full_name}</span>? Это нельзя отменить.
            </p>
          )}
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || deleteTarget?.active_rentals > 0}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Редактировать курьера' : 'Добавить курьера'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Фото</Label>
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={form.avatar_url || undefined} alt="avatar" />
                  <AvatarFallback className="text-lg">{form.full_name?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarUploading ? <><Loader2 size={13} className="mr-1 animate-spin" />Загрузка...</> : 'Выбрать фото'}
                  </Button>
                  {form.avatar_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 h-7 text-xs"
                      onClick={() => setForm((p) => ({ ...p, avatar_url: '' }))}
                    >
                      Удалить фото
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">ФИО</Label>
              <Input
                id="full_name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="напр. Иванов Иван"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport_no">Номер паспорта</Label>
              <Input
                id="passport_no"
                name="passport_no"
                value={form.passport_no}
                onChange={handleChange}
                placeholder="напр. AB1234567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: formatUzPhone(e.target.value) }))}
                placeholder="+998 XX XXX XX XX"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="напр. Ул. Навои, д. 12, кв. 5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_no">Номер прав</Label>
              <Input
                id="license_no"
                name="license_no"
                value={form.license_no}
                onChange={handleChange}
                placeholder="напр. AA123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_issue_date">Дата выдачи прав</Label>
              <Input
                id="license_issue_date"
                name="license_issue_date"
                type="date"
                value={form.license_issue_date}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Страна рождения</Label>
              <SearchCombobox
                value={form.birth_country}
                onChange={(v) => setForm((p) => ({ ...p, birth_country: v, birth_city: '' }))}
                options={countries}
                placeholder="Поиск страны..."
              />
            </div>
            <div className="space-y-2">
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
