import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
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
import { Plus, Trash2, Loader2, TrendingDown } from 'lucide-react'
import { formatAmount } from '@/lib/utils'

const CATEGORIES = ['maintenance', 'fuel', 'repair', 'other']

const CATEGORY_COLORS = {
  maintenance: 'bg-amber-100 text-amber-700',
  fuel: 'bg-blue-100 text-blue-700',
  repair: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
}

const emptyForm = {
  amount: '',
  category: 'maintenance',
  description: '',
  spent_at: new Date().toISOString().split('T')[0],
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('expenses').select('*').order('spent_at', { ascending: false })
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter)
    if (monthFilter) {
      const [year, month] = monthFilter.split('-')
      const start = `${year}-${month}-01`
      const lastDay = new Date(Number(year), Number(month), 0).getDate()
      const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
      query = query.gte('spent_at', start).lte('spent_at', end)
    }
    const { data } = await query
    setExpenses(data || [])
    setLoading(false)
  }, [categoryFilter, monthFilter])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const totalThisMonth = expenses.reduce((s, e) => s + Number(e.amount), 0)

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const { error } = await supabase.from('expenses').insert({
        amount: Number(form.amount),
        category: form.category,
        description: form.description,
        spent_at: form.spent_at,
      })
      if (error) throw error
      setOpen(false)
      setForm(emptyForm)
      fetchExpenses()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await supabase.from('expenses').delete().eq('id', deleteTarget.id)
      setDeleteTarget(null)
      fetchExpenses()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Track operational costs</p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm)
            setFormError(null)
            setOpen(true)
          }}
          className="w-full md:w-auto"
        >
          <Plus size={14} className="mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Total This Month
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalThisMonth.toLocaleString()} UZS
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
          <TrendingDown size={18} className="text-red-500" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="md:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="md:w-44"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" /> Loading...
        </div>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-gray-400">No expenses found.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-x-auto bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="text-gray-600 text-sm">{exp.spent_at}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[exp.category] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {exp.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700">{exp.description}</TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {Number(exp.amount).toLocaleString()} UZS
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteTarget(exp)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add expense dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (UZS)</Label>
              <Input
                inputMode="numeric"
                value={formatAmount(form.amount)}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/\D/g, '') }))}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Oil change for HTA-50"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.spent_at}
                onChange={(e) => setForm((f) => ({ ...f, spent_at: e.target.value }))}
                required
              />
            </div>
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{' '}
            <span className="font-medium">{deleteTarget?.description}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
