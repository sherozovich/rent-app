import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useRentals } from '@/hooks/useRentals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export default function Rentals() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { rentals, loading, error, deleteRental } = useRentals(
    statusFilter !== 'all' ? { status: statusFilter } : {},
  )
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteRental(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = rentals.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.courier?.full_name?.toLowerCase().includes(q) ||
      r.scooter?.plate?.toLowerCase().includes(q) ||
      r.agreement_no?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Аренды</h1>
        <Button onClick={() => navigate('/rentals/new')} className="w-full md:w-auto">
          <Plus size={16} className="mr-2" />
          Новая аренда
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Input
          placeholder="Поиск по курьеру, номеру, договору..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-72"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="completed">Завершённые</SelectItem>
            <SelectItem value="cancelled">Отменённые</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Загрузка...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Аренды не найдены.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-x-auto bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Договор</TableHead>
                <TableHead>Курьер</TableHead>
                <TableHead>Скутер</TableHead>
                <TableHead>Тариф</TableHead>
                <TableHead>Дата окончания</TableHead>
                <TableHead>Статус</TableHead>
              <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/rentals/${r.id}`)}
                >
                  <TableCell className="font-mono text-sm">{r.agreement_no}</TableCell>
                  <TableCell className="font-medium">{r.courier?.full_name}</TableCell>
                  <TableCell>{r.scooter?.plate}</TableCell>
                  <TableCell>{{ daily: 'Суточный', weekly: 'Еженедельный', monthly: 'Ежемесячный' }[r.tariff] ?? r.tariff}</TableCell>
                  <TableCell>{r.end_date}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { setDeleteTarget(r); setDeleteError(null) }}>
                      <Trash2 size={15} />
                    </Button>
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
            <DialogTitle>Удалить аренду</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Удалить аренду <span className="font-medium font-mono">{deleteTarget?.agreement_no}</span>? Все платежи также будут удалены. Это нельзя отменить.
          </p>
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
