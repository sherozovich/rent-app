import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
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
  const { scooters, loading, error, addScooter, updateScooter } = useScooters()
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Scooters</h1>
        <Button onClick={openAdd} className="w-full md:w-auto">
          <Plus size={16} className="mr-2" />
          Add Scooter
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : scooters.length === 0 ? (
        <p className="text-muted-foreground text-sm">No scooters yet. Add the first one.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
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
                    <Button variant="ghost" size="icon" onClick={() => openEdit(scooter)}>
                      <Pencil size={15} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Scooter' : 'Add Scooter'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="e.g. Xiaomi Mi 365"
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
                placeholder="e.g. 1HGBH41JXMN109186"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">Plate</Label>
              <Input
                id="plate"
                name="plate"
                value={form.plate}
                onChange={handleChange}
                placeholder="e.g. AA1234BB"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Scooter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
