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
import { Bell, Loader2, Bike, KeyRound, CircleCheck, Wrench, TrendingUp, Clock, AlertCircle, Activity } from 'lucide-react'

function StatCard({ label, value, icon: Icon, iconClass, bgClass }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgClass}`}>
          <Icon size={15} className={iconClass} />
        </div>
      </div>
      <span className="text-3xl font-bold tracking-tight">{value ?? '—'}</span>
    </div>
  )
}

function SectionHeader({ title, count, countClass }) {
  return (
    <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
      {title}
      {count > 0 && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${countClass}`}>
          {count}
        </span>
      )}
    </h2>
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
      const { data: scooters } = await supabase.from('scooters').select('status')
      const total = scooters?.length ?? 0
      const rented = scooters?.filter((s) => s.status === 'rented').length ?? 0
      const available = scooters?.filter((s) => s.status === 'available').length ?? 0
      const maintenance = scooters?.filter((s) => s.status === 'maintenance').length ?? 0

      const { data: activeRentals } = await supabase
        .from('rentals')
        .select(`*, courier:couriers(id, full_name, phone), scooter:scooters(id, model, plate)`)
        .eq('status', 'active')
        .order('end_date', { ascending: true })

      const rentalsArr = activeRentals || []

      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('paid_at', monthStart)
      const monthlyRevenue = (monthPayments || []).reduce((s, p) => s + Number(p.amount), 0)

      setStats({ total, rented, available, maintenance, monthlyRevenue })

      const todayStr = now.toISOString().split('T')[0]
      const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      setExpiring(rentalsArr.filter((r) => r.end_date >= todayStr && r.end_date <= in2Days))

      const { data: allPayments } = await supabase.from('payments').select('rental_id, amount')
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
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
        <Loader2 size={16} className="animate-spin" />
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Scooter fleet overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Scooters"
          value={stats?.total}
          icon={Bike}
          iconClass="text-blue-600"
          bgClass="bg-blue-100"
        />
        <StatCard
          label="Rented"
          value={stats?.rented}
          icon={KeyRound}
          iconClass="text-purple-600"
          bgClass="bg-purple-100"
        />
        <StatCard
          label="Available"
          value={stats?.available}
          icon={CircleCheck}
          iconClass="text-green-600"
          bgClass="bg-green-100"
        />
        <StatCard
          label="Maintenance"
          value={stats?.maintenance}
          icon={Wrench}
          iconClass="text-yellow-600"
          bgClass="bg-yellow-100"
        />
        <StatCard
          label="Monthly Revenue"
          value={stats?.monthlyRevenue?.toLocaleString()}
          icon={TrendingUp}
          iconClass="text-emerald-600"
          bgClass="bg-emerald-100"
        />
      </div>

      {/* Expiring Soon */}
      <section>
        <SectionHeader
          title={<><Clock size={15} className="text-orange-500" /> Expiring Soon</>}
          count={expiring.length}
          countClass="bg-orange-100 text-orange-700"
        />
        {expiring.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rentals expiring in the next 2 days.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Agreement</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Scooter</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiring.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => navigate(`/rentals/${r.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{r.agreement_no}</TableCell>
                    <TableCell className="font-medium">{r.courier?.full_name}</TableCell>
                    <TableCell>{r.scooter?.plate}</TableCell>
                    <TableCell>
                      <span className="text-orange-600 font-semibold text-sm">{r.end_date}</span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant={sentIds.has(r.id) ? 'ghost' : 'outline'}
                        disabled={sendingId === r.id || sentIds.has(r.id)}
                        onClick={() => handleSendReminder(r)}
                      >
                        {sendingId === r.id ? (
                          <Loader2 size={12} className="mr-1 animate-spin" />
                        ) : (
                          <Bell size={12} className="mr-1" />
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
          title={<><AlertCircle size={15} className="text-red-500" /> Overdue Payments</>}
          count={overdue.length}
          countClass="bg-red-100 text-red-700"
        />
        {overdue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No overdue payments.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Agreement</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Scooter</TableHead>
                  <TableHead>Charged</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => navigate(`/rentals/${r.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{r.agreement_no}</TableCell>
                    <TableCell className="font-medium">{r.courier?.full_name}</TableCell>
                    <TableCell>{r.scooter?.plate}</TableCell>
                    <TableCell>{r.totalCharged.toLocaleString()}</TableCell>
                    <TableCell>{r.totalPaid.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="text-red-600 font-bold">
                        {(r.totalCharged - r.totalPaid).toLocaleString()}
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
          title={<><Activity size={15} className="text-green-500" /> Active Rentals</>}
          count={active.length}
          countClass="bg-gray-100 text-gray-600"
        />
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active rentals.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Agreement</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Scooter</TableHead>
                  <TableHead>Tariff</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => navigate(`/rentals/${r.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{r.agreement_no}</TableCell>
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
      </section>
    </div>
  )
}
