import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sendTelegramMessage, buildReminderText } from '@/lib/telegram'
import { calcTotalCharged } from '@/lib/tariffRates'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Bell,
  Loader2,
  Bike,
  KeyRound,
  CircleCheck,
  Wrench,
  TrendingUp,
  Clock,
  AlertCircle,
  Activity,
  Plus,
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1.5 tracking-tight">{value ?? '—'}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function SectionHeader({ icon: Icon, iconColor, title, count, countColor }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className={iconColor} />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {count > 0 && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${countColor}`}>
            {count}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [expiring, setExpiring] = useState([])
  const [overdue, setOverdue] = useState([])
  const [active, setActive] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState(null)
  const [sentIds, setSentIds] = useState(new Set())

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    setLoading(true)
    try {
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const [
        { data: scooters },
        { data: activeRentals },
        { data: monthPayments },
        { data: allPayments },
      ] = await Promise.all([
        supabase.from('scooters').select('status'),
        supabase
          .from('rentals')
          .select(`*, courier:couriers(id, full_name, phone), scooter:scooters(id, model, plate)`)
          .eq('status', 'active')
          .order('end_date', { ascending: true }),
        supabase.from('payments').select('amount').gte('paid_at', monthStart),
        supabase.from('payments').select('rental_id, amount'),
      ])

      const total = scooters?.length ?? 0
      const rented = scooters?.filter((s) => s.status === 'rented').length ?? 0
      const available = scooters?.filter((s) => s.status === 'available').length ?? 0
      const maintenance = scooters?.filter((s) => s.status === 'maintenance').length ?? 0
      const monthlyRevenue = (monthPayments || []).reduce((s, p) => s + Number(p.amount), 0)
      setStats({ total, rented, available, maintenance, monthlyRevenue })

      const rentalsArr = activeRentals || []
      const todayStr = now.toISOString().split('T')[0]
      const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      setExpiring(rentalsArr.filter((r) => r.end_date >= todayStr && r.end_date <= in2Days))

      const paidMap = {}
      ;(allPayments || []).forEach((p) => {
        paidMap[p.rental_id] = (paidMap[p.rental_id] || 0) + Number(p.amount)
      })
      setOverdue(
        rentalsArr
          .map((r) => ({
            ...r,
            totalCharged: calcTotalCharged(r.tariff, r.start_date, r.end_date),
            totalPaid: paidMap[r.id] || 0,
          }))
          .filter((r) => r.totalCharged - r.totalPaid > 0),
      )
      setActive(rentalsArr)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendReminder(rental) {
    setSendingId(rental.id)
    try {
      await sendTelegramMessage(buildReminderText(rental))
      setSentIds((prev) => new Set([...prev, rental.id]))
    } catch (err) {
      alert(`Failed to send: ${err.message}`)
    } finally {
      setSendingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-12">
        <Loader2 size={16} className="animate-spin" />
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Scooter fleet overview</p>
        </div>
        <Button size="sm" onClick={() => navigate('/rentals/new')}>
          <Plus size={14} className="mr-1.5" />
          New Rental
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Scooters"
          value={stats?.total}
          icon={Bike}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub="Fleet size"
        />
        <StatCard
          label="Rented"
          value={stats?.rented}
          icon={KeyRound}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub="Currently out"
        />
        <StatCard
          label="Available"
          value={stats?.available}
          icon={CircleCheck}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          sub="Ready to rent"
        />
        <StatCard
          label="Maintenance"
          value={stats?.maintenance}
          icon={Wrench}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          sub="Under service"
        />
        <StatCard
          label="Monthly Revenue"
          value={stats?.monthlyRevenue != null ? stats.monthlyRevenue.toLocaleString() + ' ₸' : '—'}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="This month"
        />
      </div>

      {/* Expiring Soon */}
      <section>
        <SectionHeader
          icon={Clock}
          iconColor="text-orange-500"
          title="Expiring Soon"
          count={expiring.length}
          countColor="bg-orange-100 text-orange-700"
        />
        {expiring.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-400">No rentals expiring in the next 2 days.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="text-xs font-semibold text-gray-500">Agreement</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Courier</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Scooter</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Ends</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiring.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/rentals/${r.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-gray-500">{r.agreement_no}</TableCell>
                    <TableCell className="font-medium text-gray-900">{r.courier?.full_name}</TableCell>
                    <TableCell className="text-gray-600">{r.scooter?.plate}</TableCell>
                    <TableCell>
                      <span className="text-orange-600 font-semibold text-sm bg-orange-50 px-2 py-0.5 rounded-md">
                        {r.end_date}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant={sentIds.has(r.id) ? 'ghost' : 'outline'}
                        disabled={sendingId === r.id || sentIds.has(r.id)}
                        onClick={() => handleSendReminder(r)}
                        className="h-7 text-xs"
                      >
                        {sendingId === r.id ? (
                          <Loader2 size={11} className="mr-1 animate-spin" />
                        ) : (
                          <Bell size={11} className="mr-1" />
                        )}
                        {sentIds.has(r.id) ? 'Sent' : 'Remind'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Overdue Payments */}
      <section>
        <SectionHeader
          icon={AlertCircle}
          iconColor="text-red-500"
          title="Overdue Payments"
          count={overdue.length}
          countColor="bg-red-100 text-red-700"
        />
        {overdue.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-400">No overdue payments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="text-xs font-semibold text-gray-500">Agreement</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Courier</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Scooter</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Charged</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Paid</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/rentals/${r.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-gray-500">{r.agreement_no}</TableCell>
                    <TableCell className="font-medium text-gray-900">{r.courier?.full_name}</TableCell>
                    <TableCell className="text-gray-600">{r.scooter?.plate}</TableCell>
                    <TableCell className="text-gray-700">{r.totalCharged.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-700">{r.totalPaid.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md text-sm">
                        -{(r.totalCharged - r.totalPaid).toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* All Active Rentals */}
      <section>
        <SectionHeader
          icon={Activity}
          iconColor="text-green-500"
          title="Active Rentals"
          count={active.length}
          countColor="bg-green-100 text-green-700"
        />
        {active.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-400">No active rentals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="text-xs font-semibold text-gray-500">Agreement</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Courier</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Scooter</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Tariff</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">End Date</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/rentals/${r.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-gray-500">{r.agreement_no}</TableCell>
                    <TableCell className="font-medium text-gray-900">{r.courier?.full_name}</TableCell>
                    <TableCell className="text-gray-600">{r.scooter?.plate}</TableCell>
                    <TableCell>
                      <span className="capitalize text-xs bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-md">
                        {r.tariff}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700">{r.end_date}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
