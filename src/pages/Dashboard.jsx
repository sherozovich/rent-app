import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sendTelegramMessage, buildReminderText } from '@/lib/telegram'
import { calcTotalCharged } from '@/lib/tariffRates'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import {
  Bell,
  Loader2,
  Bike,
  KeyRound,
  CircleCheck,
  Wrench,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Activity,
  Plus,
  Banknote,
} from 'lucide-react'

const TARIFF_LABELS = { daily: 'Суточный', weekly: 'Еженедельный', monthly: 'Ежемесячный' }

const revenueChartConfig = {
  amount: { label: 'Выручка', color: 'var(--primary)' },
}

const expensesChartConfig = {
  maintenance: { label: 'Обслуживание', color: 'hsl(38 92% 50%)' },
  fuel: { label: 'Топливо', color: 'hsl(217 91% 60%)' },
  repair: { label: 'Ремонт', color: 'hsl(0 84% 60%)' },
  other: { label: 'Прочее', color: 'hsl(215 16% 60%)' },
}

const EXPENSE_COLORS = {
  maintenance: 'hsl(38 92% 50%)',
  fuel: 'hsl(217 91% 60%)',
  repair: 'hsl(0 84% 60%)',
  other: 'hsl(215 16% 60%)',
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={17} className={iconColor} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value ?? '—'}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function SectionHeader({ icon: Icon, iconColor, title, count, countColor }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className={iconColor} />
      <h2 className="text-sm font-semibold">{title}</h2>
      {count > 0 && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${countColor}`}>
          {count}
        </span>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [expiring, setExpiring] = useState([])
  const [overdue, setOverdue] = useState([])
  const [active, setActive] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [expensesData, setExpensesData] = useState([])
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
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [
        { data: scooters },
        { data: activeRentals },
        { data: monthPayments },
        { data: allPayments },
        { data: monthExpensesData },
        { data: last30Payments },
        { data: catExpenses },
      ] = await Promise.all([
        supabase.from('scooters').select('status'),
        supabase
          .from('rentals')
          .select('*, courier:couriers(id, full_name, phone), scooter:scooters(id, model, plate)')
          .eq('status', 'active')
          .order('end_date', { ascending: true }),
        supabase.from('payments').select('amount').gte('paid_at', monthStart),
        supabase.from('payments').select('rental_id, amount'),
        supabase.from('expenses').select('amount').gte('spent_at', monthStart),
        supabase.from('payments').select('paid_at, amount').gte('paid_at', thirtyDaysAgo),
        supabase.from('expenses').select('category, amount').gte('spent_at', monthStart),
      ])

      // Stats
      const total = scooters?.length ?? 0
      const rented = scooters?.filter((s) => s.status === 'rented').length ?? 0
      const available = scooters?.filter((s) => s.status === 'available').length ?? 0
      const maintenance = scooters?.filter((s) => s.status === 'maintenance').length ?? 0
      const monthlyRevenue = (monthPayments || []).reduce((s, p) => s + Number(p.amount), 0)
      const monthlyExpenses = (monthExpensesData || []).reduce((s, e) => s + Number(e.amount), 0)
      const netIncome = monthlyRevenue - monthlyExpenses
      setStats({ total, rented, available, maintenance, monthlyRevenue, monthlyExpenses, netIncome })

      // Revenue by day (last 30 days)
      const dayMap = {}
      ;(last30Payments || []).forEach((p) => {
        const day = p.paid_at
        dayMap[day] = (dayMap[day] || 0) + Number(p.amount)
      })
      // Build last 14 days for chart (cleaner)
      const days = []
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().split('T')[0]
        const label = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
        days.push({ date: label, amount: dayMap[key] || 0 })
      }
      setRevenueData(days)

      // Expenses by category
      const catMap = {}
      ;(catExpenses || []).forEach((e) => {
        catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount)
      })
      const catData = Object.entries(catMap).map(([cat, value]) => ({
        name: expensesChartConfig[cat]?.label ?? cat,
        value,
        color: EXPENSE_COLORS[cat] ?? 'hsl(215 16% 60%)',
      }))
      setExpensesData(catData)

      // Active rentals
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
            totalCharged: r.agreed_price != null ? Number(r.agreed_price) : calcTotalCharged(r.tariff, r.start_date, r.end_date),
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
      alert(`Ошибка отправки: ${err.message}`)
    } finally {
      setSendingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-12">
        <Loader2 size={16} className="animate-spin" />
        Загрузка...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Главная</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Обзор парка скутеров</p>
        </div>
        <Button size="sm" onClick={() => navigate('/rentals/new')}>
          <Plus size={14} className="mr-1.5" />
          Новая аренда
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard label="Всего скутеров" value={stats?.total} icon={Bike} iconBg="bg-blue-50" iconColor="text-blue-600" sub="Парк" />
        <StatCard label="Арендовано" value={stats?.rented} icon={KeyRound} iconBg="bg-purple-50" iconColor="text-purple-600" sub="На руках" />
        <StatCard label="Доступно" value={stats?.available} icon={CircleCheck} iconBg="bg-green-50" iconColor="text-green-600" sub="Свободны" />
        <StatCard label="Обслуживание" value={stats?.maintenance} icon={Wrench} iconBg="bg-amber-50" iconColor="text-amber-600" sub="На сервисе" />
        <StatCard
          label="Выручка за месяц"
          value={stats?.monthlyRevenue != null ? stats.monthlyRevenue.toLocaleString() + ' UZS' : '—'}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub="Этот месяц"
        />
        <StatCard
          label="Расходы за месяц"
          value={stats?.monthlyExpenses != null ? stats.monthlyExpenses.toLocaleString() + ' UZS' : '—'}
          icon={TrendingDown}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          sub="Этот месяц"
        />
        <StatCard
          label="Чистый доход"
          value={stats?.netIncome != null ? stats.netIncome.toLocaleString() + ' UZS' : '—'}
          icon={Banknote}
          iconBg={stats?.netIncome >= 0 ? 'bg-green-50' : 'bg-orange-50'}
          iconColor={stats?.netIncome >= 0 ? 'text-green-600' : 'text-orange-500'}
          sub="Выручка − Расходы"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Выручка за 14 дней</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 || revenueData.every((d) => d.amount === 0) ? (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                Нет данных за этот период
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="h-40 w-full">
                <BarChart data={revenueData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(v) => v.toLocaleString() + ' UZS'} />}
                  />
                  <Bar dataKey="amount" fill="var(--primary)" radius={4} maxBarSize={24} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Expenses pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Расходы по категориям</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesData.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                Нет расходов за этот месяц
              </div>
            ) : (
              <div className="space-y-3">
                <ChartContainer config={expensesChartConfig} className="h-32 w-full">
                  <PieChart>
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(v) => v.toLocaleString() + ' UZS'} />}
                    />
                    <Pie data={expensesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                      {expensesData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-1">
                  {expensesData.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                        <span className="text-muted-foreground">{e.name}</span>
                      </div>
                      <span className="font-medium">{e.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon */}
      <section>
        <SectionHeader
          icon={Clock}
          iconColor="text-orange-500"
          title="Истекают скоро"
          count={expiring.length}
          countColor="bg-orange-100 text-orange-700"
        />
        {expiring.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Нет аренд, истекающих в ближайшие 2 дня.</CardContent></Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Договор</TableHead>
                    <TableHead className="text-xs">Курьер</TableHead>
                    <TableHead className="text-xs">Скутер</TableHead>
                    <TableHead className="text-xs">Окончание</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiring.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/rentals/${r.id}`)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.agreement_no}</TableCell>
                      <TableCell className="font-medium">{r.courier?.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.scooter?.plate}</TableCell>
                      <TableCell>
                        <span className="text-orange-600 font-semibold text-sm bg-orange-50 px-2 py-0.5 rounded-md">{r.end_date}</span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant={sentIds.has(r.id) ? 'ghost' : 'outline'} disabled={sendingId === r.id || sentIds.has(r.id)} onClick={() => handleSendReminder(r)} className="h-7 text-xs">
                          {sendingId === r.id ? <Loader2 size={11} className="mr-1 animate-spin" /> : <Bell size={11} className="mr-1" />}
                          {sentIds.has(r.id) ? 'Отправлено' : 'Напомнить'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </section>

      {/* Overdue Payments */}
      <section>
        <SectionHeader
          icon={AlertCircle}
          iconColor="text-red-500"
          title="Задолженности"
          count={overdue.length}
          countColor="bg-red-100 text-red-700"
        />
        {overdue.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Задолженностей нет.</CardContent></Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Договор</TableHead>
                    <TableHead className="text-xs">Курьер</TableHead>
                    <TableHead className="text-xs">Скутер</TableHead>
                    <TableHead className="text-xs">К оплате</TableHead>
                    <TableHead className="text-xs">Оплачено</TableHead>
                    <TableHead className="text-xs">Остаток</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/rentals/${r.id}`)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.agreement_no}</TableCell>
                      <TableCell className="font-medium">{r.courier?.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.scooter?.plate}</TableCell>
                      <TableCell>{r.totalCharged.toLocaleString()}</TableCell>
                      <TableCell>{r.totalPaid.toLocaleString()}</TableCell>
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
          </Card>
        )}
      </section>

      {/* Active Rentals */}
      <section>
        <SectionHeader
          icon={Activity}
          iconColor="text-green-500"
          title="Активные аренды"
          count={active.length}
          countColor="bg-green-100 text-green-700"
        />
        {active.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Нет активных аренд.</CardContent></Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Договор</TableHead>
                    <TableHead className="text-xs">Курьер</TableHead>
                    <TableHead className="text-xs">Скутер</TableHead>
                    <TableHead className="text-xs">Тариф</TableHead>
                    <TableHead className="text-xs">Окончание</TableHead>
                    <TableHead className="text-xs">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/rentals/${r.id}`)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.agreement_no}</TableCell>
                      <TableCell className="font-medium">{r.courier?.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.scooter?.plate}</TableCell>
                      <TableCell>
                        <span className="capitalize text-xs bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-md">
                          {TARIFF_LABELS[r.tariff] ?? r.tariff}
                        </span>
                      </TableCell>
                      <TableCell>{r.end_date}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}
