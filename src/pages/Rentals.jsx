import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
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

  const { rentals, loading, error } = useRentals(
    statusFilter !== 'all' ? { status: statusFilter } : {},
  )

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
        <h1 className="text-2xl font-bold">Rentals</h1>
        <Button onClick={() => navigate('/rentals/new')} className="w-full md:w-auto">
          <Plus size={16} className="mr-2" />
          New Rental
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Input
          placeholder="Search courier, plate, agreement…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-72"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No rentals found.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agreement</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Scooter</TableHead>
                <TableHead>Tariff</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell className="capitalize">{r.tariff}</TableCell>
                  <TableCell>{r.end_date}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
