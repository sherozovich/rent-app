import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useCouriers } from '@/hooks/useCouriers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const emptyForm = {
  full_name: '', passport_no: '', phone: '',
  license_no: '', license_issue_date: '',
  nationality: '', birth_country: '', birth_city: '',
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
      phone: courier.phone,
      license_no: courier.license_no ?? '',
      license_issue_date: courier.license_issue_date ?? '',
      nationality: courier.nationality ?? '',
      birth_country: courier.birth_country ?? '',
      birth_city: courier.birth_city ?? '',
    })
    setFormError(null)
    setOpen(true)
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Couriers</h1>
        <Button onClick={openAdd} className="w-full md:w-auto">
          <Plus size={16} className="mr-2" />
          Add Courier
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : couriers.length === 0 ? (
        <p className="text-muted-foreground text-sm">No couriers yet. Add the first one.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Passport No</TableHead>
                <TableHead>Active Rentals</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {couriers.map((courier) => (
                <TableRow key={courier.id}>
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
            <DialogTitle>Delete Courier</DialogTitle>
          </DialogHeader>
          {deleteTarget?.active_rentals > 0 ? (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              Cannot delete <span className="font-medium">{deleteTarget?.full_name}</span> — they have {deleteTarget?.active_rentals} active rental(s). Complete or cancel all rentals first.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-medium">{deleteTarget?.full_name}</span>? This cannot be undone.
            </p>
          )}
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || deleteTarget?.active_rentals > 0}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Courier' : 'Add Courier'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="e.g. Ivan Petrov"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport_no">Passport No</Label>
              <Input
                id="passport_no"
                name="passport_no"
                value={form.passport_no}
                onChange={handleChange}
                placeholder="e.g. AB1234567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. +380501234567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_no">Driver's License No</Label>
              <Input
                id="license_no"
                name="license_no"
                value={form.license_no}
                onChange={handleChange}
                placeholder="e.g. AA123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_issue_date">License Issue Date</Label>
              <Input
                id="license_issue_date"
                name="license_issue_date"
                type="date"
                value={form.license_issue_date}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <select
                id="nationality"
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select nationality</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_country">Birth Country</Label>
              <select
                id="birth_country"
                name="birth_country"
                value={form.birth_country}
                onChange={(e) => setForm((p) => ({ ...p, birth_country: e.target.value, birth_city: '' }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_city">Birth City</Label>
              <select
                id="birth_city"
                name="birth_city"
                value={form.birth_city}
                onChange={handleChange}
                disabled={!form.birth_country}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">Select city</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Courier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
